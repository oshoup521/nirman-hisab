import React from 'react';
import { LayoutDashboard, TrendingUp, Trash2, Package, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext } from '../../context/AppContext';
import { useDragScroll } from '../../hooks/useDragScroll';
import DemolitionOverview from './DemolitionOverview';
import BrickRecoverySection from './BrickRecoverySection';
import MalwaSection from './MalwaSection';
import ScrapSection from './ScrapSection';
import DemolitionThekaSection from './DemolitionThekaSection';

const tabs = [
  { id: 'overview', label: 'Overview',    Icon: LayoutDashboard },
  { id: 'bricks',   label: 'Eent Bachao', Icon: TrendingUp },
  { id: 'malwa',    label: 'Malwa',       Icon: Trash2 },
  { id: 'scrap',    label: 'Kabaad',      Icon: Package },
  { id: 'theka',    label: 'Theka',       Icon: ChevronRight },
];

export default function DemolitionTab() {
  const { subTab, setSubTab } = useAppContext();
  const drag = useDragScroll();

  return (
    <div className="space-y-6 pb-28">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Tod-Phod</h1>
        <p className="text-slate-500 text-sm">Demolition Tracker</p>
      </header>

      <div
        ref={drag.ref}
        onMouseDown={drag.onMouseDown}
        onMouseMove={drag.onMouseMove}
        onMouseUp={drag.onMouseUp}
        onMouseLeave={drag.onMouseLeave}
        className="-mx-4 flex gap-2 overflow-x-auto pb-2 px-4 no-scrollbar cursor-grab"
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0',
              subTab === id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-100'
                : 'bg-white text-slate-600 border border-slate-100'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <span className="shrink-0 w-4" />
      </div>

      {subTab === 'overview' && <DemolitionOverview />}
      {subTab === 'bricks'   && <BrickRecoverySection />}
      {subTab === 'malwa'    && <MalwaSection />}
      {subTab === 'scrap'    && <ScrapSection />}
      {subTab === 'theka'    && <DemolitionThekaSection />}
    </div>
  );
}
