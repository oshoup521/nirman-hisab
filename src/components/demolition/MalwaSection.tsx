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
          <h3 className="font-bold text-slate-900">Malwa Report</h3>
          <p className="text-xs text-slate-400 mt-0.5">{state.malwa.length} entries</p>
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
            <Truck size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi malwa entry nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100">
            + Pehli Entry Add Karo
          </button>
        </div>
      ) : (
        sorted.map(entry => (
          <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900">{entry.disposed} Trolleys</h4>
              <p className="text-xs text-slate-500">{format(new Date(entry.date), 'dd MMM yyyy')}{entry.vendor ? ` • ${entry.vendor}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-red-500">-{formatCurrency(entry.disposed * entry.costPerTrip)}</p>
              <button onClick={() => openEdit(entry)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => askConfirm('Is malwa entry ko delete kar dein?', () =>
                  setState(prev => ({ ...prev, malwa: prev.malwa.filter(m => m.id !== entry.id) }))
                )}
                className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Form Sheet */}
      {form && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{editId ? 'Malwa Entry Edit' : 'Naya Malwa Entry'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Trolley / Trips</label>
                  <input type="number" inputMode="numeric" autoFocus value={form.trips}
                    onChange={e => setForm(f => f ? { ...f, trips: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Cost / Trip (₹)</label>
                  <input type="number" inputMode="numeric" value={form.costPerTrip}
                    onChange={e => setForm(f => f ? { ...f, costPerTrip: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                    placeholder="0" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Vendor / Driver</label>
                <input type="text" value={form.vendor}
                  onChange={e => setForm(f => f ? { ...f, vendor: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Salim Trolley wala" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500" />
              </div>

              {Number(form.trips) > 0 && Number(form.costPerTrip) > 0 && (
                <div className="bg-red-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-red-500 font-bold uppercase">Total Cost (auto-logged as expense)</p>
                  <p className="text-lg font-bold text-red-700">-{formatCurrency(Number(form.trips) * Number(form.costPerTrip))}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={save} disabled={Number(form.trips) <= 0}
                  className="flex-1 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-orange-200">
                  {editId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
