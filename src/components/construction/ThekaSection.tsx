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
          <h3 className="font-bold text-text-primary">Thekedar Hisaab</h3>
          <p className="text-xs text-text-subdued mt-0.5">{state.thekas.length} thekedar</p>
        </div>
        <button
          onClick={openAddTheka}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {state.thekas.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Hammer size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-sm">Koi theka nahi abhi tak</p>
          <button onClick={openAddTheka} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
            + Theka Add Karein
          </button>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {state.thekas.map(theka => {
          const totalPaid = theka.payments.reduce((a, p) => a + p.amount, 0);
          const remaining = theka.totalAmount - totalPaid;
          const pct = theka.totalAmount > 0 ? (totalPaid / theka.totalAmount) * 100 : 0;
          return (
            <div key={theka.id} className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
              <div className="p-4 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-text-primary">{theka.name}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full">{theka.workType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    {theka.ratePerSqFt && theka.areaSqFt ? (
                      <p className="text-[10px] text-text-subdued font-bold mb-0.5 leading-none">{theka.areaSqFt} sq.ft × ₹{theka.ratePerSqFt}</p>
                    ) : (
                      <p className="text-xs text-text-subdued font-bold uppercase mb-0.5 leading-none">Total</p>
                    )}
                    <p className="font-bold text-text-primary leading-none">{formatCurrency(theka.totalAmount)}</p>
                  </div>
                  <button onClick={() => openEditTheka(theka)} className="p-1.5 bg-surface-subdued text-text-secondary rounded-xl border border-border-default hover:bg-border-default transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm(`"${theka.name}" ka theka delete kar dein?`, () =>
                      setState(prev => ({ ...prev, thekas: prev.thekas.filter(t => t.id !== theka.id) }))
                    )}
                    className="p-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="px-4 pb-3">
                <div className="w-full bg-border-default h-2 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-brand transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">Diya: {formatCurrency(totalPaid)}</span>
                  <span className="text-red-500">Baaki: {formatCurrency(remaining)}</span>
                </div>
              </div>
              {theka.payments.length > 0 && (
                <div className="border-t border-border-default px-4 py-2 space-y-2">
                  {[...theka.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-text-primary">{formatCurrency(payment.amount)}</p>
                        <p className="text-[10px] text-text-subdued uppercase font-bold">
                          {format(new Date(payment.date), 'dd MMM yyyy')}{payment.note && ` • ${payment.note}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditPay(theka, payment)} className="p-1 text-text-secondary hover:text-brand transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => deletePayment(theka, payment.id)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-border-default p-3">
                <button
                  onClick={() => openAddPay(theka)}
                  className="w-full py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors"
                >
                  + Payment Add Karo
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Theka Form — bottom sheet on mobile, centered modal on desktop */}
      {thekaForm && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeThekaForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 overflow-y-auto max-h-[92vh] md:max-h-[88vh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-lg">{thekaEditId ? 'Theka Edit' : 'Naya Theka'}</h3>
                <button onClick={closeThekaForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Thekedar Naam</label>
                <input type="text" autoFocus value={thekaForm.name}
                  onChange={e => setThekaForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Raju Mistri" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Kaam ka Type</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map(t => (
                    <button key={t} onClick={() => setThekaForm(f => f ? { ...f, workType: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        thekaForm.workType === t ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Pricing Mode</label>
                <div className="flex gap-2">
                  <button onClick={() => setThekaForm(f => f ? { ...f, mode: 'lumpsum' } : f)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                      thekaForm.mode === 'lumpsum' ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default')}>
                    Lumpsum (₹)
                  </button>
                  <button onClick={() => setThekaForm(f => f ? { ...f, mode: 'sqft' } : f)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                      thekaForm.mode === 'sqft' ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default')}>
                    Per Sq.Ft
                  </button>
                </div>
              </div>

              {thekaForm.mode === 'lumpsum' ? (
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Total Amount (₹)</label>
                  <input type="number" inputMode="numeric" value={thekaForm.totalAmount}
                    onChange={e => setThekaForm(f => f ? { ...f, totalAmount: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                    placeholder="0" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Rate (₹/sq.ft)</label>
                    <input type="number" inputMode="numeric" value={thekaForm.ratePerSqFt}
                      onChange={e => setThekaForm(f => f ? { ...f, ratePerSqFt: e.target.value } : f)}
                      className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Area (sq.ft)</label>
                    <input type="number" inputMode="numeric" value={thekaForm.areaSqFt}
                      onChange={e => setThekaForm(f => f ? { ...f, areaSqFt: e.target.value } : f)}
                      className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                      placeholder="0" />
                  </div>
                </div>
              )}

              {computedTotal(thekaForm) > 0 && (
                <div className="bg-brand/10 rounded-xl px-3 py-2 text-center border border-brand/20">
                  <p className="text-[10px] text-brand font-bold uppercase">Total Theka</p>
                  <p className="text-lg font-bold text-brand">{formatCurrency(computedTotal(thekaForm))}</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Start Date</label>
                <input type="date" value={thekaForm.startDate}
                  onChange={e => setThekaForm(f => f ? { ...f, startDate: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={thekaForm.notes}
                  onChange={e => setThekaForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="Kaam ka detail ya special note" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeThekaForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveTheka} disabled={!thekaForm.name || computedTotal(thekaForm) <= 0}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {thekaEditId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form — bottom sheet on mobile, centered modal on desktop */}
      {payForm && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closePayForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-lg">{payForm.paymentId ? 'Payment Edit' : 'Naya Payment'}</h3>
                <button onClick={closePayForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={payForm.amount}
                  onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input type="date" value={payForm.date}
                  onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Note (optional)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="Cash / UPI / cheque?" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePayForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={savePay} disabled={!payForm.amount || Number(payForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {payForm.paymentId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
