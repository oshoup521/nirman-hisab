import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Construction, 
  Hammer, 
  Plus, 
  Settings, 
  TrendingUp, 
  Users, 
  Package, 
  Clock, 
  Trash2, 
  IndianRupee,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Download,
  Pencil,
  Home
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfToday } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AppState, Project, Material, Labour, Theka, ThekaPayment, DemolitionTheka, RentalProperty, RentPayment, MiscExpense, Expense, Milestone, DemolitionProject, BrickRecovery, MalwaEntry, ScrapEntry } from './types';
import { useCloudSync } from './hooks/useCloudSync';
import { useDragScroll } from './hooks/useDragScroll';
import { formatCurrency, formatNumber, getStatusColor } from './utils/formatters';
import ConfirmDialog from './components/ConfirmDialog';
import { supabase } from './utils/supabaseClient';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: AppState = {
  project: null,
  materials: [],
  labours: [],
  thekas: [],
  expenses: [],
  milestones: [
    { id: '1', phase: 'Foundation', status: 'pending' },
    { id: '2', phase: 'Plinth', status: 'pending' },
    { id: '3', phase: 'Slab', status: 'pending' },
    { id: '4', phase: 'Brickwork', status: 'pending' },
    { id: '5', phase: 'Plaster', status: 'pending' },
    { id: '6', phase: 'Flooring', status: 'pending' },
    { id: '7', phase: 'Finishing', status: 'pending' },
  ],
  demolition: null,
  brickRecovery: [],
  malwa: [],
  scrap: [],
  demolitionThekas: [],
  rentals: [],
  miscExpenses: [],
  vendors: [],
};

const MATERIAL_TYPES = [
  'Cement bags', 'Bricks', 'Sand', 'Gravel/Gitti', 'Steel rods', 
  'TMT bars', 'AAC blocks', 'Tiles', 'Paint', 'Wood', 'PVC pipes', 
  'Wiring', 'Aggregates', 'Water-proofing'
];

const LABOUR_TYPES = [
  'Mistri', 'Beldar', 'Thekedar', 'Electrician', 'Plumber', 'Painter', 'Fabricator'
];

