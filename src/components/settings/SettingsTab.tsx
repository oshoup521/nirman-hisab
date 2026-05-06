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

      {/* 2-column grid on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-5 lg:space-y-0">
      {/* Left Column */}
      <div className="space-y-5">

      {/* ── 0. Display & Theme ── */}
      <Section icon={<Monitor size={16} />} title="Display & Theme">
        <div className="flex gap-2 p-1 bg-surface-subdued rounded-2xl border border-border-subdued">
          {(['light', 'dark', 'system'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all',
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
      </Section>

      {/* ── 1. Project Info ── */}
      <Section icon={<Building2 size={16} />} title="Project Info">
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
                  'px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  project?.type === value
                    ? 'bg-brand/10 text-brand border-brand/20'
                    : 'bg-surface-subdued text-text-secondary border-border-subdued'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 2. Budget ── */}
      <Section icon={<Wallet size={16} />} title="Budget">
        <div>
          <label className={lbl}>Master Budget — Sab Milake (₹)</label>
          <input type="number" inputMode="numeric"
            value={project?.masterBudget || ''}
            onChange={e => updateProject({ masterBudget: Number(e.target.value) })}
            className={cn(inp, 'bg-brand/5 focus:ring-brand')}
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
          <div className="bg-surface-subdued rounded-2xl p-3">
            <div className="flex justify-between text-[10px] font-bold text-text-subdued uppercase mb-1.5">
              <span>Construction share</span>
              <span>{constructionShare}% of master</span>
            </div>
            <div className="w-full bg-border-default h-2 rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.min(100, constructionShare)}%` }} />
            </div>
          </div>
        )}

        {/* Live burn rate */}
        {masterBudget > 0 && totalKharcha > 0 && (
          <div className={cn('rounded-2xl p-4',
            masterBurnRate > 90 ? 'bg-red-500/10' : masterBurnRate > 70 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
          )}>
            <div className="flex justify-between items-center mb-2">
              <p className={cn('text-[10px] font-bold uppercase',
                masterBurnRate > 90 ? 'text-red-600 dark:text-red-400' : masterBurnRate > 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}>
                Budget Used — {masterBurnRate.toFixed(1)}%
              </p>
              <p className={cn('text-xs font-bold', masterRemaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                {formatCurrency(masterRemaining)} left
              </p>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all',
                  masterBurnRate > 90 ? 'bg-red-500' : masterBurnRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, masterBurnRate)}%` }}
              />
            </div>
          </div>
        )}
      </Section>

      {/* ── 3. Plot Dimensions ── */}
      <Section icon={<Ruler size={16} />} title="Plot Dimensions">
        <div className="grid grid-cols-3 gap-2">
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
          <div className="bg-brand rounded-2xl p-4 text-center">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wide">Estimated Total Area</p>
            <p className="text-4xl font-bold text-white mt-1 leading-none">
              {project.totalArea.toLocaleString('en-IN')}
            </p>
            <p className="text-white/60 text-xs mt-1 font-bold">Sq. Ft</p>
            {costPerSqFt && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-white/70 text-[10px] font-bold uppercase">Budget per Sq.Ft</p>
                <p className="text-white text-lg font-bold">{formatCurrency(costPerSqFt)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-subdued rounded-2xl p-3 text-center text-text-subdued text-xs font-bold">
            Width × Length × Floors enter karo — area auto-calculate hoga
          </div>
        )}
      </Section>

      {/* ── 4. Timeline ── */}
      <Section icon={<Calendar size={16} />} title="Project Timeline">
        <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Days', value: durationDays },
              { label: 'Weeks', value: Math.round(durationDays / 7) },
              { label: 'Months', value: Math.round(durationDays / 30) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-subdued rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-text-primary leading-none">{value}</p>
                <p className="text-[9px] text-text-subdued font-bold uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
      </div>{/* end left column */}

      {/* Right Column */}
      <div className="space-y-5">

      {/* ── 5. Cloud Sync ── */}
      <Section icon={<Cloud size={16} />} title="Cloud Sync">
        <div className={cn('flex items-center justify-between p-3.5 rounded-2xl', {
          'bg-emerald-500/10': sync.status === 'synced',
          'bg-blue-500/10': sync.status === 'syncing',
          'bg-red-500/10': sync.status === 'error',
          'bg-surface-subdued': sync.status === 'offline' || sync.status === 'loading',
        })}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', {
              'bg-emerald-500': sync.status === 'synced',
              'bg-blue-500 animate-pulse': sync.status === 'syncing',
              'bg-red-500': sync.status === 'error',
              'bg-text-subdued': sync.status === 'offline' || sync.status === 'loading',
            })} />
            <div className="min-w-0">
              <p className={cn('text-sm font-bold truncate', {
                'text-emerald-700 dark:text-emerald-400': sync.status === 'synced',
                'text-blue-700 dark:text-blue-400': sync.status === 'syncing',
                'text-red-700 dark:text-red-400': sync.status === 'error',
                'text-text-secondary': sync.status === 'offline' || sync.status === 'loading',
              })}>
                {sync.status === 'synced' && 'Connected — Synced'}
                {sync.status === 'syncing' && 'Sync ho raha hai...'}
                {sync.status === 'error' && 'Sync Error'}
                {sync.status === 'offline' && 'Offline — Login Karein'}
                {sync.status === 'loading' && 'Connect ho raha hai...'}
              </p>
              {sync.userEmail && (
                <p className="text-[10px] text-text-secondary font-bold mt-0.5 truncate">{sync.userEmail}</p>
              )}
              {sync.lastSynced && (
                <p className="text-[10px] text-text-subdued font-bold mt-0.5">
                  {sync.lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
              {sync.error && <p className="text-[10px] text-red-500 font-bold mt-0.5">{sync.error}</p>}
            </div>
          </div>
          <button
            onClick={sync.syncNow}
            disabled={sync.status === 'syncing'}
            className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border shrink-0 ml-3 disabled:opacity-50', {
              'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20': sync.status === 'synced',
              'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20': sync.status === 'syncing',
              'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20': sync.status === 'error',
              'bg-surface-subdued text-text-secondary border-border-default': sync.status === 'offline' || sync.status === 'loading',
            })}
          >
            <RefreshCw size={12} className={sync.status === 'syncing' ? 'animate-spin' : ''} />
            {sync.status === 'syncing' ? '...' : 'Sync'}
          </button>
        </div>

        {sync.cloudUpdatedAt && (
          <p className="text-[10px] text-text-subdued font-bold">
            ☁ Cloud: {sync.cloudUpdatedAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <p className="text-[11px] text-text-subdued leading-relaxed">
          Phone pe add kiya aur yahan nahi dikh raha?{' '}
          <span className="font-bold text-text-secondary">Sync</span> dabao — cloud se latest data aa jayega.
        </p>
      </Section>

      {/* ── 6. Account ── */}
      <Section icon={<User size={16} />} title="Account">
        {pwForm.open ? (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className={lbl}>Naya Password</label>
              <input type="password" required value={pwForm.newPw}
                onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                className={inp} placeholder="••••••••" />
            </div>
            <div>
              <label className={lbl}>Password Confirm Karein</label>
              <input type="password" required value={pwForm.confirmPw}
                onChange={e => setPwForm(p => ({ ...p, confirmPw: e.target.value }))}
                className={inp} placeholder="••••••••" />
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
                className="flex-1 py-3 bg-brand text-white rounded-2xl font-bold text-sm disabled:opacity-60"
              >
                {pwForm.loading ? 'Save ho raha hai...' : 'Password Badlein'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPwForm(p => ({ ...p, open: true }))}
              className="w-full px-4 py-3 bg-brand/10 text-brand rounded-2xl font-bold text-sm border border-brand/20 flex items-center justify-between"
            >
              <span>Password Badlein</span>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => askConfirm('Kya aap logout karna chahte hain?', handleLogout, 'Logout', 'Logout')}
              className="w-full px-4 py-3 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-sm border border-border-default flex items-center justify-between"
            >
              <span>Logout</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </Section>

      {/* ── 7. Danger Zone ── */}
      <div className="bg-red-500/10 rounded-3xl border border-red-500/20 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="font-bold text-red-600 dark:text-red-400 text-sm">Danger Zone</p>
        </div>
        <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
          Saara data permanently delete ho jayega — materials, expenses, photos sab. Yeh undo nahi ho sakta.
        </p>
        <button
          onClick={() => askConfirm(
            'Saara data delete ho jayega aur app reset ho jayega. Kya aap bilkul sure hain?',
            () => setState(INITIAL_STATE),
            'Reset All Data?',
            'Reset Karein'
          )}
          className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-sm shadow-red-500/20"
        >
          Reset All Data
        </button>
      </div>
      </div>{/* end right column */}
      </div>{/* end 2-col grid */}
    </div>
  );
}
