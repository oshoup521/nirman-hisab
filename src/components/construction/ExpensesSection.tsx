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
  Material:  { Icon: Package,  iconBg: 'bg-blue-500/10',   iconText: 'text-blue-500',   badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',   pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'   },
  Labour:    { Icon: Users,    iconBg: 'bg-orange-500/10',  iconText: 'text-orange-500', badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-400', pill: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  Theka:     { Icon: Hammer,   iconBg: 'bg-purple-500/10',  iconText: 'text-purple-500', badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-400', pill: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  Equipment: { Icon: Wrench,   iconBg: 'bg-amber-500/10',  iconText: 'text-amber-500', badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  Transport: { Icon: Truck,    iconBg: 'bg-emerald-500/10',    iconText: 'text-emerald-500',   badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',   pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'   },
  Misc:      { Icon: Tag,      iconBg: 'bg-surface-subdued',   iconText: 'text-text-secondary',  badge: 'bg-border-default text-text-secondary', pill: 'bg-surface-subdued text-text-secondary border-border-default'  },
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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = state.expenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES
    .map(cat => ({ cat, total: state.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
    .filter(x => x.total > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-heading text-title font-bold text-text-primary">Kharcha Paani</h3>
          <p className="text-caption text-text-subdued mt-0.5">{state.expenses.length} entries</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-body-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Summary Card */}
      {state.expenses.length > 0 && (
        <div className="bg-brand text-surface rounded-2xl p-4 space-y-3">
          <div>
            <p className="opacity-80 text-caption font-bold uppercase tracking-wide">Total Construction Kharcha</p>
            <p className="text-surface text-title-lg font-bold mt-0.5">{formatCurrency(total)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categoryTotals.map(({ cat, total: catTotal }) => {
              const { Icon } = CAT_CFG[cat];
              return (
                <div key={cat} className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 rounded-xl px-2.5 py-1.5">
                  <Icon size={11} className="opacity-80" />
                  <div>
                    <p className="text-caption opacity-80 font-bold uppercase leading-none">{cat}</p>
                    <p className="text-body-sm font-bold leading-tight">{formatCurrency(catTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Cards (mobile) / Table (desktop) */}
      {sorted.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-body-sm">Koi kharcha nahi abhi tak</p>
          <p className="text-text-subdued text-caption mt-1">Pehla kharcha add karo</p>
          <button
            onClick={openAdd}
            className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-body-sm font-bold border border-brand/20 hover:bg-brand/20 transition-colors"
          >
            + Kharcha Add Karein
          </button>
        </div>
      ) : (
        <>
        {/* Desktop: table */}
        <div className="hidden md:block bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subdued border-b border-border-default">
                <tr>
                  <th className="py-2.5 px-4 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Date</th>
                  <th className="py-2.5 px-3 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Category</th>
                  <th className="py-2.5 px-3 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Notes</th>
                  <th className="py-2.5 px-3 text-center text-caption font-bold text-text-subdued uppercase tracking-wide">Photos</th>
                  <th className="py-2.5 px-3 text-right text-caption font-bold text-text-subdued uppercase tracking-wide">Amount</th>
                  <th className="py-2.5 px-4 text-right text-caption font-bold text-text-subdued uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(expense => {
                  const { Icon, iconText, badge } = CAT_CFG[expense.category];
                  const photoCount = expense.photos?.length ?? 0;
                  const isUploading = photoUploading === `expense:${expense.id}`;
                  return (
                    <tr key={expense.id} className="border-b border-border-subdued last:border-0 hover:bg-surface-subdued/50 transition-colors">
                      <td className="py-2.5 px-4 text-body-sm text-text-secondary font-bold whitespace-nowrap">
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={cn('inline-flex items-center gap-1 text-caption font-bold px-2 py-0.5 rounded-full', badge)}>
                          <Icon size={10} className={iconText} /> {expense.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-primary max-w-[320px] truncate">
                        {expense.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {photoCount > 0 ? (
                          <button
                            onClick={() => setSheetExpId(expense.id)}
                            className="inline-flex items-center gap-1 text-caption font-bold text-brand hover:opacity-80 transition-opacity"
                          >
                            <Paperclip size={10} /> {photoCount}
                          </button>
                        ) : (
                          <span className="text-text-subdued opacity-50 text-caption">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <label className={cn(
                          'w-7 h-7 rounded-lg inline-flex items-center justify-center cursor-pointer transition-colors mr-0.5',
                          isUploading ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-border-default'
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
                          className="w-7 h-7 inline-flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-border-default transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => askConfirm(
                            'Is kharche ko delete kar dein?',
                            () => setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== expense.id) }))
                          )}
                          className="w-7 h-7 inline-flex items-center justify-center text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 ml-0.5 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-surface-subdued border-t border-border-default flex justify-between items-center">
            <span className="text-caption text-text-subdued font-bold">
              {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="text-body-sm font-mono font-bold text-text-secondary">
              Total: {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {sorted.map(expense => {
            const { Icon, iconBg, iconText, badge } = CAT_CFG[expense.category];
            const photoCount = expense.photos?.length ?? 0;
            const isUploading = photoUploading === `expense:${expense.id}`;
            return (
              <div key={expense.id} className="bg-surface rounded-2xl border border-border-default shadow-sm p-3.5">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
                    <Icon size={16} className={iconText} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary text-body-sm leading-snug break-words">
                      {expense.notes || expense.category}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={cn('text-caption font-bold px-2 py-0.5 rounded-full', badge)}>
                        {expense.category}
                      </span>
                      <span className="text-caption text-text-subdued">•</span>
                      <span className="text-caption text-text-subdued font-bold">
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                      </span>
                      {photoCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-caption font-bold text-brand">
                          <Paperclip size={9} /> {photoCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount + Actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <p className="font-mono text-title font-bold text-text-primary">{formatCurrency(expense.amount)}</p>
                    <div className="flex items-center gap-1">
                      <label className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors',
                        isUploading ? 'bg-brand/10 text-brand' : 'bg-surface-subdued text-text-secondary hover:bg-border-default active:bg-border-subdued'
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
                        className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center text-text-secondary hover:bg-border-default active:bg-border-subdued transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => askConfirm(
                          'Is kharche ko delete kar dein?',
                          () => setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== expense.id) }))
                        )}
                        className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
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
          })}
        </div>
        </>
      )}

      {/* Form — bottom sheet on mobile, centered modal on desktop */}
      {form && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-5">
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto -mt-1 mb-1 md:hidden" />

              {/* Title */}
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">
                  {editId ? 'Kharcha Edit Karein' : 'Naya Kharcha'}
                </h3>
                <button onClick={closeForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Category Chips */}
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const { Icon, pill } = CAT_CFG[cat];
                    const selected = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm(f => f ? { ...f, category: cat } : f)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-bold border transition-all',
                          selected ? pill : 'bg-surface-subdued text-text-secondary border-border-default'
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
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={e => setForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg text-text-primary placeholder-text-subdued"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm text-text-primary placeholder-text-subdued"
                  placeholder="e.g. Sand aur cement liya"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm text-text-primary dark:[color-scheme:dark]"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeForm}
                  className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={!form.amount || Number(form.amount) <= 0}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity"
                >
                  {editId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
