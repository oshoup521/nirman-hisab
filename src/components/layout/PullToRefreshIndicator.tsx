import React from 'react';
import { cn } from '../../lib/cn';

interface Props {
  pullY: number;
  isPulling: boolean;
  toast: string | null;
  pullThreshold: number;
  syncError: boolean;
}

export default function PullToRefreshIndicator({ pullY, isPulling, toast, pullThreshold, syncError }: Props) {
  return (
    <>
      {isPulling && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none transition-all"
          style={{ height: `${pullY}px` }}
        >
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-md transition-all',
            pullY >= pullThreshold
              ? syncError ? 'bg-orange-100 text-orange-600' : 'bg-indigo-600 text-white'
              : 'bg-white text-slate-400 border border-slate-200'
          )}>
            {pullY >= pullThreshold
              ? (syncError ? '⚠ Unsaved data — chord do' : '↑ Chord do to sync hoga')
              : '↓ Neeche kheencho to sync hoga'}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-lg max-w-xs text-center">
          {toast}
        </div>
      )}
    </>
  );
}
