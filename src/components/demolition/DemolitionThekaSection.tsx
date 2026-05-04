import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { DemolitionTheka } from '../../types';

export default function DemolitionThekaSection() {
  const { state, setState, askConfirm } = useAppContext();
  const thekas = state.demolitionThekas || [];

  const addTheka = () => {
    const name = prompt('Thekedar ka naam?');
    if (!name) return;
    const workType = prompt('Kaam ka type? (Tod-Phod/Malwa Hatao/Cutting/Other)') as DemolitionTheka['workType'];
    const totalAmount = Number(prompt('Total theka amount (₹)?'));
    const startDate = prompt('Start date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10));
    const notes = prompt('Notes?') || '';
    setState(prev => ({
      ...prev,
      demolitionThekas: [...(prev.demolitionThekas || []), {
        id: genId(), name, workType: workType || 'Tod-Phod',
        totalAmount, payments: [], startDate: startDate || new Date().toISOString(), notes,
      }],
    }));
  };

  const editTheka = (theka: DemolitionTheka) => {
    const name = prompt('Thekedar naam?', theka.name);
    if (!name) return;
    const totalAmount = Number(prompt('Total amount?', String(theka.totalAmount)));
    const notes = prompt('Notes?', theka.notes) || '';
    setState(prev => ({
      ...prev,
      demolitionThekas: (prev.demolitionThekas || []).map(t =>
        t.id === theka.id ? { ...t, name, totalAmount, notes } : t
      ),
    }));
  };

  const addPayment = (theka: DemolitionTheka) => {
    const amount = Number(prompt(`${theka.name} ko kitna diya?`));
    if (!amount) return;
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
    const note = prompt('Note (optional)?') || '';
    const paymentId = genId();
    setState(prev => ({
      ...prev,
      demolitionThekas: (prev.demolitionThekas || []).map(t =>
        t.id === theka.id
          ? { ...t, payments: [...t.payments, { id: paymentId, date: new Date(dateStr).toISOString(), amount, note }] }
          : t
      ),
    }));
  };

  const editPayment = (thekaId: string, paymentId: string, current: { amount: number; date: string; note: string }) => {
    const amount = Number(prompt('Amount?', String(current.amount)));
    if (!amount) return;
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(current.date), 'yyyy-MM-dd')) || format(new Date(current.date), 'yyyy-MM-dd');
    const note = prompt('Note?', current.note) || '';
    setState(prev => ({
      ...prev,
      demolitionThekas: (prev.demolitionThekas || []).map(t =>
        t.id === thekaId
          ? { ...t, payments: t.payments.map(p => p.id === paymentId ? { ...p, amount, date: new Date(dateStr).toISOString(), note } : p) }
          : t
      ),
    }));
  };

  const deletePayment = (thekaId: string, paymentId: string) =>
    askConfirm('Is demolition theka payment ko delete kar dein?', () =>
      setState(prev => ({
        ...prev,
        demolitionThekas: (prev.demolitionThekas || []).map(t =>
          t.id === thekaId ? { ...t, payments: t.payments.filter(p => p.id !== paymentId) } : t
        ),
      }))
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Tod-Phod Theka</h3>
        <button onClick={addTheka} className="p-2 bg-orange-600 text-white rounded-full">
          <Plus size={20} />
        </button>
      </div>

      {thekas.map(theka => {
        const totalPaid = theka.payments.reduce((a, p) => a + p.amount, 0);
        const remaining = theka.totalAmount - totalPaid;
        const pct = theka.totalAmount > 0 ? (totalPaid / theka.totalAmount) * 100 : 0;
        return (
          <div key={theka.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{theka.name}</h4>
                <span className="text-xs font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">{theka.workType}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
                  <p className="font-bold text-slate-900">{formatCurrency(theka.totalAmount)}</p>
                </div>
                <button onClick={() => editTheka(theka)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => askConfirm(`"${theka.name}" ka demolition theka delete kar dein?`, () =>
                    setState(prev => ({ ...prev, demolitionThekas: (prev.demolitionThekas || []).filter(t => t.id !== theka.id) }))
                  )}
                  className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-green-600">Diya: {formatCurrency(totalPaid)}</span>
                <span className="text-red-500">Baaki: {formatCurrency(remaining)}</span>
              </div>
            </div>
            {theka.payments.length > 0 && (
              <div className="border-t border-slate-50 px-4 py-2 space-y-2">
                {[...theka.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                  <div key={payment.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-700">{formatCurrency(payment.amount)}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        {format(new Date(payment.date), 'dd MMM yyyy')}{payment.note && ` • ${payment.note}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => editPayment(theka.id, payment.id, payment)} className="p-1 text-slate-400 hover:text-orange-500">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deletePayment(theka.id, payment.id)} className="p-1 text-red-300 hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-slate-50 p-3">
              <button
                onClick={() => addPayment(theka)}
                className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100"
              >
                + Payment Add Karo
              </button>
            </div>
          </div>
        );
      })}

      {thekas.length === 0 && (
        <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm">
          Koi theka nahi mila. Upar + se add karo.
        </div>
      )}
    </div>
  );
}
