import React, { useState, useEffect } from 'react';
import { Download, Package, Clock, Home, Hammer, Plus, Pencil, Trash2, X, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { downloadCSV } from '../../utils/csv';
import { useAppContext } from '../../context/AppContext';
import { Material } from '../../types';

type MiscForm = { amount: string; category: string; notes: string; date: string };
const blankMisc = (): MiscForm => ({ amount: '', category: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });

export default function DashboardTab() {
  const {
    state, setState, calcs, askConfirm,
    setActiveTab, setSubTab,
    showAllMisc, setShowAllMisc,
    shareOnWhatsApp,
  } = useAppContext();

  const {
    totalKharcha, masterBudget, masterBurnRate, masterRemaining,
    totalSpent, demolitionThekaCost, malwaCost, totalCashRentPaid,
    depositPaid, totalMisc, totalRentPaid, totalRecovery,
    currentMonthRent, depositPending,
  } = calcs;

  const [miscForm, setMiscForm] = useState<MiscForm | null>(null);
  const [miscEditId, setMiscEditId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = (showAllMisc || !!miscForm) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showAllMisc, miscForm]);

  const openAddMisc = () => { setMiscEditId(null); setMiscForm(blankMisc()); };
  const openEditMisc = (e: { id: string; amount: number; category: string; notes: string; date: string }) => {
    setMiscEditId(e.id);
    setMiscForm({ amount: String(e.amount), category: e.category, notes: e.notes, date: format(new Date(e.date), 'yyyy-MM-dd') });
  };
  const closeMiscForm = () => { setMiscForm(null); setMiscEditId(null); };

  const saveMisc = () => {
    if (!miscForm) return;
    const amount = Number(miscForm.amount);
    if (!amount) return;
    const entry = { id: miscEditId || genId(), date: new Date(miscForm.date).toISOString(), amount, category: miscForm.category || 'Misc', notes: miscForm.notes.trim() };
    setState(prev => ({
      ...prev,
      miscExpenses: miscEditId
        ? (prev.miscExpenses || []).map(x => x.id === miscEditId ? entry : x)
        : [...(prev.miscExpenses || []), entry],
    }));
    closeMiscForm();
  };

  const deleteMisc = (id: string) =>
    askConfirm('Is misc expense ko delete kar dein?', () =>
      setState(prev => ({ ...prev, miscExpenses: (prev.miscExpenses || []).filter(x => x.id !== id) }))
    );

  const sortedMisc = [...(state.miscExpenses || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const demolitionNet = totalRecovery - malwaCost - demolitionThekaCost;
  const budgetStatus = masterBurnRate > 90 ? 'danger' : masterBurnRate > 70 ? 'warning' : 'good';

  const breakdownRows = [
    { label: 'Construction', value: totalSpent, color: 'bg-indigo-500' },
    { label: 'Tod-Phod Theka', value: demolitionThekaCost, color: 'bg-orange-500' },
    { label: 'Malwa Disposal', value: malwaCost, color: 'bg-amber-500' },
    { label: 'Kiraya', value: totalCashRentPaid, color: 'bg-violet-500' },
    { label: 'Security Deposit', value: depositPaid, color: 'bg-blue-400' },
    { label: 'Miscellaneous', value: totalMisc, color: 'bg-slate-400 dark:bg-slate-500' },
  ].filter(r => r.value > 0);

  const renderMiscRow = (e: typeof sortedMisc[0]) => (
    <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-border-subdued last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-primary text-body-sm truncate">{e.category}</p>
        <p className="text-caption text-text-subdued font-bold">
          {format(new Date(e.date), 'dd MMM yyyy')}{e.notes ? ` • ${e.notes}` : ''}
        </p>
      </div>
      <p className="font-mono font-bold text-text-primary text-body-sm shrink-0">{formatCurrency(e.amount)}</p>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={() => openEditMisc(e)} className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-subdued transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={() => deleteMisc(e.id)} className="w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  const renderMiscTableRow = (e: typeof sortedMisc[0]) => (
    <tr key={e.id} className="border-b border-border-subdued last:border-0 hover:bg-surface-subdued/60 transition-colors">
      <td className="py-2.5 pr-3 text-caption text-text-secondary font-bold whitespace-nowrap">
        {format(new Date(e.date), 'dd MMM yyyy')}
      </td>
      <td className="py-2.5 pr-3 text-body-sm font-bold text-text-primary">{e.category}</td>
      <td className="py-2.5 pr-3 text-caption text-text-secondary max-w-[280px] truncate">{e.notes || '—'}</td>
      <td className="py-2.5 pr-3 text-body-sm font-mono font-bold text-text-primary text-right whitespace-nowrap">
        {formatCurrency(e.amount)}
      </td>
      <td className="py-2.5 text-right whitespace-nowrap">
        <button onClick={() => openEditMisc(e)} className="w-7 h-7 inline-flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-subdued transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={() => deleteMisc(e.id)} className="w-7 h-7 inline-flex items-center justify-center text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 ml-0.5 transition-colors">
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center pt-1 md:hidden">
        <div className="flex items-center gap-3">
          <img src="/pwa-64x64.png" alt="" className="w-10 h-10 rounded-2xl" onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <h1 className="font-heading text-title-lg font-bold text-text-primary leading-tight">Nirman Hisaab</h1>
            <p className="text-text-subdued text-caption font-medium">{state.project?.name || 'Project Overview'}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={shareOnWhatsApp} className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </button>
          <button onClick={() => downloadCSV(state)} className="w-9 h-9 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary">
            <Download size={18} />
          </button>
        </div>
      </header>

      {/* Desktop header — TopNav already shows project name; this row only adds actions */}
      <header className="hidden md:flex justify-between items-center">
        <div>
          <h1 className="font-heading text-title-lg font-black text-text-primary leading-tight">Hisaab Overview</h1>
          <p className="text-text-subdued text-body-sm font-medium">{state.project?.name || 'Project Overview'}{state.project?.location ? ` • ${state.project.location}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={shareOnWhatsApp} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-body-sm font-bold hover:bg-emerald-500/20 transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            Share
          </button>
          <button onClick={() => downloadCSV(state)} className="flex items-center gap-2 px-3 py-2 bg-surface-subdued text-text-primary rounded-xl text-body-sm font-bold hover:bg-border-default transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      {/* Master Budget Hero + Kharcha Breakdown — side by side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-5 lg:space-y-0">
      {/* Master Budget Hero */}
      {masterBudget > 0 ? (
        <div className={cn(
          'rounded-3xl p-5',
          budgetStatus === 'danger' ? 'bg-gradient-to-br from-red-500 to-rose-600'
            : budgetStatus === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-500'
            : 'bg-gradient-to-br from-indigo-600 to-violet-600'
        )}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/70 text-caption font-bold uppercase tracking-wide">Master Budget</p>
              <p className="text-white text-display font-bold mt-0.5 leading-none">{formatCurrency(masterBudget)}</p>
            </div>
            <span className={cn(
              'px-2.5 py-1 rounded-xl text-caption font-bold',
              budgetStatus === 'danger' ? 'bg-red-400/40 text-red-100'
                : budgetStatus === 'warning' ? 'bg-amber-400/40 text-amber-100'
                : 'bg-white/20 text-white'
            )}>
              {masterBurnRate.toFixed(0)}% used
            </span>
          </div>
          <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, masterBurnRate)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/15 rounded-xl px-3 py-2">
              <p className="text-white/60 text-caption font-bold uppercase">Kharcha</p>
              <p className="text-white font-bold text-title leading-tight">{formatCurrency(totalKharcha)}</p>
            </div>
            <div className="bg-black/15 rounded-xl px-3 py-2">
              <p className="text-white/60 text-caption font-bold uppercase">Bacha Hua</p>
              <p className={cn('font-bold text-title leading-tight', masterRemaining < 0 ? 'text-red-200' : 'text-white')}>
                {formatCurrency(masterRemaining)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-subdued border-2 border-dashed border-border-default p-5 rounded-3xl text-center">
          <Wallet size={28} className="text-text-secondary mx-auto mb-2" />
          <p className="text-text-secondary text-body-sm font-bold">Master budget set nahi hai</p>
          <button onClick={() => setActiveTab('settings')} className="mt-2 text-caption text-brand font-bold">
            Settings mein set karo →
          </button>
        </div>
      )}

      {/* Kharcha Breakdown */}
      {breakdownRows.length > 0 && (
        <div className="bg-surface p-5 rounded-3xl border border-border-default shadow-sm space-y-3">
          <h3 className="font-heading text-title font-bold text-text-primary">Kharcha Breakdown</h3>
          <div className="space-y-3">
            {breakdownRows.map(row => (
              <div key={row.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-body-sm text-text-secondary font-medium">{row.label}</span>
                  <span className="text-body-sm font-bold text-text-primary">{formatCurrency(row.value)}</span>
                </div>
                <div className="w-full bg-surface-subdued h-1.5 rounded-full overflow-hidden border border-border-subdued">
                  <div
                    className={cn('h-full rounded-full transition-all', row.color)}
                    style={{ width: masterBudget > 0 ? `${Math.min(100, (row.value / masterBudget) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
            {(totalRentPaid - totalCashRentPaid) > 0 && (
              <div className="bg-violet-500/10 rounded-xl px-3 py-2 flex justify-between items-center">
                <span className="text-caption text-violet-600 dark:text-violet-400 font-bold">+ Deposit Se Kata Rent</span>
                <span className="text-caption font-bold text-violet-600 dark:text-violet-400">{formatCurrency(totalRentPaid - totalCashRentPaid)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border-subdued flex justify-between items-center">
              <span className="text-body-sm font-bold text-text-secondary uppercase">Total</span>
              <span className="font-bold text-text-primary">{formatCurrency(totalKharcha)}</span>
            </div>
          </div>
        </div>
      )}
      </div>{/* end hero + breakdown grid */}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => { setActiveTab('construction'); setSubTab('materials'); }}
          className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm text-left active:scale-95 hover:shadow-md transition-all"
        >
          <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center mb-2">
            <Package size={18} className="text-brand" />
          </div>
          <p className="text-title-lg font-bold text-text-primary leading-none">
            {state.materials.filter((m: Material) => m.purchased - m.used <= m.minStock).length}
          </p>
          <p className="text-caption font-bold text-text-subdued uppercase mt-1">Low Stock Items</p>
        </button>
        <button
          onClick={() => { setActiveTab('construction'); setSubTab('timeline'); }}
          className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm text-left active:scale-95 hover:shadow-md transition-all"
        >
          <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center mb-2">
            <Clock size={18} className="text-brand" />
          </div>
          <p className="text-title-lg font-bold text-text-primary leading-none">
            {state.milestones.filter(m => m.status === 'in-progress').length}
          </p>
          <p className="text-caption font-bold text-text-subdued uppercase mt-1">Active Phases</p>
        </button>
        {currentMonthRent > 0 && (
          <button
            onClick={() => setActiveTab('kiraya')}
            className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 text-left active:scale-95 hover:shadow-md transition-all col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Home size={14} className="text-orange-600 dark:text-orange-400" />
              <span className="text-caption font-bold uppercase text-orange-600 dark:text-orange-400">Is Mahine Rent Baaki</span>
            </div>
            <p className="text-title-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(currentMonthRent)}</p>
          </button>
        )}
        {depositPending > 0 && (
          <button
            onClick={() => setActiveTab('kiraya')}
            className="bg-violet-500/10 p-4 rounded-2xl border border-violet-500/20 text-left active:scale-95 hover:shadow-md transition-all col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Home size={14} className="text-violet-600 dark:text-violet-400" />
              <span className="text-caption font-bold uppercase text-violet-600 dark:text-violet-400">Deposit Dena Baaki</span>
            </div>
            <p className="text-title-lg font-bold text-violet-600 dark:text-violet-400">{formatCurrency(depositPending)}</p>
          </button>
        )}
      </div>

      {/* Tod-Phod Net */}
      {(totalRecovery > 0 || demolitionThekaCost > 0 || malwaCost > 0) && (
        <div className="bg-surface-subdued border border-border-default p-5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={16} className="text-orange-500" />
            <h3 className="font-heading font-bold text-title text-text-primary">Tod-Phod Net Bachat</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface border border-border-subdued rounded-2xl p-3">
              <p className="text-text-subdued text-caption uppercase font-bold mb-1">Scrap + Bricks</p>
              <p className="text-title font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalRecovery)}</p>
            </div>
            <div className="bg-surface border border-border-subdued rounded-2xl p-3">
              <p className="text-text-subdued text-caption uppercase font-bold mb-1">Malwa + Theka</p>
              <p className="text-title font-bold text-red-600 dark:text-red-400">−{formatCurrency(malwaCost + demolitionThekaCost)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-subdued flex justify-between items-center">
            <span className="text-text-secondary text-body-sm font-bold uppercase">Net</span>
            <span className={cn('text-title-lg font-bold', demolitionNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {formatCurrency(demolitionNet)}
            </span>
          </div>
        </div>
      )}

      {/* Misc Expenses */}
      <div className="bg-surface p-5 rounded-3xl border border-border-default shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-heading text-title font-bold text-text-primary">Miscellaneous</h3>
            {totalMisc > 0 && <p className="text-caption text-text-subdued font-bold mt-0.5"><span>{formatCurrency(totalMisc)}</span> total</p>}
          </div>
          <button
            onClick={openAddMisc}
            className="flex items-center gap-1.5 px-3 py-2 bg-text-primary text-surface rounded-xl text-body-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {sortedMisc.length === 0 ? (
          <p className="text-text-secondary text-body-sm text-center py-3">Koi misc kharcha nahi</p>
        ) : (
          <>
            {/* Mobile: card-style list (top 5, then "Sab Dekho" sheet) */}
            <div className="md:hidden">
              {sortedMisc.slice(0, 5).map(renderMiscRow)}
              {sortedMisc.length > 5 && (
                <button onClick={() => setShowAllMisc(true)} className="w-full pt-3 text-body-sm font-bold text-brand text-center">
                  Sab Dekho ({sortedMisc.length} entries)
                </button>
              )}
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5">
                    <tr className="border-b border-border-subdued">
                      <th className="py-2 pr-3 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Date</th>
                      <th className="py-2 pr-3 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Category</th>
                      <th className="py-2 pr-3 text-left text-caption font-bold text-text-subdued uppercase tracking-wide">Notes</th>
                      <th className="py-2 pr-3 text-right text-caption font-bold text-text-subdued uppercase tracking-wide">Amount</th>
                      <th className="py-2 text-right text-caption font-bold text-text-subdued uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMisc.map(renderMiscTableRow)}
                  </tbody>
                </table>
              </div>
              {sortedMisc.length > 0 && (
                <p className="text-caption text-text-subdued font-bold mt-2 text-right">
                  {sortedMisc.length} {sortedMisc.length === 1 ? 'entry' : 'entries'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* All Misc Bottom Sheet — mobile only */}
      {showAllMisc && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAllMisc(false)} />
          <div className="relative bg-surface rounded-t-3xl max-h-[80vh] flex flex-col border-t border-border-default">
            <div className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-border-subdued">
              <div>
                <h3 className="font-heading text-title font-bold text-text-primary">Miscellaneous Kharcha</h3>
                <p className="text-caption text-text-subdued font-bold uppercase mt-0.5">
                  {sortedMisc.length} entries • {formatCurrency(totalMisc)}
                </p>
              </div>
              <button onClick={() => setShowAllMisc(false)} className="w-9 h-9 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-5 py-2 overscroll-contain">
              {sortedMisc.map(renderMiscRow)}
            </div>
          </div>
        </div>
      )}

      {/* Misc Form — bottom sheet on mobile, centered modal on desktop */}
      {miscForm && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={closeMiscForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{miscEditId ? 'Misc Edit' : 'Naya Misc Kharcha'}</h3>
                <button onClick={closeMiscForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default"><X size={16} /></button>
              </div>
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={miscForm.amount}
                  onChange={e => setMiscForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                  placeholder="0" />
              </div>
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Category</label>
                <input type="text" value={miscForm.category}
                  onChange={e => setMiscForm(f => f ? { ...f, category: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Bijli, Paani, Tools" />
              </div>
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={miscForm.notes}
                  onChange={e => setMiscForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="Kuch aur batana hai?" />
              </div>
              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input type="date" value={miscForm.date}
                  onChange={e => setMiscForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={closeMiscForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default">Cancel</button>
                <button onClick={saveMisc} disabled={!miscForm.amount || Number(miscForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 hover:opacity-90">
                  {miscEditId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
