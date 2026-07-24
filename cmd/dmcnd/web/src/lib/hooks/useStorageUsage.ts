import { useState, useEffect, useRef, useCallback } from 'react';
import { PersonalStore, type StorageUsage } from '../api/personalStore';
import { useKeys } from './useKeys';
import { useAuth } from './useAuth';

// useStorageUsage reads the signed-in owner's personal-storage occupancy (used
// bytes vs. their effective quota) for the Settings meter. It fetches on mount and
// on tab focus/reconnect — usage changes slowly, so there's no polling timer.
// `refresh` lets a caller re-read after an action (e.g. returning from checkout).

interface StorageUsageState {
  usage: StorageUsage | null;
  loading: boolean;
  refresh: () => void;
}

export function useStorageUsage(): StorageUsageState {
  const { keys } = useKeys();
  const { sessionToken, isAuthenticated } = useAuth();
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!keys || !sessionToken || !isAuthenticated) return;

    const store = new PersonalStore(keys);
    let cancelled = false;

    const doSync = () => {
      setLoading(true);
      store.stat()
        .then((u) => { if (!cancelled) setUsage(u); })
        .catch(() => { /* transient; keep last good */ })
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    syncRef.current = doSync;
    doSync();

    const onWake = () => { if (document.visibilityState === 'visible' && navigator.onLine) doSync(); };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
      window.removeEventListener('focus', onWake);
      syncRef.current = () => {};
      setUsage(null);
    };
  }, [keys, sessionToken, isAuthenticated]);

  const refresh = useCallback(() => syncRef.current(), []);
  return { usage, loading, refresh };
}
