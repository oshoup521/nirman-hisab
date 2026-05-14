import React, { useEffect, useRef, useState } from 'react';
import { X, ImageIcon, Check } from 'lucide-react';
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
  onDelete?: (path: string) => void;
  onAdd?: (file: File, caption: string) => void;
}

const PhotosSheet: React.FC<PhotosSheetProps> = ({
  open, title, subtitle, photos, uploading, getSignedUrl, onClose, onOpenAt, onDelete, onAdd,
}) => {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const captionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (pendingFile) {
      setTimeout(() => captionInputRef.current?.focus(), 100);
    }
  }, [pendingFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setCaption('');
    }
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (!pendingFile || !onAdd) return;
    onAdd(pendingFile, caption.trim());
    setPendingFile(null);
    setCaption('');
  };

  const handleCancelCaption = () => {
    setPendingFile(null);
    setCaption('');
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-2xl max-w-md mx-auto flex flex-col border-t border-border-default"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border-subdued shrink-0">
          <div className="w-10 h-1 bg-border-default rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-text-primary text-title truncate">{title}</h3>
              <p className="text-caption font-bold text-text-subdued uppercase">
                {photos.length} photo{photos.length === 1 ? '' : 's'}{subtitle ? ` • ${subtitle}` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary shrink-0"
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
              <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ImageIcon size={26} className="text-border-default" />
              </div>
              <p className="font-bold text-text-secondary text-body-sm">Koi photo nahi abhi tak</p>
              {onAdd && (
                <p className="text-caption text-text-subdued mt-1">Niche "Photo Add" se shuru karo</p>
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
                  onDelete={() => onDelete?.(photo.path)}
                  hideDelete={!onDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {onAdd && (
          <div
            className="absolute bottom-0 inset-x-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-surface via-surface to-transparent"
          >
            {pendingFile ? (
              /* Caption entry UI */
              <div className="bg-surface-subdued rounded-2xl p-3 flex flex-col gap-2.5 border border-border-default">
                <p className="text-caption font-bold text-text-subdued uppercase tracking-wide">Photo ka caption (optional)</p>
                <input
                  ref={captionInputRef}
                  type="text"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                  placeholder="e.g. Foundation ka kaam, Chhath ka view..."
                  className="w-full p-3.5 bg-surface text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelCaption}
                    className="flex-1 py-3 bg-surface text-text-secondary rounded-2xl font-bold text-body-sm border border-border-default active:scale-[0.99] transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-brand text-white rounded-2xl font-bold text-body-sm flex items-center justify-center gap-1.5 shadow-sm shadow-brand/20 active:scale-[0.99] transition-transform"
                  >
                    <Check size={15} />
                    Upload Karein
                  </button>
                </div>
              </div>
            ) : uploading ? (
              <div className="w-full py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm text-center">
                Uploading…
              </div>
            ) : (
              <label className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-white rounded-2xl font-bold text-body-sm shadow-sm shadow-brand/20 cursor-pointer active:scale-[0.99] transition-transform">
                <ImageIcon size={16} />
                Photo Add Karein
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
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
