import React from 'react';
import { LayoutDashboard, Construction, Hammer, Home, Settings, NotebookPen } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext, TabType } from '../../context/AppContext';

const tabs: { id: TabType; label: string; Icon: React.ElementType; color: string; pill: string }[] = [
  { id: 'dashboard',    label: 'Hisaab',    Icon: LayoutDashboard, color: 'text-indigo-600', pill: 'bg-indigo-50'  },
  { id: 'construction', label: 'Naya Kaam', Icon: Construction,    color: 'text-indigo-600', pill: 'bg-indigo-50'  },
  { id: 'diary',        label: 'Diary',     Icon: NotebookPen,     color: 'text-emerald-600', pill: 'bg-emerald-50' },
  { id: 'demolition',   label: 'Tod-Phod',  Icon: Hammer,          color: 'text-orange-600', pill: 'bg-orange-50'  },
  { id: 'kiraya',       label: 'Kiraya',    Icon: Home,            color: 'text-violet-600', pill: 'bg-violet-50'  },
  { id: 'settings',     label: 'Taiyari',   Icon: Settings,        color: 'text-slate-700',  pill: 'bg-slate-100'  },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, setSubTab } = useAppContext();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-1 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] flex justify-around items-end z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map(({ id, label, Icon, color, pill }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSubTab('overview'); }}
            className="flex flex-col items-center gap-0.5 flex-1 min-w-0 active:scale-95 transition-transform"
          >
            <div className={cn(
              'w-9 h-7 flex items-center justify-center rounded-xl transition-all duration-200',
              active ? cn(pill, color) : 'text-slate-400'
            )}>
              <Icon size={18} />
            </div>
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-tight transition-colors truncate max-w-full px-0.5',
              active ? color : 'text-slate-400'
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
