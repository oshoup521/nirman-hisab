import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { BrickRecovery } from '../../types';

type EntryForm = {
  recovered: string;
  broken: string;
  ratePerBrick: string;
  date: string;
};

const blankForm = (): EntryForm => ({
  recovered: '', broken: '', ratePerBrick: '7', date: format(new Date(), 'yyyy-MM-dd'),
});

export default function BrickRecoverySection() {
  const { state, setState, askConfirm } = useAppContext();
  const [form, setForm] = useState<EntryForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openAdd = () => { setEditId(null); setForm(blankForm()); };
  const openEdit = (e: BrickRecovery) => {
    setEditId(e.id);
    setForm({
      recovered: String(e.recovered),
      broken: String(e.broken),
      ratePerBrick: String(e.ratePerBrick),
      date: format(new Date(e.date), 'yyyy-MM-dd'),
    });
  };
  const closeForm = () => { setForm(null); setEditId(null); };

  const save = () => {
    if (!form) return;
    const recovered = Number(form.recovered) || 0;
    const broken = Number(form.broken) || 0;
    const ratePerBrick = Number(form.ratePerBrick) || 7;
    if (recovered <= 0 && broken <= 0) return;

    const baseFields = {
      recovered, broken, estimated: recovered + broken, ratePerBrick,
      date: new Date(form.date).toISOString(),
    };

    if (editId) {
      setState(prev => ({
        ...prev,
        brickRecovery: prev.brickRecovery.map(b => b.id === editId ? { ...b, ...baseFields } : b),
      }));
    } else {
      setState(prev => ({
        ...prev,
        brickRecovery: [...prev.brickRecovery, { id: genId(), ...baseFields }],
      }));
    }
    closeForm();
  };

  const sorted = [...state.brickRecovery].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalRecovered = state.brickRecovery.reduce((a, b) => a + b.recovered, 0);
  const totalBroken = state.brickRecovery.reduce((a, b) => a + b.broken, 0);
  const totalEstimated = state.brickRecovery.reduce((a, b) => a + b.estimated, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900">Eent Bachao Counter</h3>
          <p className="text-xs text-slate-400 mt-0.5">{state.brickRecovery.length} entries</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-orange-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {state.brickRecovery.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-2xl border border-green-100 text-center">
            <p className="text-[10px] font-bold text-green-500 uppercase mb-0.5">Bachao</p>
            <p className="text-lg font-bold text-green-700">{formatNumber(totalRecovered)}</p>
            <p className="text-[10px] text-green-400 font-bold">pcs</p>
          </div>
          <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-center">
            <p className="text-[10px] font-bold text-red-400 uppercase mb-0.5">Tooti</p>
            <p className="text-lg font-bold text-red-600">{formatNumber(totalBroken)}</p>
            <p className="text-[10px] text-red-300 font-bold">pcs</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kul</p>
            <p className="text-lg font-bold text-slate-700">{formatNumber(totalEstimated)}</p>
            <p className="text-[10px] text-slate-400 font-bold">pcs</p>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="font-bold text-slate-600 text-sm">Koi entry nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100">
            + Pehli Entry Add Karo
          </button>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {sorted.map(entry => (
          <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-900">{format(new Date(entry.date), 'dd MMM yyyy')}</h4>
                <p className="text-xs text-slate-500">
                  Recovery Rate: {((entry.recovered / Math.max(1, entry.recovered + entry.broken)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-green-600">+{formatCurrency(entry.recovered * entry.ratePerBrick)}</p>
                <button onClick={() => openEdit(entry)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => askConfirm('Is brick recovery entry ko delete kar dein?', () =>
                    setState(prev => ({ ...prev, brickRecovery: prev.brickRecovery.filter(b => b.id !== entry.id) }))
                  )}
                  className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-green-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-green-600 uppercase">Recovered</p>
                <p className="font-bold text-green-700">{entry.recovered}</p>
              </div>
              <div className="flex-1 bg-red-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-red-600 uppercase">Broken</p>
                <p className="font-bold text-red-700">{entry.broken}</p>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Form — bottom sheet on mobile, centered modal on desktop */}
      {form && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{editId ? 'Entry Edit' : 'Naya Brick Entry'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Recovered (pcs)</label>
                  <input type="number" inputMode="numeric" autoFocus value={form.recovered}
                    onChange={e => setForm(f => f ? { ...f, recovered: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Broken (pcs)</label>
                  <input type="number" inputMode="numeric" value={form.broken}
                    onChange={e => setForm(f => f ? { ...f, broken: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                    placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Rate / Brick (₹)</label>
                  <input type="number" inputMode="numeric" value={form.ratePerBrick}
                    onChange={e => setForm(f => f ? { ...f, ratePerBrick: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold"
                    placeholder="7" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              {Number(form.recovered) > 0 && Number(form.ratePerBrick) > 0 && (
                <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-green-500 font-bold uppercase">Recovery Value</p>
                  <p className="text-lg font-bold text-green-700">+{formatCurrency(Number(form.recovered) * Number(form.ratePerBrick))}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200">Cancel</button>
                <button onClick={save} disabled={Number(form.recovered) <= 0 && Number(form.broken) <= 0}
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
