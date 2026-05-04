import React, { useState } from 'react';
import { Plus, Home, Pencil, Trash2, X, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { RentalProperty } from '../../types';

type PropForm = {
  name: string; type: RentalProperty['type'];
  monthlyRent: string; deposit: string; depositStatus: RentalProperty['depositStatus'];
  ownerName: string; ownerPhone: string;
  startDate: string; agreementEndDate: string; agreementNote: string;
};
type PayForm = {
  rentalId: string; paymentId: string | null;
  amount: string; month: string; date: string; note: string;
  paidFromDeposit: boolean; isDepositMode: boolean; maxFromDeposit: number;
};

const PROP_TYPES: RentalProperty['type'][] = ['Basement', '1BHK', '2BHK', 'Shop', 'Other'];
const DEP_STATUSES: { value: RentalProperty['depositStatus']; label: string }[] = [
  { value: 'pending', label: '⏳ Dena Baaki' },
  { value: 'paid', label: '✓ De Diya' },
  { value: 'refunded', label: '↩ Wapas Mila' },
  { value: 'forfeited', label: '✗ Kaat Liya' },
];

const blankProp = (): PropForm => ({
  name: '', type: 'Other', monthlyRent: '', deposit: '', depositStatus: 'pending',
  ownerName: '', ownerPhone: '', startDate: format(new Date(), 'yyyy-MM-dd'),
  agreementEndDate: '', agreementNote: '',
});

export default function KirayaTab() {
  const { state, setState, calcs, askConfirm } = useAppContext();
  const { depositPaid, depositPending, depositWapas, getDepositStatus } = calcs;

  const rentals = state.rentals || [];
  const totalMonthlyRent = rentals.reduce((a, r) => a + r.monthlyRent, 0);
  const totalPaidRent = rentals.reduce((a, r) => a + r.payments.reduce((s, p) => s + p.amount, 0), 0);

  const [propForm, setPropForm] = useState<PropForm | null>(null);
  const [propEditId, setPropEditId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PayForm | null>(null);

  const openAddProp = () => { setPropEditId(null); setPropForm(blankProp()); };
  const openEditProp = (r: RentalProperty) => {
    setPropEditId(r.id);
    setPropForm({
      name: r.name, type: r.type || 'Other',
      monthlyRent: String(r.monthlyRent), deposit: String(r.deposit || 0),
      depositStatus: r.depositStatus || 'pending',
      ownerName: r.ownerName || '', ownerPhone: r.ownerPhone || '',
      startDate: r.startDate ? format(new Date(r.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      agreementEndDate: r.agreementEndDate ? format(new Date(r.agreementEndDate), 'yyyy-MM-dd') : '',
      agreementNote: r.agreementNote || '',
    });
  };
  const closePropForm = () => { setPropForm(null); setPropEditId(null); };

  const saveProp = () => {
    if (!propForm?.name) return;
    const entry: RentalProperty = {
      id: propEditId || genId(),
      name: propForm.name, type: propForm.type,
      monthlyRent: Number(propForm.monthlyRent) || 0,
      deposit: Number(propForm.deposit) || 0,
      depositStatus: propForm.depositStatus,
      ownerName: propForm.ownerName, ownerPhone: propForm.ownerPhone,
      startDate: propForm.startDate ? new Date(propForm.startDate).toISOString() : new Date().toISOString(),
      agreementEndDate: propForm.agreementEndDate ? new Date(propForm.agreementEndDate).toISOString() : '',
      agreementNote: propForm.agreementNote,
      payments: propEditId ? (rentals.find(r => r.id === propEditId)?.payments || []) : [],
    };
    setState(prev => ({
      ...prev,
      rentals: propEditId
        ? (prev.rentals || []).map(r => r.id === propEditId ? entry : r)
        : [...(prev.rentals || []), entry],
    }));
    closePropForm();
  };

  const openAddPay = (r: RentalProperty, depositMode = false) => {
    const depositUsed = r.payments.filter(p => p.paidFromDeposit).reduce((a, p) => a + p.amount, 0);
    const maxFromDeposit = Math.max(0, r.deposit - depositUsed);
    setPayForm({
      rentalId: r.id, paymentId: null,
      amount: String(depositMode ? Math.min(r.monthlyRent, maxFromDeposit) : r.monthlyRent),
      month: format(new Date(), 'yyyy-MM'), date: format(new Date(), 'yyyy-MM-dd'),
      note: '', paidFromDeposit: depositMode, isDepositMode: depositMode, maxFromDeposit,
    });
  };
  const openEditPay = (rentalId: string, p: RentalProperty['payments'][0]) => {
    const r = rentals.find(x => x.id === rentalId)!;
    const depositUsed = r.payments.filter(x => x.paidFromDeposit).reduce((a, x) => a + x.amount, 0);
    setPayForm({
      rentalId, paymentId: p.id,
      amount: String(p.amount), month: p.month,
      date: format(new Date(p.date), 'yyyy-MM-dd'),
      note: p.note || '', paidFromDeposit: !!p.paidFromDeposit,
      isDepositMode: !!p.paidFromDeposit, maxFromDeposit: r.deposit - depositUsed + p.amount,
    });
  };
  const closePayForm = () => setPayForm(null);

  const savePay = () => {
    if (!payForm) return;
    const amount = Number(payForm.amount);
    if (!amount) return;
    const entry = {
      id: payForm.paymentId || genId(),
      date: new Date(payForm.date).toISOString(),
      amount, month: payForm.month, note: payForm.note.trim(),
      paidFromDeposit: payForm.paidFromDeposit,
    };
    setState(prev => ({
      ...prev,
      rentals: (prev.rentals || []).map(r =>
        r.id === payForm.rentalId
          ? { ...r, payments: payForm.paymentId ? r.payments.map(p => p.id === payForm.paymentId ? entry : p) : [...r.payments, entry] }
          : r
      ),
    }));
    closePayForm();
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kiraya Hisaab</h1>
          <p className="text-slate-500 text-sm">Rent Tracker</p>
        </div>
        <button
          onClick={openAddProp}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-violet-200"
        >
          <Plus size={16} /> Add Property
        </button>
      </header>

      {/* Summary */}
      {rentals.length > 0 && (
        <div className="bg-violet-600 rounded-3xl p-5">
          <p className="text-violet-200 text-[10px] font-bold uppercase tracking-wide mb-3">Monthly Overview</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/15 rounded-xl px-3 py-2">
              <p className="text-violet-200 text-[10px] font-bold uppercase">Monthly Rent</p>
              <p className="text-white font-bold text-lg leading-tight">{formatCurrency(totalMonthlyRent)}</p>
            </div>
            <div className="bg-black/15 rounded-xl px-3 py-2">
              <p className="text-violet-200 text-[10px] font-bold uppercase">Rent Diya</p>
              <p className="text-white font-bold text-lg leading-tight">{formatCurrency(totalPaidRent)}</p>
            </div>
            {depositPaid > 0 && (
              <div className="bg-black/15 rounded-xl px-3 py-2">
                <p className="text-violet-200 text-[10px] font-bold uppercase">Deposit Diya ✓</p>
                <p className="text-white font-bold text-base leading-tight">{formatCurrency(depositPaid)}</p>
                <p className="text-violet-300 text-[9px] mt-0.5">Wapas milega</p>
              </div>
            )}
            {depositPending > 0 && (
              <div className="bg-orange-500/30 rounded-xl px-3 py-2">
                <p className="text-orange-200 text-[10px] font-bold uppercase">Deposit Baaki ⏳</p>
                <p className="text-white font-bold text-base leading-tight">{formatCurrency(depositPending)}</p>
                <p className="text-orange-200 text-[9px] mt-0.5">Maine nahi diya</p>
              </div>
            )}
            {depositWapas > 0 && (
              <div className="bg-emerald-500/30 rounded-xl px-3 py-2">
                <p className="text-emerald-200 text-[10px] font-bold uppercase">Wapas Milega 🔄</p>
                <p className="text-white font-bold text-base leading-tight">{formatCurrency(depositWapas)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Cards */}
      {rentals.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Home size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi property nahi abhi tak</p>
          <button onClick={openAddProp} className="mt-4 px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold border border-violet-100">
            + Property Add Karein
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map(rental => {
            const currentMonth = format(new Date(), 'yyyy-MM');
            const paidThisMonth = rental.payments.filter(p => p.month === currentMonth).reduce((a, p) => a + p.amount, 0);
            const thisMonthDone = paidThisMonth >= rental.monthlyRent;
            const depositUsedForRent = rental.payments.filter(p => p.paidFromDeposit).reduce((a, p) => a + p.amount, 0);
            const depositRemaining = (rental.deposit || 0) - depositUsedForRent;
            const dStatus = getDepositStatus(rental);

            return (
              <div key={rental.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="p-4 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Home size={15} className="text-violet-500 shrink-0" />
                      <h4 className="font-bold text-slate-900">{rental.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">{rental.type}</span>
                    </div>
                    {(rental.ownerName || rental.ownerPhone) && (
                      <p className="text-xs text-slate-400 mt-0.5">{rental.ownerName}{rental.ownerPhone ? ` • ${rental.ownerPhone}` : ''}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => openEditProp(rental)} className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => askConfirm(`"${rental.name}" delete kar dein?`, () =>
                        setState(prev => ({ ...prev, rentals: (prev.rentals || []).filter(r => r.id !== rental.id) }))
                      )}
                      className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Rent + Deposit mini stats */}
                <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Monthly Rent</p>
                    <p className="font-bold text-slate-900">{formatCurrency(rental.monthlyRent)}</p>
                  </div>
                  {(rental.deposit || 0) > 0 && (
                    <div className={cn('p-3 rounded-xl', {
                      'bg-blue-50': dStatus === 'paid',
                      'bg-green-50': dStatus === 'refunded',
                      'bg-red-50': dStatus === 'forfeited',
                      'bg-orange-50': dStatus === 'pending',
                    })}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Deposit</p>
                      <p className="font-bold text-slate-900">{formatCurrency(rental.deposit || 0)}</p>
                      <p className={cn('text-[10px] font-bold mt-0.5', {
                        'text-blue-600': dStatus === 'paid',
                        'text-green-600': dStatus === 'refunded',
                        'text-red-600': dStatus === 'forfeited',
                        'text-orange-600': dStatus === 'pending',
                      })}>
                        {dStatus === 'pending' && '⏳ Dena Baaki'}
                        {dStatus === 'paid' && '✓ Diya'}
                        {dStatus === 'refunded' && '✓ Wapas'}
                        {dStatus === 'forfeited' && '✗ Kaat Liya'}
                      </p>
                    </div>
                  )}
                  {depositUsedForRent > 0 && (
                    <div className="col-span-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">Deposit Remaining</p>
                          <p className="font-bold text-indigo-700">{formatCurrency(Math.max(0, depositRemaining))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-indigo-300 uppercase mb-0.5">Rent se Kata</p>
                          <p className="font-bold text-indigo-400">−{formatCurrency(depositUsedForRent)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agreement */}
                {(rental.agreementEndDate || rental.agreementNote) && (
                  <div className="mx-4 mb-3 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-0.5">
                    {rental.agreementEndDate && (
                      <p className="font-bold">Agreement ends: {format(new Date(rental.agreementEndDate), 'dd MMM yyyy')}</p>
                    )}
                    {rental.agreementNote && <p className="opacity-80">{rental.agreementNote}</p>}
                  </div>
                )}

                {/* This month badge */}
                <div className={cn(
                  'mx-4 mb-3 px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center',
                  thisMonthDone ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                )}>
                  <div className="flex items-center gap-1.5">
                    {thisMonthDone ? <CheckCircle size={13} /> : <Clock size={13} />}
                    <span>{format(new Date(), 'MMMM yyyy')}</span>
                  </div>
                  <span>{thisMonthDone ? `✓ Paid ${formatCurrency(paidThisMonth)}` : `Baaki: ${formatCurrency(rental.monthlyRent - paidThisMonth)}`}</span>
                </div>

                {/* Payment history */}
                {rental.payments.length > 0 && (
                  <div className="border-t border-slate-50 px-4 py-2 max-h-44 overflow-y-auto space-y-0">
                    {[...rental.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-700 text-sm">{formatCurrency(payment.amount)}</p>
                            {payment.paidFromDeposit && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-500 rounded-full">Deposit se</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {format(new Date(payment.date), 'dd MMM yyyy')} • {payment.month}
                            {payment.note ? ` • ${payment.note}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 ml-2">
                          <button onClick={() => openEditPay(rental.id, payment)} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-violet-500 rounded-lg">
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => askConfirm('Is payment ko delete kar dein?', () =>
                              setState(prev => ({
                                ...prev,
                                rentals: (prev.rentals || []).map(r =>
                                  r.id === rental.id ? { ...r, payments: r.payments.filter(p => p.id !== payment.id) } : r
                                ),
                              }))
                            )}
                            className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add payment buttons */}
                <div className="border-t border-slate-50 p-3 flex gap-2">
                  <button
                    onClick={() => openAddPay(rental, false)}
                    className="flex-1 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold border border-violet-100"
                  >
                    + Online/Cash
                  </button>
                  {dStatus === 'paid' && depositRemaining > 0 && (
                    <button
                      onClick={() => openAddPay(rental, true)}
                      className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
                    >
                      + Deposit se
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Form Sheet */}
      {propForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closePropForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto overflow-y-auto max-h-[92vh]" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{propEditId ? 'Property Edit' : 'Naya Property'}</h3>
                <button onClick={closePropForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Property Name</label>
                <input type="text" autoFocus value={propForm.name} onChange={e => setPropForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. Basement, 1BHK Floor 1" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {PROP_TYPES.map(t => (
                    <button key={t} onClick={() => setPropForm(f => f ? { ...f, type: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        propForm.type === t ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Monthly Rent (₹)</label>
                  <input type="number" inputMode="numeric" value={propForm.monthlyRent} onChange={e => setPropForm(f => f ? { ...f, monthlyRent: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Security Deposit (₹)</label>
                  <input type="number" inputMode="numeric" value={propForm.deposit} onChange={e => setPropForm(f => f ? { ...f, deposit: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 font-bold" placeholder="0" />
                </div>
              </div>

              {Number(propForm.deposit) > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Deposit Status</label>
                  <div className="flex flex-wrap gap-2">
                    {DEP_STATUSES.map(s => (
                      <button key={s.value} onClick={() => setPropForm(f => f ? { ...f, depositStatus: s.value } : f)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                          propForm.depositStatus === s.value ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Owner Name</label>
                  <input type="text" value={propForm.ownerName} onChange={e => setPropForm(f => f ? { ...f, ownerName: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500" placeholder="Malik ji" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Owner Phone</label>
                  <input type="tel" value={propForm.ownerPhone} onChange={e => setPropForm(f => f ? { ...f, ownerPhone: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500" placeholder="9XXXXXXXXX" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Start Date</label>
                  <input type="date" value={propForm.startDate} onChange={e => setPropForm(f => f ? { ...f, startDate: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Agreement End</label>
                  <input type="date" value={propForm.agreementEndDate} onChange={e => setPropForm(f => f ? { ...f, agreementEndDate: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Agreement Notes</label>
                <input type="text" value={propForm.agreementNote} onChange={e => setPropForm(f => f ? { ...f, agreementNote: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. 11 month, 1 month notice" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePropForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={saveProp} disabled={!propForm.name}
                  className="flex-1 py-3.5 bg-violet-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-violet-200">
                  {propEditId ? 'Update Karein' : 'Save Karo'}
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
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">
                  {payForm.paymentId ? 'Payment Edit' : payForm.isDepositMode ? 'Deposit se Kata' : 'Rent Payment'}
                </h3>
                <button onClick={closePayForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              {payForm.isDepositMode && (
                <div className="bg-indigo-50 rounded-xl px-3 py-2 text-xs text-indigo-600 font-bold">
                  Deposit remaining: {formatCurrency(payForm.maxFromDeposit)}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={payForm.amount}
                  onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 font-bold text-xl"
                  placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Mahina</label>
                  <input type="month" value={payForm.month}
                    onChange={e => setPayForm(f => f ? { ...f, month: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                  <input type="date" value={payForm.date}
                    onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                    className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Note (optional)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Kuch note karna hai?" />
              </div>
              {!payForm.isDepositMode && (
                <button
                  onClick={() => setPayForm(f => f ? { ...f, paidFromDeposit: !f.paidFromDeposit } : f)}
                  className={cn('w-full py-2.5 rounded-xl text-xs font-bold border transition-all',
                    payForm.paidFromDeposit ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-100'
                  )}
                >
                  {payForm.paidFromDeposit ? '✓ Deposit se kata' : 'Deposit se katna hai?'}
                </button>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={closePayForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={savePay} disabled={!payForm.amount || Number(payForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-violet-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-violet-200">
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
