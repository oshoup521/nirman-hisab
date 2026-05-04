import React from 'react';
import { ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { useAppContext } from '../../context/AppContext';
import { Milestone } from '../../types';
import PhotoThumb from '../common/PhotoThumb';

export default function TimelineSection() {
  const { state, setState, askConfirm, photos } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto, setLightboxPhoto } = photos;

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
      <h3 className="font-bold text-slate-900">Kaam ki Raftaar</h3>
      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {state.milestones.map(milestone => (
          <div key={milestone.id} className="relative">
            <div className={cn(
              'absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10',
              milestone.status === 'completed' ? 'bg-green-500' :
              milestone.status === 'in-progress' ? 'bg-indigo-500' : 'bg-slate-200'
            )} />
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900">{milestone.phase}</h4>
                <select
                  value={milestone.status}
                  onChange={e => updateStatus(milestone.id, e.target.value as Milestone['status'])}
                  className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-0"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shuru</p>
                  <input
                    type="date"
                    value={milestone.startDate ?? ''}
                    onChange={e => updateDate(milestone.id, 'startDate', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-slate-700"
                  />
                </div>
                <div>
                  <p className={cn('text-[10px] font-bold uppercase mb-1', milestone.status !== 'completed' ? 'text-slate-200' : 'text-slate-400')}>
                    Khatam
                  </p>
                  <input
                    type="date"
                    value={milestone.endDate ?? ''}
                    disabled={milestone.status !== 'completed'}
                    onChange={e => updateDate(milestone.id, 'endDate', e.target.value)}
                    className={cn(
                      'w-full text-xs border rounded-lg px-2 py-1.5',
                      milestone.status !== 'completed'
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    )}
                  />
                </div>
              </div>

              {milestone.startDate && (() => {
                if (milestone.status === 'completed' && milestone.endDate) {
                  const days = Math.round((new Date(milestone.endDate).getTime() - new Date(milestone.startDate).getTime()) / 86400000);
                  return days >= 0 ? <p className="mt-2 text-xs text-slate-400">{days} din lage</p> : null;
                }
                if (milestone.status === 'in-progress') {
                  const days = Math.round((Date.now() - new Date(milestone.startDate).getTime()) / 86400000);
                  return <p className="mt-2 text-xs text-indigo-400 font-medium">{days} din se chal raha hai</p>;
                }
                return null;
              })()}

              {/* Photos */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <ImageIcon size={11} /> Photos {milestone.photos?.length ? `(${milestone.photos.length})` : ''}
                  </p>
                  {photoUploading === milestone.id ? (
                    <span className="text-xs text-slate-400 font-bold">Uploading…</span>
                  ) : (
                    <label className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer bg-slate-100 text-slate-600 active:bg-slate-200">
                      <ImageIcon size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const caption = prompt('Photo ka naam / caption (optional):') ?? '';
                            uploadPhoto(milestone.id, file, caption);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
                {milestone.photos && milestone.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {milestone.photos.map(photo => (
                      <PhotoThumb
                        key={photo.path}
                        path={photo.path}
                        caption={photo.caption}
                        getSignedUrl={getSignedUrl}
                        onOpen={(url, caption) => setLightboxPhoto({ url, caption })}
                        onDelete={() => askConfirm('Is photo ko delete karein?', () => deletePhoto(milestone.id, photo.path))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
