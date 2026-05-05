import React from 'react';
import { LayoutDashboard, Construction, Hammer, Home, Settings, NotebookPen } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext, TabType } from '../../context/AppContext';

const tabs: { id: TabType; label: string; Icon: React.ElementType; color: string; pill: string }[] = [
  { id: 'dashboard',    label: 'Hisaab',    Icon: LayoutDashboard, color: 'text-brand', pill: 'bg-brand/10'  },
  { id: 'construction', label: 'Naya Kaam', Icon: Construction,    color: 'text-brand', pill: 'bg-brand/10'  },
  { id: 'diary',        label: 'Diary',     Icon: NotebookPen,     color: 'text-emerald-600 dark:text-emerald-400', pill: 'bg-emerald-500/10' },
  { id: 'demolition',   label: 'Tod-Phod',  Icon: Hammer,          color: 'text-orange-600 dark:text-orange-400', pill: 'bg-orange-500/10'  },
  { id: 'kiraya',       label: 'Kiraya',    Icon: Home,            color: 'text-violet-600 dark:text-violet-400', pill: 'bg-violet-500/10'  },
  { id: 'settings',     label: 'Taiyari',   Icon: Settings,        color: 'text-text-primary',  pill: 'bg-surface-subdued'  },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, setSubTab } = useAppContext();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border-default px-1 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] flex justify-around items-end z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
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
              active ? cn(pill, color) : 'text-text-subdued'
            )}>
              <Icon size={18} />
            </div>
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-tight transition-colors truncate max-w-full px-0.5',
              active ? color : 'text-text-subdued'
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
