import React from 'react';
import { LayoutDashboard, Package, Users, ChevronRight, IndianRupee, Clock, Images } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppContext } from '../../context/AppContext';
import { useDragScroll } from '../../hooks/useDragScroll';
import Lightbox from '../common/Lightbox';
import OverviewSection from './OverviewSection';
import MaterialsSection from './MaterialsSection';
import VendorsSection from './VendorsSection';
import LabourSection from './LabourSection';
import ThekaSection from './ThekaSection';
import ExpensesSection from './ExpensesSection';
import TimelineSection from './TimelineSection';
import GallerySection from './GallerySection';

const tabs = [
  { id: 'overview',   label: 'Overview', Icon: LayoutDashboard },
  { id: 'materials',  label: 'Samaan',   Icon: Package },
  { id: 'vendors',    label: 'Udhaar',   Icon: Users },
  { id: 'labour',     label: 'Mazdoor',  Icon: Users },
  { id: 'theka',      label: 'Theka',    Icon: ChevronRight },
  { id: 'expenses',   label: 'Kharcha',  Icon: IndianRupee },
  { id: 'timeline',   label: 'Raftaar',  Icon: Clock },
  { id: 'gallery',    label: 'Gallery',  Icon: Images },
];

export default function ConstructionTab() {
  const { subTab, setSubTab, photos } = useAppContext();
  const drag = useDragScroll();

  return (
    <div className="space-y-6 pb-28">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Naya Kaam</h1>
        <p className="text-text-subdued text-sm">Construction Tracker</p>
      </header>

      {/* Sub-tab navigation */}
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
                ? 'bg-brand text-surface shadow-md shadow-brand/20'
                : 'bg-surface text-text-secondary border border-border-default'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <span className="shrink-0 w-4" />
      </div>

      {subTab === 'overview'   && <OverviewSection />}
      {subTab === 'materials'  && <MaterialsSection />}
      {subTab === 'vendors'    && <VendorsSection />}
      {subTab === 'labour'     && <LabourSection />}
      {subTab === 'theka'      && <ThekaSection />}
      {subTab === 'expenses'   && <ExpensesSection />}
      {subTab === 'timeline'   && <TimelineSection />}
      {subTab === 'gallery'    && <GallerySection />}

      <Lightbox photo={photos.lightboxPhoto} onClose={() => photos.setLightboxPhoto(null)} />
    </div>
  );
}
