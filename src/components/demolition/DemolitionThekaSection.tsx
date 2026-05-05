import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Hammer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { DemolitionTheka } from '../../types';

const WORK_TYPES: DemolitionTheka['workType'][] = ['Tod-Phod', 'Malwa Hatao', 'Cutting', 'Other'];

type ThekaForm = {
  name: string;
  workType: DemolitionTheka['workType'];
  totalAmount: string;
  startDate: string;
  notes: string;
};

type PayForm = {
  thekaId: string;
  paymentId: string | null;
  amount: string;
  date: string;
  note: string;
};

const blankThekaForm = (): ThekaForm => ({
  name: '', workType: 'Tod-Phod', totalAmount: '',
  startDate: format(new Date(), 'yyyy-MM-dd'), notes: '',
});

export default function DemolitionThekaSection() {
  const { state, setState, askConfirm } = useAppContext();
  const thekas = state.demolitionThekas || [];

  const [thekaForm, setThekaForm] = useState<ThekaForm | null>(null);
  const [thekaEditId, setThekaEditId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PayForm | null>(null);

  const openAddTheka = () => { setThekaEditId(null); setThekaForm(blankThekaForm()); };
  const openEditTheka = (t: DemolitionTheka) => {
    setThekaEditId(t.id);
    setThekaForm({
      name: t.name,
      workType: t.workType,
      totalAmount: String(t.totalAmount),
      startDate: t.startDate ? format(new Date(t.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      notes: t.notes || '',
    });
  };
  const closeThekaForm = () => { setThekaForm(null); setThekaEditId(null); };

  const saveTheka = () => {
    if (!thekaForm?.name) return;
    const totalAmount = Number(thekaForm.totalAmount) || 0;
    if (totalAmount <= 0) return;

    const baseFields = {
      name: thekaForm.name,
      workType: thekaForm.workType,
      totalAmount,
      startDate: thekaForm.startDate ? new Date(thekaForm.startDate).toISOString() : new Date().toISOString(),
      notes: thekaForm.notes,
    };

    if (thekaEditId) {
      setState(prev => ({
        ...prev,
        demolitionThekas: (prev.demolitionThekas || []).map(t => t.id === thekaEditId ? { ...t, ...baseFields } : t),
      }));
    } else {
      setState(prev => ({
        ...prev,
        demolitionThekas: [...(prev.demolitionThekas || []), { id: genId(), ...baseFields, payments: [] }],
      }));
    }
    closeThekaForm();
  };

  const openAddPay = (theka: DemolitionTheka) => setPayForm({
    thekaId: theka.id, paymentId: null,
    amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '',
  });
  const openEditPay = (theka: DemolitionTheka, p: { id: string; amount: number; date: string; note: string }) => setPayForm({
    thekaId: theka.id, paymentId: p.id,
    amount: String(p.amount),
    date: format(new Date(p.date), 'yyyy-MM-dd'),
    note: p.note || '',
  });
  const closePayForm = () => setPayForm(null);

  const savePay = () => {
    if (!payForm) return;
    const amount = Number(payForm.amount);
    if (!amount) return;
    const isoDate = new Date(payForm.date).toISOString();
    const id = payForm.paymentId || genId();

    setState(prev => ({
      ...prev,
      demolitionThekas: (prev.demolitionThekas || []).map(t => t.id !== payForm.thekaId ? t : ({
        ...t,
        payments: payForm.paymentId
          ? t.payments.map(p => p.id === payForm.paymentId ? { id, date: isoDate, amount, note: payForm.note } : p)
          : [...t.payments, { id, date: isoDate, amount, note: payForm.note }],
      })),
    }));
    closePayForm();
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
        <div>
          <h3 className="font-bold text-slate-900">Tod-Phod Theka</h3>
          <p className="text-xs text-slate-400 mt-0.5">{thekas.length} thekedar</p>
        </div>
        <button
          onClick={openAddTheka}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-orange-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {thekas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Hammer size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi theka nahi abhi tak</p>
          <button onClick={openAddTheka} className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100">
            + Theka Add Karein
          </button>
        </div>
      ) : (
        thekas.map(theka => {
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
                  <button onClick={() => openEditTheka(theka)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
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
                        <button onClick={() => openEditPay(theka, payment)} className="p-1 text-slate-400 hover:text-orange-500">
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
                  onClick={() => openAddPay(theka)}
                  className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100"
                >
                  + Payment Add Karo
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Theka Form Sheet */}
      {thekaForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeThekaForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto overflow-y-auto max-h-[92vh]" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{thekaEditId ? 'Theka Edit' : 'Naya Demolition Theka'}</h3>
                <button onClick={closeThekaForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Thekedar Naam</label>
                <input type="text" autoFocus value={thekaForm.name}
                  onChange={e => setThekaForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Salim Mistri" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Kaam ka Type</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map(t => (
                    <button key={t} onClick={() => setThekaForm(f => f ? { ...f, workType: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        thekaForm.workType === t ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Total Amount (₹)</label>
                <input type="number" inputMode="numeric" value={thekaForm.totalAmount}
                  onChange={e => setThekaForm(f => f ? { ...f, totalAmount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Start Date</label>
                <input type="date" value={thekaForm.startDate}
                  onChange={e => setThekaForm(f => f ? { ...f, startDate: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={thekaForm.notes}
                  onChange={e => setThekaForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Kaam ka detail" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeThekaForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={saveTheka} disabled={!thekaForm.name || Number(thekaForm.totalAmount) <= 0}
                  className="flex-1 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-orange-200">
                  {thekaEditId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Form Sheet */}
      {payForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closePayForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{payForm.paymentId ? 'Payment Edit' : 'Naya Payment'}</h3>
                <button onClick={closePayForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={payForm.amount}
                  onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input type="date" value={payForm.date}
                  onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Note (optional)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Cash / UPI / cheque?" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePayForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={savePay} disabled={!payForm.amount || Number(payForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-orange-200">
                  {payForm.paymentId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
