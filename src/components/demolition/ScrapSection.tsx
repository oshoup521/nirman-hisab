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
          <h3 className="font-bold text-slate-900">Kabaad se Kamai</h3>
          <p className="text-xs text-slate-400 mt-0.5">{state.scrap.length} entries</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-orange-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Recycle size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi scrap entry nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100">
            + Pehli Entry Add Karo
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {sorted.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900">{entry.type}</h4>
                  <p className="text-xs text-slate-500">{entry.quantity} {entry.unit} @ {formatCurrency(entry.rate)}</p>
                  {entry.date && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      {format(new Date(entry.date), 'dd MMM yyyy')}{entry.dealer ? ` • ${entry.dealer}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-green-600">+{formatCurrency(entry.quantity * entry.rate)}</p>
                  <button onClick={() => openEdit(entry)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm('Is scrap entry ko delete kar dein?', () =>
                      setState(prev => ({ ...prev, scrap: prev.scrap.filter(s => s.id !== entry.id) }))
                    )}
                    className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Quantity</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rate</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dealer</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kamai</th>
                  <th className="py-2.5 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-xs text-slate-500 font-bold whitespace-nowrap">
                      {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{entry.type}</td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{entry.quantity} {entry.unit}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap">{formatCurrency(entry.rate)}</td>
                    <td className="py-2.5 px-3 text-slate-600">{entry.dealer || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-green-600 whitespace-nowrap">+{formatCurrency(entry.quantity * entry.rate)}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(entry)} className="w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => askConfirm('Is scrap entry ko delete kar dein?', () =>
                          setState(prev => ({ ...prev, scrap: prev.scrap.filter(s => s.id !== entry.id) }))
                        )}
                        className="w-7 h-7 inline-flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 ml-0.5"
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 overflow-y-auto max-h-[92vh] md:max-h-[88vh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{editId ? 'Scrap Entry Edit' : 'Naya Scrap Entry'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Scrap Type</label>
                <div className="flex flex-wrap gap-2">
                  {SCRAP_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => f ? { ...f, type: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        form.type === t ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                      {t}
                    </button>
                  ))}
                </div>
                {form.type === 'Other' && (
                  <input type="text" value={form.customType}
                    onChange={e => setForm(f => f ? { ...f, customType: e.target.value } : f)}
                    className="w-full mt-2 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Custom type likho..." />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Quantity</label>
                  <input type="number" inputMode="numeric" autoFocus value={form.quantity}
                    onChange={e => setForm(f => f ? { ...f, quantity: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Unit</label>
                  <div className="flex flex-wrap gap-2">
                    {UNITS.map(u => (
                      <button key={u} onClick={() => setForm(f => f ? { ...f, unit: u } : f)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                          form.unit === u ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Rate / Unit (₹)</label>
                <input type="number" inputMode="numeric" value={form.rate}
                  onChange={e => setForm(f => f ? { ...f, rate: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Dealer (optional)</label>
                <input type="text" value={form.dealer}
                  onChange={e => setForm(f => f ? { ...f, dealer: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Kabadi wala name" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500" />
              </div>

              {Number(form.quantity) > 0 && Number(form.rate) > 0 && (
                <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-green-500 font-bold uppercase">Total Kamai</p>
                  <p className="text-lg font-bold text-green-700">+{formatCurrency(Number(form.quantity) * Number(form.rate))}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200">Cancel</button>
                <button onClick={save} disabled={Number(form.quantity) <= 0}
                  className="flex-1 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-orange-200 hover:bg-orange-700">
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
