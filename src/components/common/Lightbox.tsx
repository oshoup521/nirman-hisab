import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
  photo: { url: string; caption?: string } | null;
  onClose: () => void;
}

export default function Lightbox({ photo, onClose }: LightboxProps) {
  useEffect(() => {
    if (!photo) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center" onClick={onClose}>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      {/* Image */}
      <img
        src={photo.url}
        className="max-w-full max-h-[80vh] object-contain rounded-xl px-4"
        alt={photo.caption || 'Site photo'}
        onClick={e => e.stopPropagation()}
      />

      {/* Caption */}
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
