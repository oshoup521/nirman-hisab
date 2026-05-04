import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

export default function ScrapSection() {
  const { state, setState, askConfirm } = useAppContext();

  const addEntry = () => {
    const type = prompt('Scrap Type (Iron/Steel/Copper)?');
    const qty = Number(prompt('Quantity?'));
    const unit = prompt('Unit (kg/pcs)?');
    const rate = Number(prompt('Rate per unit?'));
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      scrap: [...prev.scrap, {
        id: genId(), date: new Date(dateStr).toISOString(),
        type: type || 'Misc', quantity: qty, unit: unit || 'kg', dealer: '', rate,
      }],
    }));
  };

  const editEntry = (id: string, entry: typeof state.scrap[0]) => {
    const type = prompt('Scrap Type?', entry.type);
    if (!type) return;
    const qty = Number(prompt('Quantity?', String(entry.quantity)));
    const rate = Number(prompt('Rate per unit?', String(entry.rate)));
    const dateStr = prompt('Date (YYYY-MM-DD)?', entry.date ? format(new Date(entry.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      scrap: prev.scrap.map(s =>
        s.id === id ? { ...s, type, quantity: qty, rate, date: new Date(dateStr).toISOString() } : s
      ),
    }));
  };

  const sorted = [...state.scrap].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Kabaad se Kamai</h3>
        <button onClick={addEntry} className="p-2 bg-orange-600 text-white rounded-full">
          <Plus size={20} />
        </button>
      </div>

      {sorted.map(entry => (
        <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-900">{entry.type}</h4>
            <p className="text-xs text-slate-500">{entry.quantity} {entry.unit} @ {formatCurrency(entry.rate)}</p>
            {entry.date && (
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                {format(new Date(entry.date), 'dd MMM yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-green-600">+{formatCurrency(entry.quantity * entry.rate)}</p>
            <button onClick={() => editEntry(entry.id, entry)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
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
  );
}
