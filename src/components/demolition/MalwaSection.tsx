import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

export default function MalwaSection() {
  const { state, setState, askConfirm } = useAppContext();

  const addEntry = () => {
    const trips = Number(prompt('Trolley/Trips disposed?'));
    const cost = Number(prompt('Cost per trip?'));
    const vendor = prompt('Vendor Name?');
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      malwa: [...prev.malwa, {
        id: genId(), date: new Date(dateStr).toISOString(),
        generated: trips, disposed: trips, costPerTrip: cost, vendor: vendor || '',
      }],
      expenses: [...prev.expenses, {
        id: genId(), date: new Date(dateStr).toISOString(),
        amount: trips * cost, category: 'Transport',
        notes: `Malwa disposal: ${trips} trips`,
      }],
    }));
  };

  const editEntry = (id: string, entry: typeof state.malwa[0]) => {
    const trips = Number(prompt('Trolleys disposed?', String(entry.disposed)));
    const cost = Number(prompt('Cost per trip?', String(entry.costPerTrip)));
    const vendor = prompt('Vendor Name?', entry.vendor);
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(entry.date), 'yyyy-MM-dd')) || format(new Date(entry.date), 'yyyy-MM-dd');
    setState(prev => ({
      ...prev,
      malwa: prev.malwa.map(m =>
        m.id === id ? { ...m, disposed: trips, generated: trips, costPerTrip: cost, vendor: vendor || '', date: new Date(dateStr).toISOString() } : m
      ),
    }));
  };

  const sorted = [...state.malwa].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Malwa Report</h3>
        <button onClick={addEntry} className="p-2 bg-orange-600 text-white rounded-full">
          <Plus size={20} />
        </button>
      </div>

      {sorted.map(entry => (
        <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-900">{entry.disposed} Trolleys</h4>
            <p className="text-xs text-slate-500">{format(new Date(entry.date), 'dd MMM yyyy')} • {entry.vendor}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-red-500">-{formatCurrency(entry.disposed * entry.costPerTrip)}</p>
            <button onClick={() => editEntry(entry.id, entry)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
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
      ))}
    </div>
  );
}
