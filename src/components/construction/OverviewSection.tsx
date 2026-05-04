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
  const phasePct = Math.round((completedCount / milestones.length) * 100);
  const isOverdue = now > end;
  const isAhead = phasePct >= timePct;

  const inProgress = milestones.filter(m => m.status === 'in-progress').length;
  const pending = milestones.length - completedCount - inProgress;

  return (
    <div className="space-y-4">
      {/* Project Info */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
            <p className="text-slate-500 text-sm">{project.location}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase">
            {project.type}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Shuru</p>
            <p className="font-bold text-slate-700 text-sm">{format(new Date(project.startDate), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Khatam (Plan)</p>
            <p className="font-bold text-slate-700 text-sm">{format(new Date(project.endDate), 'dd MMM yyyy')}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-50 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Time Progress</p>
            <p className={cn('text-[10px] font-bold', isOverdue ? 'text-red-500' : isAhead ? 'text-green-600' : 'text-orange-500')}>
              {isOverdue ? `${Math.round((now - end) / 86400000)}d overdue` : `${remaining}d baaki`}
            </p>
          </div>
          <div className="relative w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={cn('absolute h-full rounded-full transition-all', isOverdue ? 'bg-red-400' : 'bg-slate-300')}
              style={{ width: `${timePct}%` }}
            />
            <div className="absolute h-full bg-indigo-500 rounded-full transition-all opacity-90" style={{ width: `${phasePct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Kaam: <span className="font-bold text-indigo-600">{phasePct}%</span></span>
            <span className={cn('font-bold', isAhead ? 'text-green-600' : 'text-orange-500')}>
              {isAhead ? 'Time se aage ✓' : 'Thoda peeche'}
            </span>
            <span>Samay: <span className={cn('font-bold', isOverdue ? 'text-red-500' : 'text-slate-600')}>{timePct}%</span></span>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-slate-900">Kaam ki Progress</h4>
          <span className="text-sm font-bold text-indigo-600">{phasePct}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${phasePct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{completedCount}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-indigo-500">{inProgress}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Chal Raha</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-400">{pending}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Baaki</p>
          </div>
        </div>
        <button
          onClick={() => setSubTab('timeline')}
          className="w-full text-xs font-bold text-indigo-600 pt-2 border-t border-slate-50"
        >
          Sab phases dekho →
        </button>
      </div>

      {/* Kharcha Summary */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-900">Kharcha</h4>
        <div className="space-y-2">
          {[
            { label: 'Samaan + Mazdoor', value: totalSpent },
            { label: 'Miscellaneous', value: totalMisc },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center text-sm">
              <span className="text-slate-500">{row.label}</span>
              <span className="font-bold text-slate-900">{formatCurrency(row.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-700">Total</span>
            <span className="font-bold text-red-600">{formatCurrency(totalSpent + totalMisc)}</span>
          </div>
        </div>
        <button onClick={() => setSubTab('expenses')} className="w-full text-xs font-bold text-indigo-600 pt-2 border-t border-slate-50">
          Detail dekho →
        </button>
      </div>

      {/* Material + Labour Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSubTab('materials')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left active:scale-95 transition-transform"
        >
          <Package size={18} className="text-indigo-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{materials.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Materials</p>
          {materials.filter(m => m.purchased - m.used <= m.minStock).length > 0 && (
            <p className="text-[10px] text-red-500 font-bold mt-1">
              {materials.filter(m => m.purchased - m.used <= m.minStock).length} low stock
            </p>
          )}
        </button>
        <button
          onClick={() => setSubTab('labour')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left active:scale-95 transition-transform"
        >
          <Users size={18} className="text-indigo-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{labours.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Mazdoor</p>
        </button>
      </div>
    </div>
  );
}
