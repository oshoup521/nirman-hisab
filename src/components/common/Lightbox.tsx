import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

type Photo = { path: string; caption?: string };

interface SinglePhoto { url: string; caption?: string }

interface LightboxProps {
  // Legacy single-photo mode
  photo?: SinglePhoto | null;
  // New gallery mode
  photos?: Photo[];
  startIndex?: number;
  getSignedUrl?: (path: string) => Promise<string | null>;
  open?: boolean;
  title?: string;
  onClose: () => void;
}

export default function Lightbox({
  photo, photos, startIndex = 0, getSignedUrl, open, title, onClose,
}: LightboxProps) {
  const galleryMode = !!photos && !!getSignedUrl;
  const isOpen = galleryMode ? !!open : !!photo;

  const [idx, setIdx] = useState(startIndex);
  const [urls, setUrls] = useState<Record<string, string>>({});

  // Reset index when reopening or startIndex changes
  useEffect(() => {
    if (galleryMode && isOpen) setIdx(startIndex);
  }, [isOpen, startIndex, galleryMode]);

  // Resolve current photo url (gallery mode)
  useEffect(() => {
    if (!galleryMode || !isOpen || !photos || !getSignedUrl) return;
    const current = photos[idx];
    if (!current) return;
    if (urls[current.path]) return;
    getSignedUrl(current.path).then(url => {
      if (url) setUrls(prev => ({ ...prev, [current.path]: url }));
    });
    // Prefetch neighbours for smooth swipe
    [-1, 1].forEach(d => {
      const n = photos[idx + d];
      if (n && !urls[n.path]) {
        getSignedUrl(n.path).then(url => {
          if (url) setUrls(prev => ({ ...prev, [n.path]: url }));
        });
      }
    });
  }, [idx, isOpen, galleryMode, photos, getSignedUrl, urls]);

  const navigate = useCallback((dir: 1 | -1) => {
    if (!photos) return;
    setIdx(i => {
      const next = i + dir;
      if (next < 0 || next >= photos.length) return i;
      return next;
    });
  }, [photos]);

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (galleryMode) {
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, galleryMode, navigate]);

  // Touch swipe (gallery mode)
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) navigate(1); else navigate(-1);
  };

  if (!isOpen) return null;

  // ----- Single mode (legacy) -----
  if (!galleryMode && photo) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center" onClick={onClose}>
        <button
          onClick={onClose}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <img
          src={photo.url}
          className="max-w-full max-h-[80vh] object-contain rounded-xl px-4"
          alt={photo.caption || 'Site photo'}
          onClick={e => e.stopPropagation()}
        />
        {photo.caption && (
          <div
            className="absolute bottom-0 inset-x-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}
          >
            <p className="text-white text-sm font-medium text-center">{photo.caption}</p>
          </div>
        )}
      </div>
    );
  }

  // ----- Gallery mode -----
  if (!photos || photos.length === 0) return null;
  const current = photos[idx];
  const url = current ? urls[current.path] : null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 shrink-0">
        <div className="min-w-0">
          {title && <p className="text-white font-bold text-sm leading-tight truncate">{title}</p>}
          <p className="text-white/50 text-[10px] font-bold mt-0.5">{idx + 1} / {photos.length}</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white active:bg-white/20 shrink-0 ml-3"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative px-2 min-h-0">
        <button
          onClick={() => navigate(-1)}
          className={cn(
            'absolute left-2 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white active:bg-white/20 transition-opacity',
            idx === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <ChevronLeft size={22} />
        </button>

        {url ? (
          <img
            src={url}
            className="max-w-full max-h-full object-contain rounded-xl"
            alt={current?.caption || title || 'Photo'}
            draggable={false}
          />
        ) : (
          <div className="w-56 h-56 bg-white/5 rounded-2xl animate-pulse" />
        )}

        <button
          onClick={() => navigate(1)}
          className={cn(
            'absolute right-2 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white active:bg-white/20 transition-opacity',
            idx === photos.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Caption + dot indicators */}
      <div
        className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 text-center"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      >
        {current?.caption && (
          <p className="text-white text-sm font-medium mb-3">{current.caption}</p>
        )}
        {photos.length > 1 && photos.length <= 30 && (
          <div className="flex items-center justify-center gap-1.5">
            {photos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
