import React, { useState, useCallback } from 'react';
import { Images, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext } from '../../context/AppContext';
import PhotoThumb from '../common/PhotoThumb';
import PhotosSheet from '../common/PhotosSheet';
import { Milestone } from '../../types';

const PHASE_GRID_CAP = 8; // show 8 thumbs + "+N more" tile

type Photo = NonNullable<Milestone['photos']>[number];
type LightboxState = {
  phase: string;
  photos: Photo[];
  idx: number;
  urls: Record<string, string>;
};

const STATUS_CFG = {
  completed:    { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Done' },
  'in-progress':{ dot: 'bg-brand',  badge: 'bg-brand/10 text-brand border-brand/20',   label: 'Active' },
  pending:      { dot: 'bg-border-subdued',   badge: 'bg-surface-subdued text-text-secondary border-border-default',      label: 'Pending' },
} as const;

export default function GallerySection() {
  const { state, askConfirm, photos } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto } = photos;

  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [sheetMilestoneId, setSheetMilestoneId] = useState<string | null>(null);
  const sheetMilestone = sheetMilestoneId ? state.milestones.find(m => m.id === sheetMilestoneId) : null;

  const milestonesWithPhotos = state.milestones.filter(m => m.photos && m.photos.length > 0);
  const totalPhotos = milestonesWithPhotos.reduce((sum, m) => sum + (m.photos?.length ?? 0), 0);

  const openLightbox = useCallback((milestone: Milestone, clickedPath: string, resolvedUrl: string) => {
    const phasePhotos = milestone.photos!;
    const idx = phasePhotos.findIndex(p => p.path === clickedPath);
    setLightbox({ phase: milestone.phase, photos: phasePhotos, idx, urls: { [clickedPath]: resolvedUrl } });
  }, []);

  const navigate = useCallback(async (dir: 1 | -1) => {
    setLightbox(prev => {
      if (!prev) return null;
      const newIdx = prev.idx + dir;
      if (newIdx < 0 || newIdx >= prev.photos.length) return prev;
      const photo = prev.photos[newIdx];
      if (prev.urls[photo.path]) {
        return { ...prev, idx: newIdx };
      }
      getSignedUrl(photo.path).then(url => {
        if (url) setLightbox(p => p ? { ...p, idx: newIdx, urls: { ...p.urls, [photo.path]: url } } : null);
      });
      return { ...prev, idx: newIdx };
    });
  }, [getSignedUrl]);

  const currentPhoto = lightbox ? lightbox.photos[lightbox.idx] : null;
  const currentUrl = lightbox && currentPhoto ? lightbox.urls[currentPhoto.path] : null;

  if (milestonesWithPhotos.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-text-primary">Site Gallery</h3>
        <div className="bg-surface rounded-2xl border border-border-default p-12 text-center">
          <div className="w-16 h-16 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Images size={28} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-sm">Abhi koi photo nahi</p>
          <p className="text-xs text-text-subdued mt-1">Timeline tab mein phases mein photos add karo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <h3 className="font-bold text-text-primary">Site Gallery</h3>
        <p className="text-xs text-text-subdued font-bold">
          {totalPhotos} photos • {milestonesWithPhotos.length} phases
        </p>
      </div>

      {/* Phase sections */}
      {milestonesWithPhotos.map(milestone => {
        const cfg = STATUS_CFG[milestone.status] ?? STATUS_CFG.pending;
        return (
          <div key={milestone.id} className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
            {/* Phase header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <div className="flex items-center gap-2.5">
                <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
                <p className="font-bold text-text-primary text-sm">{milestone.phase}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-subdued font-bold">{milestone.photos!.length} photos</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.badge)}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Photo grid (capped) */}
            {(() => {
              const all = milestone.photos!;
              const overflow = all.length > PHASE_GRID_CAP;
              const visible = overflow ? all.slice(0, PHASE_GRID_CAP - 1) : all;
              const hiddenCount = all.length - visible.length;
              return (
                <div className="p-3 grid grid-cols-3 gap-2">
                  {visible.map(photo => (
                    <PhotoThumb
                      key={photo.path}
                      path={photo.path}
                      caption={photo.caption}
                      getSignedUrl={getSignedUrl}
                      onOpen={(url) => openLightbox(milestone, photo.path, url)}
                      onDelete={() => askConfirm('Is photo ko delete karein?', () => deletePhoto('milestone', milestone.id, photo.path))}
                    />
                  ))}
                  {overflow && (
                    <button
                      onClick={() => setSheetMilestoneId(milestone.id)}
                      className="aspect-square rounded-xl bg-surface-subdued border border-border-default text-text-primary flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm"
                    >
                      <ImageIcon size={20} className="opacity-80" />
                      <span className="text-base font-bold leading-none">+{hiddenCount}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">More</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Full-screen lightbox with prev/next navigation */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 shrink-0">
            <div>
              <p className="text-white font-bold text-sm leading-tight">{lightbox.phase}</p>
              <p className="text-white/50 text-[10px] font-bold mt-0.5">
                {lightbox.idx + 1} / {lightbox.photos.length}
              </p>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white active:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>

          {/* Image area */}
          <div className="flex-1 flex items-center justify-center relative px-2 min-h-0">
            {/* Prev */}
            <button
              onClick={() => navigate(-1)}
              className={cn(
                'absolute left-2 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white active:bg-white/20 transition-opacity',
                lightbox.idx === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              )}
            >
              <ChevronLeft size={22} />
            </button>

            {/* Photo */}
            {currentUrl ? (
              <img
                src={currentUrl}
                className="max-w-full max-h-full object-contain rounded-xl"
                alt={currentPhoto?.caption || lightbox.phase}
                draggable={false}
              />
            ) : (
              <div className="w-56 h-56 bg-white/5 rounded-2xl animate-pulse" />
            )}

            {/* Next */}
            <button
              onClick={() => navigate(1)}
              className={cn(
                'absolute right-2 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white active:bg-white/20 transition-opacity',
                lightbox.idx === lightbox.photos.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
            {currentPhoto?.caption && (
              <p className="text-white text-sm font-medium mb-3">{currentPhoto.caption}</p>
            )}

            {/* Dot strip */}
            {lightbox.photos.length > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {lightbox.photos.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === lightbox.idx ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photos Sheet — opens when "+N more" tapped */}
      <PhotosSheet
        open={!!sheetMilestone}
        title={sheetMilestone?.phase ?? ''}
        subtitle="All Photos"
        photos={sheetMilestone?.photos ?? []}
        uploading={photoUploading === `milestone:${sheetMilestoneId}`}
        getSignedUrl={getSignedUrl}
        onClose={() => setSheetMilestoneId(null)}
        onOpenAt={(idx) => {
          if (!sheetMilestone) return;
          const phasePhotos = sheetMilestone.photos!;
          const target = phasePhotos[idx];
          if (!target) return;
          setLightbox({ phase: sheetMilestone.phase, photos: phasePhotos, idx, urls: {} });
          getSignedUrl(target.path).then(url => {
            if (url) setLightbox(p => p ? { ...p, urls: { ...p.urls, [target.path]: url } } : null);
          });
        }}
        onDelete={(path) => sheetMilestoneId && askConfirm('Is photo ko delete karein?', () => deletePhoto('milestone', sheetMilestoneId, path))}
        onAdd={(file, caption) => sheetMilestoneId && uploadPhoto('milestone', sheetMilestoneId, file, caption)}
      />
    </div>
  );
}
