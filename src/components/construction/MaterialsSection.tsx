import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package, AlertTriangle, X, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Material, MaterialPurchase } from '../../types';
import PhotoStrip from '../common/PhotoStrip';
import PhotosSheet from '../common/PhotosSheet';
import Lightbox from '../common/Lightbox';

type MatForm = { name: string; unit: string; purchased: string; rate: string; minStock: string };
type UsageForm = { materialId: string; materialName: string; unit: string; amount: string };

const blankForm = (): MatForm => ({ name: '', unit: '', purchased: '', rate: '', minStock: '' });

// Normalize for duplicate-detection so "Cement"/"cement " and "Bags"/"bag" match.
const normName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const normUnit = (s: string) => s.trim().toLowerCase().replace(/s$/, '');
const matKey = (name: string, unit: string) => `${normName(name)}|${normUnit(unit)}`;

// Returns purchase lots; synthesises one for old rows that predate the purchases[] field.
const getPurchaseLots = (m: Material): MaterialPurchase[] =>
  m.purchases && m.purchases.length > 0
    ? m.purchases
    : [{ id: m.id + '_0', qty: m.purchased, rate: m.rate, date: m.date }];

export default function MaterialsSection() {
  const { state, setState, askConfirm, photos, isViewer } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto } = photos;
  const [form, setForm] = useState<MatForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [usageForm, setUsageForm] = useState<UsageForm | null>(null);
  const [sheetMatId, setSheetMatId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ matId: string; idx: number } | null>(null);
  const [expandedPurchasesId, setExpandedPurchasesId] = useState<string | null>(null);

  const sheetMaterial = sheetMatId ? state.materials.find(m => m.id === sheetMatId) : null;
  const lightboxMaterial = lightbox ? state.materials.find(m => m.id === lightbox.matId) : null;

  // When adding, detect if this material (same name + unit) already exists — it will merge.
  const dupMaterial = form && !editId && form.name.trim()
    ? state.materials.find(m => matKey(m.name, m.unit) === matKey(form.name, form.unit)) ?? null
    : null;


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
      const purchaseDate = new Date().toISOString();
      const newLot: MaterialPurchase = { id: genId(), qty: purchased, rate, date: purchaseDate };
      setState(prev => {
        const key = matKey(form.name, unit);
        const idx = prev.materials.findIndex(m => matKey(m.name, m.unit) === key);
        let materials: Material[];
        if (idx >= 0) {
          // Same material already exists — push a new purchase lot, recalculate total quantity.
          const ex = prev.materials[idx];
          const allLots = [...getPurchaseLots(ex), newLot];
          const totalPurchased = allLots.reduce((s, p) => s + p.qty, 0);
          const merged: Material = { ...ex, purchased: totalPurchased, rate, purchases: allLots, date: purchaseDate };
          materials = prev.materials.map((m, i) => (i === idx ? merged : m));
        } else {
          const newMat: Material = {
            id: genId(), name: form.name, unit, purchased, used: 0, rate,
            vendor: '', date: purchaseDate, billNumber: '', minStock: Number(form.minStock) || 0,
            purchases: [newLot],
          };
          materials = [...prev.materials, newMat];
        }
        return {
          ...prev,
          materials,
          expenses: [...prev.expenses, {
            id: genId(), date: purchaseDate, amount: purchased * rate,
            category: 'Material', notes: `${purchased} ${unit} of ${form.name} @ ${formatCurrency(rate)}/${unit}`,
          }],
        };
      });
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
          <h3 className="font-heading text-title font-bold text-text-primary">Samaan ka Stock</h3>
          {lowCount > 0 && (
            <p className="text-caption font-bold text-red-500 mt-0.5 flex items-center gap-1">
              <AlertTriangle size={10} /> {lowCount} item{lowCount > 1 ? 's' : ''} low stock
            </p>
          )}
        </div>
        {!isViewer && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-body-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-body-sm">Koi material nahi abhi tak</p>
          {!isViewer && (
            <button onClick={openAdd} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-body-sm font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
              + Material Add Karein
            </button>
          )}
        </div>
      ) : (
        <>
        {/* Desktop: table */}
        <div className="hidden md:block bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subdued border-b border-border-default">
                <tr>
                  <th className="py-2.5 px-4 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Material</th>
                  <th className="py-2.5 px-3 text-center text-caption font-bold text-text-subdued uppercase tracking-wide">Purchased</th>
                  <th className="py-2.5 px-3 text-center text-caption font-bold text-text-subdued uppercase tracking-wide">Used</th>
                  <th className="py-2.5 px-3 text-center text-caption font-bold text-text-subdued uppercase tracking-wide">Stock</th>
                  <th className="py-2.5 px-3 text-right text-caption font-bold text-text-subdued uppercase tracking-wide">Rate</th>
                  <th className="py-2.5 px-3 text-center text-caption font-bold text-text-subdued uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-3 text-center text-caption font-bold text-text-subdued uppercase tracking-wide">Photos</th>
                  <th className="py-2.5 px-4 text-right text-caption font-bold text-text-subdued uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(material => {
                  const stock = material.purchased - material.used;
                  const isLow = stock <= material.minStock;
                  const usedPct = material.purchased > 0 ? Math.min(100, (material.used / material.purchased) * 100) : 0;
                  const photoCount = material.photos?.length ?? 0;
                  const lots = getPurchaseLots(material);
                  return (
                    <React.Fragment key={material.id}>
                    <tr className={cn('border-b border-border-subdued last:border-0 hover:bg-surface-subdued/50 transition-colors', isLow && 'bg-red-500/5')}>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-text-primary text-body-sm">{material.name}</p>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 text-caption font-bold px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-full">
                              <AlertTriangle size={8} /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-body-sm text-text-primary">{material.purchased} {material.unit}</td>
                      <td className="py-2.5 px-3 text-center text-body-sm text-text-secondary">{material.used} {material.unit}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('font-bold text-body-sm', isLow ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')}>
                          {stock} {material.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setExpandedPurchasesId(expandedPurchasesId === material.id ? null : material.id)}
                          className="inline-flex items-center gap-1 text-body-sm text-text-primary hover:text-brand transition-colors group"
                        >
                          {formatCurrency(material.rate)}/{material.unit}
                          {lots.length > 1 && <span className="text-caption text-brand font-bold">({lots.length})</span>}
                          {expandedPurchasesId === material.id
                            ? <ChevronUp size={11} className="text-brand" />
                            : <ChevronDown size={11} className="text-text-subdued group-hover:text-brand transition-colors" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-16 mx-auto">
                          <div className="w-full bg-surface-subdued h-1.5 rounded-full overflow-hidden border border-border-subdued">
                            <div
                              className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-400' : usedPct > 75 ? 'bg-amber-500' : 'bg-brand')}
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                          <p className="text-caption text-text-subdued mt-0.5">{usedPct.toFixed(0)}%</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {photoCount > 0 ? (
                          <button
                            onClick={() => setSheetMatId(material.id)}
                            className="inline-flex items-center gap-1 text-caption font-bold text-brand hover:opacity-80 transition-opacity"
                          >
                            <ImageIcon size={10} /> {photoCount}
                          </button>
                        ) : (
                          <span className="text-text-subdued opacity-50 text-caption">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => setUsageForm({ materialId: material.id, materialName: material.name, unit: material.unit, amount: '' })}
                              className="text-caption font-bold text-brand hover:opacity-80 transition-opacity mr-1"
                            >
                              Use
                            </button>
                            <button onClick={() => openEdit(material)} className="w-7 h-7 inline-flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-border-default transition-colors">
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => askConfirm(`"${material.name}" delete kar dein?`, () =>
                                setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== material.id) }))
                              )}
                              className="w-7 h-7 inline-flex items-center justify-center text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 ml-0.5 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {/* Purchase history sub-row */}
                    {expandedPurchasesId === material.id && (
                      <tr className="bg-surface-subdued/60">
                        <td colSpan={8} className="px-6 pb-3 pt-1">
                          <p className="text-caption font-bold text-text-subdued uppercase mb-1.5">Kharide ka itihas ({lots.length} lot)</p>
                          <div className="space-y-1">
                            {lots.map((lot, i) => (
                              <div key={lot.id} className="flex items-center gap-3 text-body-sm">
                                <span className="text-text-subdued w-5 text-caption font-bold">{i + 1}.</span>
                                <span className="text-text-primary font-bold">{lot.qty} {material.unit}</span>
                                <span className="text-text-subdued">@</span>
                                <span className="text-text-primary font-bold">{formatCurrency(lot.rate)}/{material.unit}</span>
                                <span className="text-text-subdued text-caption">{new Date(lot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                <span className="ml-auto text-text-secondary font-bold">{formatCurrency(lot.qty * lot.rate)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {sorted.map(material => {
            const stock = material.purchased - material.used;
            const isLow = stock <= material.minStock;
            const usedPct = material.purchased > 0 ? Math.min(100, (material.used / material.purchased) * 100) : 0;
            return (
              <div key={material.id} className={cn('bg-surface rounded-2xl border shadow-sm p-4', isLow ? 'border-red-500/30 bg-red-500/5' : 'border-border-default')}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heading text-title font-bold text-text-primary">{material.name}</h4>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 text-caption font-bold px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                          <AlertTriangle size={9} /> Low
                        </span>
                      )}
                    </div>
                    {(() => {
                      const lots = getPurchaseLots(material);
                      return (
                        <button
                          onClick={() => setExpandedPurchasesId(expandedPurchasesId === material.id ? null : material.id)}
                          className="flex items-center gap-1.5 mt-0.5 text-left"
                        >
                          <p className="text-caption text-text-subdued">
                            {material.purchased} {material.unit} kharida • {formatCurrency(material.rate)}/{material.unit}
                            {lots.length > 1 && <span className="text-brand font-bold"> ({lots.length} lots)</span>}
                          </p>
                          {expandedPurchasesId === material.id
                            ? <ChevronUp size={12} className="text-brand shrink-0" />
                            : <ChevronDown size={12} className="text-text-subdued shrink-0" />}
                        </button>
                      );
                    })()}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-title-lg font-bold leading-none', isLow ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')}>{stock}</p>
                    <p className="text-caption text-text-subdued font-bold mt-0.5">{material.unit} left</p>
                  </div>
                </div>

                {/* Usage bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-caption text-text-subdued font-bold mb-1">
                    <span>Used: {material.used} {material.unit}</span>
                    <span>{usedPct.toFixed(0)}% consumed</span>
                  </div>
                  <div className="w-full bg-surface-subdued h-2 rounded-full overflow-hidden border border-border-subdued">
                    <div
                      className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-400' : usedPct > 75 ? 'bg-amber-500' : 'bg-brand')}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>

                {/* Purchase history (expandable) */}
                {expandedPurchasesId === material.id && (() => {
                  const lots = getPurchaseLots(material);
                  return (
                    <div className="mb-3 bg-surface-subdued rounded-xl p-3 border border-border-subdued">
                      <p className="text-caption font-bold text-text-subdued uppercase mb-2">Kharide ka itihas</p>
                      <div className="space-y-1.5">
                        {lots.map((lot, i) => (
                          <div key={lot.id} className="flex items-center justify-between gap-2 text-body-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-caption text-text-subdued font-bold w-4">{i + 1}.</span>
                              <span className="font-bold text-text-primary">{lot.qty} {material.unit}</span>
                              <span className="text-text-subdued text-caption">@ {formatCurrency(lot.rate)}/{material.unit}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-text-primary">{formatCurrency(lot.qty * lot.rate)}</p>
                              <p className="text-caption text-text-subdued">{new Date(lot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                {!isViewer && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsageForm({ materialId: material.id, materialName: material.name, unit: material.unit, amount: '' })}
                      className="flex-1 py-2 bg-brand/10 text-brand rounded-xl text-body-sm font-bold border border-brand/20 hover:bg-brand/20 transition-colors"
                    >
                      Update Usage
                    </button>
                    <button onClick={() => openEdit(material)} className="w-9 h-9 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary border border-border-default hover:bg-border-default transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askConfirm(`"${material.name}" delete kar dein?`, () =>
                        setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== material.id) }))
                      )}
                      className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Photos: bill / samaan ki tasveer */}
                <div className="mt-3 border-t border-border-subdued pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-caption font-bold text-text-subdued uppercase flex items-center gap-1">
                      <ImageIcon size={11} /> Bill / Photos {material.photos?.length ? `(${material.photos.length})` : ''}
                    </p>
                    {!isViewer && (photoUploading === `material:${material.id}` ? (
                      <span className="text-caption text-text-subdued font-bold">Uploading…</span>
                    ) : (
                      <label className="flex items-center gap-1 text-caption font-bold px-2 py-1 rounded-lg cursor-pointer bg-surface-subdued text-text-secondary active:bg-border-default transition-colors">
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
                    ))}
                  </div>
                  <PhotoStrip
                    photos={material.photos ?? []}
                    getSignedUrl={getSignedUrl}
                    onOpenAt={(idx) => setLightbox({ matId: material.id, idx })}
                    onSeeAll={() => setSheetMatId(material.id)}
                    onDelete={(path) => askConfirm('Is photo ko delete karein?', () => deletePhoto('material', material.id, path))}
                  />
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* Add / Edit Form — bottom sheet on mobile, centered modal on desktop */}
      {form && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{editId ? 'Material Edit' : 'Naya Material'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Material Name</label>
                <input type="text" autoFocus value={form.name} onChange={e => setForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Cement, Sand, Sariya" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Unit</label>
                  <input type="text" value={form.unit} onChange={e => setForm(f => f ? { ...f, unit: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                    placeholder="bags / tons" />
                </div>
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Quantity</label>
                  <input type="number" inputMode="numeric" value={form.purchased} onChange={e => setForm(f => f ? { ...f, purchased: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Rate / Unit (₹)</label>
                  <input type="number" inputMode="numeric" value={form.rate} onChange={e => setForm(f => f ? { ...f, rate: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand" placeholder="0" />
                </div>
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Low Stock Alert</label>
                  <input type="number" inputMode="numeric" value={form.minStock} onChange={e => setForm(f => f ? { ...f, minStock: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand" placeholder="0" />
                </div>
              </div>
              {dupMaterial && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-caption text-amber-700 dark:text-amber-300 font-medium leading-snug">
                    <span className="font-bold">{dupMaterial.name}</span> pehle se hai ({dupMaterial.purchased} {dupMaterial.unit})
                    {form.purchased && form.rate
                      ? <>. Naya lot add hoga — combined stock: <span className="font-bold">{dupMaterial.purchased + (Number(form.purchased) || 0)} {dupMaterial.unit}</span>. Rate alag-alag dikhega.</>
                      : <>. Naya lot add hoga, rate alag-alag dikhega.</>}
                  </p>
                </div>
              )}
              {!editId && form.purchased && form.rate && (
                <div className="bg-brand/10 border border-brand/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-caption text-brand font-bold uppercase">Total Cost (auto-logged as expense)</p>
                  <p className="text-title-lg font-bold text-brand">{formatCurrency(Number(form.purchased) * Number(form.rate))}</p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={save} disabled={!form.name} className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {editId ? 'Update Karein' : dupMaterial ? 'Jodo (Merge)' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Sheet (full grid) */}
      <PhotosSheet
        open={!!sheetMaterial}
        title={sheetMaterial?.name ?? ''}
        subtitle="Bill / Photos"
        photos={sheetMaterial?.photos ?? []}
        uploading={photoUploading === `material:${sheetMatId}`}
        getSignedUrl={getSignedUrl}
        onClose={() => setSheetMatId(null)}
        onOpenAt={(idx) => sheetMatId && setLightbox({ matId: sheetMatId, idx })}
        onDelete={(path) => sheetMatId && askConfirm('Is photo ko delete karein?', () => deletePhoto('material', sheetMatId, path))}
        onAdd={(file, caption) => sheetMatId && uploadPhoto('material', sheetMatId, file, caption)}
      />

      {/* Photo Lightbox (swipeable) */}
      <Lightbox
        open={!!lightbox}
        photos={lightboxMaterial?.photos ?? []}
        startIndex={lightbox?.idx ?? 0}
        title={lightboxMaterial?.name}
        getSignedUrl={getSignedUrl}
        onClose={() => setLightbox(null)}
      />

      {/* Usage Form — bottom sheet on mobile, centered modal on desktop */}
      {usageForm && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={() => setUsageForm(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">Usage Update</h3>
                <button onClick={() => setUsageForm(null)} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>
              <p className="text-text-secondary text-body-sm font-medium">{usageForm.materialName} — Kitna use hua aaj?</p>
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Quantity ({usageForm.unit})</label>
                <input type="number" inputMode="numeric" autoFocus value={usageForm.amount}
                  onChange={e => setUsageForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                  placeholder="0" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setUsageForm(null)} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={submitUsage} disabled={!usageForm.amount || Number(usageForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-brand text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                  Update Karo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
