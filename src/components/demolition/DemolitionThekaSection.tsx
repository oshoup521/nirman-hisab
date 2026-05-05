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
          <h3 className="font-bold text-text-primary">Tod-Phod Theka</h3>
          <p className="text-xs text-text-subdued mt-0.5">{thekas.length} thekedar</p>
        </div>
        <button
          onClick={openAddTheka}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {thekas.length === 0 ? (
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
        {thekas.map(theka => {
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
                    <p className="text-xs text-text-subdued font-bold uppercase">Total</p>
                    <p className="font-bold text-text-primary">{formatCurrency(theka.totalAmount)}</p>
                  </div>
                  <button onClick={() => openEditTheka(theka)} className="p-1.5 bg-surface-subdued text-text-secondary rounded-xl border border-border-default hover:bg-border-default transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm(`"${theka.name}" ka demolition theka delete kar dein?`, () =>
                      setState(prev => ({ ...prev, demolitionThekas: (prev.demolitionThekas || []).filter(t => t.id !== theka.id) }))
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
                        <button onClick={() => deletePayment(theka.id, payment.id)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors">
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
                <h3 className="font-bold text-text-primary text-lg">{thekaEditId ? 'Theka Edit' : 'Naya Demolition Theka'}</h3>
                <button onClick={closeThekaForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Thekedar Naam</label>
                <input type="text" autoFocus value={thekaForm.name}
                  onChange={e => setThekaForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Salim Mistri" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Kaam ka Type</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map(t => (
                    <button key={t} onClick={() => setThekaForm(f => f ? { ...f, workType: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        thekaForm.workType === t ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default hover:bg-border-default')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Total Amount (₹)</label>
                <input type="number" inputMode="numeric" value={thekaForm.totalAmount}
                  onChange={e => setThekaForm(f => f ? { ...f, totalAmount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                  placeholder="0" />
              </div>

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
                  placeholder="Kaam ka detail" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeThekaForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveTheka} disabled={!thekaForm.name || Number(thekaForm.totalAmount) <= 0}
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
