import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { LabourDayEntry } from '../../types';

type DayEntryForm = {
  date: string;
  workerType: string;
  count: string;
  dailyWage: string;
  dayType: 'full' | 'half';
  paymentBy: 'self' | 'thekedar';
  notes: string;
};

const WORKER_TYPES = ['Mistri', 'Beldar', 'Plumber', 'Electrician', 'Painter', 'Carpenter', 'Other'];

export default function LabourSection() {
  const { state, setState, askConfirm } = useAppContext();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [dayForm, setDayForm] = useState<DayEntryForm | null>(null);
  const [editDayId, setEditDayId] = useState<string | null>(null);

  const openDayAdd = () => {
    setEditDayId(null);
    setDayForm({ date: today, workerType: '', count: '', dailyWage: '', dayType: 'full', paymentBy: 'self', notes: '' });
  };

  const openDayEdit = (entry: LabourDayEntry) => {
    setEditDayId(entry.id);
    setDayForm({ date: entry.date, workerType: entry.workerType, count: String(entry.count), dailyWage: String(entry.dailyWage), dayType: entry.dayType, paymentBy: entry.paymentBy, notes: entry.notes || '' });
  };

  const closeDayForm = () => { setDayForm(null); setEditDayId(null); };

  const saveDayEntry = () => {
    if (!dayForm?.workerType || !dayForm.count) return;
    const count = Number(dayForm.count) || 0;
    const dailyWage = Number(dayForm.dailyWage) || 0;
    const amount = dayForm.dayType === 'full' ? count * dailyWage : count * dailyWage * 0.5;
    const expenseNote = `${count} ${dayForm.workerType} — ${dayForm.dayType === 'half' ? 'Half day' : 'Full day'}${dayForm.notes ? ` (${dayForm.notes})` : ''}`;

    if (editDayId) {
      setState(prev => {
        const original = (prev.labourDayEntries || []).find(e => e.id === editDayId);
        const newExpId = dayForm.paymentBy === 'self' ? (original?.expenseId || genId()) : undefined;
        const updatedEntry: LabourDayEntry = { ...original!, date: dayForm.date, workerType: dayForm.workerType, count, dailyWage, dayType: dayForm.dayType, paymentBy: dayForm.paymentBy, notes: dayForm.notes || undefined, expenseId: newExpId };
        let expenses = prev.expenses.filter(e => e.id !== original?.expenseId);
        if (newExpId && amount > 0) {
          expenses = [...expenses, { id: newExpId, date: new Date(dayForm.date).toISOString(), amount, category: 'Labour', notes: expenseNote }];
        }
        return { ...prev, labourDayEntries: (prev.labourDayEntries || []).map(e => e.id === editDayId ? updatedEntry : e), expenses };
      });
    } else {
      const expId = dayForm.paymentBy === 'self' ? genId() : undefined;
      const entry: LabourDayEntry = { id: genId(), date: dayForm.date, workerType: dayForm.workerType, count, dailyWage, dayType: dayForm.dayType, paymentBy: dayForm.paymentBy, notes: dayForm.notes || undefined, expenseId: expId };
      setState(prev => {
        const next: typeof prev = { ...prev, labourDayEntries: [...(prev.labourDayEntries || []), entry] };
        if (expId && amount > 0) {
          next.expenses = [...prev.expenses, { id: expId, date: new Date(dayForm.date).toISOString(), amount, category: 'Labour', notes: expenseNote }];
        }
        return next;
      });
    }
    closeDayForm();
  };

  const deleteDayEntry = (entry: LabourDayEntry) => {
    setState(prev => ({
      ...prev,
      labourDayEntries: (prev.labourDayEntries || []).filter(e => e.id !== entry.id),
      expenses: entry.expenseId ? prev.expenses.filter(e => e.id !== entry.expenseId) : prev.expenses,
    }));
  };

  const dayEntries = [...(state.labourDayEntries || [])].sort((a, b) => b.date.localeCompare(a.date));
  const groupedByDate: Record<string, LabourDayEntry[]> = {};
  dayEntries.forEach(e => { (groupedByDate[e.date] = groupedByDate[e.date] || []).push(e); });

  const entryAmt = (e: LabourDayEntry) => e.dayType === 'full' ? e.count * e.dailyWage : e.count * e.dailyWage * 0.5;
  const totalSelf = dayEntries.filter(e => e.paymentBy === 'self').reduce((s, e) => s + entryAmt(e), 0);
  const totalTheka = dayEntries.filter(e => e.paymentBy === 'thekedar').reduce((s, e) => s + entryAmt(e), 0);

  // true = expanded, false/absent = collapsed (default collapsed)
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const toggleDate = (d: string) => setExpandedDates(prev => ({ ...prev, [d]: !prev[d] }));
  const dates = Object.keys(groupedByDate);
  const anyExpanded = dates.some(d => expandedDates[d]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    dates.forEach(d => { next[d] = !anyExpanded; });
    setExpandedDates(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-heading text-title font-bold text-text-primary">Mazdoor Hisaab</h3>
          <p className="text-caption text-text-subdued mt-0.5">Din ke hisab se mazdoor log karo</p>
        </div>
        <button onClick={openDayAdd} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-body-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add
        </button>
      </div>

      {dayEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Mujhe Dena Hai</p>
            <p className="text-title font-bold text-sky-600 dark:text-sky-400 mt-0.5">{formatCurrency(totalSelf)}</p>
            <p className="text-[10px] text-sky-600/70 dark:text-sky-500 mt-0.5">Mere kharche mein</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Theke Se</p>
            <p className="text-title font-bold text-violet-600 dark:text-violet-400 mt-0.5">{formatCurrency(totalTheka)}</p>
            <p className="text-[10px] text-violet-600/70 dark:text-violet-500 mt-0.5">Thekedar dega</p>
          </div>
        </div>
      )}

      {dayEntries.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CalendarDays size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-body-sm">Abhi tak koi record nahi</p>
          <button onClick={openDayAdd} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-body-sm font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
            + Aaj ka hisaab add karein
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dates.length > 1 && (
            <button onClick={toggleAll} className="text-caption font-bold text-brand hover:opacity-70 transition-opacity self-end ml-auto block">
              {anyExpanded ? 'Collapse All ↑' : 'Expand All ↓'}
            </button>
          )}
          {Object.entries(groupedByDate).map(([date, entries]) => {
            const dayTotal = entries.reduce((sum, e) => sum + (e.dayType === 'full' ? e.count * e.dailyWage : e.count * e.dailyWage * 0.5), 0);
            const selfTotal = entries.filter(e => e.paymentBy === 'self').reduce((sum, e) => sum + (e.dayType === 'full' ? e.count * e.dailyWage : e.count * e.dailyWage * 0.5), 0);
            const totalWorkers = entries.reduce((sum, e) => sum + e.count, 0);
            const isExpanded = expandedDates[date];

            return (
              <div key={date} className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
                <button onClick={() => toggleDate(date)} className="w-full flex items-center justify-between p-4 hover:bg-surface-subdued transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                      <CalendarDays size={18} className="text-brand" />
                    </div>
                    <div className="text-left">
                      <p className="font-heading text-title font-bold text-text-primary">
                        {format(parseISO(date), 'dd MMM yyyy')}
                        {date === today && <span className="ml-2 text-caption font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">Aaj</span>}
                      </p>
                      <p className="text-caption text-text-subdued">{totalWorkers} workers · {formatCurrency(selfTotal)} mujhe dena</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-title text-text-primary">{formatCurrency(dayTotal)}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border-default divide-y divide-border-default">
                    {entries.map(entry => {
                      const amt = entry.dayType === 'full' ? entry.count * entry.dailyWage : entry.count * entry.dailyWage * 0.5;
                      return (
                        <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="text-center w-10">
                              <p className="text-title font-bold text-text-primary leading-none">{entry.count}</p>
                              <p className="text-[10px] text-text-subdued font-bold uppercase">log</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-body-sm font-bold text-text-primary">{entry.workerType}</p>
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', entry.dayType === 'half' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}>
                                  {entry.dayType === 'half' ? '½ Half' : 'Full'}
                                </span>
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', entry.paymentBy === 'thekedar' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400')}>
                                  {entry.paymentBy === 'thekedar' ? 'Theke Me' : 'Mujhe'}
                                </span>
                              </div>
                              {entry.notes && <p className="text-caption text-text-subdued mt-0.5">{entry.notes}</p>}
                              <p className="text-caption text-text-subdued">{formatCurrency(entry.dailyWage)}/person</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-body-sm text-text-primary">{formatCurrency(amt)}</p>
                            <button onClick={() => openDayEdit(entry)} className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => askConfirm('Ye entry delete kar dein?', () => deleteDayEntry(entry))} className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {dayForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closeDayForm}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{editDayId ? 'Entry Edit Karein' : 'Din Ka Hisaab'}</h3>
                <button onClick={closeDayForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Tarikh</label>
                <input type="date" value={dayForm.date} onChange={e => setDayForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand" />
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Mazdoor Type</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {WORKER_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setDayForm(f => f ? { ...f, workerType: t } : f)}
                      className={cn('px-3 py-1.5 rounded-xl text-body-sm font-bold border transition-all',
                        dayForm.workerType === t ? 'bg-brand text-surface border-brand' : 'bg-surface-subdued text-text-secondary border-border-default hover:border-brand/50'
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
                <input type="text" value={dayForm.workerType} onChange={e => setDayForm(f => f ? { ...f, workerType: e.target.value } : f)}
                  className="w-full p-3 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm"
                  placeholder="Ya khud likho..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Kitne Aaye</label>
                  <input type="number" inputMode="numeric" value={dayForm.count} onChange={e => setDayForm(f => f ? { ...f, count: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Rate/Person (₹)</label>
                  <input type="number" inputMode="numeric" value={dayForm.dailyWage} onChange={e => setDayForm(f => f ? { ...f, dailyWage: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                    placeholder="0" />
                </div>
              </div>

              {Number(dayForm.count) > 0 && Number(dayForm.dailyWage) > 0 && (
                <div className="bg-brand/10 rounded-2xl p-3.5 flex items-center justify-between">
                  <p className="text-body-sm font-bold text-brand">Kul Raqam</p>
                  <p className="text-title font-bold text-brand">
                    {formatCurrency(dayForm.dayType === 'full' ? Number(dayForm.count) * Number(dayForm.dailyWage) : Number(dayForm.count) * Number(dayForm.dailyWage) * 0.5)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDayForm(f => f ? { ...f, dayType: 'full' } : f)}
                  className={cn('py-2.5 rounded-xl text-body-sm font-bold border-2 transition-all', dayForm.dayType === 'full' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500' : 'bg-surface-subdued text-text-secondary border-transparent hover:border-border-default')}>
                  ✓ Full Day
                </button>
                <button type="button" onClick={() => setDayForm(f => f ? { ...f, dayType: 'half' } : f)}
                  className={cn('py-2.5 rounded-xl text-body-sm font-bold border-2 transition-all', dayForm.dayType === 'half' ? 'bg-amber-500/15 text-amber-500 border-amber-500' : 'bg-surface-subdued text-text-secondary border-transparent hover:border-border-default')}>
                  ½ Half Day
                </button>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-2">Paisa Kaun Dega?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setDayForm(f => f ? { ...f, paymentBy: 'self' } : f)}
                    className={cn('py-3 rounded-2xl text-body-sm font-bold border-2 transition-all text-center', dayForm.paymentBy === 'self' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500' : 'bg-surface-subdued text-text-secondary border-transparent hover:border-border-default')}>
                    💸 Mujhe Dena Hai
                    <p className="text-[10px] font-normal opacity-70 mt-0.5">Kharche mein jodega</p>
                  </button>
                  <button type="button" onClick={() => setDayForm(f => f ? { ...f, paymentBy: 'thekedar' } : f)}
                    className={cn('py-3 rounded-2xl text-body-sm font-bold border-2 transition-all text-center', dayForm.paymentBy === 'thekedar' ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500' : 'bg-surface-subdued text-text-secondary border-transparent hover:border-border-default')}>
                    🤝 Theke Me Included
                    <p className="text-[10px] font-normal opacity-70 mt-0.5">Thekedar dega, mera nahi</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={dayForm.notes} onChange={e => setDayForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Foundation ka kaam" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeDayForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveDayEntry} disabled={!dayForm.workerType || !dayForm.count}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {editDayId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
