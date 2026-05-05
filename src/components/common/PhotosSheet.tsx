import React, { useEffect } from 'react';
import { X, ImageIcon } from 'lucide-react';
import PhotoThumb from './PhotoThumb';

type Photo = { path: string; caption?: string };

interface PhotosSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  photos: Photo[];
  uploading?: boolean;
  getSignedUrl: (path: string) => Promise<string | null>;
  onClose: () => void;
  onOpenAt: (index: number) => void;
  onDelete: (path: string) => void;
  onAdd?: (file: File, caption: string) => void;
}

const PhotosSheet: React.FC<PhotosSheetProps> = ({
  open, title, subtitle, photos, uploading, getSignedUrl, onClose, onOpenAt, onDelete, onAdd,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base truncate">{title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                {photos.length} photo{photos.length === 1 ? '' : 's'}{subtitle ? ` • ${subtitle}` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
          {photos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ImageIcon size={26} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-600 text-sm">Koi photo nahi abhi tak</p>
              {onAdd && (
                <p className="text-xs text-slate-400 mt-1">Niche "Photo Add" se shuru karo</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((photo, i) => (
                <PhotoThumb
                  key={photo.path}
                  path={photo.path}
                  caption={photo.caption}
                  getSignedUrl={getSignedUrl}
                  onOpen={() => onOpenAt(i)}
                  onDelete={() => onDelete(photo.path)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer add button */}
        {onAdd && (
          <div
            className="absolute bottom-0 inset-x-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-white/0"
          >
            {uploading ? (
              <div className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm text-center">
                Uploading…
              </div>
            ) : (
              <label className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-sm shadow-indigo-200 cursor-pointer active:scale-[0.99] transition-transform">
                <ImageIcon size={16} />
                Photo Add Karein
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const caption = prompt('Photo ka naam / caption (optional):') ?? '';
                      onAdd(file, caption);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PhotosSheet;
