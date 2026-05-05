import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { MalwaEntry } from '../../types';

type EntryForm = {
  trips: string;
  costPerTrip: string;
  vendor: string;
  date: string;
};

const blankForm = (): EntryForm => ({
  trips: '', costPerTrip: '', vendor: '', date: format(new Date(), 'yyyy-MM-dd'),
});

export default function MalwaSection() {
  const { state, setState, askConfirm } = useAppContext();
  const [form, setForm] = useState<EntryForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openAdd = () => { setEditId(null); setForm(blankForm()); };
  const openEdit = (e: MalwaEntry) => {
    setEditId(e.id);
    setForm({
      trips: String(e.disposed),
      costPerTrip: String(e.costPerTrip),
      vendor: e.vendor || '',
      date: format(new Date(e.date), 'yyyy-MM-dd'),
    });
  };
  const closeForm = () => { setForm(null); setEditId(null); };

  const save = () => {
    if (!form) return;
    const trips = Number(form.trips) || 0;
    const costPerTrip = Number(form.costPerTrip) || 0;
    if (trips <= 0) return;
    const isoDate = new Date(form.date).toISOString();

    const baseFields = {
      generated: trips, disposed: trips, costPerTrip,
      vendor: form.vendor.trim(), date: isoDate,
    };

    if (editId) {
      setState(prev => ({
        ...prev,
        malwa: prev.malwa.map(m => m.id === editId ? { ...m, ...baseFields } : m),
      }));
    } else {
      const id = genId();
      setState(prev => ({
        ...prev,
        malwa: [...prev.malwa, { id, ...baseFields }],
        expenses: [...prev.expenses, {
          id: genId(), date: isoDate, amount: trips * costPerTrip, category: 'Transport',
          notes: `Malwa disposal: ${trips} trips${form.vendor ? ` (${form.vendor})` : ''}`,
        }],
      }));
    }
    closeForm();
  };

  const sorted = [...state.malwa].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Malwa Report</h3>
          <p className="text-xs text-text-subdued mt-0.5">{state.malwa.length} entries</p>
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
            <Truck size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-sm">Koi malwa entry nahi abhi tak</p>
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
                  <h4 className="font-bold text-text-primary">{entry.disposed} Trolleys</h4>
                  <p className="text-xs text-text-subdued">{format(new Date(entry.date), 'dd MMM yyyy')}{entry.vendor ? ` • ${entry.vendor}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-red-500">-{formatCurrency(entry.disposed * entry.costPerTrip)}</p>
                  <button onClick={() => openEdit(entry)} className="p-1.5 bg-surface-subdued text-text-secondary rounded-xl border border-border-default hover:bg-border-default transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm('Is malwa entry ko delete kar dein?', () =>
                      setState(prev => ({ ...prev, malwa: prev.malwa.filter(m => m.id !== entry.id) }))
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
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-text-subdued uppercase tracking-wide">Trolleys</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-text-subdued uppercase tracking-wide">Vendor / Driver</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold text-text-subdued uppercase tracking-wide">Cost / Trip</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold text-text-subdued uppercase tracking-wide">Total</th>
                  <th className="py-2.5 px-4 text-right text-[10px] font-bold text-text-subdued uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(entry => (
                  <tr key={entry.id} className="border-b border-border-subdued last:border-0 hover:bg-surface-subdued/50 transition-colors">
                    <td className="py-2.5 px-4 text-xs text-text-subdued font-bold whitespace-nowrap">
                      {format(new Date(entry.date), 'dd MMM yyyy')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-text-primary">{entry.disposed}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{entry.vendor || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-text-primary whitespace-nowrap">{formatCurrency(entry.costPerTrip)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-500 whitespace-nowrap">−{formatCurrency(entry.disposed * entry.costPerTrip)}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(entry)} className="w-7 h-7 inline-flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-border-default transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => askConfirm('Is malwa entry ko delete kar dein?', () =>
                          setState(prev => ({ ...prev, malwa: prev.malwa.filter(m => m.id !== entry.id) }))
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
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-lg">{editId ? 'Malwa Entry Edit' : 'Naya Malwa Entry'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Trolley / Trips</label>
                  <input type="number" inputMode="numeric" autoFocus value={form.trips}
                    onChange={e => setForm(f => f ? { ...f, trips: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Cost / Trip (₹)</label>
                  <input type="number" inputMode="numeric" value={form.costPerTrip}
                    onChange={e => setForm(f => f ? { ...f, costPerTrip: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                    placeholder="0" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Vendor / Driver</label>
                <input type="text" value={form.vendor}
                  onChange={e => setForm(f => f ? { ...f, vendor: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Salim Trolley wala" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              {Number(form.trips) > 0 && Number(form.costPerTrip) > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-red-500 font-bold uppercase">Total Cost (auto-logged as expense)</p>
                  <p className="text-lg font-bold text-red-500">-{formatCurrency(Number(form.trips) * Number(form.costPerTrip))}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={save} disabled={Number(form.trips) <= 0}
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
