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

  const { project, milestones, materials, labours } = state;
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
    <div className="space-y-4">
      {/* Project Info */}
      <div className="bg-surface p-5 rounded-3xl border border-border-default shadow-sm space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-heading text-title-lg font-bold text-text-primary">{project.name}</h3>
            <p className="text-text-subdued text-body-sm">{project.location}</p>
          </div>
          <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-caption font-bold uppercase">
            {project.type}
          </span>
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
            <div
              className={cn('absolute h-full rounded-full transition-all', isOverdue ? 'bg-red-400' : 'bg-text-subdued')}
              style={{ width: `${timePct}%` }}
            />
            <div className="absolute h-full bg-brand rounded-full transition-all opacity-90" style={{ width: `${phasePct}%` }} />
          </div>
          <div className="flex justify-between text-caption text-text-subdued font-medium">
            <span>Kaam: <span className="font-bold text-brand">{phasePct}%</span></span>
            <span className={cn('font-bold', isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500')}>
              {isAhead ? 'Time se aage ✓' : 'Thoda peeche'}
            </span>
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
            <p className="text-caption text-text-subdued font-bold uppercase">Done</p>
          </div>
          <div className="text-center">
            <p className="text-title-lg font-bold text-brand">{inProgress}</p>
            <p className="text-caption text-text-subdued font-bold uppercase">Chal Raha</p>
          </div>
          <div className="text-center">
            <p className="text-title-lg font-bold text-text-subdued">{pending}</p>
            <p className="text-caption text-text-subdued font-bold uppercase">Baaki</p>
          </div>
        </div>
        <button
          onClick={() => setSubTab('timeline')}
          className="w-full text-body-sm font-bold text-brand pt-2 border-t border-border-subdued hover:opacity-80 transition-opacity"
        >
          Sab phases dekho →
        </button>
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
        <button onClick={() => setSubTab('expenses')} className="w-full text-body-sm font-bold text-brand pt-2 border-t border-border-subdued hover:opacity-80 transition-opacity">
          Detail dekho →
        </button>
      </div>

      {/* Material + Labour Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSubTab('materials')}
          className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm text-left active:scale-95 transition-transform"
        >
          <Package size={18} className="text-brand mb-2" />
          <p className="text-title-lg font-bold text-text-primary">{materials.length}</p>
          <p className="text-caption font-bold text-text-subdued uppercase">Materials</p>
          {materials.filter(m => m.purchased - m.used <= m.minStock).length > 0 && (
            <p className="text-caption text-red-500 font-bold mt-1">
              {materials.filter(m => m.purchased - m.used <= m.minStock).length} low stock
            </p>
          )}
        </button>
        <button
          onClick={() => setSubTab('labour')}
          className="bg-surface p-4 rounded-2xl border border-border-default shadow-sm text-left active:scale-95 transition-transform"
        >
          <Users size={18} className="text-brand mb-2" />
          <p className="text-title-lg font-bold text-text-primary">{labours.length}</p>
          <p className="text-caption font-bold text-text-subdued uppercase">Mazdoor</p>
        </button>
      </div>
    </div>
  );
}
