import React from 'react';
import { Building2, Wallet, Ruler, Calendar, Cloud, User, AlertTriangle, RefreshCw, ChevronRight, Moon, Sun, Monitor } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { INITIAL_STATE } from '../../constants/initialState';
import { Project } from '../../types';

const PROJECT_TYPES: { value: Project['type']; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial',  label: 'Commercial'  },
  { value: 'mixed',       label: 'Mixed'       },
  { value: 'renovation',  label: 'Renovation'  },
  { value: 'other',       label: 'Other'       },
];

const lbl = 'text-[10px] font-bold text-text-subdued uppercase tracking-wide block mb-1.5';
const inp = 'w-full p-3 bg-surface-subdued border-none rounded-2xl focus:ring-2 focus:ring-brand text-text-primary text-sm';

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-3xl border border-border-subdued shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary shrink-0">
          {icon}
        </div>
        <h3 className="font-bold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsTab() {
  const { state, setState, calcs, askConfirm, sync, pwForm, setPwForm, handleChangePassword, handleLogout } = useAppContext();
  const { theme, setTheme } = useTheme();
  const { masterBudget, masterBurnRate, masterRemaining, totalKharcha } = calcs;

  const project = state.project;

  const updateProject = (patch: Partial<Project>) =>
    setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), ...patch } }));

  const startDate = project?.startDate ? new Date(project.startDate) : null;
  const endDate = project?.endDate ? new Date(project.endDate) : null;
  const durationDays = startDate && endDate && endDate > startDate
    ? differenceInDays(endDate, startDate)
    : null;

  const constructionShare = project?.budget && project?.masterBudget
    ? Math.round((project.budget / project.masterBudget) * 100)
    : null;

  const costPerSqFt = project?.totalArea && project?.masterBudget
    ? Math.round(project.masterBudget / project.totalArea)
    : null;

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      {/* Header */}
      <header>
        <h1 className="font-heading text-display font-bold text-text-primary">Settings</h1>
        <p className="text-text-subdued text-body-sm font-medium">
          {project?.name ? project.name : 'Project Taiyari'}
          {project?.type ? ` • ${project.type.charAt(0).toUpperCase()}${project.type.slice(1)}` : ''}
        </p>
      </header>

      {/* ── 0. Display & Theme ── */}
      <div className="bg-surface rounded-3xl border border-border-subdued shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-surface-subdued rounded-2xl flex items-center justify-center text-text-secondary">
            <Monitor size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary">App Appearance</h3>
            <p className="text-[10px] text-text-subdued font-bold uppercase tracking-widest">Interface Theme</p>
          </div>
        </div>
        
        <div className="flex gap-2 p-1 bg-surface-subdued rounded-2xl border border-border-subdued md:w-64">
          {(['light', 'dark', 'system'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all',
                theme === t
                  ? 'bg-surface text-text-primary shadow-sm border border-border-default'
                  : 'text-text-subdued hover:text-text-secondary'
              )}
            >
              {t === 'light' && <Sun size={14} />}
              {t === 'dark' && <Moon size={14} />}
              {t === 'system' && <Monitor size={14} />}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2-column grid on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-start space-y-5 lg:space-y-0">
        {/* Left Column: Project Setup */}
        <div className="space-y-6">
          <p className="hidden lg:block text-caption font-bold text-text-subdued uppercase tracking-widest px-1">Project Setup</p>
          
          {/* ── 1. Project Info ── */}
          <Section icon={<Building2 size={16} />} title="Project Identity">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Project Name</label>
                <input type="text" value={project?.name || ''} onChange={e => updateProject({ name: e.target.value })}
                  className={inp} placeholder="e.g. Sharma Sadan" />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input type="text" value={project?.location || ''} onChange={e => updateProject({ location: e.target.value })}
                  className={inp} placeholder="e.g. Sector 15, Noida" />
              </div>
              <div>
                <label className={lbl}>Project Type</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PROJECT_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateProject({ type: value })}
                      className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
                        project?.type === value
                          ? 'bg-brand text-surface border-brand shadow-sm'
                          : 'bg-surface-subdued text-text-secondary border-border-subdued hover:border-text-subdued'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* ── 2. Budget ── */}
          <Section icon={<Wallet size={16} />} title="Financial Planning">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Master Budget — Sab Milake (₹)</label>
                <input type="number" inputMode="numeric"
                  value={project?.masterBudget || ''}
                  onChange={e => updateProject({ masterBudget: Number(e.target.value) })}
                  className={cn(inp, 'bg-brand/5 border border-brand/10 focus:ring-brand')}
                  placeholder="e.g. 80,00,000" />
              </div>
              <div>
                <label className={lbl}>Construction Budget (₹)</label>
                <input type="number" inputMode="numeric"
                  value={project?.budget || ''}
                  onChange={e => updateProject({ budget: Number(e.target.value) })}
                  className={inp}
                  placeholder="e.g. 50,00,000" />
              </div>

              {/* Construction share bar */}
              {constructionShare !== null && (
                <div className="bg-surface-subdued/50 border border-border-subdued rounded-2xl p-4">
                  <div className="flex justify-between text-[10px] font-bold text-text-subdued uppercase mb-2">
                    <span>Construction share</span>
                    <span>{constructionShare}% of master</span>
                  </div>
                  <div className="w-full bg-border-subdued h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--brand-rgb),0.4)]" style={{ width: `${Math.min(100, constructionShare)}%` }} />
                  </div>
                </div>
              )}

              {/* Live burn rate */}
              {masterBudget > 0 && totalKharcha > 0 && (
                <div className={cn('rounded-2xl p-4 border',
                  masterBurnRate > 90 ? 'bg-red-500/5 border-red-500/20' : masterBurnRate > 70 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
                )}>
                  <div className="flex justify-between items-center mb-2.5">
                    <p className={cn('text-[10px] font-bold uppercase tracking-wider',
                      masterBurnRate > 90 ? 'text-red-600' : masterBurnRate > 70 ? 'text-amber-600' : 'text-emerald-600'
                    )}>
                      Budget Used — {masterBurnRate.toFixed(1)}%
                    </p>
                    <p className={cn('text-xs font-bold', masterRemaining < 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {formatCurrency(masterRemaining)} left
                    </p>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-subdued">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000',
                        masterBurnRate > 90 ? 'bg-red-500' : masterBurnRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(100, masterBurnRate)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── 3. Plot Dimensions ── */}
          <Section icon={<Ruler size={16} />} title="Plot & Area">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Width (ft)</label>
                <input type="number" inputMode="numeric" placeholder="20"
                  value={project?.plotWidth || ''}
                  onChange={e => {
                    const w = Number(e.target.value);
                    const l = project?.plotLength || 0;
                    const f = project?.floors || 1;
                    updateProject({ plotWidth: w, totalArea: w * l * f });
                  }}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>Length (ft)</label>
                <input type="number" inputMode="numeric" placeholder="80"
                  value={project?.plotLength || ''}
                  onChange={e => {
                    const l = Number(e.target.value);
                    const w = project?.plotWidth || 0;
                    const f = project?.floors || 1;
                    updateProject({ plotLength: l, totalArea: w * l * f });
                  }}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>Floors</label>
                <input type="number" inputMode="numeric" placeholder="2"
                  value={project?.floors || ''}
                  onChange={e => {
                    const f = Number(e.target.value);
                    const w = project?.plotWidth || 0;
                    const l = project?.plotLength || 0;
                    updateProject({ floors: f, totalArea: w * l * f });
                  }}
                  className={inp} />
              </div>
            </div>

            {project?.totalArea ? (
              <div className="bg-brand rounded-2xl p-4 text-center shadow-lg shadow-brand/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Total Area</p>
                <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                  <p className="text-3xl font-bold text-white tracking-tighter">
                    {project.totalArea.toLocaleString('en-IN')}
                  </p>
                  <p className="text-white/60 text-[10px] font-bold uppercase">Sq. Ft</p>
                </div>
                {costPerSqFt && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/10 flex justify-between items-center">
                    <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">Rate</p>
                    <p className="text-white text-base font-bold">{formatCurrency(costPerSqFt)} / sq.ft</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface-subdued/50 rounded-2xl p-3 text-center text-text-subdued text-xs font-bold border border-dashed border-border-subdued">
                Area auto-calculate hoga
              </div>
            )}
          </Section>
        </div>

        {/* Right Column: Schedule & Config */}
        <div className="space-y-6">
          <p className="hidden lg:block text-caption font-bold text-text-subdued uppercase tracking-widest px-1">Schedule & Application</p>

          {/* ── 4. Timeline ── */}
          <Section icon={<Calendar size={16} />} title="Project Timeline">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Start Date</label>
                <input type="date" value={project?.startDate || ''}
                  onChange={e => updateProject({ startDate: e.target.value })}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>End Date (Plan)</label>
                <input type="date" value={project?.endDate || ''}
                  onChange={e => updateProject({ endDate: e.target.value })}
                  className={inp} />
              </div>
            </div>

            {durationDays !== null && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Days', value: durationDays },
                  { label: 'Weeks', value: Math.round(durationDays / 7) },
                  { label: 'Months', value: Math.round(durationDays / 30) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-subdued/50 border border-border-subdued rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
                    <p className="text-[9px] text-text-subdued font-bold uppercase mt-1.5 tracking-widest">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── 5. Cloud Sync ── */}
          <Section icon={<Cloud size={16} />} title="Cloud Synchronization">
            <div className={cn('p-5 rounded-2xl border transition-all', {
              'bg-emerald-500/5 border-emerald-500/20': sync.status === 'synced',
              'bg-blue-500/5 border-blue-500/20': sync.status === 'syncing',
              'bg-red-500/5 border-red-500/20': sync.status === 'error',
              'bg-surface-subdued/50 border-border-subdued': sync.status === 'offline' || sync.status === 'loading',
            })}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-2.5 h-2.5 rounded-full', {
                    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]': sync.status === 'synced',
                    'bg-blue-500 animate-pulse': sync.status === 'syncing',
                    'bg-red-500': sync.status === 'error',
                    'bg-text-subdued': sync.status === 'offline' || sync.status === 'loading',
                  })} />
                  <p className="text-sm font-bold text-text-primary uppercase tracking-tight">
                    {sync.status === 'synced' && 'Cloud Synced'}
                    {sync.status === 'syncing' && 'Syncing...'}
                    {sync.status === 'error' && 'Sync Error'}
                    {sync.status === 'offline' && 'Disconnected'}
                    {sync.status === 'loading' && 'Connecting...'}
                  </p>
                </div>
                <button
                  onClick={sync.syncNow}
                  disabled={sync.status === 'syncing'}
                  className={cn('p-2.5 rounded-xl border transition-all hover:scale-110 active:scale-95', {
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-600': sync.status === 'synced',
                    'bg-blue-500/10 border-blue-500/20 text-blue-600': sync.status === 'syncing',
                    'bg-red-500/10 border-red-500/20 text-red-600': sync.status === 'error',
                    'bg-surface text-text-secondary border-border-default': sync.status === 'offline' || sync.status === 'loading',
                  })}
                >
                  <RefreshCw size={16} className={sync.status === 'syncing' ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="space-y-1.5 min-w-0">
                {sync.userEmail && (
                  <p className="text-xs text-text-secondary font-bold flex items-center gap-2">
                    <User size={12} className="opacity-40" />
                    {sync.userEmail}
                  </p>
                )}
                {sync.lastSynced && (
                  <p className="text-[10px] text-text-subdued font-bold flex items-center gap-2">
                    <Calendar size={12} className="opacity-40" />
                    Last update: {sync.lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* ── 6. Account ── */}
          <Section icon={<User size={16} />} title="Account Management">
            {pwForm.open ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className={lbl}>Naya Password</label>
                      <input type="password" required value={pwForm.newPw}
                        onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                        className={inp} placeholder="••••••••" />
                   </div>
                   <div>
                      <label className={lbl}>Confirm</label>
                      <input type="password" required value={pwForm.confirmPw}
                        onChange={e => setPwForm(p => ({ ...p, confirmPw: e.target.value }))}
                        className={inp} placeholder="••••••••" />
                   </div>
                </div>
                {pwForm.error && <p className="text-xs text-red-500 font-bold">{pwForm.error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPwForm({ open: false, newPw: '', confirmPw: '', loading: false, error: '', success: '' })}
                    className="flex-1 py-3 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwForm.loading}
                    className="flex-1 py-3 bg-brand text-white rounded-2xl font-bold text-sm disabled:opacity-60 shadow-lg shadow-brand/20"
                  >
                    {pwForm.loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPwForm(p => ({ ...p, open: true }))}
                  className="px-4 py-3 bg-brand/10 text-brand rounded-2xl font-bold text-sm border border-brand/20 flex items-center justify-between hover:bg-brand/15 transition-colors"
                >
                  <span>Password</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => askConfirm('Kya aap logout karna chahte hain?', handleLogout, 'Logout', 'Logout')}
                  className="px-4 py-3 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm border border-border-default flex items-center justify-between hover:bg-border-subdued transition-colors"
                >
                  <span>Logout</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </Section>

          {/* ── 7. Danger Zone ── */}
          <div className="bg-red-500/5 rounded-3xl border border-red-500/20 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                 <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                 <p className="font-bold text-red-600 dark:text-red-400 text-title">Danger Zone</p>
                 <p className="text-caption font-bold text-red-500/60 uppercase tracking-widest">Critical Actions</p>
              </div>
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed font-medium">
              Saara data permanently delete ho jayega (Materials, Expenses, Photos). Reset ke baad aap ise wapas nahi la sakte.
            </p>
            <button
              onClick={() => askConfirm(
                'Saara data delete ho jayega aur app reset ho jayega. Kya aap bilkul sure hain?',
                () => setState(INITIAL_STATE),
                'Reset All Data?',
                'Reset Karein'
              )}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
            >
              Reset All Project Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
