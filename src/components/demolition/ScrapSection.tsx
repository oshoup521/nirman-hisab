import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Recycle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { ScrapEntry } from '../../types';

const SCRAP_TYPES = ['Iron / Sariya', 'Steel', 'Copper', 'Aluminium', 'Wood', 'Plastic', 'Other'];
const UNITS = ['kg', 'pcs', 'ton', 'bundle'];

type EntryForm = {
  type: string;
  customType: string;
  quantity: string;
  unit: string;
  rate: string;
  dealer: string;
  date: string;
};

const blankForm = (): EntryForm => ({
  type: 'Iron / Sariya', customType: '',
  quantity: '', unit: 'kg', rate: '',
  dealer: '', date: format(new Date(), 'yyyy-MM-dd'),
});

export default function ScrapSection() {
  const { state, setState, askConfirm } = useAppContext();
  const [form, setForm] = useState<EntryForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openAdd = () => { setEditId(null); setForm(blankForm()); };
  const openEdit = (e: ScrapEntry) => {
    setEditId(e.id);
    const isPreset = SCRAP_TYPES.includes(e.type);
    setForm({
      type: isPreset ? e.type : 'Other',
      customType: isPreset ? '' : e.type,
      quantity: String(e.quantity),
      unit: e.unit || 'kg',
      rate: String(e.rate),
      dealer: e.dealer || '',
      date: e.date ? format(new Date(e.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
  };
  const closeForm = () => { setForm(null); setEditId(null); };

  const finalType = (f: EntryForm) =>
    f.type === 'Other' ? (f.customType.trim() || 'Other') : f.type;

  const save = () => {
    if (!form) return;
    const quantity = Number(form.quantity) || 0;
    const rate = Number(form.rate) || 0;
    if (quantity <= 0) return;

    const baseFields = {
      type: finalType(form),
      quantity, rate,
      unit: form.unit,
      dealer: form.dealer.trim(),
      date: new Date(form.date).toISOString(),
    };

    if (editId) {
      setState(prev => ({
        ...prev,
        scrap: prev.scrap.map(s => s.id === editId ? { ...s, ...baseFields } : s),
      }));
    } else {
      setState(prev => ({
        ...prev,
        scrap: [...prev.scrap, { id: genId(), ...baseFields }],
      }));
    }
    closeForm();
  };

  const sorted = [...state.scrap].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Kabaad se Kamai</h3>
          <p className="text-xs text-text-subdued mt-0.5">{state.scrap.length} entries</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Recycle size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-sm">Koi scrap entry nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
            + Pehli Entry Add Karo
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {sorted.map(entry => (
              <div key={entry.id} className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-text-primary">{entry.type}</h4>
                  <p className="text-xs text-text-subdued">{entry.quantity} {entry.unit} @ {formatCurrency(entry.rate)}</p>
                  {entry.date && (
                    <p className="text-[10px] text-text-subdued font-bold uppercase mt-0.5">
                      {format(new Date(entry.date), 'dd MMM yyyy')}{entry.dealer ? ` • ${entry.dealer}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(entry.quantity * entry.rate)}</p>
                  <button onClick={() => openEdit(entry)} className="p-1.5 bg-surface-subdued text-text-secondary rounded-xl border border-border-default hover:bg-border-default transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm('Is scrap entry ko delete kar dein?', () =>
                      setState(prev => ({ ...prev, scrap: prev.scrap.filter(s => s.id !== entry.id) }))
                    )}
                    className="p-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-subdued border-b border-border-default">
                <tr>
                  <th className="py-2.5 px-4 text-left text-[10px] font-bold text-text-subdued uppercase tracking-wide">Date</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-text-subdued uppercase tracking-wide">Type</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-text-subdued uppercase tracking-wide">Quantity</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold text-text-subdued uppercase tracking-wide">Rate</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-text-subdued uppercase tracking-wide">Dealer</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold text-text-subdued uppercase tracking-wide">Kamai</th>
                  <th className="py-2.5 px-4 text-right text-[10px] font-bold text-text-subdued uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(entry => (
                  <tr key={entry.id} className="border-b border-border-subdued last:border-0 hover:bg-surface-subdued/50 transition-colors">
                    <td className="py-2.5 px-4 text-xs text-text-subdued font-bold whitespace-nowrap">
                      {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-text-primary">{entry.type}</td>
                    <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{entry.quantity} {entry.unit}</td>
                    <td className="py-2.5 px-3 text-right text-text-primary whitespace-nowrap">{formatCurrency(entry.rate)}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{entry.dealer || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">+{formatCurrency(entry.quantity * entry.rate)}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(entry)} className="w-7 h-7 inline-flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-border-default transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => askConfirm('Is scrap entry ko delete kar dein?', () =>
                          setState(prev => ({ ...prev, scrap: prev.scrap.filter(s => s.id !== entry.id) }))
                        )}
                        className="w-7 h-7 inline-flex items-center justify-center text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 ml-0.5 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 overflow-y-auto max-h-[92vh] md:max-h-[88vh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-lg">{editId ? 'Scrap Entry Edit' : 'Naya Scrap Entry'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Scrap Type</label>
                <div className="flex flex-wrap gap-2">
                  {SCRAP_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => f ? { ...f, type: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        form.type === t ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default hover:bg-border-default')}>
                      {t}
                    </button>
                  ))}
                </div>
                {form.type === 'Other' && (
                  <input type="text" value={form.customType}
                    onChange={e => setForm(f => f ? { ...f, customType: e.target.value } : f)}
                    className="w-full mt-2 p-3 bg-surface-subdued text-text-primary rounded-xl border-none focus:ring-2 focus:ring-brand text-sm"
                    placeholder="Custom type likho..." />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Quantity</label>
                  <input type="number" inputMode="numeric" autoFocus value={form.quantity}
                    onChange={e => setForm(f => f ? { ...f, quantity: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Unit</label>
                  <div className="flex flex-wrap gap-2">
                    {UNITS.map(u => (
                      <button key={u} onClick={() => setForm(f => f ? { ...f, unit: u } : f)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                          form.unit === u ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default hover:bg-border-default')}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Rate / Unit (₹)</label>
                <input type="number" inputMode="numeric" value={form.rate}
                  onChange={e => setForm(f => f ? { ...f, rate: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Dealer (optional)</label>
                <input type="text" value={form.dealer}
                  onChange={e => setForm(f => f ? { ...f, dealer: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Kabadi wala name" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              {Number(form.quantity) > 0 && Number(form.rate) > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Total Kamai</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(Number(form.quantity) * Number(form.rate))}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={save} disabled={Number(form.quantity) <= 0}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {editId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
