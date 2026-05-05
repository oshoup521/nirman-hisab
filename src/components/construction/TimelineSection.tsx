import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { useAppContext } from '../../context/AppContext';
import { Milestone } from '../../types';
import PhotoStrip from '../common/PhotoStrip';
import PhotosSheet from '../common/PhotosSheet';
import Lightbox from '../common/Lightbox';

export default function TimelineSection() {
  const { state, setState, askConfirm, photos } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto } = photos;
  const [sheetMilestoneId, setSheetMilestoneId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ milestoneId: string; idx: number } | null>(null);

  const sheetMilestone = sheetMilestoneId ? state.milestones.find(m => m.id === sheetMilestoneId) : null;
  const lightboxMilestone = lightbox ? state.milestones.find(m => m.id === lightbox.milestoneId) : null;

  const updateStatus = (milestoneId: string, newStatus: Milestone['status']) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          status: newStatus,
          startDate: newStatus === 'in-progress' && !m.startDate ? today : m.startDate,
          endDate: newStatus === 'completed' ? today : undefined,
        };
      }),
    }));
  };

  const updateDate = (milestoneId: string, field: 'startDate' | 'endDate', value: string) => {
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === milestoneId ? { ...m, [field]: value || undefined } : m
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-text-primary">Kaam ki Raftaar</h3>
      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-default">
        {state.milestones.map(milestone => (
          <div key={milestone.id} className="relative">
            <div className={cn(
              'absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 border-surface shadow-sm z-10',
              milestone.status === 'completed' ? 'bg-emerald-500' :
              milestone.status === 'in-progress' ? 'bg-brand' : 'bg-border-default'
            )} />
            <div className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-text-primary">{milestone.phase}</h4>
                <select
                  value={milestone.status}
                  onChange={e => updateStatus(milestone.id, e.target.value as Milestone['status'])}
                  className="text-xs font-bold bg-surface-subdued text-text-primary border-none rounded-lg focus:ring-0"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-text-subdued uppercase mb-1">Shuru</p>
                  <input
                    type="date"
                    value={milestone.startDate ?? ''}
                    onChange={e => updateDate(milestone.id, 'startDate', e.target.value)}
                    className="w-full text-xs bg-surface-subdued border border-border-default rounded-lg px-2 py-1.5 text-text-primary dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <p className={cn('text-[10px] font-bold uppercase mb-1', milestone.status !== 'completed' ? 'text-text-subdued/50' : 'text-text-subdued')}>
                    Khatam
                  </p>
                  <input
                    type="date"
                    value={milestone.endDate ?? ''}
                    disabled={milestone.status !== 'completed'}
                    onChange={e => updateDate(milestone.id, 'endDate', e.target.value)}
                    className={cn(
                      'w-full text-xs border rounded-lg px-2 py-1.5 dark:[color-scheme:dark]',
                      milestone.status !== 'completed'
                        ? 'bg-surface-subdued/50 border-border-subdued text-text-subdued/50 cursor-not-allowed'
                        : 'bg-surface-subdued border-border-default text-text-primary'
                    )}
                  />
                </div>
              </div>

              {milestone.startDate && (() => {
                if (milestone.status === 'completed' && milestone.endDate) {
                  const days = Math.round((new Date(milestone.endDate).getTime() - new Date(milestone.startDate).getTime()) / 86400000);
                  return days >= 0 ? <p className="mt-2 text-xs text-text-subdued">{days} din lage</p> : null;
                }
                if (milestone.status === 'in-progress') {
                  const days = Math.round((Date.now() - new Date(milestone.startDate).getTime()) / 86400000);
                  return <p className="mt-2 text-xs text-brand font-medium">{days} din se chal raha hai</p>;
                }
                return null;
              })()}

              {/* Photos */}
              <div className="mt-3 border-t border-border-default pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-text-subdued uppercase flex items-center gap-1">
                    <ImageIcon size={11} /> Photos {milestone.photos?.length ? `(${milestone.photos.length})` : ''}
                  </p>
                  {photoUploading === `milestone:${milestone.id}` ? (
                    <span className="text-xs text-text-subdued font-bold">Uploading…</span>
                  ) : (
                    <label className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer bg-surface-subdued text-text-secondary active:bg-border-default transition-colors">
                      <ImageIcon size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const caption = prompt('Photo ka naam / caption (optional):') ?? '';
                            uploadPhoto('milestone', milestone.id, file, caption);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
                {milestone.photos && milestone.photos.length > 0 && (
                  <PhotoStrip
                    photos={milestone.photos}
                    getSignedUrl={getSignedUrl}
                    onOpenAt={(idx) => setLightbox({ milestoneId: milestone.id, idx })}
                    onSeeAll={() => setSheetMilestoneId(milestone.id)}
                    onDelete={(path) => askConfirm('Is photo ko delete karein?', () => deletePhoto('milestone', milestone.id, path))}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photos Sheet */}
      <PhotosSheet
        open={!!sheetMilestone}
        title={sheetMilestone?.phase ?? ''}
        subtitle="Phase Photos"
        photos={sheetMilestone?.photos ?? []}
        uploading={photoUploading === `milestone:${sheetMilestoneId}`}
        getSignedUrl={getSignedUrl}
        onClose={() => setSheetMilestoneId(null)}
        onOpenAt={(idx) => sheetMilestoneId && setLightbox({ milestoneId: sheetMilestoneId, idx })}
        onDelete={(path) => sheetMilestoneId && askConfirm('Is photo ko delete karein?', () => deletePhoto('milestone', sheetMilestoneId, path))}
        onAdd={(file, caption) => sheetMilestoneId && uploadPhoto('milestone', sheetMilestoneId, file, caption)}
      />

      {/* Photo Lightbox (swipeable) */}
      <Lightbox
        open={!!lightbox}
        photos={lightboxMilestone?.photos ?? []}
        startIndex={lightbox?.idx ?? 0}
        title={lightboxMilestone?.phase}
        getSignedUrl={getSignedUrl}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
