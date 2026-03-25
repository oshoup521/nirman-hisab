import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useCloudSync<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
         const parsed = JSON.parse(item);
         const merged = { ...initialValue, ...(typeof parsed === 'object' && parsed ? parsed : {}) } as any;
         // Ensure fallback for arrays to prevent white screen crashes
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

  // Fetch initial data from Cloud
  useEffect(() => {
    const fetchCloud = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('app_state')
        .select('data')
        .eq('user_id', session.user.id)
        .single();
        
      if (data && data.data) {
        // We found data in the cloud!
        const cloudMerged = { ...initialValue, ...(typeof data.data === 'object' && data.data ? data.data : {}) } as any;
        for (const k in initialValue) {
           if (Array.isArray((initialValue as any)[k]) && !Array.isArray(cloudMerged[k])) {
             cloudMerged[k] = (initialValue as any)[k];
           }
        }
        setStoredValue(cloudMerged as T);
        window.localStorage.setItem(key, JSON.stringify(cloudMerged));
      } else if (error && error.code === 'PGRST116') {
        // Table is empty for this user. Insert current local storage
        await supabase.from('app_state').insert({
          user_id: session.user.id,
          data: storedValue || initialValue
        }).then(({ error: insertError }) => {
          if (insertError) console.error("Insert error:", insertError);
        });
      } else if (error) {
        console.error("Supabase fetch error:", error);
      }
      setLoading(false);
    };
    fetchCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Sync to Cloud on change (Debounced)
  useEffect(() => {
    if (loading) return; // Don't upload while initially loading

    window.localStorage.setItem(key, JSON.stringify(storedValue));

    const timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('app_state')
          .update({ data: storedValue, updated_at: new Date().toISOString() })
          .eq('user_id', session.user.id);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [storedValue, key, loading]);

  return [storedValue, setStoredValue, loading] as const;
}
