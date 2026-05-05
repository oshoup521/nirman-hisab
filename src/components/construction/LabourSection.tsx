import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users, X, CheckCircle, Clock } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Labour } from '../../types';

type LabourForm = { type: string; dailyWage: string };

export default function LabourSection() {
  const { state, setState, askConfirm } = useAppContext();
  const [form, setForm] = useState<LabourForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openAdd = () => { setEditId(null); setForm({ type: '', dailyWage: '' }); };
  const openEdit = (l: Labour) => { setEditId(l.id); setForm({ type: l.type, dailyWage: String(l.dailyWage) }); };
  const closeForm = () => { setForm(null); setEditId(null); };

  const save = () => {
    if (!form?.type) return;
    const dailyWage = Number(form.dailyWage) || 0;
    if (editId) {
      setState(prev => ({ ...prev, labours: prev.labours.map(l => l.id === editId ? { ...l, type: form.type, dailyWage } : l) }));
    } else {
      setState(prev => ({ ...prev, labours: [...prev.labours, { id: genId(), type: form.type, dailyWage, attendance: {} }] }));
    }
    closeForm();
  };

  const markAttendance = (labour: Labour, status: 'present' | 'half') => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const amount = status === 'present' ? labour.dailyWage : labour.dailyWage / 2;
    setState(prev => ({
      ...prev,
      labours: prev.labours.map(l =>
        l.id === labour.id ? { ...l, attendance: { ...l.attendance, [dateStr]: status } } : l
      ),
      expenses: [...prev.expenses, {
        id: genId(), date: new Date().toISOString(), amount, category: 'Labour',
        notes: `${status === 'half' ? 'Half day' : 'Full day'} — ${labour.type}`,
      }],
    }));
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = startOfMonth(new Date());

  const getMonthStats = (labour: Labour) => {
    const entries = Object.entries(labour.attendance).filter(([d]) => new Date(d) >= monthStart);
    const fullDays = entries.filter(([, v]) => v === 'present').length;
    const halfDays = entries.filter(([, v]) => v === 'half').length;
    return {
      fullDays, halfDays,
      wages: fullDays * labour.dailyWage + halfDays * (labour.dailyWage / 2),
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Mazdoor & Theka</h3>
          <p className="text-xs text-text-subdued mt-0.5">{state.labours.length} workers</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {state.labours.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-sm">Koi mazdoor nahi abhi tak</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
            + Mazdoor Add Karein
          </button>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {state.labours.map(labour => {
            const { fullDays, halfDays, wages } = getMonthStats(labour);
            const todayStatus = labour.attendance[today];
            return (
              <div key={labour.id} className="bg-surface rounded-2xl border border-border-default shadow-sm p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-text-primary">{labour.type}</h4>
                    <p className="text-xs text-text-subdued mt-0.5">{formatCurrency(labour.dailyWage)}/day</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {todayStatus && (
                      <span className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-full',
                        todayStatus === 'present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                      )}>
                        {todayStatus === 'present' ? '✓ Aaj Full' : '½ Aaj Half'}
                      </span>
                    )}
                    <button onClick={() => openEdit(labour)} className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => askConfirm(`"${labour.type}" ko delete kar dein?`, () =>
                        setState(prev => ({ ...prev, labours: prev.labours.filter(l => l.id !== labour.id) }))
                      )}
                      className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* This month mini stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{fullDays}</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase mt-1">Full Days</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-2.5 text-center">
                    <p className="text-xl font-bold text-amber-500 leading-none">{halfDays}</p>
                    <p className="text-[9px] text-amber-500 font-bold uppercase mt-1">Half Days</p>
                  </div>
                  <div className="bg-brand/10 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-brand leading-tight">{formatCurrency(wages)}</p>
                    <p className="text-[9px] text-brand font-bold uppercase mt-1">This Month</p>
                  </div>
                </div>

                {/* Attendance buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => markAttendance(labour, 'present')}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all',
                      todayStatus === 'present'
                        ? 'bg-emerald-600 text-surface border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    )}
                  >
                    <CheckCircle size={14} /> Present Today
                  </button>
                  <button
                    onClick={() => markAttendance(labour, 'half')}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all',
                      todayStatus === 'half'
                        ? 'bg-amber-500 text-surface border-amber-500 shadow-sm shadow-amber-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                    )}
                  >
                    <Clock size={14} /> Half Day
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form — bottom sheet on mobile, centered modal on desktop */}
      {form && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-lg">{editId ? 'Mazdoor Edit' : 'Naya Mazdoor'}</h3>
                <button onClick={closeForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Labour Type</label>
                <input type="text" autoFocus value={form.type} onChange={e => setForm(f => f ? { ...f, type: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Mistri, Beldar, Plumber" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-subdued uppercase block mb-1.5">Daily Wage (₹)</label>
                <input type="number" inputMode="numeric" value={form.dailyWage} onChange={e => setForm(f => f ? { ...f, dailyWage: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-xl"
                  placeholder="0" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={save} disabled={!form.type}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {editId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
