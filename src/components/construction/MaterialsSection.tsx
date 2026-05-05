import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package, AlertTriangle, X, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Material } from '../../types';
import PhotoThumb from '../common/PhotoThumb';
import Lightbox from '../common/Lightbox';

type MatForm = { name: string; unit: string; purchased: string; rate: string; minStock: string };
type UsageForm = { materialId: string; materialName: string; unit: string; amount: string };

const blankForm = (): MatForm => ({ name: '', unit: '', purchased: '', rate: '', minStock: '' });

export default function MaterialsSection() {
  const { state, setState, askConfirm, photos } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto, lightboxPhoto, setLightboxPhoto } = photos;
  const [form, setForm] = useState<MatForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [usageForm, setUsageForm] = useState<UsageForm | null>(null);

  const openAdd = () => { setEditId(null); setForm(blankForm()); };
  const openEdit = (m: Material) => {
    setEditId(m.id);
    setForm({ name: m.name, unit: m.unit, purchased: String(m.purchased), rate: String(m.rate), minStock: String(m.minStock) });
  };
  const closeForm = () => { setForm(null); setEditId(null); };

  const save = () => {
    if (!form?.name) return;
    const purchased = Number(form.purchased) || 0;
    const rate = Number(form.rate) || 0;
    const unit = form.unit || 'units';
    if (editId) {
      setState(prev => ({
        ...prev,
        materials: prev.materials.map(m =>
          m.id === editId ? { ...m, name: form.name, unit, purchased, rate, minStock: Number(form.minStock) || 0 } : m
        ),
      }));
    } else {
      const newMat: Material = {
        id: genId(), name: form.name, unit, purchased, used: 0, rate,
        vendor: '', date: new Date().toISOString(), billNumber: '', minStock: Number(form.minStock) || 0,
      };
      setState(prev => ({
        ...prev,
        materials: [...prev.materials, newMat],
        expenses: [...prev.expenses, {
          id: genId(), date: new Date().toISOString(), amount: purchased * rate,
          category: 'Material', notes: `${purchased} ${unit} of ${form.name} purchased`,
        }],
      }));
    }
    closeForm();
  };

  const submitUsage = () => {
    if (!usageForm) return;
    const used = Number(usageForm.amount);
    if (!used || used <= 0) return;
    setState(prev => ({
      ...prev,
      materials: prev.materials.map(m => m.id === usageForm.materialId ? { ...m, used: m.used + used } : m),
    }));
    setUsageForm(null);
  };

  const sorted = [...state.materials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lowCount = sorted.filter(m => m.purchased - m.used <= m.minStock).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900">Samaan ka Stock</h3>
          {lowCount > 0 && (
            <p className="text-[10px] font-bold text-red-500 mt-0.5 flex items-center gap-1">
              <AlertTriangle size={10} /> {lowCount} item{lowCount > 1 ? 's' : ''} low stock
            </p>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi material nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100">
            + Material Add Karein
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(material => {
            const stock = material.purchased - material.used;
            const isLow = stock <= material.minStock;
            const usedPct = material.purchased > 0 ? Math.min(100, (material.used / material.purchased) * 100) : 0;
            return (
              <div key={material.id} className={cn('bg-white rounded-2xl border shadow-sm p-4', isLow ? 'border-red-100' : 'border-slate-100')}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900">{material.name}</h4>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-500 rounded-full">
                          <AlertTriangle size={9} /> Low
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {material.purchased} {material.unit} bought • {formatCurrency(material.rate)}/{material.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-2xl font-bold leading-none', isLow ? 'text-red-500' : 'text-emerald-600')}>{stock}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{material.unit} left</p>
                  </div>
                </div>

                {/* Usage bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                    <span>Used: {material.used} {material.unit}</span>
                    <span>{usedPct.toFixed(0)}% consumed</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-400' : usedPct > 75 ? 'bg-amber-400' : 'bg-indigo-400')}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUsageForm({ materialId: material.id, materialName: material.name, unit: material.unit, amount: '' })}
                    className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
                  >
                    Update Usage
                  </button>
                  <button onClick={() => openEdit(material)} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm(`"${material.name}" delete kar dein?`, () =>
                      setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== material.id) }))
                    )}
                    className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-red-400 border border-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Photos: bill / samaan ki tasveer */}
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <ImageIcon size={11} /> Bill / Photos {material.photos?.length ? `(${material.photos.length})` : ''}
                    </p>
                    {photoUploading === `material:${material.id}` ? (
                      <span className="text-xs text-slate-400 font-bold">Uploading…</span>
                    ) : (
                      <label className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer bg-slate-100 text-slate-600 active:bg-slate-200">
                        <ImageIcon size={12} /> Add
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const caption = prompt('Photo ka naam / caption (optional):') ?? '';
                              uploadPhoto('material', material.id, file, caption);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {material.photos && material.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {material.photos.map(photo => (
                        <PhotoThumb
                          key={photo.path}
                          path={photo.path}
                          caption={photo.caption}
                          getSignedUrl={getSignedUrl}
                          onOpen={(url, caption) => setLightboxPhoto({ url, caption })}
                          onDelete={() => askConfirm('Is photo ko delete karein?', () => deletePhoto('material', material.id, photo.path))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Sheet */}
      {form && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{editId ? 'Material Edit' : 'Naya Material'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Material Name</label>
                <input type="text" autoFocus value={form.name} onChange={e => setForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Cement, Sand, Sariya" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Unit</label>
                  <input type="text" value={form.unit} onChange={e => setForm(f => f ? { ...f, unit: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="bags / tons" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Quantity</label>
                  <input type="number" inputMode="numeric" value={form.purchased} onChange={e => setForm(f => f ? { ...f, purchased: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Rate / Unit (₹)</label>
                  <input type="number" inputMode="numeric" value={form.rate} onChange={e => setForm(f => f ? { ...f, rate: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Low Stock Alert</label>
                  <input type="number" inputMode="numeric" value={form.minStock} onChange={e => setForm(f => f ? { ...f, minStock: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                </div>
              </div>
              {!editId && form.purchased && form.rate && (
                <div className="bg-indigo-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase">Total Cost (auto-logged as expense)</p>
                  <p className="text-lg font-bold text-indigo-700">{formatCurrency(Number(form.purchased) * Number(form.rate))}</p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={save} disabled={!form.name} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200">
                  {editId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Photo Lightbox */}
      <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />

      {/* Usage Sheet */}
      {usageForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setUsageForm(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Usage Update</h3>
                <button onClick={() => setUsageForm(null)} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>
              <p className="text-slate-500 text-sm font-medium">{usageForm.materialName} — Kitna use hua aaj?</p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Quantity ({usageForm.unit})</label>
                <input type="number" inputMode="numeric" autoFocus value={usageForm.amount}
                  onChange={e => setUsageForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-xl"
                  placeholder="0" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setUsageForm(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={submitUsage} disabled={!usageForm.amount || Number(usageForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40">
                  Update Karo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
