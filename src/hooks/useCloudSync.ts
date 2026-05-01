import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export type SyncStatus = 'loading' | 'syncing' | 'synced' | 'error' | 'offline';

export function useCloudSync<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
         const parsed = JSON.parse(item);
         const merged = { ...initialValue, ...(typeof parsed === 'object' && parsed ? parsed : {}) } as any;
         for (const k in initialValue) {
           if (Array.isArray((initialValue as any)[k]) && !Array.isArray(merged[k])) {
             merged[k] = (initialValue as any)[k];
           }
         }
         return merged as T;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const storedValueRef = useRef(storedValue);
  storedValueRef.current = storedValue;

  const mergeCloud = useCallback((cloudData: any): T => {
    const merged = { ...initialValue, ...(typeof cloudData === 'object' && cloudData ? cloudData : {}) } as any;
    for (const k in initialValue) {
      if (Array.isArray((initialValue as any)[k]) && !Array.isArray(merged[k])) {
        merged[k] = (initialValue as any)[k];
      }
    }
    return merged as T;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial data from Cloud
  useEffect(() => {
    const fetchCloud = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        setSyncStatus('offline');
        return;
      }
      setUserEmail(session.user.email ?? null);

      const { data, error } = await supabase
        .from('app_state')
        .select('data, updated_at')
        .eq('user_id', session.user.id)
        .single();

      if (data && data.data) {
        const merged = mergeCloud(data.data);
        setStoredValue(merged);
        window.localStorage.setItem(key, JSON.stringify(merged));
        setSyncStatus('synced');
        setLastSynced(new Date());
        if (data.updated_at) setCloudUpdatedAt(new Date(data.updated_at));
      } else if (error && error.code === 'PGRST116') {
        await supabase.from('app_state').insert({
          user_id: session.user.id,
          data: storedValueRef.current || initialValue
        }).then(({ error: insertError }) => {
          if (insertError) {
            console.error("Insert error:", insertError);
            setSyncStatus('error');
            setSyncError(insertError.message);
          } else {
            setSyncStatus('synced');
            setLastSynced(new Date());
          }
        });
      } else if (error) {
        console.error("Supabase fetch error:", error);
        setSyncStatus('error');
        setSyncError(error.message);
      }
      setLoading(false);
    };
    fetchCloud();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Sync to Cloud on change (Debounced, with retry)
  useEffect(() => {
    if (loading) return;

    window.localStorage.setItem(key, JSON.stringify(storedValue));
    setSyncStatus('syncing');

    const pushToCloud = async (valueToSync: T, attempt = 1): Promise<void> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSyncStatus('offline'); return; }

        const { error } = await supabase
          .from('app_state')
          .update({ data: valueToSync, updated_at: new Date().toISOString() })
          .eq('user_id', session.user.id);

        if (error) throw new Error(error.message);

        setSyncStatus('synced');
        setLastSynced(new Date());
        setSyncError(null);
      } catch (err: any) {
        if (attempt < 3) {
          // Retry after 3s, then 6s
          setTimeout(() => pushToCloud(valueToSync, attempt + 1), attempt * 3000);
        } else {
          setSyncStatus('error');
          setSyncError(err?.message || 'Network error — retry karein');
        }
      }
    };

    const timeoutId = setTimeout(() => pushToCloud(storedValue), 1500);
    return () => clearTimeout(timeoutId);
  }, [storedValue, key, loading]);

  const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSyncStatus('offline'); return; }
    setUserEmail(session.user.email ?? null);

    const { data, error } = await supabase
      .from('app_state')
      .select('data, updated_at')
      .eq('user_id', session.user.id)
      .single();

    if (data && data.data) {
      const merged = mergeCloud(data.data);
      setStoredValue(merged);
      window.localStorage.setItem(key, JSON.stringify(merged));
      setSyncStatus('synced');
      setLastSynced(new Date());
      if (data.updated_at) setCloudUpdatedAt(new Date(data.updated_at));
      setSyncError(null);
    } else if (error) {
      setSyncStatus('error');
      setSyncError(error.message);
    }
  }, [key, mergeCloud]);

  return [storedValue, setStoredValue, loading, syncStatus, lastSynced, syncError, syncNow, userEmail, cloudUpdatedAt] as const;
}
