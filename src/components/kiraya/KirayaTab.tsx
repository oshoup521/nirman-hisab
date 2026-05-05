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
          <h1 className="text-2xl font-bold text-text-primary">Kiraya Hisaab</h1>
          <p className="text-text-subdued text-sm">Rent Tracker</p>
        </div>
        <button
          onClick={openAddProp}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Property
        </button>
      </header>

      {/* Summary */}
      {rentals.length > 0 && (
        <div className="bg-brand dark:bg-brand-subdued dark:border dark:border-brand/20 rounded-3xl p-5 shadow-sm shadow-brand/20">
          <p className="text-surface dark:text-brand-text/70 text-[10px] font-bold uppercase tracking-wide mb-3">Monthly Overview</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/15 dark:bg-white/10 rounded-xl px-3 py-2">
              <p className="text-surface/80 dark:text-brand-text/80 text-[10px] font-bold uppercase">Monthly Rent</p>
              <p className="text-surface dark:text-brand-text font-bold text-lg leading-tight">{formatCurrency(totalMonthlyRent)}</p>
            </div>
            <div className="bg-black/15 dark:bg-white/10 rounded-xl px-3 py-2">
              <p className="text-surface/80 dark:text-brand-text/80 text-[10px] font-bold uppercase">Rent Diya</p>
              <p className="text-surface dark:text-brand-text font-bold text-lg leading-tight">{formatCurrency(totalPaidRent)}</p>
            </div>
            {depositPaid > 0 && (
              <div className="bg-black/15 dark:bg-white/10 rounded-xl px-3 py-2">
                <p className="text-surface/80 dark:text-brand-text/80 text-[10px] font-bold uppercase">Deposit Diya ✓</p>
                <p className="text-surface dark:text-brand-text font-bold text-base leading-tight">{formatCurrency(depositPaid)}</p>
                <p className="text-surface/60 dark:text-brand-text/60 text-[9px] mt-0.5">Wapas milega</p>
              </div>
            )}
            {depositPending > 0 && (
              <div className="bg-amber-500/30 dark:bg-amber-500/20 rounded-xl px-3 py-2 border border-amber-500/30">
                <p className="text-amber-100 dark:text-amber-400 text-[10px] font-bold uppercase">Deposit Baaki ⏳</p>
                <p className="text-surface dark:text-amber-300 font-bold text-base leading-tight">{formatCurrency(depositPending)}</p>
                <p className="text-amber-100 dark:text-amber-400/80 text-[9px] mt-0.5">Maine nahi diya</p>
              </div>
            )}
            {depositWapas > 0 && (
              <div className="bg-emerald-500/30 dark:bg-emerald-500/20 rounded-xl px-3 py-2 border border-emerald-500/30">
                <p className="text-emerald-100 dark:text-emerald-400 text-[10px] font-bold uppercase">Wapas Milega 🔄</p>
                <p className="text-surface dark:text-emerald-300 font-bold text-base leading-tight">{formatCurrency(depositWapas)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Cards */}
      {rentals.length === 0 ? (
        <div className="bg-surface p-10 rounded-3xl border-2 border-dashed border-border-default text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Home size={26} className="text-text-subdued" />
          </div>
          <p className="font-bold text-text-secondary text-sm">Koi property nahi abhi tak</p>
          <button onClick={openAddProp} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
            + Property Add Karein
          </button>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {rentals.map(rental => {
            const currentMonth = format(new Date(), 'yyyy-MM');
            const paidThisMonth = rental.payments.filter(p => p.month === currentMonth).reduce((a, p) => a + p.amount, 0);
            const thisMonthDone = paidThisMonth >= rental.monthlyRent;
            const depositUsedForRent = rental.payments.filter(p => p.paidFromDeposit).reduce((a, p) => a + p.amount, 0);
            const depositRemaining = (rental.deposit || 0) - depositUsedForRent;
            const dStatus = getDepositStatus(rental);

            return (
              <div key={rental.id} className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="p-4 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Home size={15} className="text-brand shrink-0" />
                      <h4 className="font-bold text-text-primary">{rental.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full">{rental.type}</span>
                    </div>
                    {(rental.ownerName || rental.ownerPhone) && (
                      <p className="text-xs text-text-subdued mt-0.5">{rental.ownerName}{rental.ownerPhone ? ` • ${rental.ownerPhone}` : ''}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => openEditProp(rental)} className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border-default transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => askConfirm(`"${rental.name}" delete kar dein?`, () =>
                        setState(prev => ({ ...prev, rentals: (prev.rentals || []).filter(r => r.id !== rental.id) }))
                      )}
                      className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Rent + Deposit mini stats */}
                <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                  <div className="bg-surface-subdued p-3 rounded-xl border border-border-default">
                    <p className="text-[10px] font-bold text-text-subdued uppercase mb-0.5">Monthly Rent</p>
                    <p className="font-bold text-text-primary">{formatCurrency(rental.monthlyRent)}</p>
                  </div>
                  {(rental.deposit || 0) > 0 && (
                    <div className={cn('p-3 rounded-xl border', {
                      'bg-blue-500/10 border-blue-500/20': dStatus === 'paid',
                      'bg-emerald-500/10 border-emerald-500/20': dStatus === 'refunded',
                      'bg-red-500/10 border-red-500/20': dStatus === 'forfeited',
                      'bg-amber-500/10 border-amber-500/20': dStatus === 'pending',
                    })}>
                      <p className="text-[10px] font-bold text-text-subdued uppercase mb-0.5">Deposit</p>
                      <p className="font-bold text-text-primary">{formatCurrency(rental.deposit || 0)}</p>
                      <p className={cn('text-[10px] font-bold mt-0.5', {
                        'text-blue-500': dStatus === 'paid',
                        'text-emerald-500': dStatus === 'refunded',
                        'text-red-500': dStatus === 'forfeited',
                        'text-amber-500': dStatus === 'pending',
                      })}>
                        {dStatus === 'pending' && '⏳ Dena Baaki'}
                        {dStatus === 'paid' && '✓ Diya'}
                        {dStatus === 'refunded' && '✓ Wapas'}
                        {dStatus === 'forfeited' && '✗ Kaat Liya'}
                      </p>
                    </div>
                  )}
                  {depositUsedForRent > 0 && (
                    <div className="col-span-2 bg-brand/10 p-3 rounded-xl border border-brand/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-brand uppercase mb-0.5">Deposit Remaining</p>
                          <p className="font-bold text-text-primary">{formatCurrency(Math.max(0, depositRemaining))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-brand uppercase mb-0.5">Rent se Kata</p>
                          <p className="font-bold text-brand">−{formatCurrency(depositUsedForRent)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agreement */}
                {(rental.agreementEndDate || rental.agreementNote) && (
                  <div className="mx-4 mb-3 px-3 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-xs text-blue-500 space-y-0.5">
                    {rental.agreementEndDate && (
                      <p className="font-bold">Agreement ends: {format(new Date(rental.agreementEndDate), 'dd MMM yyyy')}</p>
                    )}
                    {rental.agreementNote && <p className="opacity-80">{rental.agreementNote}</p>}
                  </div>
                )}

                {/* This month badge */}
                <div className={cn(
                  'mx-4 mb-3 px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center border',
                  thisMonthDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                )}>
                  <div className="flex items-center gap-1.5">
                    {thisMonthDone ? <CheckCircle size={13} /> : <Clock size={13} />}
                    <span>{format(new Date(), 'MMMM yyyy')}</span>
                  </div>
                  <span>{thisMonthDone ? `✓ Paid ${formatCurrency(paidThisMonth)}` : `Baaki: ${formatCurrency(rental.monthlyRent - paidThisMonth)}`}</span>
                </div>

                {/* Payment history */}
                {rental.payments.length > 0 && (
                  <div className="border-t border-border-default px-4 py-2 max-h-44 overflow-y-auto space-y-0">
                    {[...rental.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-border-subdued last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-text-primary text-sm">{formatCurrency(payment.amount)}</p>
                            {payment.paidFromDeposit && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-brand/10 text-brand rounded-full">Deposit se</span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-subdued font-bold mt-0.5">
                            {format(new Date(payment.date), 'dd MMM yyyy')} • {payment.month}
                            {payment.note ? ` • ${payment.note}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 ml-2">
                          <button onClick={() => openEditPay(rental.id, payment)} className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-brand rounded-lg transition-colors">
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
                            className="w-7 h-7 flex items-center justify-center text-red-500/50 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add payment buttons */}
                <div className="border-t border-border-default p-3 flex gap-2">
                  <button
                    onClick={() => openAddPay(rental, false)}
                    className="flex-1 py-2.5 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors"
                  >
                    + Online/Cash
                  </button>
                  {dStatus === 'paid' && depositRemaining > 0 && (
                    <button
                      onClick={() => openAddPay(rental, true)}
                      className="flex-1 py-2.5 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors"
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

      {/* Property Form — bottom sheet on mobile, centered modal on desktop */}
      {propForm && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closePropForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 overflow-y-auto max-h-[92vh] md:max-h-[88vh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-lg">{propEditId ? 'Property Edit' : 'Naya Property'}</h3>
                <button onClick={closePropForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Property Name</label>
                <input type="text" autoFocus value={propForm.name} onChange={e => setPropForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Basement, 1BHK Floor 1" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {PROP_TYPES.map(t => (
                    <button key={t} onClick={() => setPropForm(f => f ? { ...f, type: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        propForm.type === t ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default hover:bg-border-default')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Monthly Rent (₹)</label>
                  <input type="number" inputMode="numeric" value={propForm.monthlyRent} onChange={e => setPropForm(f => f ? { ...f, monthlyRent: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Security Deposit (₹)</label>
                  <input type="number" inputMode="numeric" value={propForm.deposit} onChange={e => setPropForm(f => f ? { ...f, deposit: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold" placeholder="0" />
                </div>
              </div>

              {Number(propForm.deposit) > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-2">Deposit Status</label>
                  <div className="flex flex-wrap gap-2">
                    {DEP_STATUSES.map(s => (
                      <button key={s.value} onClick={() => setPropForm(f => f ? { ...f, depositStatus: s.value } : f)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                          propForm.depositStatus === s.value ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default hover:bg-border-default')}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Owner Name</label>
                  <input type="text" value={propForm.ownerName} onChange={e => setPropForm(f => f ? { ...f, ownerName: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand" placeholder="Malik ji" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Owner Phone</label>
                  <input type="tel" value={propForm.ownerPhone} onChange={e => setPropForm(f => f ? { ...f, ownerPhone: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand" placeholder="9XXXXXXXXX" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Start Date</label>
                  <input type="date" value={propForm.startDate} onChange={e => setPropForm(f => f ? { ...f, startDate: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Agreement End</label>
                  <input type="date" value={propForm.agreementEndDate} onChange={e => setPropForm(f => f ? { ...f, agreementEndDate: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Agreement Notes</label>
                <input type="text" value={propForm.agreementNote} onChange={e => setPropForm(f => f ? { ...f, agreementNote: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. 11 month, 1 month notice" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePropForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveProp} disabled={!propForm.name}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {propEditId ? 'Update Karein' : 'Save Karo'}
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
                <h3 className="font-bold text-text-primary text-lg">
                  {payForm.paymentId ? 'Payment Edit' : payForm.isDepositMode ? 'Deposit se Kata' : 'Rent Payment'}
                </h3>
                <button onClick={closePayForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              {payForm.isDepositMode && (
                <div className="bg-brand/10 rounded-xl px-3 py-2 text-xs text-brand font-bold">
                  Deposit remaining: {formatCurrency(payForm.maxFromDeposit)}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={payForm.amount}
                  onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                  placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Mahina</label>
                  <input type="month" value={payForm.month}
                    onChange={e => setPayForm(f => f ? { ...f, month: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                  <input type="date" value={payForm.date}
                    onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Note (optional)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="Kuch note karna hai?" />
              </div>
              {!payForm.isDepositMode && (
                <button
                  onClick={() => setPayForm(f => f ? { ...f, paidFromDeposit: !f.paidFromDeposit } : f)}
                  className={cn('w-full py-2.5 rounded-xl text-xs font-bold border transition-all',
                    payForm.paidFromDeposit ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default hover:bg-border-default'
                  )}
                >
                  {payForm.paidFromDeposit ? '✓ Deposit se kata' : 'Deposit se katna hai?'}
                </button>
              )}
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
