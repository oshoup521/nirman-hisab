import React, { useState } from 'react';
import { format } from 'date-fns';
import { AppProvider, useConfirmDialog, PwFormState, TabType } from './context/AppContext';
import { useCloudSync } from './hooks/useCloudSync';
import { useAppCalculations } from './hooks/useAppCalculations';
import { usePhotoManager } from './hooks/usePhotoManager';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { INITIAL_STATE } from './constants/initialState';
import { AppState } from './types';
import { supabase } from './utils/supabaseClient';
import { formatCurrency } from './utils/formatters';
import { downloadCSV } from './utils/csv';
import LoadingScreen from './components/layout/LoadingScreen';
import BottomNav from './components/layout/BottomNav';
import TopNav from './components/layout/TopNav';
import PullToRefreshIndicator from './components/layout/PullToRefreshIndicator';
import ConfirmDialog from './components/ConfirmDialog';
import DashboardTab from './components/dashboard/DashboardTab';
import ConstructionTab from './components/construction/ConstructionTab';
import DemolitionTab from './components/demolition/DemolitionTab';
import KirayaTab from './components/kiraya/KirayaTab';
import SettingsTab from './components/settings/SettingsTab';
import DiaryTab from './components/diary/DiaryTab';

export default function App() {
  const [state, setState, loading, syncStatus, lastSynced, syncError, syncNow, userEmail, cloudUpdatedAt] =
    useCloudSync<AppState>('nirman_hisaab_data', INITIAL_STATE);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [subTab, setSubTab] = useState('overview');
  const [showAllMisc, setShowAllMisc] = useState(false);
  const [pwForm, setPwForm] = useState<PwFormState>({
    open: false, newPw: '', confirmPw: '', loading: false, error: '', success: '',
  });

  const { confirmDialog, askConfirm, closeConfirm } = useConfirmDialog();
  const calcs = useAppCalculations(state);
  const photos = usePhotoManager(setState);
  const { pullY, isPulling, toast, PULL_THRESHOLD } = usePullToRefresh(syncStatus, syncNow);

  // One-time migration: prepend Demolition phase if missing
  React.useEffect(() => {
    if (!loading && !state.milestones.find(m => m.id === 'demolition')) {
      setState(prev => ({
        ...prev,
        milestones: [{ id: 'demolition', phase: 'Demolition', status: 'pending' as const }, ...prev.milestones],
      }));
    }
  }, [loading]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

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

  const exportToCSV = () => downloadCSV(state);

  const shareOnWhatsApp = () => {
    const { totalKharcha, totalSpent, masterBudget, masterRemaining, malwaCost, demolitionThekaCost, totalRecovery, currentMonthRent } = calcs;
    const constructionThekaPaid = state.thekas.reduce((acc, t) => acc + t.payments.reduce((a, p) => a + p.amount, 0), 0);
    const constructionThekaPending = state.thekas.reduce((acc, t) => acc + (t.totalAmount - t.payments.reduce((a, p) => a + p.amount, 0)), 0);
    const burnPct = masterBudget > 0 ? Math.round((totalKharcha / masterBudget) * 100) : 0;
    const demolitionThekaPaid = (state.demolitionThekas || []).reduce((acc, t) => acc + t.payments.reduce((a, p) => a + p.amount, 0), 0);
    const demolitionThekaPending = (state.demolitionThekas || []).reduce((acc, t) => acc + (t.totalAmount - t.payments.reduce((a, p) => a + p.amount, 0)), 0);
    const hasDemolition = (state.demolitionThekas || []).length > 0 || (state.malwa || []).length > 0;
    const totalRentIncome = (state.rentals || []).reduce((a, r) => a + r.payments.reduce((s, p) => s + p.amount, 0), 0);
    const hasKiraya = (state.rentals || []).length > 0;
    const lowStockItems = state.materials.filter(m => m.purchased - m.used <= m.minStock).map(m => m.name);
    const today = format(new Date(), 'dd MMM yyyy');
    const projectName = state.project?.name || 'Nirman Project';
    const location = state.project?.location ? ` — ${state.project.location}` : '';

    let text = `🏗️ *${projectName}${location}*\n📅 ${today} ka hisaab\n${'─'.repeat(28)}\n\n`;
    text += `💼 *BUDGET OVERVIEW*\nTotal Budget:  ₹${formatCurrency(masterBudget)}\nTotal Kharcha: ₹${formatCurrency(totalKharcha)}\nBacha Hua:     ₹${formatCurrency(masterRemaining)}\nBudget Used:   ${burnPct}%\n\n`;
    if (calcs.budget > 0 || totalSpent > 0) {
      text += `🧱 *CONSTRUCTION*\nBudget:         ₹${formatCurrency(calcs.budget)}\nKharcha:        ₹${formatCurrency(totalSpent)}\nTheka Diya:     ₹${formatCurrency(constructionThekaPaid)}\nTheka Baaki:    ₹${formatCurrency(constructionThekaPending)}\n\n`;
    }
    if (hasDemolition) {
      text += `⛏️ *DEMOLITION*\nTheka Diya:  ₹${formatCurrency(demolitionThekaPaid)}\nTheka Baaki: ₹${formatCurrency(demolitionThekaPending)}\n`;
      if (malwaCost > 0) text += `Malwa Cost:  ₹${formatCurrency(malwaCost)}\n`;
      if (totalRecovery > 0) text += `Recovery:    ₹${formatCurrency(totalRecovery)}\n`;
      text += '\n';
    }
    if (hasKiraya) {
      text += `🏠 *KIRAYA*\nTotal Properties: ${(state.rentals || []).length}\nRent Mila:        ₹${formatCurrency(totalRentIncome)}\n`;
      if (currentMonthRent > 0) text += `Is Mahine Baaki:  ₹${formatCurrency(currentMonthRent)}\n`;
      text += '\n';
    }
    if (lowStockItems.length > 0) {
      text += `⚠️ *LOW STOCK ALERT*\n`;
      lowStockItems.slice(0, 5).forEach(name => { text += `• ${name}\n`; });
      if (lowStockItems.length > 5) text += `• ...aur ${lowStockItems.length - 5} aur\n`;
      text += '\n';
    }
    text += `_Shared via Nirman Hisaab App_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loading) return <LoadingScreen />;

  return (
    <AppProvider value={{
      state, setState, calcs,
      activeTab, setActiveTab,
      subTab, setSubTab,
      confirmDialog, askConfirm, closeConfirm,
      sync: { status: syncStatus, syncNow, lastSynced, error: syncError, userEmail, cloudUpdatedAt },
      photos,
      pwForm, setPwForm,
      handleChangePassword, handleLogout,
      exportToCSV, shareOnWhatsApp,
      showAllMisc, setShowAllMisc,
    }}>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <PullToRefreshIndicator
          pullY={pullY}
          isPulling={isPulling}
          toast={toast}
          pullThreshold={PULL_THRESHOLD}
          syncError={syncStatus === 'error'}
        />

        <TopNav />

        <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 md:px-6 pt-[max(env(safe-area-inset-top),24px)] md:pt-6 pb-28 md:pb-10">
          {activeTab === 'dashboard'    && <DashboardTab />}
          {activeTab === 'construction' && <ConstructionTab />}
          {activeTab === 'diary'        && <DiaryTab />}
          {activeTab === 'demolition'   && <DemolitionTab />}
          {activeTab === 'kiraya'       && <KirayaTab />}
          {activeTab === 'settings'     && <SettingsTab />}
        </div>

        <BottomNav />

        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
        />
      </div>
    </AppProvider>
  );
}
