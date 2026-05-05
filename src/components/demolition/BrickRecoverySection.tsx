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
          <h3 className="font-bold text-text-primary">Eent Bachao Counter</h3>
          <p className="text-xs text-text-subdued mt-0.5">{state.brickRecovery.length} entries</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {state.brickRecovery.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">Bachao</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(totalRecovered)}</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold">pcs</p>
          </div>
          <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase mb-0.5">Tooti</p>
            <p className="text-lg font-bold text-red-500">{formatNumber(totalBroken)}</p>
            <p className="text-[10px] text-red-500/70 font-bold">pcs</p>
          </div>
          <div className="bg-surface-subdued p-3 rounded-2xl border border-border-default text-center">
            <p className="text-[10px] font-bold text-text-subdued uppercase mb-0.5">Kul</p>
            <p className="text-lg font-bold text-text-primary">{formatNumber(totalEstimated)}</p>
            <p className="text-[10px] text-text-subdued font-bold">pcs</p>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <p className="font-bold text-text-secondary text-sm">Koi entry nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
            + Pehli Entry Add Karo
          </button>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {sorted.map(entry => (
          <div key={entry.id} className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-text-primary">{format(new Date(entry.date), 'dd MMM yyyy')}</h4>
                <p className="text-xs text-text-subdued">
                  Recovery Rate: {((entry.recovered / Math.max(1, entry.recovered + entry.broken)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(entry.recovered * entry.ratePerBrick)}</p>
                <button onClick={() => openEdit(entry)} className="p-1.5 bg-surface-subdued text-text-secondary rounded-xl border border-border-default hover:bg-border-default transition-colors">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => askConfirm('Is brick recovery entry ko delete kar dein?', () =>
                    setState(prev => ({ ...prev, brickRecovery: prev.brickRecovery.filter(b => b.id !== entry.id) }))
                  )}
                  className="p-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Recovered</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{entry.recovered}</p>
              </div>
              <div className="flex-1 bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-red-500 uppercase">Broken</p>
                <p className="font-bold text-red-500">{entry.broken}</p>
              </div>
            </div>
          </div>
        ))}
        </div>
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
                <h3 className="font-bold text-text-primary text-lg">{editId ? 'Entry Edit' : 'Naya Brick Entry'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Recovered (pcs)</label>
                  <input type="number" inputMode="numeric" autoFocus value={form.recovered}
                    onChange={e => setForm(f => f ? { ...f, recovered: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Broken (pcs)</label>
                  <input type="number" inputMode="numeric" value={form.broken}
                    onChange={e => setForm(f => f ? { ...f, broken: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                    placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Rate / Brick (₹)</label>
                  <input type="number" inputMode="numeric" value={form.ratePerBrick}
                    onChange={e => setForm(f => f ? { ...f, ratePerBrick: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                    placeholder="7" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
                </div>
              </div>

              {Number(form.recovered) > 0 && Number(form.ratePerBrick) > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Recovery Value</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(Number(form.recovered) * Number(form.ratePerBrick))}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={save} disabled={Number(form.recovered) <= 0 && Number(form.broken) <= 0}
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
