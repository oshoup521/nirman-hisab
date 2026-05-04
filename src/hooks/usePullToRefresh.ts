import { useState, useEffect, useRef, useCallback } from 'react';
import { SyncStatus } from './useCloudSync';

const PULL_THRESHOLD = 72;

export function usePullToRefresh(syncStatus: SyncStatus, syncNow: () => Promise<void>) {
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const touchStartY = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || touchStartY.current === 0) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0) {
        setIsPulling(true);
        setPullY(Math.min(dy * 0.4, PULL_THRESHOLD + 16));
      }
    };
    const onTouchEnd = async () => {
      if (!isPulling) return;
      if (pullY >= PULL_THRESHOLD) {
        if (syncStatus === 'error') {
          showToast('⚠ Unsaved data hai — pehle Settings me ↻ Sync karein');
        } else if (syncStatus === 'syncing') {
          showToast('Sync chal raha hai, thoda rukein...');
        } else {
          showToast('Cloud se sync ho raha hai...');
          await syncNow();
        }
      }
      setIsPulling(false);
      setPullY(0);
      touchStartY.current = 0;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPulling, pullY, syncStatus, syncNow, showToast]);

  return { pullY, isPulling, toast, PULL_THRESHOLD };
}
