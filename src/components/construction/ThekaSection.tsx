import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Hammer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Theka } from '../../types';

const WORK_TYPES: Theka['workType'][] = ['Civil', 'Electrical', 'Plumbing', 'Painting', 'Flooring', 'Other'];

type ThekaForm = {
  name: string;
  workType: Theka['workType'];
  mode: 'lumpsum' | 'sqft';
  totalAmount: string;
  ratePerSqFt: string;
  areaSqFt: string;
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

const blankThekaForm = (defaultArea: number): ThekaForm => ({
  name: '',
  workType: 'Civil',
  mode: 'lumpsum',
  totalAmount: '',
  ratePerSqFt: '',
  areaSqFt: defaultArea ? String(defaultArea) : '',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
});

export default function ThekaSection() {
  const { state, setState, askConfirm } = useAppContext();
  const [thekaForm, setThekaForm] = useState<ThekaForm | null>(null);
  const [thekaEditId, setThekaEditId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PayForm | null>(null);

  const openAddTheka = () => {
    setThekaEditId(null);
    setThekaForm(blankThekaForm(state.project?.totalArea || 0));
  };

  const openEditTheka = (t: Theka) => {
    setThekaEditId(t.id);
    setThekaForm({
      name: t.name,
      workType: t.workType,
      mode: t.ratePerSqFt && t.areaSqFt ? 'sqft' : 'lumpsum',
      totalAmount: String(t.totalAmount),
      ratePerSqFt: String(t.ratePerSqFt || ''),
      areaSqFt: String(t.areaSqFt || ''),
      startDate: t.startDate ? format(new Date(t.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      notes: t.notes || '',
    });
  };

  const closeThekaForm = () => { setThekaForm(null); setThekaEditId(null); };

  const computedTotal = (f: ThekaForm) =>
    f.mode === 'sqft'
      ? (Number(f.ratePerSqFt) || 0) * (Number(f.areaSqFt) || 0)
      : Number(f.totalAmount) || 0;

  const saveTheka = () => {
    if (!thekaForm?.name) return;
    const total = computedTotal(thekaForm);
    if (total <= 0) return;

    const baseFields = {
      name: thekaForm.name,
      workType: thekaForm.workType,
      totalAmount: total,
      startDate: thekaForm.startDate ? new Date(thekaForm.startDate).toISOString() : new Date().toISOString(),
      notes: thekaForm.notes,
      ratePerSqFt: thekaForm.mode === 'sqft' ? Number(thekaForm.ratePerSqFt) || undefined : undefined,
      areaSqFt: thekaForm.mode === 'sqft' ? Number(thekaForm.areaSqFt) || undefined : undefined,
    };

    if (thekaEditId) {
      setState(prev => ({
        ...prev,
        thekas: prev.thekas.map(t => t.id === thekaEditId ? { ...t, ...baseFields } : t),
      }));
    } else {
      setState(prev => ({
        ...prev,
        thekas: [...prev.thekas, { id: genId(), ...baseFields, payments: [] }],
      }));
    }
    closeThekaForm();
  };

  const openAddPay = (theka: Theka) => {
    setPayForm({
      thekaId: theka.id, paymentId: null,
      amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '',
    });
  };

  const openEditPay = (theka: Theka, p: { id: string; amount: number; date: string; note: string }) => {
    setPayForm({
      thekaId: theka.id, paymentId: p.id,
      amount: String(p.amount),
      date: format(new Date(p.date), 'yyyy-MM-dd'),
      note: p.note || '',
    });
  };

  const closePayForm = () => setPayForm(null);

  const savePay = () => {
    if (!payForm) return;
    const amount = Number(payForm.amount);
    if (!amount) return;

    const theka = state.thekas.find(t => t.id === payForm.thekaId);
    if (!theka) return;

    const isoDate = new Date(payForm.date).toISOString();
    const id = payForm.paymentId || genId();
    const expenseNotes = `${theka.name} (${theka.workType})${payForm.note ? ` - ${payForm.note}` : ''}`;

    setState(prev => ({
      ...prev,
      thekas: prev.thekas.map(t => t.id !== payForm.thekaId ? t : ({
        ...t,
        payments: payForm.paymentId
          ? t.payments.map(p => p.id === payForm.paymentId ? { id, date: isoDate, amount, note: payForm.note } : p)
          : [...t.payments, { id, date: isoDate, amount, note: payForm.note }],
      })),
      expenses: payForm.paymentId
        ? prev.expenses.map(e => e.id === payForm.paymentId ? { ...e, amount, date: isoDate, notes: expenseNotes } : e)
        : [...prev.expenses, { id, date: isoDate, amount, category: 'Theka', notes: expenseNotes }],
    }));
    closePayForm();
  };

  const deletePayment = (theka: Theka, paymentId: string) =>
    askConfirm('Is theka payment ko delete kar dein?', () =>
      setState(prev => ({
        ...prev,
        thekas: prev.thekas.map(t => t.id === theka.id
          ? { ...t, payments: t.payments.filter(p => p.id !== paymentId) }
          : t),
        expenses: prev.expenses.filter(e => e.id !== paymentId),
      }))
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900">Thekedar Hisaab</h3>
          <p className="text-xs text-slate-400 mt-0.5">{state.thekas.length} thekedar</p>
        </div>
        <button
          onClick={openAddTheka}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {state.thekas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Hammer size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi theka nahi abhi tak</p>
          <button onClick={openAddTheka} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100">
            + Theka Add Karein
          </button>
        </div>
      ) : (
        state.thekas.map(theka => {
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
                  <button onClick={() => openEditTheka(theka)} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
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
                        <button onClick={() => openEditPay(theka, payment)} className="p-1 text-slate-400 hover:text-indigo-500">
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
                  onClick={() => openAddPay(theka)}
                  className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
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
                <h3 className="font-bold text-slate-900 text-lg">{thekaEditId ? 'Theka Edit' : 'Naya Theka'}</h3>
                <button onClick={closeThekaForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Thekedar Naam</label>
                <input type="text" autoFocus value={thekaForm.name}
                  onChange={e => setThekaForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Raju Mistri" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Kaam ka Type</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map(t => (
                    <button key={t} onClick={() => setThekaForm(f => f ? { ...f, workType: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        thekaForm.workType === t ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Pricing Mode</label>
                <div className="flex gap-2">
                  <button onClick={() => setThekaForm(f => f ? { ...f, mode: 'lumpsum' } : f)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                      thekaForm.mode === 'lumpsum' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                    Lumpsum (₹)
                  </button>
                  <button onClick={() => setThekaForm(f => f ? { ...f, mode: 'sqft' } : f)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                      thekaForm.mode === 'sqft' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                    Per Sq.Ft
                  </button>
                </div>
              </div>

              {thekaForm.mode === 'lumpsum' ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Total Amount (₹)</label>
                  <input type="number" inputMode="numeric" value={thekaForm.totalAmount}
                    onChange={e => setThekaForm(f => f ? { ...f, totalAmount: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-xl"
                    placeholder="0" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Rate (₹/sq.ft)</label>
                    <input type="number" inputMode="numeric" value={thekaForm.ratePerSqFt}
                      onChange={e => setThekaForm(f => f ? { ...f, ratePerSqFt: e.target.value } : f)}
                      className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Area (sq.ft)</label>
                    <input type="number" inputMode="numeric" value={thekaForm.areaSqFt}
                      onChange={e => setThekaForm(f => f ? { ...f, areaSqFt: e.target.value } : f)}
                      className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="0" />
                  </div>
                </div>
              )}

              {computedTotal(thekaForm) > 0 && (
                <div className="bg-indigo-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase">Total Theka</p>
                  <p className="text-lg font-bold text-indigo-700">{formatCurrency(computedTotal(thekaForm))}</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Start Date</label>
                <input type="date" value={thekaForm.startDate}
                  onChange={e => setThekaForm(f => f ? { ...f, startDate: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={thekaForm.notes}
                  onChange={e => setThekaForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Kaam ka detail ya special note" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeThekaForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={saveTheka} disabled={!thekaForm.name || computedTotal(thekaForm) <= 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200">
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
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input type="date" value={payForm.date}
                  onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Note (optional)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Cash / UPI / cheque?" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePayForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={savePay} disabled={!payForm.amount || Number(payForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200">
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
