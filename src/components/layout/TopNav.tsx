import React from 'react';
import { LayoutDashboard, Construction, Hammer, Home, Settings, NotebookPen } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext, TabType } from '../../context/AppContext';

const tabs: { id: TabType; label: string; Icon: React.ElementType; color: string; pill: string }[] = [
  { id: 'dashboard',    label: 'Hisaab',    Icon: LayoutDashboard, color: 'text-brand',  pill: 'bg-brand/10'  },
  { id: 'construction', label: 'Naya Kaam', Icon: Construction,    color: 'text-brand',  pill: 'bg-brand/10'  },
  { id: 'diary',        label: 'Diary',     Icon: NotebookPen,     color: 'text-emerald-600 dark:text-emerald-400', pill: 'bg-emerald-500/10' },
  { id: 'demolition',   label: 'Tod-Phod',  Icon: Hammer,          color: 'text-orange-600 dark:text-orange-400',  pill: 'bg-orange-500/10'  },
  { id: 'kiraya',       label: 'Kiraya',    Icon: Home,            color: 'text-violet-600 dark:text-violet-400',  pill: 'bg-violet-500/10'  },
  { id: 'settings',     label: 'Taiyari',   Icon: Settings,        color: 'text-text-primary',   pill: 'bg-surface-subdued'  },
];

export default function TopNav() {
  const { activeTab, setActiveTab, setSubTab, state } = useAppContext();
  const projectName = state.project?.name || 'Nirman Hisaab';

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border-default shadow-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center gap-6 h-16">
        <div className="flex items-center gap-4 shrink-0">
          <img src="/pwa-192x192.png" alt="Nirman Hisab" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
          <span className="font-heading font-black text-text-primary text-2xl tracking-tighter">Nirman Hisab</span>
        </div>

        <div className="flex items-center gap-1 flex-1 h-full">
          {tabs.map(({ id, label, Icon, color, pill }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSubTab('overview'); }}
                className={cn(
                  'relative h-full flex items-center gap-2 px-5 py-2 text-sm font-bold transition-all group',
                  active ? color : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon size={18} className={cn('transition-transform', active ? 'scale-110' : 'group-hover:scale-110')} />
                <span>{label}</span>
                
                {/* Active Indicator Line */}
                {active && (
                  <div className={cn('absolute bottom-0 left-0 right-0 h-1 rounded-t-full', color.replace('text-', 'bg-'))} />
                )}
                
                {/* Hover state */}
                {!active && (
                  <div className="absolute inset-0 bg-surface-subdued opacity-0 group-hover:opacity-100 rounded-xl transition-opacity -z-10 m-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
