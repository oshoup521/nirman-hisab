import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { AppState } from '../types';
import {
  loadAllData, migrateFromBlob,
  syncProject, syncMaterials, syncLabours, syncLabourDayEntries,
  syncThekas, syncDemolitionThekas, syncExpenses, syncMiscExpenses,
  syncMilestones, syncDemolitionProject, syncBrickRecovery, syncMalwaEntries,
  syncScrapEntries, syncVendors, syncRentals, syncDiaryEntries,
} from '../services/db';

export type SyncStatus = 'loading' | 'syncing' | 'synced' | 'error' | 'offline';
export type UserRole = 'owner' | 'viewer';

const LS_KEY           = 'nirman_hisaab_data';
const MIGRATION_FLAG   = 'nirman_migrated_v2';
const MIGRATION_FLAG_V3 = 'nirman_migrated_v3'; // targeted fix: masterBudget + deposit status

// Maps each AppState key to the function that syncs it to Supabase
type SyncFn = (userId: string, value: any) => Promise<void>;

function makeSyncMap(): Record<keyof AppState, SyncFn> {
  return {
    project:          (uid, v) => syncProject(uid, v),
    materials:        (uid, v) => syncMaterials(uid, v),
    labours:          (uid, v) => syncLabours(uid, v),
    labourDayEntries: (uid, v) => syncLabourDayEntries(uid, v),
    thekas:           (uid, v) => syncThekas(uid, v),
    expenses:         (uid, v) => syncExpenses(uid, v),
    milestones:       (uid, v) => syncMilestones(uid, v),
    demolition:       (uid, v) => syncDemolitionProject(uid, v),
    brickRecovery:    (uid, v) => syncBrickRecovery(uid, v),
    malwa:            (uid, v) => syncMalwaEntries(uid, v),
    scrap:            (uid, v) => syncScrapEntries(uid, v),
    demolitionThekas: (uid, v) => syncDemolitionThekas(uid, v),
    rentals:          (uid, v) => syncRentals(uid, v),
    miscExpenses:     (uid, v) => syncMiscExpenses(uid, v),
    vendors:          (uid, v) => syncVendors(uid, v),
    diary:            (uid, v) => syncDiaryEntries(uid, v),
  };
}

function mergeWithInitial<T extends object>(initial: T, loaded: any): T {
  const merged = { ...initial, ...(typeof loaded === 'object' && loaded ? loaded : {}) } as any;
  for (const k in initial) {
    if (Array.isArray((initial as any)[k]) && !Array.isArray(merged[k])) {
      merged[k] = (initial as any)[k];
    }
  }
  return merged as T;
}

