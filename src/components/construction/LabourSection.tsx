import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, CalendarDays, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
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

type BulkRow = {
  tempId: string;
  workerType: string;
  count: string;
  dailyWage: string;
  dayType: 'full' | 'half';
  paymentBy: 'self' | 'thekedar';
  notes: string;
};

const WORKER_TYPES = ['Mistri', 'Beldar', 'Plumber', 'Electrician', 'Painter', 'Carpenter', 'Other'];

const emptyRow = (): BulkRow => ({
  tempId: genId(),
  workerType: '',
  count: '',
  dailyWage: '',
  dayType: 'full',
  paymentBy: 'self',
  notes: '',
});

const rowAmt = (row: BulkRow) => {
  if (!row.count || !row.dailyWage) return 0;
  const base = Number(row.count) * Number(row.dailyWage);
  return row.dayType === 'full' ? base : base * 0.5;
};

export default function LabourSection() {
  const { state, setState, askConfirm, isViewer } = useAppContext();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Single-entry edit form (for pencil icon on existing entries)
  const [dayForm, setDayForm] = useState<DayEntryForm | null>(null);
  const [editDayId, setEditDayId] = useState<string | null>(null);

  // Bulk add form (for the Add button)
  const [bulkForm, setBulkForm] = useState<{ date: string; rows: BulkRow[] } | null>(null);

  // ─── Edit form handlers ───────────────────────────────────────────────────
  const openDayEdit = (entry: LabourDayEntry) => {
    setEditDayId(entry.id);
    setDayForm({ date: entry.date, workerType: entry.workerType, count: String(entry.count), dailyWage: String(entry.dailyWage), dayType: entry.dayType, paymentBy: entry.paymentBy, notes: entry.notes || '' });
  };

  const closeDayForm = () => { setDayForm(null); setEditDayId(null); };

  const saveDayEdit = () => {
    if (!dayForm?.workerType || !dayForm.count || !editDayId) return;
    const count = Number(dayForm.count) || 0;
    const dailyWage = Number(dayForm.dailyWage) || 0;
    const amount = dayForm.dayType === 'full' ? count * dailyWage : count * dailyWage * 0.5;
    const expenseNote = `${count} ${dayForm.workerType} — ${dayForm.dayType === 'half' ? 'Half day' : 'Full day'}${dayForm.notes ? ` (${dayForm.notes})` : ''}`;

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
    closeDayForm();
  };

  const deleteDayEntry = (entry: LabourDayEntry) => {
    setState(prev => ({
      ...prev,
      labourDayEntries: (prev.labourDayEntries || []).filter(e => e.id !== entry.id),
      expenses: entry.expenseId ? prev.expenses.filter(e => e.id !== entry.expenseId) : prev.expenses,
    }));
  };

  // ─── Bulk add form handlers ───────────────────────────────────────────────
  const openBulkAdd = () => setBulkForm({ date: today, rows: [emptyRow()] });
  const closeBulkForm = () => setBulkForm(null);

  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) => {
    setBulkForm(prev => {
      if (!prev) return prev;
      return { ...prev, rows: prev.rows.map((r, i) => i === idx ? { ...r, [field]: value } : r) };
    });
  };

  const addBulkRow = () => setBulkForm(prev => prev ? { ...prev, rows: [...prev.rows, emptyRow()] } : prev);

  const removeBulkRow = (idx: number) => {
    setBulkForm(prev => {
      if (!prev || prev.rows.length <= 1) return prev;
      return { ...prev, rows: prev.rows.filter((_, i) => i !== idx) };
    });
  };

  const copyFromPrevDay = () => {
    if (!bulkForm) return;
    const prevDate = format(subDays(new Date(bulkForm.date + 'T00:00:00'), 1), 'yyyy-MM-dd');
    const prevEntries = (state.labourDayEntries || []).filter(e => e.date === prevDate);
    if (prevEntries.length === 0) return;
    setBulkForm(prev => prev ? {
      ...prev,
      rows: prevEntries.map(e => ({
        tempId: genId(),
        workerType: e.workerType,
        count: String(e.count),
        dailyWage: String(e.dailyWage),
        dayType: e.dayType,
        paymentBy: e.paymentBy,
        notes: e.notes || '',
      }))
    } : prev);
  };

  const saveBulkForm = () => {
    if (!bulkForm) return;
    const validRows = bulkForm.rows.filter(r => r.workerType && r.count);
    if (validRows.length === 0) return;

    setState(prev => {
      let newEntries = [...(prev.labourDayEntries || [])];
      let newExpenses = [...prev.expenses];

      for (const row of validRows) {
        const count = Number(row.count) || 0;
        const dailyWage = Number(row.dailyWage) || 0;
        const amount = row.dayType === 'full' ? count * dailyWage : count * dailyWage * 0.5;
        const expenseNote = `${count} ${row.workerType} — ${row.dayType === 'half' ? 'Half day' : 'Full day'}${row.notes ? ` (${row.notes})` : ''}`;
        const expId = row.paymentBy === 'self' ? genId() : undefined;

        newEntries.push({
          id: genId(),
          date: bulkForm.date,
          workerType: row.workerType,
          count,
          dailyWage,
          dayType: row.dayType,
          paymentBy: row.paymentBy,
          notes: row.notes || undefined,
          expenseId: expId,
        });

        if (expId && amount > 0) {
          newExpenses.push({ id: expId, date: new Date(bulkForm.date).toISOString(), amount, category: 'Labour', notes: expenseNote });
        }
      }

      return { ...prev, labourDayEntries: newEntries, expenses: newExpenses };
    });

    closeBulkForm();
  };

  // ─── Display logic ────────────────────────────────────────────────────────
  const dayEntries = [...(state.labourDayEntries || [])].sort((a, b) => b.date.localeCompare(a.date));
  const groupedByDate: Record<string, LabourDayEntry[]> = {};
  dayEntries.forEach(e => { (groupedByDate[e.date] = groupedByDate[e.date] || []).push(e); });

  const entryAmt = (e: LabourDayEntry) => e.dayType === 'full' ? e.count * e.dailyWage : e.count * e.dailyWage * 0.5;
  const totalSelf = dayEntries.filter(e => e.paymentBy === 'self').reduce((s, e) => s + entryAmt(e), 0);
  const totalTheka = dayEntries.filter(e => e.paymentBy === 'thekedar').reduce((s, e) => s + entryAmt(e), 0);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const toggleDate = (d: string) => setExpandedDates(prev => ({ ...prev, [d]: !prev[d] }));
  const dates = Object.keys(groupedByDate);
  const anyExpanded = dates.some(d => expandedDates[d]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    dates.forEach(d => { next[d] = !anyExpanded; });
    setExpandedDates(next);
  };

  // Bulk form live totals
  const bulkSelf = bulkForm?.rows.reduce((s, r) => r.paymentBy === 'self' ? s + rowAmt(r) : s, 0) ?? 0;
  const bulkTheka = bulkForm?.rows.reduce((s, r) => r.paymentBy === 'thekedar' ? s + rowAmt(r) : s, 0) ?? 0;

  const hasPrevDay = bulkForm
    ? (state.labourDayEntries || []).some(e => {
        const prev = format(subDays(new Date(bulkForm.date + 'T00:00:00'), 1), 'yyyy-MM-dd');
        return e.date === prev;
      })
    : false;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-heading text-title font-bold text-text-primary">Mazdoor Hisaab</h3>
          <p className="text-caption text-text-subdued mt-0.5">Din ke hisab se mazdoor log karo</p>
        </div>
        {!isViewer && (
          <button onClick={openBulkAdd} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-body-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity">
            <Plus size={16} /> Add
          </button>
        )}
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
          {!isViewer && (
            <button onClick={openBulkAdd} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-body-sm font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
              + Aaj ka hisaab add karein
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {dates.length > 1 && (
            <button onClick={toggleAll} className="text-caption font-bold text-brand hover:opacity-70 transition-opacity self-end ml-auto block">
              {anyExpanded ? 'Collapse All ↑' : 'Expand All ↓'}
            </button>
          )}
          {Object.entries(groupedByDate).map(([date, entries]) => {
            const dayTotal = entries.reduce((sum, e) => sum + entryAmt(e), 0);
            const selfTotal = entries.filter(e => e.paymentBy === 'self').reduce((sum, e) => sum + entryAmt(e), 0);
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
                      const amt = entryAmt(entry);
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
                            {!isViewer && (
                              <>
                                <button onClick={() => openDayEdit(entry)} className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => askConfirm('Ye entry delete kar dein?', () => deleteDayEntry(entry))} className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
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

      {/* ── Bulk Add Form ─────────────────────────────────────────────────── */}
      {bulkForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closeBulkForm}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 flex flex-col"
            style={{ maxHeight: '92dvh' }}
          >
            {/* Header */}
            <div className="p-4 pb-3 shrink-0">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto mb-3 md:hidden" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-title font-bold text-text-primary">Din Ka Hisaab</h3>
                <button onClick={closeBulkForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Date + copy button */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={bulkForm.date}
                  onChange={e => setBulkForm(prev => prev ? { ...prev, date: e.target.value } : prev)}
                  className="flex-1 p-3 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm font-bold"
                />
                {hasPrevDay && (
                  <button
                    onClick={copyFromPrevDay}
                    className="flex items-center gap-1.5 px-3 py-3 bg-surface-subdued text-text-secondary rounded-2xl text-caption font-bold hover:bg-border-default transition-colors shrink-0 border border-border-default"
                  >
                    <Copy size={13} />
                    Kal wala
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable worker rows */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 min-h-0">
              {bulkForm.rows.map((row, idx) => {
                const amt = rowAmt(row);
                return (
                  <div key={row.tempId} className="bg-surface-subdued rounded-2xl p-3 space-y-2.5">
                    {/* Type chips + delete */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {WORKER_TYPES.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateBulkRow(idx, 'workerType', t)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-caption font-bold border transition-all',
                              row.workerType === t
                                ? 'bg-brand text-surface border-brand'
                                : 'bg-surface text-text-secondary border-border-default hover:border-brand/40'
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      {bulkForm.rows.length > 1 && (
                        <button
                          onClick={() => removeBulkRow(idx)}
                          className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors shrink-0 mt-0.5"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Custom type input */}
                    {!WORKER_TYPES.includes(row.workerType) && (
                      <input
                        type="text"
                        value={row.workerType}
                        onChange={e => updateBulkRow(idx, 'workerType', e.target.value)}
                        placeholder="Type ka naam likhein..."
                        className="w-full p-2.5 bg-surface text-text-primary rounded-xl text-body-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    )}

                    {/* Count stepper + Rate */}
                    <div className="flex gap-2">
                      <div className="flex items-center bg-surface rounded-xl border border-border-default flex-1">
                        <button
                          onClick={() => updateBulkRow(idx, 'count', String(Math.max(0, Number(row.count || 0) - 1)))}
                          className="w-10 h-10 flex items-center justify-center font-bold text-title text-text-primary hover:bg-surface-subdued rounded-l-xl transition-colors"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center font-bold text-title text-text-primary select-none">
                          {row.count || '0'}
                        </span>
                        <button
                          onClick={() => updateBulkRow(idx, 'count', String(Number(row.count || 0) + 1))}
                          className="w-10 h-10 flex items-center justify-center font-bold text-title text-brand hover:bg-brand/10 rounded-r-xl transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center bg-surface rounded-xl border border-border-default flex-1 px-3 gap-1">
                        <span className="text-text-subdued text-body-sm shrink-0">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={row.dailyWage}
                          onChange={e => updateBulkRow(idx, 'dailyWage', e.target.value)}
                          placeholder="Rate"
                          className="flex-1 bg-transparent text-text-primary font-bold text-body-sm focus:outline-none w-0 min-w-0"
                        />
                        <span className="text-text-subdued text-caption shrink-0">/din</span>
                      </div>
                    </div>

                    {/* Full/Half + Self/Theka */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex rounded-xl overflow-hidden border border-border-default">
                        <button
                          onClick={() => updateBulkRow(idx, 'dayType', 'full')}
                          className={cn('flex-1 py-2 text-caption font-bold transition-colors',
                            row.dayType === 'full' ? 'bg-emerald-500 text-white' : 'bg-surface text-text-secondary hover:bg-surface-subdued'
                          )}
                        >
                          Full
                        </button>
                        <button
                          onClick={() => updateBulkRow(idx, 'dayType', 'half')}
                          className={cn('flex-1 py-2 text-caption font-bold transition-colors',
                            row.dayType === 'half' ? 'bg-amber-500 text-white' : 'bg-surface text-text-secondary hover:bg-surface-subdued'
                          )}
                        >
                          ½ Half
                        </button>
                      </div>
                      <div className="flex rounded-xl overflow-hidden border border-border-default">
                        <button
                          onClick={() => updateBulkRow(idx, 'paymentBy', 'self')}
                          className={cn('flex-1 py-2 text-caption font-bold transition-colors',
                            row.paymentBy === 'self' ? 'bg-sky-500 text-white' : 'bg-surface text-text-secondary hover:bg-surface-subdued'
                          )}
                        >
                          Self
                        </button>
                        <button
                          onClick={() => updateBulkRow(idx, 'paymentBy', 'thekedar')}
                          className={cn('flex-1 py-2 text-caption font-bold transition-colors',
                            row.paymentBy === 'thekedar' ? 'bg-violet-500 text-white' : 'bg-surface text-text-secondary hover:bg-surface-subdued'
                          )}
                        >
                          Theka
                        </button>
                      </div>
                    </div>

                    {/* Row total */}
                    {amt > 0 && (
                      <p className="text-right text-brand font-bold text-body-sm">= {formatCurrency(amt)}</p>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addBulkRow}
                className="w-full py-3 border-2 border-dashed border-border-default rounded-2xl text-body-sm font-bold text-text-secondary hover:border-brand/40 hover:text-brand transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={15} /> Worker Type Jodo
              </button>
            </div>

            {/* Sticky footer */}
            <div className="p-4 pt-3 border-t border-border-default shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {(bulkSelf > 0 || bulkTheka > 0) && (
                <div className="flex gap-2 mb-3">
                  {bulkSelf > 0 && (
                    <div className="flex-1 bg-sky-500/10 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Self</p>
                      <p className="text-body-sm font-bold text-sky-600 dark:text-sky-400">{formatCurrency(bulkSelf)}</p>
                    </div>
                  )}
                  {bulkTheka > 0 && (
                    <div className="flex-1 bg-violet-500/10 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">Theka</p>
                      <p className="text-body-sm font-bold text-violet-600 dark:text-violet-400">{formatCurrency(bulkTheka)}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={closeBulkForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveBulkForm}
                  disabled={bulkForm.rows.every(r => !r.workerType || !r.count)}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity"
                >
                  Save Karo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Single Entry Edit Form ─────────────────────────────────────────── */}
      {dayForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closeDayForm}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">Entry Edit Karein</h3>
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
                <button onClick={saveDayEdit} disabled={!dayForm.workerType || !dayForm.count}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  Update Karein
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
