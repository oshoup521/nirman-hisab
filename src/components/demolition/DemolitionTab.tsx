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
    <div className="space-y-6 pb-28 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-display font-bold text-text-primary">Tod-Phod</h1>
          <p className="text-text-subdued text-body-sm font-medium">Demolition Tracker</p>
        </div>
      </header>

      <div
        ref={drag.ref}
        onMouseDown={drag.onMouseDown}
        onMouseMove={drag.onMouseMove}
        onMouseUp={drag.onMouseUp}
        onMouseLeave={drag.onMouseLeave}
        className={cn(
          'flex gap-2 overflow-x-auto pb-2 no-scrollbar cursor-grab',
          '-mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible md:cursor-default'
        )}
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-bold whitespace-nowrap transition-all shrink-0 md:shrink md:rounded-xl',
              subTab === id
                ? 'bg-brand text-surface shadow-md shadow-brand/20'
                : 'bg-surface text-text-secondary border border-border-default hover:bg-surface-subdued'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <span className="shrink-0 w-4 md:hidden" />
      </div>

      {subTab === 'overview' && <DemolitionOverview />}
      {subTab === 'bricks'   && <BrickRecoverySection />}
      {subTab === 'malwa'    && <MalwaSection />}
      {subTab === 'scrap'    && <ScrapSection />}
      {subTab === 'theka'    && <DemolitionThekaSection />}
    </div>
  );
}
