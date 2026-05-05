import React from 'react';
import { Building2, Wallet, Ruler, Calendar, Cloud, User, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { useAppContext } from '../../context/AppContext';
import { INITIAL_STATE } from '../../constants/initialState';
import { Project } from '../../types';

const PROJECT_TYPES: { value: Project['type']; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial',  label: 'Commercial'  },
  { value: 'mixed',       label: 'Mixed'       },
  { value: 'renovation',  label: 'Renovation'  },
  { value: 'other',       label: 'Other'       },
];

const lbl = 'text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5';
const inp = 'w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm';

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
          {icon}
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsTab() {
  const { state, setState, calcs, askConfirm, sync, pwForm, setPwForm, handleChangePassword, handleLogout } = useAppContext();
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
    <div className="space-y-5 pb-28">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-400 text-sm">
          {project?.name ? project.name : 'Project Taiyari'}
          {project?.type ? ` • ${project.type.charAt(0).toUpperCase()}${project.type.slice(1)}` : ''}
        </p>
      </header>

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
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-500 border-slate-100'
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
            className={cn(inp, 'bg-indigo-50 focus:ring-indigo-500')}
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
          <div className="bg-slate-50 rounded-2xl p-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              <span>Construction share</span>
              <span>{constructionShare}% of master</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, constructionShare)}%` }} />
            </div>
          </div>
        )}

        {/* Live burn rate */}
        {masterBudget > 0 && totalKharcha > 0 && (
          <div className={cn('rounded-2xl p-4',
            masterBurnRate > 90 ? 'bg-red-50' : masterBurnRate > 70 ? 'bg-amber-50' : 'bg-emerald-50'
          )}>
            <div className="flex justify-between items-center mb-2">
              <p className={cn('text-[10px] font-bold uppercase',
                masterBurnRate > 90 ? 'text-red-600' : masterBurnRate > 70 ? 'text-amber-600' : 'text-emerald-600'
              )}>
                Budget Used — {masterBurnRate.toFixed(1)}%
              </p>
              <p className={cn('text-xs font-bold', masterRemaining < 0 ? 'text-red-600' : 'text-emerald-600')}>
                {formatCurrency(masterRemaining)} left
              </p>
            </div>
            <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
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
          <div className="bg-indigo-600 rounded-2xl p-4 text-center">
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wide">Estimated Total Area</p>
            <p className="text-4xl font-bold text-white mt-1 leading-none">
              {project.totalArea.toLocaleString('en-IN')}
            </p>
            <p className="text-indigo-300 text-xs mt-1 font-bold">Sq. Ft</p>
            {costPerSqFt && (
              <div className="mt-3 pt-3 border-t border-indigo-500">
                <p className="text-indigo-200 text-[10px] font-bold uppercase">Budget per Sq.Ft</p>
                <p className="text-white text-lg font-bold">{formatCurrency(costPerSqFt)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-3 text-center text-slate-400 text-xs font-bold">
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
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── 5. Cloud Sync ── */}
      <Section icon={<Cloud size={16} />} title="Cloud Sync">
        <div className={cn('flex items-center justify-between p-3.5 rounded-2xl', {
          'bg-emerald-50': sync.status === 'synced',
          'bg-blue-50': sync.status === 'syncing',
          'bg-red-50': sync.status === 'error',
          'bg-slate-50': sync.status === 'offline' || sync.status === 'loading',
        })}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', {
              'bg-emerald-500': sync.status === 'synced',
              'bg-blue-500 animate-pulse': sync.status === 'syncing',
              'bg-red-500': sync.status === 'error',
              'bg-slate-400': sync.status === 'offline' || sync.status === 'loading',
            })} />
            <div className="min-w-0">
              <p className={cn('text-sm font-bold truncate', {
                'text-emerald-700': sync.status === 'synced',
                'text-blue-700': sync.status === 'syncing',
                'text-red-700': sync.status === 'error',
                'text-slate-600': sync.status === 'offline' || sync.status === 'loading',
              })}>
                {sync.status === 'synced' && 'Connected — Synced'}
                {sync.status === 'syncing' && 'Sync ho raha hai...'}
                {sync.status === 'error' && 'Sync Error'}
                {sync.status === 'offline' && 'Offline — Login Karein'}
                {sync.status === 'loading' && 'Connect ho raha hai...'}
              </p>
              {sync.userEmail && (
                <p className="text-[10px] text-slate-500 font-bold mt-0.5 truncate">{sync.userEmail}</p>
              )}
              {sync.lastSynced && (
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {sync.lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
              {sync.error && <p className="text-[10px] text-red-400 font-bold mt-0.5">{sync.error}</p>}
            </div>
          </div>
          <button
            onClick={sync.syncNow}
            disabled={sync.status === 'syncing'}
            className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border shrink-0 ml-3 disabled:opacity-50', {
              'bg-emerald-100 text-emerald-700 border-emerald-200': sync.status === 'synced',
              'bg-blue-100 text-blue-700 border-blue-200': sync.status === 'syncing',
              'bg-red-100 text-red-700 border-red-200': sync.status === 'error',
              'bg-slate-100 text-slate-600 border-slate-200': sync.status === 'offline' || sync.status === 'loading',
            })}
          >
            <RefreshCw size={12} className={sync.status === 'syncing' ? 'animate-spin' : ''} />
            {sync.status === 'syncing' ? '...' : 'Sync'}
          </button>
        </div>

        {sync.cloudUpdatedAt && (
          <p className="text-[10px] text-slate-400 font-bold">
            ☁ Cloud: {sync.cloudUpdatedAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Phone pe add kiya aur yahan nahi dikh raha?{' '}
          <span className="font-bold text-slate-600">Sync</span> dabao — cloud se latest data aa jayega.
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
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPwForm(p => ({ ...p, open: true }))}
              className="w-full px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm border border-indigo-100 flex items-center justify-between"
            >
              <span>Password Badlein</span>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => askConfirm('Kya aap logout karna chahte hain?', handleLogout, 'Logout', 'Logout')}
              className="w-full px-4 py-3 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm border border-slate-100 flex items-center justify-between"
            >
              <span>Logout</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </Section>

      {/* ── 7. Danger Zone ── */}
      <div className="bg-red-50 rounded-3xl border border-red-100 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="font-bold text-red-700 text-sm">Danger Zone</p>
        </div>
        <p className="text-xs text-red-500 leading-relaxed">
          Saara data permanently delete ho jayega — materials, expenses, photos sab. Yeh undo nahi ho sakta.
        </p>
        <button
          onClick={() => askConfirm(
            'Saara data delete ho jayega aur app reset ho jayega. Kya aap bilkul sure hain?',
            () => setState(INITIAL_STATE),
            'Reset All Data?',
            'Reset Karein'
          )}
          className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-sm shadow-red-200"
        >
          Reset All Data
        </button>
      </div>
    </div>
  );
}
