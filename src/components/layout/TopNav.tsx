import React from 'react';
import { LayoutDashboard, Construction, Hammer, Home, Settings, NotebookPen } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext, TabType } from '../../context/AppContext';

const tabs: { id: TabType; label: string; Icon: React.ElementType; color: string; pill: string }[] = [
  { id: 'dashboard',    label: 'Hisaab',    Icon: LayoutDashboard, color: 'text-indigo-600',  pill: 'bg-indigo-50'  },
  { id: 'construction', label: 'Naya Kaam', Icon: Construction,    color: 'text-indigo-600',  pill: 'bg-indigo-50'  },
  { id: 'diary',        label: 'Diary',     Icon: NotebookPen,     color: 'text-emerald-600', pill: 'bg-emerald-50' },
  { id: 'demolition',   label: 'Tod-Phod',  Icon: Hammer,          color: 'text-orange-600',  pill: 'bg-orange-50'  },
  { id: 'kiraya',       label: 'Kiraya',    Icon: Home,            color: 'text-violet-600',  pill: 'bg-violet-50'  },
  { id: 'settings',     label: 'Taiyari',   Icon: Settings,        color: 'text-slate-700',   pill: 'bg-slate-100'  },
];

export default function TopNav() {
  const { activeTab, setActiveTab, setSubTab, state } = useAppContext();
  const projectName = state.project?.name || 'Nirman Hisaab';

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm">
            NH
          </div>
          <span className="font-black text-slate-800 text-base truncate max-w-[200px]">{projectName}</span>
        </div>

        <div className="flex items-center gap-1 flex-1">
          {tabs.map(({ id, label, Icon, color, pill }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSubTab('overview'); }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all',
                  active ? cn(pill, color) : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