export function useNormalizedSync(initialValue: AppState) {
  const [storedValue, setStoredValue] = useState<AppState>(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) return mergeWithInitial(initialValue, JSON.parse(raw));
    } catch { /* ignore */ }
    return initialValue;
  });

  const [loading,        setLoading]        = useState(true);
  const [syncStatus,     setSyncStatus]     = useState<SyncStatus>('loading');
  const [lastSynced,     setLastSynced]     = useState<Date | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<Date | null>(null);
  const [syncError,      setSyncError]      = useState<string | null>(null);
  const [userEmail,      setUserEmail]      = useState<string | null>(null);
  const [role,           setRole]           = useState<UserRole>('viewer');
  const [userName,       setUserName]       = useState<string | null>(null);

  const userIdRef    = useRef<string | null>(null);
  const isViewerRef  = useRef(false);
  const prevStateRef = useRef<AppState>(storedValue);
  const liveStateRef = useRef<AppState>(storedValue);
  liveStateRef.current = storedValue;

  // ── Initial load ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        setSyncStatus('offline');
        return;
      }

      setUserEmail(session.user.email ?? null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, data_owner_id, name')
        .eq('id', session.user.id)
        .single();

      const userRole: UserRole = profile?.role === 'owner' ? 'owner' : 'viewer';
      const dataOwnerId: string | null = profile?.data_owner_id ?? null;

      if (!cancelled) {
        setRole(userRole);
        setUserName(profile?.name ?? null);
      }
      isViewerRef.current  = userRole === 'viewer';
      userIdRef.current    = session.user.id;

      const targetId = userRole === 'viewer' && dataOwnerId ? dataOwnerId : session.user.id;

      try {
        let loaded = await loadAllData(targetId);

        // Owner with no normalized data yet → try migrating from old blob
        if (!loaded && userRole === 'owner' && !localStorage.getItem(MIGRATION_FLAG)) {
          const { data: blobRow } = await supabase
            .from('app_state')
            .select('data, updated_at')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (blobRow?.data) {
            const blob = mergeWithInitial(initialValue, blobRow.data);
            await migrateFromBlob(session.user.id, blob);
            loaded = await loadAllData(session.user.id);
            if (blobRow.updated_at && !cancelled) setCloudUpdatedAt(new Date(blobRow.updated_at));
          }
          localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
        }

        // V3 fix: surgically patch masterBudget and deposit statuses if migration
        // dropped them (legacy blob had depositPaid:boolean, schema default was 'pending').
        // Runs once per device. Only updates fields that are demonstrably wrong;
        // preserves all other DB state to avoid stomping local edits.
        // V3 fix: surgically patch project (incl. masterBudget) and rental deposit_status
        // when the original migration dropped them. Legacy blobs may lack project.id and
        // use depositPaid:boolean instead of depositStatus enum. Runs once per device.
        if (loaded && userRole === 'owner' && !localStorage.getItem(MIGRATION_FLAG_V3)) {
          try {
            const missingMasterBudget = !loaded.project?.masterBudget;
            const { data: blobRow } = await supabase
              .from('app_state').select('data')
              .eq('user_id', session.user.id).maybeSingle();

            if (blobRow?.data) {
              const blob = mergeWithInitial(initialValue, blobRow.data);
              let needsReload = false;

              // Patch project from blob if DB row is missing or masterBudget got dropped.
              if (missingMasterBudget && blob.project?.masterBudget) {
                const projectToSync = loaded.project
                  ? { ...loaded.project, masterBudget: blob.project.masterBudget }
                  : blob.project;
                await syncProject(session.user.id, projectToSync);
                needsReload = true;
              }

              // Patch deposit_status for any rental whose blob status is paid/forfeited
              // but normalized DB status is something else (pending/null/undefined).
              const blobRentalById = new Map((blob.rentals ?? []).map((br: any) => [br.id, br]));
              const fixedRentals = (loaded.rentals ?? []).map(r => {
                const br: any = blobRentalById.get(r.id);
                if (!br) return r;
                const blobStatus: string = br.depositStatus ?? (br.depositPaid === true ? 'paid' : 'pending');
                const currentStatus = r.depositStatus || 'pending';
                if (currentStatus !== blobStatus && blobStatus !== 'pending') {
                  return { ...r, depositStatus: blobStatus as any };
                }
                return r;
              });
              const changedRentalCount = fixedRentals.filter(
                (r, i) => r.depositStatus !== (loaded!.rentals ?? [])[i]?.depositStatus
              ).length;
              if (changedRentalCount > 0) {
                await syncRentals(session.user.id, fixedRentals);
                needsReload = true;
              }

              if (needsReload) loaded = await loadAllData(session.user.id);
            }
          } catch (e) {
            console.warn('[v3 fix] partial re-sync failed:', e);
          }
          localStorage.setItem(MIGRATION_FLAG_V3, new Date().toISOString());
        }

        if (loaded) {
          prevStateRef.current = loaded;
          if (!cancelled) {
            setStoredValue(loaded);
            window.localStorage.setItem(LS_KEY, JSON.stringify(loaded));
            setSyncStatus('synced');
            setLastSynced(new Date());
          }
        } else {
          // Completely fresh owner — seed milestones
          if (userRole === 'owner') {
            await syncMilestones(session.user.id, liveStateRef.current.milestones);
            prevStateRef.current = liveStateRef.current;
          }
          if (!cancelled) {
            setSyncStatus('synced');
            setLastSynced(new Date());
          }
        }
      } catch (err: any) {
        console.error('[useNormalizedSync] init error:', err);
        if (!cancelled) {
          setSyncStatus('error');
          setSyncError(err?.message ?? 'Load failed');
        }
      }

      if (!cancelled) setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Smart sync on state change ───────────────────────────────
  // Compares each AppState key by reference; only pushes changed keys.
  useEffect(() => {
    if (loading || isViewerRef.current || !userIdRef.current) return;

    const userId = userIdRef.current;
    const prev   = prevStateRef.current;
    const next   = storedValue;

    // Always persist locally
    window.localStorage.setItem(LS_KEY, JSON.stringify(next));

    const changedKeys = (Object.keys(next) as (keyof AppState)[]).filter(
      k => (next as any)[k] !== (prev as any)[k],
    );
    if (changedKeys.length === 0) return;

    prevStateRef.current = next;
    setSyncStatus('syncing');

    const syncMap = makeSyncMap();

    const push = async (attempt = 1): Promise<void> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSyncStatus('offline'); return; }

        await Promise.all(changedKeys.map(k => syncMap[k](userId, (next as any)[k])));

        setSyncStatus('synced');
        setLastSynced(new Date());
        setSyncError(null);
      } catch (err: any) {
        if (attempt < 3) {
          setTimeout(() => push(attempt + 1), attempt * 3000);
        } else {
          setSyncStatus('error');
          setSyncError(err?.message ?? 'Network error — retry karein');
        }
      }
    };

    const timerId = setTimeout(push, 1500);
    return () => clearTimeout(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedValue, loading]);

  // ── Manual pull-from-cloud ───────────────────────────────────
  const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSyncStatus('offline'); return; }
    setUserEmail(session.user.email ?? null);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, data_owner_id')
      .eq('id', session.user.id)
      .single();

    const userRole: UserRole = profile?.role === 'owner' ? 'owner' : 'viewer';
    const dataOwnerId: string | null = profile?.data_owner_id ?? null;
    const targetId = userRole === 'viewer' && dataOwnerId ? dataOwnerId : session.user.id;

    try {
      const loaded = await loadAllData(targetId);
      if (loaded) {
        prevStateRef.current = loaded;
        setStoredValue(loaded);
        window.localStorage.setItem(LS_KEY, JSON.stringify(loaded));
        setSyncStatus('synced');
        setLastSynced(new Date());
        setSyncError(null);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err?.message ?? 'Sync failed');
    }
  }, []);

  return [storedValue, setStoredValue, loading, syncStatus, lastSynced, syncError, syncNow, userEmail, cloudUpdatedAt, role, userName] as const;
}
