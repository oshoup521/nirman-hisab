import React from 'react';
import { Plus, Package, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { useAppContext } from '../../context/AppContext';

export default function OverviewSection() {
  const { state, calcs, setActiveTab, setSubTab } = useAppContext();
  const { totalSpent, totalMisc } = calcs;

  if (!state.project) {
    return (
      <div className="bg-surface p-8 rounded-3xl border-2 border-dashed border-border-default text-center space-y-4">
        <div className="bg-brand/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <Plus className="text-brand" />
        </div>
        <div>
          <h3 className="font-heading text-title font-bold text-text-primary">No Project Found</h3>
          <p className="text-text-subdued text-body-sm">Settings mein jaake project setup karein.</p>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className="px-6 py-2 bg-brand text-surface rounded-full font-bold text-body-sm hover:opacity-90 transition-opacity"
        >
          Setup Project
        </button>
      </div>
    );
  }

  const { project, milestones, materials } = state;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayWorkers = (state.labourDayEntries || []).filter(e => e.date === todayStr).reduce((sum, e) => sum + e.count, 0);
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = Date.now();
  const totalDays = Math.round((end - start) / 86400000);
  const elapsed = Math.round((now - start) / 86400000);
  const remaining = Math.max(0, Math.round((end - now) / 86400000));
  const timePct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const phasePct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  const isOverdue = now > end;
  const isAhead = phasePct >= timePct;

  const inProgress = milestones.filter(m => m.status === 'in-progress').length;
  const pending = milestones.length - completedCount - inProgress;

  return (
    <>
    {/* ═══ DESKTOP ═══ */}
    <div className="hidden md:block space-y-6">
      {/* Row 1: Project Header & Progress */}
      <div className="grid grid-cols-5 gap-6">
        {/* Project Info (Left 2 units) */}
        <div className="col-span-2 bg-surface p-7 rounded-3xl border border-border-default shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-brand/5 blur-3xl rounded-full" />
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-heading text-title-lg font-bold text-text-primary tracking-tight">{project.name}</h3>
                <p className="text-text-subdued text-caption flex items-center gap-1.5 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-brand/40" />
                  {project.location}
                </p>
              </div>
              <span className="px-3 py-1 bg-brand text-surface rounded-full text-caption font-bold uppercase tracking-widest scale-90 origin-right">
                {project.type}
              </span>
            </div>

            <div className="space-y-4 py-5 border-y border-border-subdued">
              <div>
                <p className="text-caption font-bold text-text-subdued uppercase tracking-widest mb-1">Project Shuru</p>
                <p className="text-body font-bold text-text-primary">{format(new Date(project.startDate), 'dd MMM, yyyy')}</p>
              </div>
              <div>
                <p className="text-caption font-bold text-text-subdued uppercase tracking-widest mb-1">Target End</p>
                <p className="text-body font-bold text-text-primary">{format(new Date(project.endDate), 'dd MMM, yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="pt-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-caption font-bold text-text-subdued uppercase tracking-widest">Timeline</p>
              <p className={cn('text-caption font-bold px-2 py-0.5 rounded-lg', isOverdue ? 'bg-red-500/10 text-red-500' : isAhead ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-500')}>
                {isOverdue ? 'Overdue' : `${remaining}d baaki`}
              </p>
            </div>
            <div className="relative w-full bg-surface-subdued h-2.5 rounded-full overflow-hidden border border-border-subdued">
              <div className={cn('absolute h-full rounded-full transition-all duration-1000', isOverdue ? 'bg-red-400' : 'bg-text-subdued/30')} style={{ width: `${timePct}%` }} />
              <div className="absolute h-full bg-brand rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-rgb),0.3)]" style={{ width: `${phasePct}%` }} />
            </div>
            <div className="flex justify-between text-caption font-bold tracking-tight">
              <span className="text-text-secondary">Kaam: <span className="text-brand">{phasePct}%</span></span>
              <span className="text-text-secondary">Time: <span className={cn(isOverdue ? 'text-red-500' : 'text-text-primary')}>{timePct}%</span></span>
            </div>
          </div>
        </div>

        {/* Phase Progress (Right 3 units) */}
        <div className="col-span-3 bg-surface p-7 rounded-3xl border border-border-default shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-heading text-title font-bold text-text-primary uppercase tracking-widest">Construction Phases</h4>
              <div className="flex flex-col items-end">
                <span className="text-display-sm font-bold text-brand leading-none">{phasePct}%</span>
                <span className="text-caption font-bold text-text-subdued uppercase tracking-widest mt-1">Overall Progress</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-subdued/30 border border-border-subdued p-5 rounded-2xl flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-title mb-3">{completedCount}</div>
                <p className="text-caption font-bold text-text-primary uppercase tracking-tight">Done</p>
                <p className="text-[10px] text-text-subdued uppercase mt-1">Verified</p>
              </div>
              <div className="bg-surface-subdued/30 border border-border-subdued p-5 rounded-2xl flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand font-bold text-title mb-3">{inProgress}</div>
                <p className="text-caption font-bold text-text-primary uppercase tracking-tight">Active</p>
                <p className="text-[10px] text-text-subdued uppercase mt-1">In Progress</p>
              </div>
              <div className="bg-surface-subdued/30 border border-border-subdued p-5 rounded-2xl flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-surface-subdued rounded-xl flex items-center justify-center text-text-subdued font-bold text-title mb-3">{pending}</div>
                <p className="text-caption font-bold text-text-primary uppercase tracking-tight">Pending</p>
                <p className="text-[10px] text-text-subdued uppercase mt-1">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border-subdued flex items-center justify-between">
             <div className="flex -space-x-2">
                {[...Array(Math.min(5, milestones.length))].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-surface-subdued border-2 border-surface flex items-center justify-center text-[10px] font-bold text-text-subdued">
                    P{i+1}
                  </div>
                ))}
                {milestones.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-brand/10 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-brand">
                    +{milestones.length - 5}
                  </div>
                )}
             </div>
             <button onClick={() => setSubTab('timeline')} className="px-6 py-2 text-caption font-bold text-brand border border-brand/20 hover:bg-brand/5 rounded-full transition-all uppercase tracking-widest">
               View Timeline →
             </button>
          </div>
        </div>

      </div>

      {/* Row 2: Financials & Resources */}
      <div className="grid grid-cols-3 gap-6">
        {/* Kharcha Card */}
        <div className="bg-surface p-7 rounded-3xl border border-border-default shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-heading text-title font-bold text-text-primary mb-6">Financial Overview</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-text-secondary font-medium">Materials & Labour</span>
                <span className="text-body font-bold text-text-primary">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-text-secondary font-medium">Miscellaneous</span>
                <span className="text-body font-bold text-text-primary">{formatCurrency(totalMisc)}</span>
              </div>
              <div className="pt-4 border-t border-border-subdued flex justify-between items-center">
                <span className="text-body font-bold text-text-primary uppercase tracking-widest">Total Spent</span>
                <span className="text-title font-bold text-red-600">{formatCurrency(totalSpent + totalMisc)}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setSubTab('expenses')} className="w-full mt-8 py-3 text-body-sm font-bold text-brand border border-brand/20 hover:bg-brand/5 rounded-xl transition-all">
            Full Expense Log
          </button>
        </div>

        {/* Materials Card */}
        <button onClick={() => setSubTab('materials')} className="bg-surface p-7 rounded-3xl border border-border-default shadow-sm text-left hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"><Package size={28} className="text-brand" /></div>
          <div>
            <p className="text-display-sm font-bold text-text-primary tracking-tight">{materials.length}</p>
            <p className="text-caption font-bold text-text-subdued uppercase tracking-widest mt-1">Materials Tracked</p>
          </div>
          {materials.filter(m => m.purchased - m.used <= m.minStock).length > 0 && (
            <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <p className="text-caption font-bold uppercase">{materials.filter(m => m.purchased - m.used <= m.minStock).length} Critical Low Stock</p>
            </div>
          )}
        </button>

        {/* Labour Card */}
        <button onClick={() => setSubTab('labour')} className="bg-surface p-7 rounded-3xl border border-border-default shadow-sm text-left hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"><Users size={28} className="text-emerald-600" /></div>
          <div>
            <p className="text-display-sm font-bold text-text-primary tracking-tight">{todayWorkers}</p>
            <p className="text-caption font-bold text-text-subdued uppercase tracking-widest mt-1">Aaj Ke Mazdoor</p>
          </div>
          <div className="mt-6 text-caption font-bold text-emerald-600 uppercase tracking-widest">{todayWorkers > 0 ? 'Aaj kaam chal raha hai ✓' : 'Koi record nahi aaj ka'}</div>
        </button>
      </div>
    </div>

    {/* ═══ MOBILE ═══ */}
    <div className="md:hidden space-y-4">
      {/* Project Info */}
      <div className="bg-surface p-5 rounded-3xl border border-border-default shadow-sm space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-heading text-title-lg font-bold text-text-primary">{project.name}</h3>
            <p className="text-text-subdued text-body-sm">{project.location}</p>
          </div>
          <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-caption font-bold uppercase tracking-widest">{project.type}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subdued">
          <div>
            <p className="text-caption font-bold text-text-subdued uppercase mb-0.5">Shuru</p>
            <p className="font-bold text-text-primary text-body-sm">{format(new Date(project.startDate), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-caption font-bold text-text-subdued uppercase mb-0.5">Khatam (Plan)</p>
            <p className="font-bold text-text-primary text-body-sm">{format(new Date(project.endDate), 'dd MMM yyyy')}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-border-subdued space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-caption font-bold text-text-subdued uppercase">Time Progress</p>
            <p className={cn('text-caption font-bold', isOverdue ? 'text-red-500' : isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500')}>
              {isOverdue ? `${Math.round((now - end) / 86400000)}d overdue` : `${remaining}d baaki`}
            </p>
          </div>
          <div className="relative w-full bg-surface-subdued h-2.5 rounded-full overflow-hidden border border-border-subdued">
            <div className={cn('absolute h-full rounded-full transition-all', isOverdue ? 'bg-red-400' : 'bg-text-subdued')} style={{ width: `${timePct}%` }} />
            <div className="absolute h-full bg-brand rounded-full transition-all opacity-90" style={{ width: `${phasePct}%` }} />
          </div>
          <div className="flex justify-between text-caption text-text-subdued font-medium">
            <span>Kaam: <span className="font-bold text-brand">{phasePct}%</span></span>
            <span className={cn('font-bold', isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500')}>{isAhead ? 'Time se aage ✓' : 'Thoda peeche'}</span>
            <span>Samay: <span className={cn('font-bold', isOverdue ? 'text-red-500' : 'text-text-secondary')}>{timePct}%</span></span>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-surface p-5 rounded-3xl border border-border-default shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-heading text-title font-bold text-text-primary">Kaam ki Progress</h4>
          <span className="text-body-sm font-bold text-brand">{phasePct}%</span>
        </div>
        <div className="w-full bg-surface-subdued h-2.5 rounded-full overflow-hidden border border-border-subdued">
          <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${phasePct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-title-lg font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
            <p className="text-caption text-text-subdued font-bold uppercase tracking-widest">Done</p>
          </div>
          <div className="text-center">
            <p className="text-title-lg font-bold text-brand">{inProgress}</p>
            <p className="text-caption text-text-subdued font-bold uppercase tracking-widest">Chal Raha</p>
          </div>
          <div className="text-center">
            <p className="text-title-lg font-bold text-text-subdued">{pending}</p>
            <p className="text-caption text-text-subdued font-bold uppercase tracking-widest">Baaki</p>
          </div>
        </div>
        <button onClick={() => setSubTab('timeline')} className="w-full text-body-sm font-bold text-brand pt-2 border-t border-border-subdued hover:opacity-80 transition-opacity uppercase tracking-widest">Sab phases dekho →</button>
      </div>

      {/* Kharcha Summary */}
      <div className="bg-surface p-5 rounded-3xl border border-border-default shadow-sm space-y-3">
        <h4 className="font-heading text-title font-bold text-text-primary">Kharcha</h4>
        <div className="space-y-2">
          {[
            { label: 'Samaan + Mazdoor', value: totalSpent },
            { label: 'Miscellaneous', value: totalMisc },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center text-body-sm">
              <span className="text-text-secondary">{row.label}</span>
              <span className="font-mono font-bold text-text-primary">{formatCurrency(row.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center text-body-sm pt-2 border-t border-border-default">
            <span className="font-bold text-text-primary">Total</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSpent + totalMisc)}</span>
          </div>
        </div>
        <button onClick={() => setSubTab('expenses')} className="w-full text-body-sm font-bold text-brand pt-2 border-t border-border-subdued hover:opacity-80 transition-opacity uppercase tracking-widest">Detail dekho →</button>
      </div>

      {/* Material + Labour Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setSubTab('materials')} className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm text-left active:scale-95 transition-transform">
          <Package size={18} className="text-brand mb-2" />
          <p className="text-title-lg font-bold text-text-primary">{materials.length}</p>
          <p className="text-caption font-bold text-text-subdued uppercase tracking-widest">Materials</p>
          {materials.filter(m => m.purchased - m.used <= m.minStock).length > 0 && (
            <p className="text-caption text-red-500 font-bold mt-1 uppercase tracking-widest">{materials.filter(m => m.purchased - m.used <= m.minStock).length} low stock</p>
          )}
        </button>
        <button onClick={() => setSubTab('labour')} className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm text-left active:scale-95 transition-transform">
          <Users size={18} className="text-brand mb-2" />
          <p className="text-title-lg font-bold text-text-primary">{todayWorkers}</p>
          <p className="text-caption font-bold text-text-subdued uppercase tracking-widest">Aaj Mazdoor</p>
        </button>
      </div>
    </div>
    </>
  );
}
