import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package, Users, Hammer, Wrench, Truck, Tag, X, ImageIcon, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Expense } from '../../types';
import PhotoStrip from '../common/PhotoStrip';
import PhotosSheet from '../common/PhotosSheet';
import Lightbox from '../common/Lightbox';

const CATEGORIES: Expense['category'][] = ['Material', 'Labour', 'Theka', 'Equipment', 'Transport', 'Misc'];

const CAT_CFG: Record<Expense['category'], {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string; iconText: string;
  badge: string; pill: string;
}> = {
  Material:  { Icon: Package,  iconBg: 'bg-blue-50',   iconText: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700',   pill: 'bg-blue-50 text-blue-600 border-blue-200'   },
  Labour:    { Icon: Users,    iconBg: 'bg-orange-50',  iconText: 'text-orange-500', badge: 'bg-orange-100 text-orange-700', pill: 'bg-orange-50 text-orange-600 border-orange-200' },
  Theka:     { Icon: Hammer,   iconBg: 'bg-purple-50',  iconText: 'text-purple-500', badge: 'bg-purple-100 text-purple-700', pill: 'bg-purple-50 text-purple-600 border-purple-200' },
  Equipment: { Icon: Wrench,   iconBg: 'bg-yellow-50',  iconText: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', pill: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  Transport: { Icon: Truck,    iconBg: 'bg-teal-50',    iconText: 'text-teal-500',   badge: 'bg-teal-100 text-teal-700',   pill: 'bg-teal-50 text-teal-600 border-teal-200'   },
  Misc:      { Icon: Tag,      iconBg: 'bg-slate-50',   iconText: 'text-slate-400',  badge: 'bg-slate-100 text-slate-600', pill: 'bg-slate-50 text-slate-500 border-slate-200'  },
};

type FormState = { amount: string; category: Expense['category']; notes: string; date: string };

const blankForm = (): FormState => ({
  amount: '', category: 'Material', notes: '', date: format(new Date(), 'yyyy-MM-dd'),
});

export default function ExpensesSection() {
  const { state, setState, askConfirm, photos } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto } = photos;
  const [form, setForm] = useState<FormState | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetExpId, setSheetExpId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ expId: string; idx: number } | null>(null);

  const sheetExpense = sheetExpId ? state.expenses.find(e => e.id === sheetExpId) : null;
  const lightboxExpense = lightbox ? state.expenses.find(e => e.id === lightbox.expId) : null;

  const openAdd = () => { setEditId(null); setForm(blankForm()); };

  const openEdit = (e: Expense) => {
    setEditId(e.id);
    setForm({ amount: String(e.amount), category: e.category, notes: e.notes, date: format(new Date(e.date), 'yyyy-MM-dd') });
  };

  const closeForm = () => { setForm(null); setEditId(null); };

  const save = () => {
    if (!form) return;
    const amount = Number(form.amount);
    if (!amount) return;
    const entry: Expense = {
      id: editId || genId(),
      date: new Date(form.date).toISOString(),
      amount,
      category: form.category,
      notes: form.notes.trim(),
    };
    setState(prev => ({
      ...prev,
      expenses: editId
        ? prev.expenses.map(e => e.id === editId ? entry : e)
        : [entry, ...prev.expenses],
    }));
    closeForm();
  };

  const sorted = [...state.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  const total = state.expenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES
    .map(cat => ({ cat, total: state.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
    .filter(x => x.total > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900">Kharcha Paani</h3>
          <p className="text-xs text-slate-400 mt-0.5">{state.expenses.length} entries</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Summary Card */}
      {state.expenses.length > 0 && (
        <div className="bg-indigo-600 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wide">Total Construction Kharcha</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatCurrency(total)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categoryTotals.map(({ cat, total: catTotal }) => {
              const { Icon, iconText } = CAT_CFG[cat];
              return (
                <div key={cat} className="flex items-center gap-1.5 bg-white/15 rounded-xl px-2.5 py-1.5">
                  <Icon size={11} className="text-indigo-200" />
                  <div>
                    <p className="text-[9px] text-indigo-300 font-bold uppercase leading-none">{cat}</p>
                    <p className="text-[11px] text-white font-bold leading-tight">{formatCurrency(catTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Cards */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package size={26} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-600 text-sm">Koi kharcha nahi abhi tak</p>
            <p className="text-slate-400 text-xs mt-1">Pehla kharcha add karo</p>
            <button
              onClick={openAdd}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
            >
              + Kharcha Add Karein
            </button>
          </div>
        ) : (
          sorted.map(expense => {
            const { Icon, iconBg, iconText, badge } = CAT_CFG[expense.category];
            const photoCount = expense.photos?.length ?? 0;
            const isUploading = photoUploading === `expense:${expense.id}`;
            return (
              <div key={expense.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
                    <Icon size={16} className={iconText} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-snug break-words">
                      {expense.notes || expense.category}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badge)}>
                        {expense.category}
                      </span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                      </span>
                      {photoCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-500">
                          <Paperclip size={9} /> {photoCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount + Actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <p className="font-bold text-slate-900 text-sm">{formatCurrency(expense.amount)}</p>
                    <div className="flex items-center gap-1">
                      <label className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors',
                        isUploading ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 active:bg-slate-200'
                      )}>
                        <ImageIcon size={12} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const caption = prompt('Bill ka naam / caption (optional):') ?? '';
                              uploadPhoto('expense', expense.id, file, caption);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        onClick={() => openEdit(expense)}
                        className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => askConfirm(
                          'Is kharche ko delete kar dein?',
                          () => setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== expense.id) }))
                        )}
                        className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100 active:bg-red-200 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Photo strip */}
                {photoCount > 0 && (
                  <div className="mt-3">
                    <PhotoStrip
                      photos={expense.photos ?? []}
                      getSignedUrl={getSignedUrl}
                      onOpenAt={(idx) => setLightbox({ expId: expense.id, idx })}
                      onSeeAll={() => setSheetExpId(expense.id)}
                      onDelete={(path) => askConfirm('Is photo ko delete karein?', () => deletePhoto('expense', expense.id, path))}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sheet Form */}
      {form && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeForm} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto"
            style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="p-6 space-y-5">
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

              {/* Title */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">
                  {editId ? 'Kharcha Edit Karein' : 'Naya Kharcha'}
                </h3>
                <button onClick={closeForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                  <X size={16} />
                </button>
              </div>

              {/* Category Chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const { Icon, pill } = CAT_CFG[cat];
                    const selected = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm(f => f ? { ...f, category: cat } : f)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                          selected ? pill : 'bg-slate-50 text-slate-400 border-slate-100'
                        )}
                      >
                        <Icon size={11} /> {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={e => setForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-slate-900 placeholder-slate-300"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                  placeholder="e.g. Sand aur cement liya"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeForm}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={!form.amount || Number(form.amount) <= 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200"
                >
                  {editId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Photos Sheet */}
      <PhotosSheet
        open={!!sheetExpense}
        title={sheetExpense?.notes || sheetExpense?.category || 'Expense'}
        subtitle="Bills"
        photos={sheetExpense?.photos ?? []}
        uploading={photoUploading === `expense:${sheetExpId}`}
        getSignedUrl={getSignedUrl}
        onClose={() => setSheetExpId(null)}
        onOpenAt={(idx) => sheetExpId && setLightbox({ expId: sheetExpId, idx })}
        onDelete={(path) => sheetExpId && askConfirm('Is photo ko delete karein?', () => deletePhoto('expense', sheetExpId, path))}
        onAdd={(file, caption) => sheetExpId && uploadPhoto('expense', sheetExpId, file, caption)}
      />

      {/* Photo Lightbox (swipeable) */}
      <Lightbox
        open={!!lightbox}
        photos={lightboxExpense?.photos ?? []}
        startIndex={lightbox?.idx ?? 0}
        title={lightboxExpense?.notes || lightboxExpense?.category}
        getSignedUrl={getSignedUrl}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
