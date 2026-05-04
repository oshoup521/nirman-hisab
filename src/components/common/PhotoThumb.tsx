import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PhotoThumbProps {
  path: string;
  caption?: string;
  getSignedUrl: (path: string) => Promise<string | null>;
  onOpen: (url: string, caption?: string) => void;
  onDelete: () => void;
}

const PhotoThumb: React.FC<PhotoThumbProps> = ({ path, caption, getSignedUrl, onOpen, onDelete }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getSignedUrl(path).then(setUrl);
  }, [path, getSignedUrl]);

  if (!url) {
    return <div className="aspect-square bg-slate-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm active:scale-95 transition-transform duration-150">
      <img
        src={url}
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => onOpen(url, caption)}
        alt={caption || 'Site photo'}
        loading="lazy"
      />

      {/* Caption gradient overlay */}
      {caption && (
        <div
          className="absolute inset-x-0 bottom-0 pt-5 pb-1.5 px-1.5 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
        >
          <p className="text-[9px] text-white font-bold leading-tight truncate">{caption}</p>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 w-5 h-5 bg-black/50 backdrop-blur-sm text-white rounded-md flex items-center justify-center"
        aria-label="Delete photo"
      >
        <X size={9} />
      </button>
    </div>
  );
};

export default PhotoThumb;
