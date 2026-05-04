import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Theka } from '../../types';

export default function ThekaSection() {
  const { state, setState, askConfirm } = useAppContext();

  const addTheka = () => {
    const name = prompt('Thekedar ka naam?');
    if (!name) return;
    const workType = prompt('Kaam ka type? (Civil/Electrical/Plumbing/Painting/Flooring/Other)') as Theka['workType'];
    let totalAmount = 0, ratePerSqFt = 0, areaSqFt = 0;
    const useSqFt = confirm('Kya aap Theka per Square Feet (₹/sq.ft) ke hisaab se lagana chahte hain?');
    if (useSqFt) {
      ratePerSqFt = Number(prompt('Darr (Rate) bataiye (e.g., 168 ₹/sq.ft)?'));
      areaSqFt = Number(prompt('Total Area (Sq.Ft) bataiye?', String(state.project?.totalArea || 0)));
      totalAmount = ratePerSqFt * areaSqFt;
    } else {
      totalAmount = Number(prompt('Total lumpsum theka amount (₹)?'));
    }
    const startDate = prompt('Start date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10));
    const notes = prompt('Notes?') || '';
    setState(prev => ({
      ...prev,
      thekas: [...prev.thekas, {
        id: genId(), name, workType: workType || 'Civil', totalAmount, payments: [],
        startDate: startDate || new Date().toISOString(), notes,
        ratePerSqFt: ratePerSqFt || undefined, areaSqFt: areaSqFt || undefined,
      }],
    }));
  };

  const editTheka = (theka: Theka) => {
    const name = prompt('Thekedar naam?', theka.name);
    if (!name) return;
    const totalAmount = Number(prompt('Total amount?', String(theka.totalAmount)));
    const notes = prompt('Notes?', theka.notes) || '';
    setState(prev => ({
      ...prev,
      thekas: prev.thekas.map(t => t.id === theka.id ? { ...t, name, totalAmount, notes } : t),
    }));
  };

  const addPayment = (theka: Theka) => {
    const amount = Number(prompt(`${theka.name} ko kitna diya?`));
    if (!amount) return;
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
    const note = prompt('Note (optional)?') || '';
    const paymentId = genId();
    setState(prev => ({
      ...prev,
      thekas: prev.thekas.map(t => t.id === theka.id
        ? { ...t, payments: [...t.payments, { id: paymentId, date: new Date(dateStr).toISOString(), amount, note }] }
        : t),
      expenses: [...prev.expenses, {
        id: paymentId, date: new Date(dateStr).toISOString(), amount, category: 'Theka',
        notes: `${theka.name} (${theka.workType}) - ${note}`,
      }],
    }));
  };

  const editPayment = (theka: Theka, paymentId: string, current: { amount: number; date: string; note: string }) => {
    const amount = Number(prompt('Amount?', String(current.amount)));
    if (!amount) return;
    const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(current.date), 'yyyy-MM-dd')) || format(new Date(current.date), 'yyyy-MM-dd');
    const note = prompt('Note?', current.note) || '';
    setState(prev => ({
      ...prev,
      thekas: prev.thekas.map(t => t.id === theka.id
        ? { ...t, payments: t.payments.map(p => p.id === paymentId ? { ...p, amount, date: new Date(dateStr).toISOString(), note } : p) }
        : t),
      expenses: prev.expenses.map(e => e.id === paymentId
        ? { ...e, amount, date: new Date(dateStr).toISOString(), notes: `${theka.name} (${theka.workType}) - ${note}` }
        : e),
    }));
  };

  const deletePayment = (theka: Theka, paymentId: string) =>
    askConfirm('Is theka payment ko delete kar dein?', () =>
      setState(prev => ({
        ...prev,
        thekas: prev.thekas.map(t => t.id === theka.id
          ? { ...t, payments: t.payments.filter(p => p.id !== paymentId) } : t),
        expenses: prev.expenses.filter(e => e.id !== paymentId),
      }))
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Thekedar Hisaab</h3>
        <button onClick={addTheka} className="p-2 bg-indigo-600 text-white rounded-full">
          <Plus size={20} />
        </button>
      </div>

      {state.thekas.map(theka => {
        const totalPaid = theka.payments.reduce((a, p) => a + p.amount, 0);
        const remaining = theka.totalAmount - totalPaid;
        const pct = theka.totalAmount > 0 ? (totalPaid / theka.totalAmount) * 100 : 0;
        return (
          <div key={theka.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{theka.name}</h4>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{theka.workType}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  {theka.ratePerSqFt && theka.areaSqFt ? (
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">{theka.areaSqFt} sq.ft × ₹{theka.ratePerSqFt}</p>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold uppercase mb-0.5 leading-none">Total</p>
                  )}
                  <p className="font-bold text-slate-900 leading-none">{formatCurrency(theka.totalAmount)}</p>
                </div>
                <button onClick={() => editTheka(theka)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => askConfirm(`"${theka.name}" ka theka delete kar dein?`, () =>
                    setState(prev => ({ ...prev, thekas: prev.thekas.filter(t => t.id !== theka.id) }))
                  )}
                  className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
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
                      <button onClick={() => editPayment(theka, payment.id, payment)} className="p-1 text-slate-400 hover:text-indigo-500">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deletePayment(theka, payment.id)} className="p-1 text-red-300 hover:text-red-500">
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
                className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
              >
                + Payment Add Karo
              </button>
            </div>
          </div>
        );
      })}

      {state.thekas.length === 0 && (
        <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm">
          Koi theka nahi mila. Upar + se add karo.
        </div>
      )}
    </div>
  );
}
