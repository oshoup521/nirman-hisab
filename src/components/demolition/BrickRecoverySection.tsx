import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

export default function BrickRecoverySection() {
  const { state, setState, askConfirm } = useAppContext();

  const addEntry = () => {
    const recovered = Number(prompt('Bricks Recovered today?'));
    const broken = Number(prompt('Bricks Broken?'));
    const rate = Number(prompt('Rate per brick (₹)?'));
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      brickRecovery: [...prev.brickRecovery, {
        id: genId(), date: new Date(dateStr).toISOString(),
        estimated: recovered + broken, recovered, broken, ratePerBrick: rate || 7,
      }],
    }));
  };

  const editEntry = (id: string, entry: typeof state.brickRecovery[0]) => {
    const recovered = Number(prompt('Bricks Recovered?', String(entry.recovered)));
    const broken = Number(prompt('Bricks Broken?', String(entry.broken)));
    const rate = Number(prompt('Rate per brick (₹)?', String(entry.ratePerBrick)));
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(entry.date), 'yyyy-MM-dd')) || format(new Date(entry.date), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      brickRecovery: prev.brickRecovery.map(b =>
        b.id === id ? { ...b, recovered, broken, estimated: recovered + broken, ratePerBrick: rate, date: new Date(dateStr).toISOString() } : b
      ),
    }));
  };

  const sorted = [...state.brickRecovery].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalRecovered = state.brickRecovery.reduce((a, b) => a + b.recovered, 0);
  const totalBroken = state.brickRecovery.reduce((a, b) => a + b.broken, 0);
  const totalEstimated = state.brickRecovery.reduce((a, b) => a + b.estimated, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Eent Bachao Counter</h3>
        <button onClick={addEntry} className="p-2 bg-orange-600 text-white rounded-full">
          <Plus size={20} />
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

      {sorted.map(entry => (
        <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-bold text-slate-900">{format(new Date(entry.date), 'dd MMM yyyy')}</h4>
              <p className="text-xs text-slate-500">
                Recovery Rate: {((entry.recovered / (entry.recovered + entry.broken)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-green-600">+{formatCurrency(entry.recovered * entry.ratePerBrick)}</p>
              <button onClick={() => editEntry(entry.id, entry)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
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
  );
}