export default function App() {
  const [state, setState, loading, syncStatus, lastSynced, syncError, syncNow, userEmail, cloudUpdatedAt] = useCloudSync<AppState>('nirman_hisaab_data', INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'construction' | 'demolition' | 'kiraya' | 'settings'>('dashboard');
  const [subTab, setSubTab] = useState<string>('overview');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title?: string; message: string; confirmText?: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [pwForm, setPwForm] = useState({ open: false, newPw: '', confirmPw: '', loading: false, error: '', success: '' });

  const askConfirm = (message: string, onConfirm: () => void, title?: string, confirmText?: string) => {
    setConfirmDialog({ open: true, title, message, confirmText, onConfirm });
  };

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullToast, setPullToast] = useState<string | null>(null);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 72;

  const showPullToast = useCallback((msg: string) => {
    setPullToast(msg);
    setTimeout(() => setPullToast(null), 3000);
  }, []);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || touchStartY.current === 0) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0) {
        setIsPulling(true);
        setPullY(Math.min(dy * 0.4, PULL_THRESHOLD + 16));
      }
    };
    const onTouchEnd = async () => {
      if (!isPulling) return;
      if (pullY >= PULL_THRESHOLD) {
        if (syncStatus === 'error') {
          showPullToast('⚠ Unsaved data hai — pehle Settings me ↻ Sync karein');
        } else if (syncStatus === 'syncing') {
          showPullToast('Sync chal raha hai, thoda rukein...');
        } else {
          showPullToast('Cloud se sync ho raha hai...');
          await syncNow();
        }
      }
      setIsPulling(false);
      setPullY(0);
      touchStartY.current = 0;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPulling, pullY, syncStatus, syncNow, showPullToast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwForm(p => ({ ...p, error: 'Dono passwords match nahi kar rahe', success: '' }));
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwForm(p => ({ ...p, error: 'Password kam se kam 6 characters ka hona chahiye', success: '' }));
      return;
    }
    setPwForm(p => ({ ...p, loading: true, error: '', success: '' }));
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) {
      setPwForm(p => ({ ...p, loading: false, error: error.message }));
    } else {
      setPwForm({ open: false, newPw: '', confirmPw: '', loading: false, error: '', success: '' });
    }
  };



  const constructionTabsDrag = useDragScroll();
  const demolitionTabsDrag = useDragScroll();

  const totalSpent = useMemo(() => (state.expenses || []).reduce((acc, curr) => acc + curr.amount, 0), [state.expenses]);
  const budget = state.project?.budget || 0;
  const masterBudget = state.project?.masterBudget || 0;
  const remainingBudget = budget - totalSpent;
  const burnRate = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const scrapIncome = useMemo(() => (state.scrap || []).reduce((acc, curr) => acc + (curr.quantity * curr.rate), 0), [state.scrap]);
  const brickRecoveryValue = useMemo(() => (state.brickRecovery || []).reduce((acc, curr) => acc + (curr.recovered * curr.ratePerBrick), 0), [state.brickRecovery]);
  const totalRecovery = scrapIncome + brickRecoveryValue;
  
  const malwaCost = useMemo(() => (state.malwa || []).reduce((acc, curr) => acc + (curr.disposed * curr.costPerTrip), 0), [state.malwa]);
  const demolitionThekaCost = useMemo(() => (state.demolitionThekas || []).reduce((acc, t) => acc + t.payments.reduce((a, p) => a + p.amount, 0), 0), [state.demolitionThekas]);
  const demolitionThekaPending = useMemo(() => (state.demolitionThekas || []).reduce((acc, t) => acc + (t.totalAmount - t.payments.reduce((a, p) => a + p.amount, 0)), 0), [state.demolitionThekas]);

  // totalRentPaid = all payments (for display in kiraya tab)
  const totalRentPaid = useMemo(() => (state.rentals || []).reduce((a, r) => a + r.payments.reduce((s, p) => s + p.amount, 0), 0), [state.rentals]);
  // totalCashRentPaid = only cash/online payments (deposit-se wale exclude) — for kharcha calculation to avoid double counting
  const totalCashRentPaid = useMemo(() => (state.rentals || []).reduce((a, r) => a + r.payments.filter(p => !p.paidFromDeposit).reduce((s, p) => s + p.amount, 0), 0), [state.rentals]);
  const totalDeposit = useMemo(() => (state.rentals || []).reduce((a, r) => a + (r.deposit || 0), 0), [state.rentals]);

  // helper: get effective depositStatus, handles old data that had depositPaid boolean
  const getDepositStatus = (r: any): 'pending' | 'paid' | 'refunded' | 'forfeited' => {
    if (r.depositStatus) return r.depositStatus;
    if (r.depositPaid === true) return 'paid';
    return 'pending';
  };

  // depositPaid = money actually gone from pocket (paid to owner, not yet refunded)
  const depositPaid = useMemo(() => (state.rentals || [])
    .filter(r => { const s = getDepositStatus(r); return s === 'paid' || s === 'forfeited'; })
    .reduce((a, r) => a + (r.deposit || 0), 0), [state.rentals]);
  const depositPending = useMemo(() => (state.rentals || [])
    .filter(r => getDepositStatus(r) === 'pending')
    .reduce((a, r) => a + (r.deposit || 0), 0), [state.rentals]);
  // depositWapas = remaining deposit recoverable (full deposit minus jo rent se already kata)
  const depositWapas = useMemo(() => (state.rentals || [])
    .filter(r => getDepositStatus(r) === 'paid')
    .reduce((a, r) => {
      const usedForRent = r.payments.filter(p => p.paidFromDeposit).reduce((s, p) => s + p.amount, 0);
      return a + Math.max(0, (r.deposit || 0) - usedForRent);
    }, 0), [state.rentals]);
  const currentMonthRent = useMemo(() => {
    const m = format(new Date(), 'yyyy-MM');
    return (state.rentals || []).reduce((a, r) => {
      const paid = r.payments.filter(p => p.month === m).reduce((s, p) => s + p.amount, 0);
      return a + (r.monthlyRent - paid);
    }, 0);
  }, [state.rentals]);

  const totalMisc = useMemo(() => (state.miscExpenses || []).reduce((a, e) => a + e.amount, 0), [state.miscExpenses]);

  // Master total kharcha = construction + demolition theka + malwa + cash rent paid + deposit paid + misc
  // Note: deposit-se-kata rent excluded from rent total (already counted in depositPaid) to avoid double counting
  const totalKharcha = useMemo(() =>
    totalSpent + demolitionThekaCost + malwaCost + totalCashRentPaid + depositPaid + totalMisc,
    [totalSpent, demolitionThekaCost, malwaCost, totalCashRentPaid, depositPaid, totalMisc]
  );
  const masterRemaining = masterBudget > 0 ? masterBudget - totalKharcha : 0;
  const masterBurnRate = masterBudget > 0 ? (totalKharcha / masterBudget) * 100 : 0;

  const exportToCSV = () => {
    const esc = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const safeDate = (d: any) => {
      if (!d) return '';
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? '' : format(dt, 'yyyy-MM-dd');
    };
    const rows: string[] = [];
    rows.push(['Date', 'Section', 'Type/Category', 'Description', 'Amount', 'Notes'].join(','));

    // Construction Expenses
    (state.expenses || []).forEach((e: Expense) => {
      rows.push([safeDate(e.date), 'Construction', esc(e.category), esc(e.category), e.amount, esc(e.notes)].join(','));
    });

    // Construction Theka Payments
    (state.thekas || []).forEach((t: Theka) => {
      (t.payments || []).forEach((p: ThekaPayment) => {
        rows.push([safeDate(p.date), 'Construction Theka', esc(t.name), esc(`Theka: ${t.name}`), p.amount, esc(p.note || '')].join(','));
      });
    });

    // Misc Expenses
    (state.miscExpenses || []).forEach((e: MiscExpense) => {
      rows.push([safeDate(e.date), 'Misc', esc(e.category), esc(e.category), e.amount, esc(e.notes || '')].join(','));
    });

    // Demolition Theka Payments
    (state.demolitionThekas || []).forEach((t: DemolitionTheka) => {
      (t.payments || []).forEach((p: ThekaPayment) => {
        rows.push([safeDate(p.date), 'Demolition Theka', esc(t.name), esc(`Theka: ${t.name}`), p.amount, esc(p.note || '')].join(','));
      });
    });

    // Malwa (Demolition)
    (state.malwa || []).forEach((m: MalwaEntry) => {
      const amt = (m.disposed || 0) * (m.costPerTrip || 0);
      rows.push([safeDate(m.date), 'Demolition', 'Malwa Disposal', esc(`${m.disposed} trips @ ₹${m.costPerTrip} (${m.vendor})`), amt, ''].join(','));
    });

    // Scrap Income (Demolition)
    (state.scrap || []).forEach((s: ScrapEntry) => {
      const amt = (s.quantity || 0) * (s.rate || 0);
      rows.push([safeDate(s.date), 'Demolition Income', 'Scrap Sale', esc(`${s.type}: ${s.quantity} ${s.unit} @ ₹${s.rate} (${s.dealer})`), amt, ''].join(','));
    });

    // Brick Recovery Income (Demolition)
    (state.brickRecovery || []).forEach((b: BrickRecovery) => {
      const amt = (b.recovered || 0) * (b.ratePerBrick || 0);
      rows.push([safeDate(b.date), 'Demolition Income', 'Brick Recovery', esc(`${b.recovered} bricks @ ₹${b.ratePerBrick}`), amt, ''].join(','));
    });

    // Rental Payments
    (state.rentals || []).forEach((r: RentalProperty) => {
      (r.payments || []).forEach((p: RentPayment) => {
        rows.push([safeDate(p.date), 'Kiraya', esc(r.name), esc(`Rent: ${r.name} (${p.month})`), p.amount, esc(p.note || '')].join(','));
      });
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const fileName = `NirmanHisaab_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const a = document.createElement('a');
    a.setAttribute('href', dataUri);
    a.setAttribute('download', fileName);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareOnWhatsApp = () => {
    const projectName = state.project?.name || 'Nirman Project';
    const location = state.project?.location ? ` — ${state.project.location}` : '';
    const today = format(new Date(), 'dd MMM yyyy');

    // Construction
    const constructionThekaPaid = state.thekas.reduce((acc: number, t: Theka) => acc + t.payments.reduce((a: number, p: ThekaPayment) => a + p.amount, 0), 0);
    const constructionThekaPending = state.thekas.reduce((acc: number, t: Theka) => acc + (t.totalAmount - t.payments.reduce((a: number, p: ThekaPayment) => a + p.amount, 0)), 0);
    const burnPct = masterBudget > 0 ? Math.round((totalKharcha / masterBudget) * 100) : 0;

    // Demolition
    const demolitionThekaPaid = (state.demolitionThekas || []).reduce((acc: number, t: DemolitionTheka) => acc + t.payments.reduce((a: number, p: ThekaPayment) => a + p.amount, 0), 0);
    const demolitionThekaPending = (state.demolitionThekas || []).reduce((acc: number, t: DemolitionTheka) => acc + (t.totalAmount - t.payments.reduce((a: number, p: ThekaPayment) => a + p.amount, 0)), 0);
    const hasDemolition = (state.demolitionThekas || []).length > 0 || (state.malwa || []).length > 0;

    // Kiraya
    const totalRentIncome = (state.rentals || []).reduce((a: number, r: RentalProperty) => a + r.payments.reduce((s: number, p: RentPayment) => s + p.amount, 0), 0);
    const hasKiraya = (state.rentals || []).length > 0;

    // Alerts
    const lowStockItems = state.materials.filter((m: Material) => m.purchased - m.used <= m.minStock).map((m: Material) => m.name);

    let text = '';
    text += `🏗️ *${projectName}${location}*\n`;
    text += `📅 ${today} ka hisaab\n`;
    text += `${'─'.repeat(28)}\n\n`;

    // Budget Overview
    text += `💼 *BUDGET OVERVIEW*\n`;
    text += `Total Budget:  ₹${formatCurrency(masterBudget)}\n`;
    text += `Total Kharcha: ₹${formatCurrency(totalKharcha)}\n`;
    text += `Bacha Hua:     ₹${formatCurrency(masterRemaining)}\n`;
    text += `Budget Used:   ${burnPct}%\n\n`;

    // Construction
    if (budget > 0 || totalSpent > 0) {
      text += `🧱 *CONSTRUCTION*\n`;
      text += `Budget:         ₹${formatCurrency(budget)}\n`;
      text += `Kharcha:        ₹${formatCurrency(totalSpent)}\n`;
      text += `Theka Diya:     ₹${formatCurrency(constructionThekaPaid)}\n`;
      text += `Theka Baaki:    ₹${formatCurrency(constructionThekaPending)}\n\n`;
    }

    // Demolition
    if (hasDemolition) {
      text += `⛏️ *DEMOLITION*\n`;
      text += `Theka Diya:  ₹${formatCurrency(demolitionThekaPaid)}\n`;
      text += `Theka Baaki: ₹${formatCurrency(demolitionThekaPending)}\n`;
      if (malwaCost > 0)       text += `Malwa Cost:  ₹${formatCurrency(malwaCost)}\n`;
      if (totalRecovery > 0)   text += `Recovery:    ₹${formatCurrency(totalRecovery)}\n`;
      text += '\n';
    }

    // Kiraya
    if (hasKiraya) {
      text += `🏠 *KIRAYA*\n`;
      text += `Total Properties: ${(state.rentals || []).length}\n`;
      text += `Rent Mila:        ₹${formatCurrency(totalRentIncome)}\n`;
      if (currentMonthRent > 0) text += `Is Mahine Baaki:  ₹${formatCurrency(currentMonthRent)}\n`;
      text += '\n';
    }

    // Alerts
    if (lowStockItems.length > 0) {
      text += `⚠️ *LOW STOCK ALERT*\n`;
      lowStockItems.slice(0, 5).forEach((name: string) => { text += `• ${name}\n`; });
      if (lowStockItems.length > 5) text += `• ...aur ${lowStockItems.length - 5} aur\n`;
      text += '\n';
    }

    text += `_Shared via Nirman Hisaab App_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const renderDashboard = () => {
    const chartData = [
      { name: 'Spent', value: totalSpent, fill: '#ef4444' },
      { name: 'Remaining', value: Math.max(0, remainingBudget), fill: '#22c55e' }
    ];

    const categoryData = [
      { name: 'Material', value: state.expenses.filter(e => e.category === 'Material').reduce((a, b) => a + b.amount, 0) },
      { name: 'Labour', value: state.expenses.filter(e => e.category === 'Labour').reduce((a, b) => a + b.amount, 0) },
      { name: 'Theka', value: state.expenses.filter(e => e.category === 'Theka').reduce((a, b) => a + b.amount, 0) },
      { name: 'Other', value: state.expenses.filter(e => !['Material', 'Labour', 'Theka'].includes(e.category)).reduce((a, b) => a + b.amount, 0) },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6 pb-28">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/pwa-64x64.png" alt="Nirman Hisaab" className="w-10 h-10 rounded-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nirman Hisaab</h1>
              <p className="text-slate-500 text-sm">Project Overview</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={shareOnWhatsApp} className="p-2 bg-green-50 rounded-full text-green-600 hover:bg-green-100 transition-colors" title="Share on WhatsApp">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </button>
            <button onClick={exportToCSV} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors" title="Export CSV">
              <Download size={20} />
            </button>
          </div>
        </header>

        {/* Master Budget Card */}
        {masterBudget > 0 ? (
          <div className={cn("p-4 rounded-3xl border shadow-sm", masterBurnRate > 90 ? "bg-red-50 border-red-200" : masterBurnRate > 70 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200")}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Master Budget</p>
            <div className="flex flex-col gap-2 mb-3">
              <div className="bg-white/60 rounded-2xl p-3 flex justify-between items-center">
                <p className="text-[11px] text-slate-500 uppercase font-bold">Total Budget</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(masterBudget)}</p>
              </div>
              <div className="bg-white/60 rounded-2xl p-3 flex justify-between items-center">
                <p className="text-[11px] text-slate-500 uppercase font-bold">Total Kharcha</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalKharcha)}</p>
              </div>
            </div>
            <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden mb-2">
              <div
                className={cn("h-full transition-all duration-500 rounded-full", masterBurnRate > 90 ? 'bg-red-500' : masterBurnRate > 70 ? 'bg-yellow-500' : 'bg-green-500')}
                style={{ width: `${Math.min(100, masterBurnRate)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold uppercase">
              <span className="text-slate-600">{masterBurnRate.toFixed(1)}% Used</span>
              <span className={masterRemaining < 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(masterRemaining)} Left</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 border-2 border-dashed border-slate-200 p-5 rounded-3xl text-center">
            <p className="text-slate-500 text-sm font-bold">Master budget set nahi hai</p>
            <button onClick={() => setActiveTab('settings')} className="mt-2 text-xs text-indigo-600 font-bold underline">Settings mein set karo</button>
          </div>
        )}

        {/* Category-wise Kharcha Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900">Kharcha Breakdown</h3>
          {[
            { label: 'Construction (Samaan + Mazdoor)', value: totalSpent, color: 'bg-indigo-500' },
            { label: 'Tod-Phod Theka', value: demolitionThekaCost, color: 'bg-orange-500' },
            { label: 'Malwa Disposal', value: malwaCost, color: 'bg-amber-500' },
            { label: 'Kiraya (Rent Paid)', value: totalRentPaid, color: 'bg-violet-500' },
            { label: 'Deposit Diya (Wapas Milega)', value: depositPaid, color: 'bg-blue-400' },
            { label: 'Miscellaneous', value: totalMisc, color: 'bg-slate-400' },
          ].filter(r => r.value > 0).map(row => (
            <div key={row.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                <span className="text-xs font-bold text-slate-900">{formatCurrency(row.value)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", row.color)}
                  style={{ width: masterBudget > 0 ? `${Math.min(100, (row.value / masterBudget) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalKharcha)}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Package size={16} />
              <span className="text-xs font-bold uppercase">Low Stock</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {state.materials.filter(m => m.purchased - m.used <= m.minStock).length} Items
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase">Active Phases</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {state.milestones.filter(m => m.status === 'in-progress').length}
            </p>
          </div>
          {currentMonthRent > 0 && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm col-span-2">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <Home size={16} />
                <span className="text-xs font-bold uppercase">Is Mahine Rent Baaki</span>
              </div>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(currentMonthRent)}</p>
            </div>
          )}
          {depositPending > 0 && (
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 shadow-sm col-span-2">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <Home size={16} />
                <span className="text-xs font-bold uppercase">Deposit Dena Baaki (Maine Nahi Diya)</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(depositPending)}</p>
            </div>
          )}
        </div>

        {/* Tod-Phod Net */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={18} className="text-orange-400" />
            <h3 className="font-bold">Tod-Phod Net Bachat</h3>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-white/5 rounded-2xl p-3">
              <p className="text-slate-400 text-[11px] uppercase font-bold">Scrap + Bricks</p>
              <p className="text-lg font-bold text-green-400">+{formatCurrency(totalRecovery)}</p>
            </div>
            <div className="flex justify-between items-center bg-white/5 rounded-2xl p-3">
              <p className="text-slate-400 text-[11px] uppercase font-bold">Malwa + Theka</p>
              <p className="text-lg font-bold text-red-400">-{formatCurrency(malwaCost + demolitionThekaCost)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase">Net</span>
            <span className={cn("text-xl font-bold", totalRecovery - malwaCost - demolitionThekaCost >= 0 ? "text-green-400" : "text-red-400")}>
              {formatCurrency(totalRecovery - malwaCost - demolitionThekaCost)}
            </span>
          </div>
        </div>

        {/* Misc Expenses quick add */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900">Miscellaneous Kharcha</h3>
            <button
              onClick={() => {
                const amount = Number(prompt('Amount (₹)?'));
                if (!amount) return;
                const category = prompt('Category? (e.g. Bijli, Paani, Transport, Tools)') || 'Misc';
                const notes = prompt('Notes?') || '';
                const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                setState(prev => ({
                  ...prev,
                  miscExpenses: [...(prev.miscExpenses || []), {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date(dateStr).toISOString(),
                    amount, category, notes
                  }]
                }));
              }}
              className="p-2 bg-slate-600 text-white rounded-full"
            >
              <Plus size={18} />
            </button>
          </div>
          {(state.miscExpenses || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-2">Koi misc kharcha nahi</p>
          ) : (
            <div className="space-y-2">
              {[...(state.miscExpenses || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(e => (
                <div key={e.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-slate-800">{e.category}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{format(new Date(e.date), 'dd MMM yyyy')}{e.notes ? ` • ${e.notes}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{formatCurrency(e.amount)}</p>
                    <button
                      onClick={() => {
                        const amount = Number(prompt('Amount?', String(e.amount)));
                        if (!amount) return;
                        const category = prompt('Category?', e.category) || e.category;
                        const notes = prompt('Notes?', e.notes) || '';
                        const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(e.date), 'yyyy-MM-dd')) || format(new Date(e.date), 'yyyy-MM-dd');
                        setState(prev => ({
                          ...prev,
                          miscExpenses: (prev.miscExpenses || []).map(x => x.id === e.id ? { ...x, amount, category, notes, date: new Date(dateStr).toISOString() } : x)
                        }));
                      }}
                      className="p-1 text-slate-300 hover:text-slate-500"
                    >
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => askConfirm('Is misc expense ko delete kar dein?', () => setState(prev => ({ ...prev, miscExpenses: (prev.miscExpenses || []).filter(x => x.id !== e.id) })))} className="p-1 text-red-300 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {(state.miscExpenses || []).length > 5 && (
                <p className="text-xs text-slate-400 text-center">+{(state.miscExpenses || []).length - 5} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConstruction = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'materials', label: 'Samaan', icon: Package },
      { id: 'vendors', label: 'Udhaar', icon: Users },
      { id: 'labour', label: 'Mazdoor', icon: Users },
      { id: 'theka', label: 'Theka', icon: ChevronRight },
      { id: 'expenses', label: 'Kharcha', icon: IndianRupee },
      { id: 'timeline', label: 'Raftaar', icon: Clock },
    ];

    return (
      <div className="space-y-6 pb-28">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Naya Kaam</h1>
          <p className="text-slate-500 text-sm">Construction Tracker</p>
        </header>

        <div
          ref={constructionTabsDrag.ref}
          onMouseDown={constructionTabsDrag.onMouseDown}
          onMouseMove={constructionTabsDrag.onMouseMove}
          onMouseUp={constructionTabsDrag.onMouseUp}
          onMouseLeave={constructionTabsDrag.onMouseLeave}
          className="-mx-4 flex gap-2 overflow-x-auto pb-2 px-4 no-scrollbar cursor-grab"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0",
                subTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "bg-white text-slate-600 border border-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
          <span className="shrink-0 w-4" />
        </div>

        {subTab === 'overview' && (
          <div className="space-y-4">
            {!state.project ? (
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">No Project Found</h3>
                  <p className="text-slate-500 text-sm">Settings mein jaake project setup karein.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm"
                >
                  Setup Project
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{state.project.name}</h3>
                    <p className="text-slate-500 text-sm">{state.project.location}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase">
                    {state.project.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Start Date</p>
                    <p className="font-bold text-slate-700">{format(new Date(state.project.startDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">End Date</p>
                    <p className="font-bold text-slate-700">{format(new Date(state.project.endDate), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {subTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Samaan ka Stock</h3>
              <button 
                onClick={() => {
                  const name = prompt('Material Name?');
                  if (!name) return;
                  const unit = prompt('Unit (e.g. bags, tons)?');
                  const purchased = Number(prompt('Quantity Purchased?'));
                  const rate = Number(prompt('Rate per unit?'));
                  const minStock = Number(prompt('Low Stock Alert at?'));
                  
                  const newMaterial: Material = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    unit: unit || 'units',
                    purchased,
                    used: 0,
                    rate,
                    vendor: '',
                    date: new Date().toISOString(),
                    billNumber: '',
                    minStock
                  };
                  
                  setState(prev => ({
                    ...prev,
                    materials: [...prev.materials, newMaterial],
                    expenses: [...prev.expenses, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString(),
                      amount: purchased * rate,
                      category: 'Material',
                      notes: `Purchased ${purchased} ${unit} of ${name}`
                    }]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {[...state.materials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(material => {
              const stock = material.purchased - material.used;
              const isLow = stock <= material.minStock;
              return (
                <div key={material.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900">{material.name}</h4>
                      <p className="text-xs text-slate-500">{material.purchased} {material.unit} Purchased • ₹{material.rate}/{material.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("text-lg font-bold", isLow ? "text-red-500" : "text-green-600")}>
                        {stock} {material.unit}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const used = Number(prompt(`How many ${material.unit} used?`));
                        if (isNaN(used)) return;
                        setState(prev => ({
                          ...prev,
                          materials: prev.materials.map(m => m.id === material.id ? { ...m, used: m.used + used } : m)
                        }));
                      }}
                      className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
                    >
                      Update Usage
                    </button>
                    <button
                      onClick={() => {
                        const name = prompt('Material Name?', material.name);
                        if (!name) return;
                        const purchased = Number(prompt('Quantity Purchased?', String(material.purchased)));
                        const rate = Number(prompt('Rate per unit?', String(material.rate)));
                        const minStock = Number(prompt('Low Stock Alert at?', String(material.minStock)));
                        setState(prev => ({
                          ...prev,
                          materials: prev.materials.map(m => m.id === material.id ? { ...m, name, purchased, rate, minStock } : m)
                        }));
                      }}
                      className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askConfirm(`"${material.name}" material ko delete kar dein?`, () => {
                        setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== material.id) }));
                      })}
                      className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {subTab === 'vendors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Dukandar Khata (Udhaar)</h3>
              <button 
                onClick={() => {
                  const name = prompt('Dukandar ka naam? (e.g. Gupta Cement)');
                  if (!name) return;
                  const type = prompt('Samaan ka type? (e.g. Cement/Rodi/Hardware)');
                  const totalBilled = Number(prompt('Ab tak ka total bill (₹)?', '0'));
                  
                  setState(prev => ({
                    ...prev,
                    vendors: [...(prev.vendors || []), {
                      id: Math.random().toString(36).substr(2, 9),
                      name, type: type || 'General', phone: '',
                      totalBilled, payments: []
                    }]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {(state.vendors || []).map(vendor => {
              const totalPaid = vendor.payments.reduce((a, p) => a + p.amount, 0);
              const balance = vendor.totalBilled - totalPaid;
              return (
                <div key={vendor.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{vendor.name}</h4>
                      <p className="text-xs text-slate-500 font-bold">{vendor.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Bill</p>
                      <p className="font-bold text-slate-900">₹{formatNumber(vendor.totalBilled)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs font-bold border-y border-slate-50 py-2">
                    <div>
                      <span className="text-slate-400">JAMA KIYA: </span>
                      <span className="text-green-600">₹{formatNumber(totalPaid)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">DENA BAAKI: </span>
                      <span className={balance > 0 ? "text-red-500" : "text-green-500"}>
                        {balance > 0 ? `₹${formatNumber(balance)}` : `Advance ₹${formatNumber(Math.abs(balance))}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => {
                      const amount = Number(prompt('Kitna payment (jama) de rahe hain?'));
                      if (!amount) return;
                      const dateStr = prompt('Date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10));
                      const note = prompt('Notes? (e.g. Cash/UPI)') || '';
                      
                      setState(prev => ({
                        ...prev,
                        vendors: prev.vendors.map(v => v.id === vendor.id ? {
                          ...v, payments: [...v.payments, { id: Math.random().toString(36).substr(2, 9), date: dateStr || '', amount, type: 'payment', note }]
                        } : v),
                        expenses: [...prev.expenses, {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date(dateStr || '').toISOString(),
                          amount, category: 'Material', notes: `Paid to ${vendor.name} - ${note}`
                        }]
                      }));
                    }} className="flex-1 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100">
                      Paise Jama
                    </button>
                    <button onClick={() => {
                      const amount = Number(prompt('Naya bill kitne ka aaya (₹)?'));
                      if (!amount) return;
                      setState(prev => ({
                        ...prev,
                        vendors: prev.vendors.map(v => v.id === vendor.id ? { ...v, totalBilled: v.totalBilled + amount } : v)
                      }));
                    }} className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100">
                      Bill Badao
                    </button>
                    <button onClick={() => askConfirm(`"${vendor.name}" vendor ko delete kar dein?`, () => {
                      setState(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== vendor.id) }));
                    })} className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {subTab === 'labour' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Mazdoor & Theka</h3>
              <button 
                onClick={() => {
                  const type = prompt('Labour Type (Mistri/Beldar/etc)?');
                  if (!type) return;
                  const wage = Number(prompt('Daily Wage?'));
                  
                  const newLabour: Labour = {
                    id: Math.random().toString(36).substr(2, 9),
                    type,
                    dailyWage: wage,
                    attendance: {}
                  };
                  
                  setState(prev => ({
                    ...prev,
                    labours: [...prev.labours, newLabour]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.labours.map(labour => (
              <div key={labour.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-900">{labour.type}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-600">{formatCurrency(labour.dailyWage)}/day</p>
                    <button
                      onClick={() => {
                        const type = prompt('Labour Type?', labour.type);
                        if (!type) return;
                        const wage = Number(prompt('Daily Wage?', String(labour.dailyWage)));
                        setState(prev => ({
                          ...prev,
                          labours: prev.labours.map(l => l.id === labour.id ? { ...l, type, dailyWage: wage } : l)
                        }));
                      }}
                      className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askConfirm(`"${labour.type}" labour ko delete kar dein?`, () => {
                        setState(prev => ({ ...prev, labours: prev.labours.filter(l => l.id !== labour.id) }));
                      })}
                      className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                      const date = dateStr;
                      setState(prev => ({
                        ...prev,
                        labours: prev.labours.map(l => l.id === labour.id ? { ...l, attendance: { ...l.attendance, [date]: 'present' } } : l),
                        expenses: [...prev.expenses, {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date(dateStr).toISOString(),
                          amount: labour.dailyWage,
                          category: 'Labour',
                          notes: `Daily wage for ${labour.type}`
                        }]
                      }));
                    }}
                    className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100"
                  >
                    Present
                  </button>
                  <button 
                    onClick={() => {
                      const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                      const date = dateStr;
                      setState(prev => ({
                        ...prev,
                        labours: prev.labours.map(l => l.id === labour.id ? { ...l, attendance: { ...l.attendance, [date]: 'half' } } : l),
                        expenses: [...prev.expenses, {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date(dateStr).toISOString(),
                          amount: labour.dailyWage / 2,
                          category: 'Labour',
                          notes: `Half day wage for ${labour.type}`
                        }]
                      }));
                    }}
                    className="flex-1 py-2 bg-yellow-50 text-yellow-600 rounded-xl text-xs font-bold border border-yellow-100"
                  >
                    Half Day
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'theka' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Thekedar Hisaab</h3>
              <button
                onClick={() => {
                  const name = prompt('Thekedar ka naam?');
                  if (!name) return;
                  const workType = prompt('Kaam ka type? (Civil/Electrical/Plumbing/Painting/Flooring/Other)') as Theka['workType'];
                  let totalAmount = 0;
                  let ratePerSqFt = 0;
                  let areaSqFt = 0;
                  
                  const useSqFt = confirm('Kya aap Theka per Square Feet (₹/sq.ft) ke hisaab se lagana chahte hain?');
                  if (useSqFt) {
                    ratePerSqFt = Number(prompt('Darr (Rate) bataiye (e.g., 168 ₹/sq.ft)?'));
                    const defaultArea = state.project?.totalArea || 0;
                    areaSqFt = Number(prompt('Total Area (Sq.Ft) bataiye?', String(defaultArea)));
                    totalAmount = ratePerSqFt * areaSqFt;
                  } else {
                    totalAmount = Number(prompt('Total lumpsum theka amount (₹)?'));
                  }
                  
                  const startDate = prompt('Start date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10));
                  const notes = prompt('Notes?') || '';
                  const newTheka: Theka = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    workType: workType || 'Civil',
                    totalAmount,
                    payments: [],
                    startDate: startDate || new Date().toISOString(),
                    notes,
                    ratePerSqFt: ratePerSqFt || undefined,
                    areaSqFt: areaSqFt || undefined,
                  };
                  setState(prev => ({ ...prev, thekas: [...prev.thekas, newTheka] }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.thekas.map(theka => {
              const totalPaid = theka.payments.reduce((a, p) => a + p.amount, 0);
              const remaining = theka.totalAmount - totalPaid;
              const pct = theka.totalAmount > 0 ? (totalPaid / theka.totalAmount) * 100 : 0;
              return (
                <div key={theka.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Header */}
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
                      <button
                        onClick={() => {
                          const name = prompt('Thekedar naam?', theka.name);
                          if (!name) return;
                          const totalAmount = Number(prompt('Total amount?', String(theka.totalAmount)));
                          const notes = prompt('Notes?', theka.notes) || '';
                          setState(prev => ({
                            ...prev,
                            thekas: prev.thekas.map(t => t.id === theka.id ? { ...t, name, totalAmount, notes } : t)
                          }));
                        }}
                        className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => askConfirm(`"${theka.name}" ka theka delete kar dein?`, () => {
                          setState(prev => ({ ...prev, thekas: prev.thekas.filter(t => t.id !== theka.id) }));
                        })}
                        className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-4 pb-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-green-600">Diya: {formatCurrency(totalPaid)}</span>
                      <span className="text-red-500">Baaki: {formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {/* Payment history */}
                  {theka.payments.length > 0 && (
                    <div className="border-t border-slate-50 px-4 py-2 space-y-2">
                      {[...theka.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-sm">
                          <div>
                            <p className="font-bold text-slate-700">{formatCurrency(payment.amount)}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{format(new Date(payment.date), 'dd MMM yyyy')} {payment.note && `• ${payment.note}`}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const amount = Number(prompt('Amount?', String(payment.amount)));
                                if (!amount) return;
                                const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(payment.date), 'yyyy-MM-dd')) || format(new Date(payment.date), 'yyyy-MM-dd');
                                const note = prompt('Note?', payment.note) || '';
                                setState(prev => ({
                                  ...prev,
                                  thekas: prev.thekas.map(t => t.id === theka.id
                                    ? { ...t, payments: t.payments.map(p => p.id === payment.id ? { ...p, amount, date: new Date(dateStr).toISOString(), note } : p) }
                                    : t),
                                  expenses: prev.expenses.map(e => e.id === payment.id ? { ...e, amount, date: new Date(dateStr).toISOString(), notes: `${theka.name} (${theka.workType}) - ${note}` } : e)
                                }));
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-500"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => askConfirm('Is theka payment ko delete kar dein?', () => {
                                setState(prev => ({
                                  ...prev,
                                  thekas: prev.thekas.map(t => t.id === theka.id
                                    ? { ...t, payments: t.payments.filter(p => p.id !== payment.id) }
                                    : t),
                                  expenses: prev.expenses.filter(e => e.id !== payment.id)
                                }));
                              })}
                              className="p-1 text-red-300 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add payment */}
                  <div className="border-t border-slate-50 p-3">
                    <button
                      onClick={() => {
                        const amount = Number(prompt(`${theka.name} ko kitna diya?`));
                        if (!amount) return;
                        const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                        const note = prompt('Note (optional)?') || '';
                        const paymentId = Math.random().toString(36).substr(2, 9);
                        setState(prev => ({
                          ...prev,
                          thekas: prev.thekas.map(t => t.id === theka.id
                            ? { ...t, payments: [...t.payments, { id: paymentId, date: new Date(dateStr).toISOString(), amount, note }] }
                            : t),
                          expenses: [...prev.expenses, {
                            id: paymentId,
                            date: new Date(dateStr).toISOString(),
                            amount,
                            category: 'Theka',
                            notes: `${theka.name} (${theka.workType}) - ${note}`
                          }]
                        }));
                      }}
                      className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
                    >
                      + Payment Add Karo
                    </button>
                  </div>
                </div>
              );
            })}

            {state.thekas.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm">
                Koi theka nahi mila. Upar + se add karo.
              </div>
            )}
          </div>
        )}

        {subTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Kharcha Paani</h3>
              <button 
                onClick={() => {
                  const amount = Number(prompt('Amount?'));
                  if (!amount) return;
                  const category = prompt('Category (Material/Labour/Theka/Equipment/Transport/Misc)?') as any;
                  const notes = prompt('Notes?');
                  const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                  
                  setState(prev => ({
                    ...prev,
                    expenses: [{
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date(dateStr).toISOString(),
                      amount,
                      category: category || 'Misc',
                      notes: notes || ''
                    }, ...prev.expenses]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {[...state.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map(expense => (
                <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{expense.category}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{format(new Date(expense.date), 'dd MMM, HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[80px]">{expense.notes}</p>
                    </div>
                    <button
                      onClick={() => {
                        const amount = Number(prompt('Amount?', String(expense.amount)));
                        if (!amount) return;
                        const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(expense.date), 'yyyy-MM-dd')) || format(new Date(expense.date), 'yyyy-MM-dd');
                        const notes = prompt('Notes?', expense.notes);
                        setState(prev => ({
                          ...prev,
                          expenses: prev.expenses.map(e => e.id === expense.id ? { ...e, amount, date: new Date(dateStr).toISOString(), notes: notes || '' } : e)
                        }));
                      }}
                      className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askConfirm('Is kharche ko delete kar dein?', () => {
                        setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== expense.id) }));
                      })}
                      className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Kaam ki Raftaar</h3>
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {state.milestones.map((milestone, idx) => (
                <div key={milestone.id} className="relative">
                  <div className={cn(
                    "absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10",
                    milestone.status === 'completed' ? 'bg-green-500' : 
                    milestone.status === 'in-progress' ? 'bg-indigo-500' : 'bg-slate-200'
                  )} />
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">{milestone.phase}</h4>
                      <select 
                        value={milestone.status}
                        onChange={(e) => {
                          setState(prev => ({
                            ...prev,
                            milestones: prev.milestones.map(m => m.id === milestone.id ? { ...m, status: e.target.value as any } : m)
                          }));
                        }}
                        className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-0"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDemolition = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'bricks', label: 'Eent Bachao', icon: TrendingUp },
      { id: 'malwa', label: 'Malwa', icon: Trash2 },
      { id: 'scrap', label: 'Kabaad', icon: Package },
      { id: 'theka', label: 'Theka', icon: ChevronRight },
    ];

    return (
      <div className="space-y-6 pb-28">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Tod-Phod</h1>
          <p className="text-slate-500 text-sm">Demolition Tracker</p>
        </header>

        <div
          ref={demolitionTabsDrag.ref}
          onMouseDown={demolitionTabsDrag.onMouseDown}
          onMouseMove={demolitionTabsDrag.onMouseMove}
          onMouseUp={demolitionTabsDrag.onMouseUp}
          onMouseLeave={demolitionTabsDrag.onMouseLeave}
          className="-mx-4 flex gap-2 overflow-x-auto pb-2 px-4 no-scrollbar cursor-grab"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0",
                subTab === tab.id 
                  ? "bg-orange-600 text-white shadow-md shadow-orange-100" 
                  : "bg-white text-slate-600 border border-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
          <span className="shrink-0 w-4" />
        </div>

        {subTab === 'overview' && (
          <div className="space-y-4">
            {/* Cost Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Kharcha (Cost)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Malwa Disposal</span>
                  <span className="font-bold text-red-500">-{formatCurrency(malwaCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Theka Diya (Paid)</span>
                  <span className="font-bold text-red-500">-{formatCurrency(demolitionThekaCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Theka Baaki (Pending)</span>
                  <span className="font-bold text-orange-500">-{formatCurrency(demolitionThekaPending)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Total Kharcha</span>
                  <span className="font-bold text-red-600">{formatCurrency(malwaCost + demolitionThekaCost)}</span>
                </div>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Kamai (Income)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Scrap Income</span>
                  <span className="font-bold text-green-600">+{formatCurrency(scrapIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Brick Recovery Value</span>
                  <span className="font-bold text-green-600">+{formatCurrency(brickRecoveryValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Bricks Recovered</span>
                  <span className="font-bold text-blue-600">{formatNumber(state.brickRecovery.reduce((a, b) => a + b.recovered, 0))} pcs</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Total Kamai</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalRecovery)}</span>
                </div>
              </div>
            </div>

            {/* Net */}
            <div className={cn(
              "p-6 rounded-3xl border shadow-sm",
              totalRecovery - malwaCost - demolitionThekaCost >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
            )}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold uppercase text-slate-500">Net Bachat</p>
                  <p className="text-xs text-slate-400">Kamai − Kharcha (paid)</p>
                </div>
                <span className={cn(
                  "text-2xl font-bold",
                  totalRecovery - malwaCost - demolitionThekaCost >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(totalRecovery - malwaCost - demolitionThekaCost)}
                </span>
              </div>
            </div>

            {/* Theka summary cards */}
            {(state.demolitionThekas || []).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Thekedar Status</h3>
                {(state.demolitionThekas || []).map(t => {
                  const paid = t.payments.reduce((a, p) => a + p.amount, 0);
                  const pct = t.totalAmount > 0 ? (paid / t.totalAmount) * 100 : 0;
                  return (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">{t.workType}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Baaki</p>
                          <p className="font-bold text-red-500">{formatCurrency(t.totalAmount - paid)}</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 text-right">{pct.toFixed(0)}% paid</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {subTab === 'bricks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Eent Bachao Counter</h3>
              <button 
                onClick={() => {
                  const recovered = Number(prompt('Bricks Recovered today?'));
                  const broken = Number(prompt('Bricks Broken?'));
                  const rate = Number(prompt('Rate per brick (₹)?'));
                  const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                  
                  setState(prev => ({
                    ...prev,
                    brickRecovery: [...prev.brickRecovery, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date(dateStr).toISOString(),
                      estimated: recovered + broken,
                      recovered,
                      broken,
                      ratePerBrick: rate || 7
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Totals summary */}
            {state.brickRecovery.length > 0 && (() => {
              const totalRecovered = state.brickRecovery.reduce((a, b) => a + b.recovered, 0);
              const totalBroken = state.brickRecovery.reduce((a, b) => a + b.broken, 0);
              const totalEstimated = state.brickRecovery.reduce((a, b) => a + b.estimated, 0);
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 p-3 rounded-2xl border border-green-100 text-center">
                    <p className="text-[10px] font-bold text-green-500 uppercase mb-0.5">Bachao</p>
                    <p className="text-lg font-bold text-green-700">{formatNumber(totalRecovered)}</p>
                    <p className="text-[10px] text-green-400 font-bold">pcs</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-center">
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-0.5">Tooti</p>
                    <p className="text-lg font-bold text-red-600">{formatNumber(totalBroken)}</p>
                    <p className="text-[10px] text-red-300 font-bold">pcs</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kul</p>
                    <p className="text-lg font-bold text-slate-700">{formatNumber(totalEstimated)}</p>
                    <p className="text-[10px] text-slate-400 font-bold">pcs</p>
                  </div>
                </div>
              );
            })()}

            {[...state.brickRecovery].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{format(new Date(entry.date), 'dd MMM yyyy')}</h4>
                    <p className="text-xs text-slate-500">Recovery Rate: {((entry.recovered / (entry.recovered + entry.broken)) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-green-600">+{formatCurrency(entry.recovered * entry.ratePerBrick)}</p>
                    <button
                      onClick={() => {
                        const recovered = Number(prompt('Bricks Recovered?', String(entry.recovered)));
                        const broken = Number(prompt('Bricks Broken?', String(entry.broken)));
                        const rate = Number(prompt('Rate per brick (₹)?', String(entry.ratePerBrick)));
                        const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(entry.date), 'yyyy-MM-dd')) || format(new Date(entry.date), 'yyyy-MM-dd');
                        setState(prev => ({
                          ...prev,
                          brickRecovery: prev.brickRecovery.map(b => b.id === entry.id ? { ...b, recovered, broken, estimated: recovered + broken, ratePerBrick: rate, date: new Date(dateStr).toISOString() } : b)
                        }));
                      }}
                      className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askConfirm('Is brick recovery entry ko delete kar dein?', () => {
                        setState(prev => ({ ...prev, brickRecovery: prev.brickRecovery.filter(b => b.id !== entry.id) }));
                      })}
                      className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1 bg-green-50 p-2 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-green-600 uppercase">Recovered</p>
                    <p className="font-bold text-green-700">{entry.recovered}</p>
                  </div>
                  <div className="flex-1 bg-red-50 p-2 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-red-600 uppercase">Broken</p>
                    <p className="font-bold text-red-700">{entry.broken}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'malwa' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Malwa Report</h3>
              <button 
                onClick={() => {
                  const trips = Number(prompt('Trolley/Trips disposed?'));
                  const cost = Number(prompt('Cost per trip?'));
                  const vendor = prompt('Vendor Name?');
                  const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                  
                  setState(prev => ({
                    ...prev,
                    malwa: [...prev.malwa, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date(dateStr).toISOString(),
                      generated: trips,
                      disposed: trips,
                      costPerTrip: cost,
                      vendor: vendor || ''
                    }],
                    expenses: [...prev.expenses, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date(dateStr).toISOString(),
                      amount: trips * cost,
                      category: 'Transport',
                      notes: `Malwa disposal: ${trips} trips`
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {[...state.malwa].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900">{entry.disposed} Trolleys</h4>
                  <p className="text-xs text-slate-500">{format(new Date(entry.date), 'dd MMM yyyy')} • {entry.vendor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-red-500">-{formatCurrency(entry.disposed * entry.costPerTrip)}</p>
                  <button
                    onClick={() => {
                      const trips = Number(prompt('Trolleys disposed?', String(entry.disposed)));
                      const cost = Number(prompt('Cost per trip?', String(entry.costPerTrip)));
                      const vendor = prompt('Vendor Name?', entry.vendor);
                      const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(entry.date), 'yyyy-MM-dd')) || format(new Date(entry.date), 'yyyy-MM-dd');
                      setState(prev => ({
                        ...prev,
                        malwa: prev.malwa.map(m => m.id === entry.id ? { ...m, disposed: trips, generated: trips, costPerTrip: cost, vendor: vendor || '', date: new Date(dateStr).toISOString() } : m)
                      }));
                    }}
                    className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm('Is malwa entry ko delete kar dein?', () => {
                      setState(prev => ({ ...prev, malwa: prev.malwa.filter(m => m.id !== entry.id) }));
                    })}
                    className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'scrap' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Kabaad se Kamai</h3>
              <button 
                onClick={() => {
                  const type = prompt('Scrap Type (Iron/Steel/Copper)?');
                  const qty = Number(prompt('Quantity?'));
                  const unit = prompt('Unit (kg/pcs)?');
                  const rate = Number(prompt('Rate per unit?'));
                  const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                  
                  setState(prev => ({
                    ...prev,
                    scrap: [...prev.scrap, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date(dateStr).toISOString(),
                      type: type || 'Misc',
                      quantity: qty,
                      unit: unit || 'kg',
                      dealer: '',
                      rate
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {[...state.scrap].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900">{entry.type}</h4>
                  <p className="text-xs text-slate-500">{entry.quantity} {entry.unit} @ {formatCurrency(entry.rate)}</p>
                  {entry.date && <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{format(new Date(entry.date), 'dd MMM yyyy')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-green-600">+{formatCurrency(entry.quantity * entry.rate)}</p>
                  <button
                    onClick={() => {
                      const type = prompt('Scrap Type?', entry.type);
                      if (!type) return;
                      const qty = Number(prompt('Quantity?', String(entry.quantity)));
                      const rate = Number(prompt('Rate per unit?', String(entry.rate)));
                      const dateStr = prompt('Date (YYYY-MM-DD)?', entry.date ? format(new Date(entry.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                      setState(prev => ({
                        ...prev,
                        scrap: prev.scrap.map(s => s.id === entry.id ? { ...s, type, quantity: qty, rate, date: new Date(dateStr).toISOString() } : s)
                      }));
                    }}
                    className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm('Is scrap entry ko delete kar dein?', () => {
                      setState(prev => ({ ...prev, scrap: prev.scrap.filter(s => s.id !== entry.id) }));
                    })}
                    className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'theka' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Tod-Phod Theka</h3>
              <button
                onClick={() => {
                  const name = prompt('Thekedar ka naam?');
                  if (!name) return;
                  const workType = prompt('Kaam ka type? (Tod-Phod/Malwa Hatao/Cutting/Other)') as DemolitionTheka['workType'];
                  const totalAmount = Number(prompt('Total theka amount (₹)?'));
                  const startDate = prompt('Start date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10));
                  const notes = prompt('Notes?') || '';
                  setState(prev => ({
                    ...prev,
                    demolitionThekas: [...(prev.demolitionThekas || []), {
                      id: Math.random().toString(36).substr(2, 9),
                      name,
                      workType: workType || 'Tod-Phod',
                      totalAmount,
                      payments: [],
                      startDate: startDate || new Date().toISOString(),
                      notes,
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {(state.demolitionThekas || []).map(theka => {
              const totalPaid = theka.payments.reduce((a, p) => a + p.amount, 0);
              const remaining = theka.totalAmount - totalPaid;
              const pct = theka.totalAmount > 0 ? (totalPaid / theka.totalAmount) * 100 : 0;
              return (
                <div key={theka.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{theka.name}</h4>
                      <span className="text-xs font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">{theka.workType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
                        <p className="font-bold text-slate-900">{formatCurrency(theka.totalAmount)}</p>
                      </div>
                      <button
                        onClick={() => {
                          const name = prompt('Thekedar naam?', theka.name);
                          if (!name) return;
                          const totalAmount = Number(prompt('Total amount?', String(theka.totalAmount)));
                          const notes = prompt('Notes?', theka.notes) || '';
                          setState(prev => ({
                            ...prev,
                            demolitionThekas: (prev.demolitionThekas || []).map(t => t.id === theka.id ? { ...t, name, totalAmount, notes } : t)
                          }));
                        }}
                        className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => askConfirm(`"${theka.name}" ka demolition theka delete kar dein?`, () => {
                          setState(prev => ({ ...prev, demolitionThekas: (prev.demolitionThekas || []).filter(t => t.id !== theka.id) }));
                        })}
                        className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
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
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{format(new Date(payment.date), 'dd MMM yyyy')}{payment.note && ` • ${payment.note}`}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const amount = Number(prompt('Amount?', String(payment.amount)));
                                if (!amount) return;
                                const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(payment.date), 'yyyy-MM-dd')) || format(new Date(payment.date), 'yyyy-MM-dd');
                                const note = prompt('Note?', payment.note) || '';
                                setState(prev => ({
                                  ...prev,
                                  demolitionThekas: (prev.demolitionThekas || []).map(t => t.id === theka.id
                                    ? { ...t, payments: t.payments.map(p => p.id === payment.id ? { ...p, amount, date: new Date(dateStr).toISOString(), note } : p) }
                                    : t),
                                }));
                              }}
                              className="p-1 text-slate-400 hover:text-orange-500"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => askConfirm('Is demolition theka payment ko delete kar dein?', () => {
                                setState(prev => ({
                                  ...prev,
                                  demolitionThekas: (prev.demolitionThekas || []).map(t => t.id === theka.id
                                    ? { ...t, payments: t.payments.filter(p => p.id !== payment.id) }
                                    : t),
                                }));
                              })}
                              className="p-1 text-red-300 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-50 p-3">
                    <button
                      onClick={() => {
                        const amount = Number(prompt(`${theka.name} ko kitna diya?`));
                        if (!amount) return;
                        const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                        const note = prompt('Note (optional)?') || '';
                        const paymentId = Math.random().toString(36).substr(2, 9);
                        setState(prev => ({
                          ...prev,
                          demolitionThekas: (prev.demolitionThekas || []).map(t => t.id === theka.id
                            ? { ...t, payments: [...t.payments, { id: paymentId, date: new Date(dateStr).toISOString(), amount, note }] }
                            : t),
                        }));
                      }}
                      className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100"
                    >
                      + Payment Add Karo
                    </button>
                  </div>
                </div>
              );
            })}

            {(state.demolitionThekas || []).length === 0 && (
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm">
                Koi theka nahi mila. Upar + se add karo.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderKiraya = () => {
    const totalMonthlyRent = (state.rentals || []).reduce((a, r) => a + r.monthlyRent, 0);
    const totalPaidRent = (state.rentals || []).reduce((a, r) => a + r.payments.reduce((s, p) => s + p.amount, 0), 0);

    return (
      <div className="space-y-6 pb-28">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kiraya Hisaab</h1>
            <p className="text-slate-500 text-sm">Rent Tracker</p>
          </div>
          <button
            onClick={() => {
              const name = prompt('Property ka naam? (e.g. Basement, 1BHK)');
              if (!name) return;
              const type = prompt('Type? (Basement/1BHK/2BHK/Shop/Other)') as RentalProperty['type'];
              const monthlyRent = Number(prompt('Monthly rent (₹)?'));
              const deposit = Number(prompt('Security deposit (₹)? (0 if none)') || '0');
              const depositStatus: RentalProperty['depositStatus'] = deposit > 0
                ? (prompt('Deposit status?\n1. pending - dena baaki hai\n2. paid - de diya, wapas milega\nType: pending ya paid') === 'paid' ? 'paid' : 'pending')
                : 'pending';
              const ownerName = prompt('Makan malik ka naam?') || '';
              const ownerPhone = prompt('Makan malik ka phone?') || '';
              const startDate = prompt('Rent start date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10)) || new Date().toISOString();
              const agreementEndDate = prompt('Agreement end date (YYYY-MM-DD)?', '') || '';
              const agreementNote = prompt('Agreement notes? (e.g. 11 month, notice period)') || '';
              setState(prev => ({
                ...prev,
                rentals: [...(prev.rentals || []), {
                  id: Math.random().toString(36).substr(2, 9),
                  name,
                  type: type || 'Other',
                  monthlyRent,
                  deposit,
                  depositStatus,
                  ownerName,
                  ownerPhone,
                  startDate,
                  agreementEndDate,
                  agreementNote,
                  payments: [],
                }]
              }));
            }}
            className="p-2 bg-violet-600 text-white rounded-full"
          >
            <Plus size={20} />
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-violet-600 text-white p-4 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Monthly Rent</p>
            <p className="text-xl font-bold">{formatCurrency(totalMonthlyRent)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Rent Diya</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPaidRent)}</p>
          </div>
          {depositPaid > 0 && (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-blue-500 mb-0.5">Deposit Diya ✓</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(depositPaid)}</p>
              <p className="text-[10px] text-blue-400 font-bold mt-0.5">Paisa gaya • ghar khaali karne pe wapas milega</p>
            </div>
          )}
          {depositPending > 0 && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-orange-500 mb-0.5">Deposit Dena Baaki ⏳</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(depositPending)}</p>
              <p className="text-[10px] text-orange-400 font-bold mt-0.5">Maine abhi nahi diya</p>
            </div>
          )}
          {depositWapas > 0 && (
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-green-500 mb-0.5">Deposit Wapas Milega 🔄</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(depositWapas)}</p>
              <p className="text-[10px] text-green-400 font-bold mt-0.5">Jab ghar khaali karunga</p>
            </div>
          )}
        </div>

        {/* Property cards */}
        {(state.rentals || []).map(rental => {
          const totalPaid = rental.payments.reduce((a, p) => a + p.amount, 0);
          const currentMonth = format(new Date(), 'yyyy-MM');
          const paidThisMonth = rental.payments.filter(p => p.month === currentMonth).reduce((a, p) => a + p.amount, 0);
          const thisMonthDone = paidThisMonth >= rental.monthlyRent;
          const depositUsedForRent = rental.payments.filter(p => p.paidFromDeposit).reduce((a, p) => a + p.amount, 0);
          const depositRemaining = rental.deposit - depositUsedForRent;

          return (
            <div key={rental.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-violet-500" />
                    <h4 className="font-bold text-slate-900">{rental.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">{rental.type}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{rental.ownerName}{rental.ownerPhone ? ` • ${rental.ownerPhone}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const name = prompt('Property naam?', rental.name);
                      if (!name) return;
                      const monthlyRent = Number(prompt('Monthly rent?', String(rental.monthlyRent)));
                      const deposit = Number(prompt('Security deposit?', String(rental.deposit || 0)));
                      const depositStatus: RentalProperty['depositStatus'] = deposit > 0
                        ? ((prompt('Deposit status? (pending/paid/refunded/forfeited)', rental.depositStatus || 'pending') || 'pending') as RentalProperty['depositStatus'])
                        : 'pending';
                      const ownerName = prompt('Makan malik?', rental.ownerName) || '';
                      const ownerPhone = prompt('Phone?', rental.ownerPhone || '') || '';
                      const agreementEndDate = prompt('Agreement end date (YYYY-MM-DD)?', rental.agreementEndDate || '') || '';
                      const agreementNote = prompt('Agreement notes?', rental.agreementNote || '') || '';
                      setState(prev => ({
                        ...prev,
                        rentals: (prev.rentals || []).map(r => r.id === rental.id
                          ? { ...r, name, monthlyRent, deposit, depositStatus, ownerName, ownerPhone, agreementEndDate, agreementNote }
                          : r)
                      }));
                    }}
                    className="p-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askConfirm(`"${rental.name}" rental property ko delete kar dein?`, () => {
                      setState(prev => ({ ...prev, rentals: (prev.rentals || []).filter(r => r.id !== rental.id) }));
                    })}
                    className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Rent + Deposit info */}
              <div className="px-4 pb-3 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Monthly Rent</p>
                  <p className="font-bold text-slate-900">{formatCurrency(rental.monthlyRent)}</p>
                </div>
                <div className={cn("p-3 rounded-xl", rental.deposit > 0 ? (
                  (() => {
                    const s = getDepositStatus(rental);
                    return s === 'paid' ? "bg-blue-50" : s === 'refunded' ? "bg-green-50" : s === 'forfeited' ? "bg-red-50" : "bg-orange-50";
                  })()
                ) : "bg-slate-50")}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Security Deposit</p>
                  {rental.deposit > 0 ? (
                    <div>
                      <p className="font-bold text-slate-900">{formatCurrency(rental.deposit)}</p>
                      <p className={cn("text-[10px] font-bold mt-0.5", (() => {
                        const s = getDepositStatus(rental);
                        return s === 'paid' ? "text-blue-600" : s === 'refunded' ? "text-green-600" : s === 'forfeited' ? "text-red-600" : "text-orange-600";
                      })())}>
                        {(() => {
                          const s = getDepositStatus(rental);
                          if (s === 'pending') return '⏳ Dena Baaki';
                          if (s === 'paid') return '✓ Diya • Wapas Milega';
                          if (s === 'refunded') return '✓ Wapas Mil Gaya';
                          if (s === 'forfeited') return '✗ Kaat Liya Gaya';
                        })()}
                      </p>
                    </div>
                  ) : (
                    <p className="font-bold text-slate-400">—</p>
                  )}
                </div>
                {depositUsedForRent > 0 && (
                  <div className="col-span-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">Deposit Remaining</p>
                        <p className="font-bold text-indigo-700">{formatCurrency(Math.max(0, depositRemaining))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-indigo-300 uppercase mb-0.5">Rent se Kata</p>
                        <p className="font-bold text-indigo-400">- {formatCurrency(depositUsedForRent)}</p>
                      </div>
                    </div>
                    {depositRemaining <= 0 && (
                      <p className="text-[10px] font-bold text-red-400 mt-1">Deposit khatam — ab online dena hoga</p>
                    )}
                  </div>
                )}
              </div>

              {/* Agreement info */}
              {(rental.agreementEndDate || rental.agreementNote) && (
                <div className="mx-4 mb-3 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-0.5">
                  {rental.agreementEndDate && (
                    <p className="font-bold">Agreement ends: {format(new Date(rental.agreementEndDate), 'dd MMM yyyy')}</p>
                  )}
                  {rental.agreementNote && <p className="opacity-80">{rental.agreementNote}</p>}
                </div>
              )}

              {/* This month status */}
              <div className={cn("mx-4 mb-3 px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center",
                thisMonthDone ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
              )}>
                <span>{format(new Date(), 'MMMM yyyy')}</span>
                <span>{thisMonthDone ? `✓ Paid ${formatCurrency(paidThisMonth)}` : `Baaki: ${formatCurrency(rental.monthlyRent - paidThisMonth)}`}</span>
              </div>

              {/* Payment history */}
              {rental.payments.length > 0 && (
                <div className="border-t border-slate-50 px-4 py-2 space-y-2 max-h-40 overflow-y-auto">
                  {[...rental.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-700">{formatCurrency(payment.amount)}</p>
                          {payment.paidFromDeposit && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-500 rounded-full">Deposit se</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {format(new Date(payment.date), 'dd MMM yyyy')} • {payment.month}
                          {payment.note && ` • ${payment.note}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const amount = Number(prompt('Amount?', String(payment.amount)));
                            if (!amount) return;
                            const month = prompt('Mahina (YYYY-MM)?', payment.month) || payment.month;
                            const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(payment.date), 'yyyy-MM-dd')) || format(new Date(payment.date), 'yyyy-MM-dd');
                            const note = prompt('Note?', payment.note) || '';
                            const fromDepositStr = prompt('Deposit se kata? (haan/nahi)', payment.paidFromDeposit ? 'haan' : 'nahi') || 'nahi';
                            const paidFromDeposit = fromDepositStr.toLowerCase() === 'haan';
                            setState(prev => ({
                              ...prev,
                              rentals: (prev.rentals || []).map(r => r.id === rental.id
                                ? { ...r, payments: r.payments.map(p => p.id === payment.id ? { ...p, amount, month, date: new Date(dateStr).toISOString(), note, paidFromDeposit } : p) }
                                : r)
                            }));
                          }}
                          className="p-1 text-slate-400 hover:text-violet-500"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => askConfirm('Is rent payment ko delete kar dein?', () => {
                            setState(prev => ({
                              ...prev,
                              rentals: (prev.rentals || []).map(r => r.id === rental.id
                                ? { ...r, payments: r.payments.filter(p => p.id !== payment.id) }
                                : r)
                            }));
                          })}
                          className="p-1 text-red-300 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add payment */}
              <div className="border-t border-slate-50 p-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const amount = Number(prompt(`${rental.name} ka rent kitna diya?`, String(rental.monthlyRent)));
                      if (!amount) return;
                      const month = prompt('Kis mahine ka? (YYYY-MM)', format(new Date(), 'yyyy-MM')) || format(new Date(), 'yyyy-MM');
                      const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                      const note = prompt('Note (optional)?') || '';
                      setState(prev => ({
                        ...prev,
                        rentals: (prev.rentals || []).map(r => r.id === rental.id
                          ? { ...r, payments: [...r.payments, { id: Math.random().toString(36).substr(2, 9), date: new Date(dateStr).toISOString(), amount, month, note, paidFromDeposit: false }] }
                          : r)
                      }));
                    }}
                    className="flex-1 py-2 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold border border-violet-100"
                  >
                    + Online/Cash
                  </button>
                  {getDepositStatus(rental) === 'paid' && depositRemaining > 0 && (
                    <button
                      onClick={() => {
                        const maxFromDeposit = depositRemaining;
                        const amount = Number(prompt(`Deposit se kitna kata? (Max: ₹${maxFromDeposit})`, String(Math.min(rental.monthlyRent, maxFromDeposit))));
                        if (!amount) return;
                        const month = prompt('Kis mahine ka? (YYYY-MM)', format(new Date(), 'yyyy-MM')) || format(new Date(), 'yyyy-MM');
                        const dateStr = prompt('Date (YYYY-MM-DD)?', format(new Date(), 'yyyy-MM-dd')) || format(new Date(), 'yyyy-MM-dd');
                        const note = prompt('Note (optional)?') || '';
                        setState(prev => ({
                          ...prev,
                          rentals: (prev.rentals || []).map(r => r.id === rental.id
                            ? { ...r, payments: [...r.payments, { id: Math.random().toString(36).substr(2, 9), date: new Date(dateStr).toISOString(), amount, month, note, paidFromDeposit: true }] }
                            : r)
                        }));
                      }}
                      className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
                    >
                      + Deposit se
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {(state.rentals || []).length === 0 && (
          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm">
            Koi property nahi mili. Upar + se add karo.
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6 pb-28">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Project Taiyari</p>
        </header>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Project Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Project Name</label>
              <input 
                type="text" 
                value={state.project?.name || ''} 
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), name: e.target.value } }))}
                className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sharma Sadan"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
              <input 
                type="text" 
                value={state.project?.location || ''} 
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), location: e.target.value } }))}
                className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sector 15, Noida"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Master Budget — Sab Milake (₹)</label>
              <input
                type="number"
                value={state.project?.masterBudget || ''}
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), masterBudget: Number(e.target.value) } }))}
                className="w-full mt-1 p-3 bg-indigo-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 8000000 (construction + rent + misc sab)"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Construction Budget (₹)</label>
              <input 
                type="number" 
                value={state.project?.budget || ''} 
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), budget: Number(e.target.value) } }))}
                className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 5000000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Plot Size (e.g. 20x80)</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" placeholder="W (ft)" value={state.project?.plotWidth || ''} onChange={(e) => setState(prev => { const w = Number(e.target.value); const l = prev.project?.plotLength || 0; const f = prev.project?.floors || 1; return { ...prev, project: { ...(prev.project || {} as Project), plotWidth: w, totalArea: w * l * f } }; })} className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm" />
                  <span className="self-center text-slate-400">×</span>
                  <input type="number" placeholder="L (ft)" value={state.project?.plotLength || ''} onChange={(e) => setState(prev => { const l = Number(e.target.value); const w = prev.project?.plotWidth || 0; const f = prev.project?.floors || 1; return { ...prev, project: { ...(prev.project || {} as Project), plotLength: l, totalArea: w * l * f } }; })} className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Kitne Floor Banenge?</label>
                <input type="number" value={state.project?.floors || ''} onChange={(e) => setState(prev => { const f = Number(e.target.value); const w = prev.project?.plotWidth || 0; const l = prev.project?.plotLength || 0; return { ...prev, project: { ...(prev.project || {} as Project), floors: f, totalArea: w * l * f } }; })} className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="e.g. 2" />
              </div>
            </div>
            {state.project?.totalArea ? (
              <div className="bg-indigo-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-indigo-600 font-bold uppercase">Estimated Total Area</p>
                <p className="text-xl font-bold text-indigo-900">{state.project.totalArea} Sq.Ft</p>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                <input 
                  type="date" 
                  value={state.project?.startDate || ''} 
                  onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), startDate: e.target.value } }))}
                  className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
                <input 
                  type="date" 
                  value={state.project?.endDate || ''} 
                  onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), endDate: e.target.value } }))}
                  className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900">Cloud Sync</h3>
          <div className={cn("flex items-center justify-between p-3 rounded-2xl", {
            'bg-green-50': syncStatus === 'synced',
            'bg-blue-50': syncStatus === 'syncing',
            'bg-red-50': syncStatus === 'error',
            'bg-slate-50': syncStatus === 'offline' || syncStatus === 'loading',
          })}>
            <div className="flex items-center gap-2.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", {
                'bg-green-500': syncStatus === 'synced',
                'bg-blue-500 animate-pulse': syncStatus === 'syncing',
                'bg-red-500': syncStatus === 'error',
                'bg-slate-400': syncStatus === 'offline' || syncStatus === 'loading',
              })} />
              <div>
                <p className={cn("text-sm font-bold", {
                  'text-green-700': syncStatus === 'synced',
                  'text-blue-700': syncStatus === 'syncing',
                  'text-red-700': syncStatus === 'error',
                  'text-slate-600': syncStatus === 'offline' || syncStatus === 'loading',
                })}>
                  {syncStatus === 'synced' && 'Connected — Synced'}
                  {syncStatus === 'syncing' && 'Sync ho raha hai...'}
                  {syncStatus === 'error' && 'Sync Error'}
                  {syncStatus === 'offline' && 'Offline — Login Karein'}
                  {syncStatus === 'loading' && 'Connect ho raha hai...'}
                </p>
                {userEmail && (
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{userEmail}</p>
                )}
                {lastSynced && (
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Synced: {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
                {syncError && (
                  <p className="text-[10px] text-red-400 font-bold mt-0.5">{syncError}</p>
                )}
              </div>
            </div>
            <button
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              className={cn("text-xs font-bold px-3 py-1.5 rounded-xl border disabled:opacity-50", {
                'bg-green-100 text-green-700 border-green-200': syncStatus === 'synced',
                'bg-blue-100 text-blue-700 border-blue-200': syncStatus === 'syncing',
                'bg-red-100 text-red-700 border-red-200': syncStatus === 'error',
                'bg-slate-100 text-slate-600 border-slate-200': syncStatus === 'offline' || syncStatus === 'loading',
              })}
            >
              {syncStatus === 'syncing' ? '...' : '↻ Sync'}
            </button>
          </div>
          {cloudUpdatedAt && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] text-slate-500 font-bold">
              ☁ Cloud last updated: {cloudUpdatedAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Phone pe add kiya aur yahan nahi dikh raha? <span className="font-bold">↻ Sync</span> dabao — cloud se latest data aa jayega.
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900">Account</h3>

          {pwForm.open ? (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Naya Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                  className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Password Confirm Karein</label>
                <input
                  type="password"
                  required
                  value={pwForm.confirmPw}
                  onChange={e => setPwForm(p => ({ ...p, confirmPw: e.target.value }))}
                  className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              {pwForm.error && <p className="text-xs text-red-500 font-bold">{pwForm.error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPwForm({ open: false, newPw: '', confirmPw: '', loading: false, error: '', success: '' })}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwForm.loading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-60"
                >
                  {pwForm.loading ? 'Save ho raha hai...' : 'Password Badlein'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPwForm(p => ({ ...p, open: true }))}
                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm border border-indigo-100"
              >
                Password Badlein
              </button>
              <button
                onClick={() => askConfirm('Kya aap logout karna chahte hain?', handleLogout, 'Logout', 'Logout')}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => askConfirm('Saara data delete ho jayega aur app reset ho jayega. Kya aap bilkul sure hain?', () => {
            setState(INITIAL_STATE);
          }, 'Reset All Data?', 'Reset Karein')}
          className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-bold border border-red-100"
        >
          Reset All Data
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p>Cloud se aapka hisaab laa rahe hain...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none transition-all"
          style={{ height: `${pullY}px` }}
        >
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-md transition-all",
            pullY >= PULL_THRESHOLD
              ? syncStatus === 'error' ? "bg-orange-100 text-orange-600" : "bg-indigo-600 text-white"
              : "bg-white text-slate-400 border border-slate-200"
          )}>
            {pullY >= PULL_THRESHOLD ? (
              syncStatus === 'error' ? '⚠ Unsaved data — chord do' : '↑ Chord do to sync hoga'
            ) : '↓ Neeche kheencho to sync hoga'}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {pullToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-lg max-w-xs text-center">
          {pullToast}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-[max(env(safe-area-inset-top),24px)]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'construction' && renderConstruction()}
        {activeTab === 'demolition' && renderDemolition()}
        {activeTab === 'kiraya' && renderKiraya()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => { setActiveTab('dashboard'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-indigo-600" : "text-slate-400")}
        >
          <LayoutDashboard size={22} />
          <span className="text-[9px] font-bold uppercase">Hisaab</span>
        </button>
        <button 
          onClick={() => { setActiveTab('construction'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'construction' ? "text-indigo-600" : "text-slate-400")}
        >
          <Construction size={22} />
          <span className="text-[9px] font-bold uppercase">Naya Kaam</span>
        </button>
        <button 
          onClick={() => { setActiveTab('demolition'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'demolition' ? "text-orange-600" : "text-slate-400")}
        >
          <Hammer size={22} />
          <span className="text-[9px] font-bold uppercase">Tod-Phod</span>
        </button>
        <button 
          onClick={() => { setActiveTab('kiraya'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'kiraya' ? "text-violet-600" : "text-slate-400")}
        >
          <Home size={22} />
          <span className="text-[9px] font-bold uppercase">Kiraya</span>
        </button>
        <button 
          onClick={() => { setActiveTab('settings'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-indigo-600" : "text-slate-400")}
        >
          <Settings size={22} />
          <span className="text-[9px] font-bold uppercase">Taiyari</span>
        </button>
      </nav>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
