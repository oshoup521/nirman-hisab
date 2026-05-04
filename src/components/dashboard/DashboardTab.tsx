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
    { label: 'Miscellaneous', value: totalMisc, color: 'bg-slate-400' },
  ].filter(r => r.value > 0);

  const renderMiscRow = (e: typeof sortedMisc[0]) => (
    <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate">{e.category}</p>
        <p className="text-[10px] text-slate-400 font-bold">
          {format(new Date(e.date), 'dd MMM yyyy')}{e.notes ? ` • ${e.notes}` : ''}
        </p>
      </div>
      <p className="font-bold text-slate-900 text-sm shrink-0">{formatCurrency(e.amount)}</p>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={() => openEditMisc(e)} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-50">
          <Pencil size={12} />
        </button>
        <button onClick={() => deleteMisc(e.id)} className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center gap-3">
          <img src="/pwa-64x64.png" alt="" className="w-10 h-10 rounded-2xl" onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Nirman Hisaab</h1>
            <p className="text-slate-400 text-xs font-medium">{state.project?.name || 'Project Overview'}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={shareOnWhatsApp} className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </button>
          <button onClick={() => downloadCSV(state)} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
            <Download size={18} />
          </button>
        </div>
      </header>

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
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wide">Master Budget</p>
              <p className="text-white text-3xl font-bold mt-0.5 leading-none">{formatCurrency(masterBudget)}</p>
            </div>
            <span className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-bold',
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
              <p className="text-white/60 text-[10px] font-bold uppercase">Kharcha</p>
              <p className="text-white font-bold text-base leading-tight">{formatCurrency(totalKharcha)}</p>
            </div>
            <div className="bg-black/15 rounded-xl px-3 py-2">
              <p className="text-white/60 text-[10px] font-bold uppercase">Bacha Hua</p>
              <p className={cn('font-bold text-base leading-tight', masterRemaining < 0 ? 'text-red-200' : 'text-white')}>
                {formatCurrency(masterRemaining)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 rounded-3xl text-center">
          <Wallet size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-bold">Master budget set nahi hai</p>
          <button onClick={() => setActiveTab('settings')} className="mt-2 text-xs text-indigo-600 font-bold">
            Settings mein set karo →
          </button>
        </div>
      )}

      {/* Kharcha Breakdown */}
      {breakdownRows.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900">Kharcha Breakdown</h3>
          <div className="space-y-3">
            {breakdownRows.map(row => (
              <div key={row.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                  <span className="text-xs font-bold text-slate-900">{formatCurrency(row.value)}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', row.color)}
                    style={{ width: masterBudget > 0 ? `${Math.min(100, (row.value / masterBudget) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
            {(totalRentPaid - totalCashRentPaid) > 0 && (
              <div className="bg-violet-50 rounded-xl px-3 py-2 flex justify-between items-center">
                <span className="text-[11px] text-violet-500 font-bold">+ Deposit Se Kata Rent</span>
                <span className="text-[11px] font-bold text-violet-600">{formatCurrency(totalRentPaid - totalCashRentPaid)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalKharcha)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setActiveTab('construction'); setSubTab('materials'); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-2">
            <Package size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 leading-none">
            {state.materials.filter((m: Material) => m.purchased - m.used <= m.minStock).length}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Low Stock Items</p>
        </button>
        <button
          onClick={() => { setActiveTab('construction'); setSubTab('timeline'); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-2">
            <Clock size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 leading-none">
            {state.milestones.filter(m => m.status === 'in-progress').length}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Active Phases</p>
        </button>
        {currentMonthRent > 0 && (
          <button
            onClick={() => setActiveTab('kiraya')}
            className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-left active:scale-95 transition-transform col-span-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Home size={14} className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase text-orange-500">Is Mahine Rent Baaki</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(currentMonthRent)}</p>
          </button>
        )}
        {depositPending > 0 && (
          <button
            onClick={() => setActiveTab('kiraya')}
            className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-left active:scale-95 transition-transform col-span-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Home size={14} className="text-purple-500" />
              <span className="text-[10px] font-bold uppercase text-purple-500">Deposit Dena Baaki</span>
            </div>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(depositPending)}</p>
          </button>
        )}
      </div>

      {/* Tod-Phod Net */}
      {(totalRecovery > 0 || demolitionThekaCost > 0 || malwaCost > 0) && (
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={16} className="text-orange-400" />
            <h3 className="font-bold text-sm">Tod-Phod Net Bachat</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Scrap + Bricks</p>
              <p className="text-base font-bold text-emerald-400">+{formatCurrency(totalRecovery)}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Malwa + Theka</p>
              <p className="text-base font-bold text-red-400">−{formatCurrency(malwaCost + demolitionThekaCost)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase">Net</span>
            <span className={cn('text-xl font-bold', demolitionNet >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {formatCurrency(demolitionNet)}
            </span>
          </div>
        </div>
      )}

      {/* Misc Expenses */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-slate-900">Miscellaneous</h3>
            {totalMisc > 0 && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatCurrency(totalMisc)} total</p>}
          </div>
          <button
            onClick={openAddMisc}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {sortedMisc.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-3">Koi misc kharcha nahi</p>
        ) : (
          <div>
            {sortedMisc.slice(0, 5).map(renderMiscRow)}
            {sortedMisc.length > 5 && (
              <button onClick={() => setShowAllMisc(true)} className="w-full pt-3 text-xs font-bold text-indigo-600 text-center">
                Sab Dekho ({sortedMisc.length} entries)
              </button>
            )}
          </div>
        )}
      </div>

      {/* All Misc Bottom Sheet */}
      {showAllMisc && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAllMisc(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">Miscellaneous Kharcha</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">
                  {sortedMisc.length} entries • {formatCurrency(totalMisc)}
                </p>
              </div>
              <button onClick={() => setShowAllMisc(false)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-5 py-2 overscroll-contain">
              {sortedMisc.map(renderMiscRow)}
            </div>
          </div>
        </div>
      )}

      {/* Misc Form Sheet */}
      {miscForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeMiscForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{miscEditId ? 'Misc Edit' : 'Naya Misc Kharcha'}</h3>
                <button onClick={closeMiscForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={miscForm.amount}
                  onChange={e => setMiscForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-400 font-bold text-xl"
                  placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Category</label>
                <input type="text" value={miscForm.category}
                  onChange={e => setMiscForm(f => f ? { ...f, category: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-400"
                  placeholder="e.g. Bijli, Paani, Tools" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={miscForm.notes}
                  onChange={e => setMiscForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Kuch aur batana hai?" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input type="date" value={miscForm.date}
                  onChange={e => setMiscForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={closeMiscForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={saveMisc} disabled={!miscForm.amount || Number(miscForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-slate-800 text-white rounded-2xl font-bold text-sm disabled:opacity-40">
                  {miscEditId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
