import React from 'react';
import { ImageIcon } from 'lucide-react';
import PhotoThumb from './PhotoThumb';

type Photo = { path: string; caption?: string };

interface PhotoStripProps {
  photos: Photo[];
  visibleCount?: number; // how many thumbs before "+N" tile (default 5)
  getSignedUrl: (path: string) => Promise<string | null>;
  onOpenAt: (index: number) => void;
  onSeeAll: () => void;
  onDelete?: (path: string) => void;
}

const PhotoStrip: React.FC<PhotoStripProps> = ({
  photos, visibleCount = 5, getSignedUrl, onOpenAt, onSeeAll, onDelete,
}) => {
  if (photos.length === 0) return null;

  const showOverflow = photos.length > visibleCount;
  const visible = showOverflow ? photos.slice(0, visibleCount) : photos;
  const hiddenCount = photos.length - visibleCount;

  return (
    <div className="-mx-1 overflow-x-auto">
      <div className="flex gap-1.5 px-1 snap-x snap-mandatory">
        {visible.map((photo, i) => (
          <div key={photo.path} className="w-20 h-20 shrink-0 snap-start">
            <PhotoThumb
              path={photo.path}
              caption={photo.caption}
              getSignedUrl={getSignedUrl}
              onOpen={() => onOpenAt(i)}
              onDelete={onDelete ? () => onDelete(photo.path) : () => {}}
              hideDelete={!onDelete}
            />
          </div>
        ))}
        {showOverflow && (
          <button
            onClick={onSeeAll}
            className="w-20 h-20 shrink-0 snap-start rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform shadow-sm"
          >
            <ImageIcon size={16} className="opacity-80" />
            <span className="text-sm font-bold leading-none">+{hiddenCount}</span>
            <span className="text-[8px] font-bold uppercase tracking-wide opacity-70">More</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PhotoStrip;
