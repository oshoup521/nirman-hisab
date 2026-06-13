import React, { useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Compass, Phone, Building2,
  CheckCircle2, Circle, IndianRupee, Footprints, FileImage,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import {
  Architect, ArchitectFeeType, ArchitectRole,
  ArchitectVisit, ArchitectPayment, ArchitectDeliverable,
} from '../../types';
import PhotoStrip from '../common/PhotoStrip';
import PhotosSheet from '../common/PhotosSheet';
import Lightbox from '../common/Lightbox';

const ROLES: ArchitectRole[] = ['Architect', 'Structural Engineer', 'Interior Designer', 'MEP', 'Other'];
const FEE_TYPES: { id: ArchitectFeeType; label: string }[] = [
  { id: 'package',    label: 'Package (Flat)' },
  { id: 'per-sqft',   label: 'Per Sq.Ft' },
  { id: 'per-visit',  label: 'Per Visit' },
  { id: 'percentage', label: '% of Project' },
];

const DEFAULT_DELIVERABLES = [
  'Site Plan',
  'Floor Plan',
  'Elevation',
  'Section',
  'Electrical Layout',
  'Plumbing Layout',
  'Structural Drawings',
  '3D View',
  'Map Approval',
  'Completion Certificate',
];

type ArchForm = {
  name: string;
  firm: string;
  phone: string;
  role: ArchitectRole;
  feeType: ArchitectFeeType;
  totalFee: string;
  ratePerSqFt: string;
  areaSqFt: string;
  ratePerVisit: string;
  percentageRate: string;
  projectValue: string;
  packageVisits: string;
  extraVisitRate: string;
  scopeNotes: string;
  startDate: string;
};

type VisitForm = {
  architectId: string;
  visitId: string | null;
  date: string;
  purpose: string;
  notes: string;
  billable: boolean;
};

type PayForm = {
  architectId: string;
  paymentId: string | null;
  amount: string;
  date: string;
  note: string;
};

type DelivForm = {
  architectId: string;
  delivId: string | null;
  name: string;
};

const blankArchForm = (projectArea: number): ArchForm => ({
  name: '', firm: '', phone: '',
  role: 'Architect',
  feeType: 'package',
  totalFee: '', ratePerSqFt: '', areaSqFt: projectArea ? String(projectArea) : '',
  ratePerVisit: '', percentageRate: '', projectValue: '',
  packageVisits: '', extraVisitRate: '',
  scopeNotes: '',
  startDate: format(new Date(), 'yyyy-MM-dd'),
});

const computeFee = (f: ArchForm): number => {
  switch (f.feeType) {
    case 'per-sqft':
      return (Number(f.ratePerSqFt) || 0) * (Number(f.areaSqFt) || 0);
    case 'percentage':
      return ((Number(f.projectValue) || 0) * (Number(f.percentageRate) || 0)) / 100;
    case 'per-visit':
      return 0; // payable accumulates per visit
    case 'package':
    default:
      return Number(f.totalFee) || 0;
  }
};

export default function ArchitectSection() {
  const { state, setState, askConfirm, photos, isViewer } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto } = photos;
  const architects = state.architects || [];

  const [archForm, setArchForm] = useState<ArchForm | null>(null);
  const [archEditId, setArchEditId] = useState<string | null>(null);
  const [visitForm, setVisitForm] = useState<VisitForm | null>(null);
  const [payForm, setPayForm] = useState<PayForm | null>(null);
  const [delivForm, setDelivForm] = useState<DelivForm | null>(null);

  const [sheetArchId, setSheetArchId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ archId: string; idx: number } | null>(null);
  const sheetArch = sheetArchId ? architects.find(a => a.id === sheetArchId) : null;
  const lightboxArch = lightbox ? architects.find(a => a.id === lightbox.archId) : null;

  // ─── Architect form ────────────────────────────────────────────
  const openAddArch = () => {
    setArchEditId(null);
    setArchForm(blankArchForm(state.project?.totalArea || 0));
  };
  const openEditArch = (a: Architect) => {
    setArchEditId(a.id);
    setArchForm({
      name: a.name,
      firm: a.firm || '',
      phone: a.phone || '',
      role: a.role,
      feeType: a.feeType,
      totalFee: String(a.totalFee || ''),
      ratePerSqFt: String(a.ratePerSqFt || ''),
      areaSqFt: String(a.areaSqFt || ''),
      ratePerVisit: String(a.ratePerVisit || ''),
      percentageRate: String(a.percentageRate || ''),
      projectValue: String(a.projectValue || ''),
      packageVisits: String(a.packageVisits || ''),
      extraVisitRate: String(a.extraVisitRate || ''),
      scopeNotes: a.scopeNotes || '',
      startDate: a.startDate ? format(new Date(a.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
  };
  const closeArchForm = () => { setArchForm(null); setArchEditId(null); };

  const saveArch = () => {
    if (!archForm?.name) return;
    const fee = computeFee(archForm);
    const fields = {
      name: archForm.name,
      firm: archForm.firm || undefined,
      phone: archForm.phone || undefined,
      role: archForm.role,
      feeType: archForm.feeType,
      totalFee: fee,
      ratePerSqFt: archForm.feeType === 'per-sqft' ? Number(archForm.ratePerSqFt) || undefined : undefined,
      areaSqFt: archForm.feeType === 'per-sqft' ? Number(archForm.areaSqFt) || undefined : undefined,
      ratePerVisit: archForm.feeType === 'per-visit' ? Number(archForm.ratePerVisit) || undefined : undefined,
      percentageRate: archForm.feeType === 'percentage' ? Number(archForm.percentageRate) || undefined : undefined,
      projectValue: archForm.feeType === 'percentage' ? Number(archForm.projectValue) || undefined : undefined,
      packageVisits: Number(archForm.packageVisits) || 0,
      extraVisitRate: Number(archForm.extraVisitRate) || 0,
      scopeNotes: archForm.scopeNotes || undefined,
      startDate: archForm.startDate ? new Date(archForm.startDate).toISOString() : new Date().toISOString(),
    };

    if (archEditId) {
      setState(prev => ({
        ...prev,
        architects: (prev.architects || []).map(a => a.id === archEditId ? { ...a, ...fields } : a),
      }));
    } else {
      const newArch: Architect = {
        id: genId(), ...fields,
        visits: [], payments: [], deliverables: [], photos: [],
      };
      setState(prev => ({ ...prev, architects: [...(prev.architects || []), newArch] }));
    }
    closeArchForm();
  };

  const deleteArchitect = (a: Architect) =>
    askConfirm(`"${a.name}" architect ko delete kar dein? Saare payments + visits + plans bhi hat jayenge.`, () => {
      // Also remove their payment expenses
      const paymentIds = new Set(a.payments.map(p => p.id));
      setState(prev => ({
        ...prev,
        architects: (prev.architects || []).filter(x => x.id !== a.id),
        expenses: prev.expenses.filter(e => !paymentIds.has(e.id)),
      }));
    });

  // ─── Visit form ────────────────────────────────────────────────
  const openAddVisit = (a: Architect) => setVisitForm({
    architectId: a.id, visitId: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    purpose: '',
    notes: '',
    billable: a.feeType === 'per-visit' ? true : false,
  });
  const openEditVisit = (a: Architect, v: ArchitectVisit) => setVisitForm({
    architectId: a.id, visitId: v.id,
    date: format(new Date(v.date), 'yyyy-MM-dd'),
    purpose: v.purpose,
    notes: v.notes || '',
    billable: v.billable,
  });
  const closeVisitForm = () => setVisitForm(null);

  const saveVisit = () => {
    if (!visitForm) return;
    const isoDate = new Date(visitForm.date).toISOString();
    const id = visitForm.visitId || genId();
    setState(prev => ({
      ...prev,
      architects: (prev.architects || []).map(a => a.id !== visitForm.architectId ? a : ({
        ...a,
        visits: visitForm.visitId
          ? a.visits.map(v => v.id === visitForm.visitId
              ? { id, date: isoDate, purpose: visitForm.purpose, notes: visitForm.notes || undefined, billable: visitForm.billable }
              : v)
          : [...a.visits, { id, date: isoDate, purpose: visitForm.purpose, notes: visitForm.notes || undefined, billable: visitForm.billable }],
      })),
    }));
    closeVisitForm();
  };

  const deleteVisit = (a: Architect, visitId: string) =>
    askConfirm('Yeh visit delete kar dein?', () =>
      setState(prev => ({
        ...prev,
        architects: (prev.architects || []).map(x => x.id === a.id
          ? { ...x, visits: x.visits.filter(v => v.id !== visitId) }
          : x),
      }))
    );

  // ─── Payment form ──────────────────────────────────────────────
  const openAddPay = (a: Architect) => setPayForm({
    architectId: a.id, paymentId: null,
    amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '',
  });
  const openEditPay = (a: Architect, p: ArchitectPayment) => setPayForm({
    architectId: a.id, paymentId: p.id,
    amount: String(p.amount),
    date: format(new Date(p.date), 'yyyy-MM-dd'),
    note: p.note || '',
  });
  const closePayForm = () => setPayForm(null);

  const savePay = () => {
    if (!payForm) return;
    const amount = Number(payForm.amount);
    if (!amount) return;
    const arch = architects.find(a => a.id === payForm.architectId);
    if (!arch) return;

    const isoDate = new Date(payForm.date).toISOString();
    const id = payForm.paymentId || genId();
    const expenseNotes = `${arch.name} (${arch.role})${payForm.note ? ` - ${payForm.note}` : ''}`;

    setState(prev => ({
      ...prev,
      architects: (prev.architects || []).map(a => a.id !== payForm.architectId ? a : ({
        ...a,
        payments: payForm.paymentId
          ? a.payments.map(p => p.id === payForm.paymentId ? { id, date: isoDate, amount, note: payForm.note } : p)
          : [...a.payments, { id, date: isoDate, amount, note: payForm.note }],
      })),
      expenses: payForm.paymentId
        ? prev.expenses.map(e => e.id === payForm.paymentId ? { ...e, amount, date: isoDate, notes: expenseNotes } : e)
        : [...prev.expenses, { id, date: isoDate, amount, category: 'Architect', notes: expenseNotes }],
    }));
    closePayForm();
  };

  const deletePayment = (a: Architect, paymentId: string) =>
    askConfirm('Is payment ko delete kar dein?', () =>
      setState(prev => ({
        ...prev,
        architects: (prev.architects || []).map(x => x.id === a.id
          ? { ...x, payments: x.payments.filter(p => p.id !== paymentId) }
          : x),
        expenses: prev.expenses.filter(e => e.id !== paymentId),
      }))
    );

  // ─── Deliverables ──────────────────────────────────────────────
  const openAddDeliv = (a: Architect) => setDelivForm({ architectId: a.id, delivId: null, name: '' });
  const openEditDeliv = (a: Architect, d: ArchitectDeliverable) =>
    setDelivForm({ architectId: a.id, delivId: d.id, name: d.name });
  const closeDelivForm = () => setDelivForm(null);

  const saveDeliv = () => {
    if (!delivForm?.name.trim()) return;
    const id = delivForm.delivId || genId();
    setState(prev => ({
      ...prev,
      architects: (prev.architects || []).map(a => a.id !== delivForm.architectId ? a : ({
        ...a,
        deliverables: delivForm.delivId
          ? a.deliverables.map(d => d.id === delivForm.delivId ? { ...d, name: delivForm.name.trim() } : d)
          : [...a.deliverables, { id, name: delivForm.name.trim(), status: 'pending' }],
      })),
    }));
    closeDelivForm();
  };

  const toggleDeliv = (a: Architect, d: ArchitectDeliverable) =>
    setState(prev => ({
      ...prev,
      architects: (prev.architects || []).map(x => x.id !== a.id ? x : ({
        ...x,
        deliverables: x.deliverables.map(item => item.id !== d.id ? item : ({
          ...item,
          status: item.status === 'done' ? 'pending' : 'done',
          doneDate: item.status === 'done' ? undefined : new Date().toISOString(),
        })),
      })),
    }));

  const deleteDeliv = (a: Architect, delivId: string) =>
    askConfirm('Yeh deliverable hata dein?', () =>
      setState(prev => ({
        ...prev,
        architects: (prev.architects || []).map(x => x.id === a.id
          ? { ...x, deliverables: x.deliverables.filter(d => d.id !== delivId) }
          : x),
      }))
    );

  const seedDefaultDeliverables = (a: Architect) => {
    const existing = new Set(a.deliverables.map(d => d.name.toLowerCase()));
    const toAdd = DEFAULT_DELIVERABLES
      .filter(n => !existing.has(n.toLowerCase()))
      .map(n => ({ id: genId(), name: n, status: 'pending' as const }));
    if (toAdd.length === 0) return;
    setState(prev => ({
      ...prev,
      architects: (prev.architects || []).map(x => x.id === a.id
        ? { ...x, deliverables: [...x.deliverables, ...toAdd] }
        : x),
    }));
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-heading text-title font-bold text-text-primary">Architect & Naksha</h3>
          <p className="text-caption text-text-subdued mt-0.5">{architects.length} architect{architects.length === 1 ? '' : 's'}</p>
        </div>
        {!isViewer && (
          <button
            onClick={openAddArch}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-surface rounded-xl text-body-sm font-bold shadow-sm shadow-brand/20 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {architects.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-10 text-center">
          <div className="w-14 h-14 bg-surface-subdued rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Compass size={26} className="text-text-secondary" />
          </div>
          <p className="font-bold text-text-secondary text-body-sm">Koi architect nahi abhi tak</p>
          {!isViewer && (
            <button onClick={openAddArch} className="mt-4 px-4 py-2 bg-brand/10 text-brand rounded-xl text-body-sm font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
              + Architect Add Karein
            </button>
          )}
        </div>
      ) : (
        <div className={cn('space-y-4', architects.length > 1 && 'md:space-y-0 md:grid md:grid-cols-2 md:gap-4')}>
          {[...architects].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(arch => {
            const totalPaid = arch.payments.reduce((s, p) => s + p.amount, 0);
            const billableVisits = arch.visits.filter(v => v.billable).length;
            const includedVisits = arch.visits.length - billableVisits;
            const extraCharges = arch.feeType === 'per-visit'
              ? billableVisits * (arch.ratePerVisit || 0)
              : billableVisits * (arch.extraVisitRate || 0);
            const totalPayable = (arch.totalFee || 0) + extraCharges;
            const remaining = totalPayable - totalPaid;
            const pct = totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;
            const visitsLeft = Math.max(0, (arch.packageVisits || 0) - includedVisits);
            const totalDeliv = arch.deliverables.length;
            const doneDeliv = arch.deliverables.filter(d => d.status === 'done').length;

            return (
              <div key={arch.id} className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading text-title font-bold text-text-primary truncate">{arch.name}</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-caption font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">{arch.role}</span>
                      {arch.firm && (
                        <span className="text-caption font-bold px-2 py-0.5 bg-surface-subdued text-text-secondary rounded-full inline-flex items-center gap-1">
                          <Building2 size={10} />{arch.firm}
                        </span>
                      )}
                    </div>
                    {arch.phone && (
                      <a href={`tel:${arch.phone}`} className="text-caption text-text-subdued font-bold inline-flex items-center gap-1 mt-1">
                        <Phone size={10} />{arch.phone}
                      </a>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <div className="text-right">
                      <p className="text-caption text-text-subdued font-bold uppercase leading-none">
                        {arch.feeType === 'per-visit' ? 'Per Visit' : 'Total Fee'}
                      </p>
                      <p className="text-title-lg font-bold text-text-primary leading-tight mt-0.5">
                        {arch.feeType === 'per-visit'
                          ? formatCurrency(arch.ratePerVisit || 0)
                          : formatCurrency(totalPayable)}
                      </p>
                      {extraCharges > 0 && arch.feeType !== 'per-visit' && (
                        <p className="text-caption text-text-subdued leading-none mt-0.5">
                          {formatCurrency(arch.totalFee)} + {formatCurrency(extraCharges)}
                        </p>
                      )}
                    </div>
                    {!isViewer && (
                      <>
                        <button onClick={() => openEditArch(arch)} className="p-1.5 bg-surface-subdued text-text-secondary rounded-xl border border-border-default hover:bg-border-default transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteArchitect(arch)} className="p-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress + payable summary */}
                <div className="px-4 pb-3">
                  <div className="w-full bg-border-default h-2 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-brand transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="flex justify-between text-caption font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">Diya: {formatCurrency(totalPaid)}</span>
                    <span className={cn(remaining > 0 ? 'text-red-500' : 'text-emerald-500 dark:text-emerald-400')}>
                      {remaining > 0 ? `Baaki: ${formatCurrency(remaining)}` : remaining < 0 ? `Advance ${formatCurrency(Math.abs(remaining))}` : 'Clear ✓'}
                    </span>
                  </div>
                </div>

                {/* Visit stats */}
                <div className="border-t border-border-default px-4 py-3 grid grid-cols-3 gap-3 bg-surface-subdued/40">
                  <div>
                    <p className="text-caption text-text-subdued font-bold uppercase leading-none">Visits</p>
                    <p className="text-title-lg font-bold text-text-primary leading-tight mt-1">{arch.visits.length}</p>
                  </div>
                  <div>
                    <p className="text-caption text-text-subdued font-bold uppercase leading-none">Package</p>
                    <p className="text-title-lg font-bold text-text-primary leading-tight mt-1">
                      {arch.packageVisits || 0}
                      {arch.packageVisits > 0 && (
                        <span className="text-caption text-text-subdued ml-1">({visitsLeft} left)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-text-subdued font-bold uppercase leading-none">Paid Extras</p>
                    <p className="text-title-lg font-bold text-red-500 leading-tight mt-1">{billableVisits}</p>
                  </div>
                </div>

                {extraCharges > 0 && (
                  <div className="px-4 py-2 bg-amber-500/10 border-y border-amber-500/20 flex justify-between items-center text-body-sm font-bold">
                    <span className="text-amber-700 dark:text-amber-400">Extra visit charges</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">+{formatCurrency(extraCharges)}</span>
                  </div>
                )}

                {/* Payments list */}
                {arch.payments.length > 0 && (
                  <div className="border-t border-border-default px-4 py-2.5">
                    <p className="text-caption font-bold text-text-subdued uppercase mb-2">Payments</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {[...arch.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-body-sm">
                          <div>
                            <p className="font-mono font-bold text-text-primary">{formatCurrency(payment.amount)}</p>
                            <p className="text-caption text-text-subdued uppercase font-bold">
                              {format(new Date(payment.date), 'dd MMM yyyy')}{payment.note && ` • ${payment.note}`}
                            </p>
                          </div>
                          {!isViewer && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditPay(arch, payment)} className="p-1 text-text-secondary hover:text-brand transition-colors"><Pencil size={12} /></button>
                              <button onClick={() => deletePayment(arch, payment.id)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visits list */}
                {arch.visits.length > 0 && (
                  <div className="border-t border-border-default px-4 py-2.5">
                    <p className="text-caption font-bold text-text-subdued uppercase mb-2">Recent Visits</p>
                    <div className="space-y-1.5">
                      {[...arch.visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4).map(visit => (
                        <div key={visit.id} className="flex justify-between items-center text-body-sm gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-text-primary truncate">
                              {visit.purpose || 'Visit'}
                              {visit.billable && (
                                <span className="ml-1.5 text-caption font-bold px-1.5 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded">
                                  PAID
                                </span>
                              )}
                            </p>
                            <p className="text-caption text-text-subdued uppercase font-bold">
                              {format(new Date(visit.date), 'dd MMM yyyy')}{visit.notes && ` • ${visit.notes}`}
                            </p>
                          </div>
                          {!isViewer && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => openEditVisit(arch, visit)} className="p-1 text-text-secondary hover:text-brand transition-colors"><Pencil size={12} /></button>
                              <button onClick={() => deleteVisit(arch, visit.id)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                      {arch.visits.length > 4 && (
                        <p className="text-caption text-text-subdued font-bold">+{arch.visits.length - 4} more visits</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Deliverables checklist */}
                <div className="border-t border-border-default px-4 py-2.5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-caption font-bold text-text-subdued uppercase">
                      Deliverables {totalDeliv > 0 && `(${doneDeliv}/${totalDeliv})`}
                    </p>
                    {!isViewer && arch.deliverables.length === 0 && (
                      <button onClick={() => seedDefaultDeliverables(arch)} className="text-caption font-bold text-brand hover:opacity-80">
                        + Default List
                      </button>
                    )}
                  </div>
                  {arch.deliverables.length > 0 ? (
                    <div className="space-y-1">
                      {arch.deliverables.map(d => (
                        <div key={d.id} className="flex justify-between items-center text-body-sm gap-2">
                          <button
                            onClick={() => !isViewer && toggleDeliv(arch, d)}
                            disabled={isViewer}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left"
                          >
                            {d.status === 'done'
                              ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                              : <Circle size={16} className="text-text-subdued shrink-0" />}
                            <span className={cn('font-bold truncate', d.status === 'done' ? 'text-text-subdued line-through' : 'text-text-primary')}>
                              {d.name}
                            </span>
                          </button>
                          {!isViewer && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => openEditDeliv(arch, d)} className="p-1 text-text-secondary hover:text-brand transition-colors"><Pencil size={12} /></button>
                              <button onClick={() => deleteDeliv(arch, d.id)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-text-subdued font-bold">Koi deliverable list nahi.</p>
                  )}
                  {!isViewer && (
                    <button onClick={() => openAddDeliv(arch)} className="mt-2 text-caption font-bold text-brand hover:opacity-80">
                      + Add Deliverable
                    </button>
                  )}
                </div>

                {/* Plans (photos) */}
                {(arch.photos?.length ?? 0) > 0 && (
                  <div className="border-t border-border-default px-4 py-2.5">
                    <p className="text-caption font-bold text-text-subdued uppercase mb-2 flex items-center gap-1">
                      <FileImage size={11} /> Naksha / Plans ({arch.photos!.length})
                    </p>
                    <PhotoStrip
                      photos={arch.photos!}
                      getSignedUrl={getSignedUrl}
                      onOpenAt={(i) => setLightbox({ archId: arch.id, idx: i })}
                      onSeeAll={() => setSheetArchId(arch.id)}
                    />
                  </div>
                )}

                {/* Scope notes */}
                {arch.scopeNotes && (
                  <div className="border-t border-border-default px-4 py-2.5">
                    <p className="text-caption font-bold text-text-subdued uppercase mb-1">Scope / Notes</p>
                    <p className="text-body-sm text-text-secondary">{arch.scopeNotes}</p>
                  </div>
                )}

                {/* Action footer */}
                {!isViewer && (
                  <div className="border-t border-border-default p-3 grid grid-cols-3 gap-2">
                    <button onClick={() => openAddPay(arch)} className="py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-caption font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors inline-flex items-center justify-center gap-1">
                      <IndianRupee size={12} /> Payment
                    </button>
                    <button onClick={() => openAddVisit(arch)} className="py-2 bg-brand/10 text-brand rounded-xl text-caption font-bold border border-brand/20 hover:bg-brand/20 transition-colors inline-flex items-center justify-center gap-1">
                      <Footprints size={12} /> Visit
                    </button>
                    <button onClick={() => setSheetArchId(arch.id)} className="py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-caption font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors inline-flex items-center justify-center gap-1">
                      <FileImage size={12} /> Naksha
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Architect Form Modal ────────────────────────────── */}
      {archForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closeArchForm}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 overflow-y-auto max-h-[92vh] md:max-h-[88vh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{archEditId ? 'Architect Edit' : 'Naya Architect'}</h3>
                <button onClick={closeArchForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Naam</label>
                <input type="text" autoFocus value={archForm.name}
                  onChange={e => setArchForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Ar. Suresh Kumar" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Firm (optional)</label>
                  <input type="text" value={archForm.firm}
                    onChange={e => setArchForm(f => f ? { ...f, firm: e.target.value } : f)}
                    className="w-full p-3 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm"
                    placeholder="Firm name" />
                </div>
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Phone</label>
                  <input type="tel" value={archForm.phone}
                    onChange={e => setArchForm(f => f ? { ...f, phone: e.target.value } : f)}
                    className="w-full p-3 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm"
                    placeholder="9XXXXXXXXX" />
                </div>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-2">Role</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setArchForm(f => f ? { ...f, role: r } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-body-sm font-bold border transition-all',
                        archForm.role === r ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' : 'bg-surface-subdued text-text-secondary border-border-default')}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-2">Fee Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEE_TYPES.map(t => (
                    <button key={t.id} onClick={() => setArchForm(f => f ? { ...f, feeType: t.id } : f)}
                      className={cn('py-2 px-3 rounded-xl text-body-sm font-bold border transition-all',
                        archForm.feeType === t.id ? 'bg-brand/10 text-brand border-brand/20' : 'bg-surface-subdued text-text-secondary border-border-default')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee inputs per type */}
              {archForm.feeType === 'package' && (
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Total Fee (₹)</label>
                  <input type="number" inputMode="numeric" value={archForm.totalFee}
                    onChange={e => setArchForm(f => f ? { ...f, totalFee: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                    placeholder="0" />
                </div>
              )}

              {archForm.feeType === 'per-sqft' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Rate (₹/sq.ft)</label>
                    <input type="number" inputMode="numeric" value={archForm.ratePerSqFt}
                      onChange={e => setArchForm(f => f ? { ...f, ratePerSqFt: e.target.value } : f)}
                      className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Area (sq.ft)</label>
                    <input type="number" inputMode="numeric" value={archForm.areaSqFt}
                      onChange={e => setArchForm(f => f ? { ...f, areaSqFt: e.target.value } : f)}
                      className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                      placeholder="0" />
                  </div>
                </div>
              )}

              {archForm.feeType === 'per-visit' && (
                <div>
                  <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Rate per Visit (₹)</label>
                  <input type="number" inputMode="numeric" value={archForm.ratePerVisit}
                    onChange={e => setArchForm(f => f ? { ...f, ratePerVisit: e.target.value } : f)}
                    className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                    placeholder="0" />
                </div>
              )}

              {archForm.feeType === 'percentage' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">% Rate</label>
                    <input type="number" inputMode="decimal" step="0.1" value={archForm.percentageRate}
                      onChange={e => setArchForm(f => f ? { ...f, percentageRate: e.target.value } : f)}
                      className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                      placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Project Value (₹)</label>
                    <input type="number" inputMode="numeric" value={archForm.projectValue}
                      onChange={e => setArchForm(f => f ? { ...f, projectValue: e.target.value } : f)}
                      className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold"
                      placeholder="0" />
                  </div>
                </div>
              )}

              {archForm.feeType !== 'per-visit' && computeFee(archForm) > 0 && (
                <div className="bg-brand/10 rounded-xl px-3 py-2 text-center border border-brand/20">
                  <p className="text-caption text-brand font-bold uppercase">Total Fee</p>
                  <p className="text-title-lg font-bold text-brand">{formatCurrency(computeFee(archForm))}</p>
                </div>
              )}

              {archForm.feeType !== 'per-visit' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Package Visits</label>
                    <input type="number" inputMode="numeric" value={archForm.packageVisits}
                      onChange={e => setArchForm(f => f ? { ...f, packageVisits: e.target.value } : f)}
                      className="w-full p-3 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm"
                      placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Extra/Visit (₹)</label>
                    <input type="number" inputMode="numeric" value={archForm.extraVisitRate}
                      onChange={e => setArchForm(f => f ? { ...f, extraVisitRate: e.target.value } : f)}
                      className="w-full p-3 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand text-body-sm"
                      placeholder="e.g. 500" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Start Date</label>
                <input type="date" value={archForm.startDate}
                  onChange={e => setArchForm(f => f ? { ...f, startDate: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Scope / Notes</label>
                <textarea value={archForm.scopeNotes} rows={2}
                  onChange={e => setArchForm(f => f ? { ...f, scopeNotes: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand resize-none"
                  placeholder="Kya kya karega? Map approval, drawings, supervision..." />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeArchForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveArch} disabled={!archForm.name}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {archEditId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Visit Form Modal ────────────────────────────────── */}
      {visitForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closeVisitForm}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 overflow-y-auto max-h-[92vh] md:max-h-[88vh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{visitForm.visitId ? 'Visit Edit' : 'Naya Visit'}</h3>
                <button onClick={closeVisitForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input type="date" value={visitForm.date}
                  onChange={e => setVisitForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Purpose</label>
                <input type="text" autoFocus value={visitForm.purpose}
                  onChange={e => setVisitForm(f => f ? { ...f, purpose: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Site marking, Slab inspection" />
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Notes (optional)</label>
                <input type="text" value={visitForm.notes}
                  onChange={e => setVisitForm(f => f ? { ...f, notes: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="Kya hua, kya bola..." />
              </div>

              <label className="flex items-center gap-3 bg-surface-subdued p-3.5 rounded-2xl cursor-pointer">
                <input type="checkbox" checked={visitForm.billable}
                  onChange={e => setVisitForm(f => f ? { ...f, billable: e.target.checked } : f)}
                  className="w-5 h-5 accent-brand" />
                <div className="flex-1">
                  <p className="text-body-sm font-bold text-text-primary">Yeh paid visit hai (package se zyada)</p>
                  <p className="text-caption text-text-subdued font-bold">Iska extra charge total payable mein add hoga</p>
                </div>
              </label>

              <div className="flex gap-3 pt-1">
                <button onClick={closeVisitForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveVisit} disabled={!visitForm.purpose.trim()}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {visitForm.visitId ? 'Update' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment Form Modal ───────────────────────────────── */}
      {payForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closePayForm}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{payForm.paymentId ? 'Payment Edit' : 'Naya Payment'}</h3>
                <button onClick={closePayForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={payForm.amount}
                  onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand font-bold text-title-lg"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Date</label>
                <input type="date" value={payForm.date}
                  onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Note (optional)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="Cash / UPI / cheque?" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePayForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={savePay} disabled={!payForm.amount || Number(payForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {payForm.paymentId ? 'Update' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deliverable Form Modal ────────────────────────────── */}
      {delivForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center" onClick={closeDelivForm}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-default w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-border-default rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-title font-bold text-text-primary">{delivForm.delivId ? 'Deliverable Edit' : 'Naya Deliverable'}</h3>
                <button onClick={closeDelivForm} className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors"><X size={16} /></button>
              </div>

              <div>
                <label className="text-caption font-bold text-text-subdued uppercase block mb-1.5">Naam</label>
                <input type="text" autoFocus value={delivForm.name}
                  onChange={e => setDelivForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-surface-subdued text-text-primary rounded-2xl border-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Floor Plan, Map Approval" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeDelivForm} className="flex-1 py-3.5 bg-surface-subdued text-text-secondary rounded-2xl font-bold text-body-sm hover:bg-border-default transition-colors">Cancel</button>
                <button onClick={saveDeliv} disabled={!delivForm.name.trim()}
                  className="flex-1 py-3.5 bg-text-primary text-surface rounded-2xl font-bold text-body-sm disabled:opacity-40 shadow-sm hover:opacity-90 transition-opacity">
                  {delivForm.delivId ? 'Update' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Plans (photos) sheet ───────────────────────────────── */}
      {sheetArch && (
        <PhotosSheet
          open={!!sheetArch}
          title={`${sheetArch.name} — Naksha`}
          subtitle={sheetArch.role}
          photos={sheetArch.photos ?? []}
          uploading={photoUploading === `architect:${sheetArch.id}`}
          getSignedUrl={getSignedUrl}
          onClose={() => setSheetArchId(null)}
          onOpenAt={(i) => setLightbox({ archId: sheetArch.id, idx: i })}
          onDelete={isViewer ? undefined : (path) => deletePhoto('architect', sheetArch.id, path)}
          onAdd={isViewer ? undefined : (file, caption) => uploadPhoto('architect', sheetArch.id, file, caption)}
        />
      )}

      {/* ─── Lightbox for plans (gallery mode) ──────────────────── */}
      <Lightbox
        open={!!lightbox}
        photos={lightboxArch?.photos ?? []}
        startIndex={lightbox?.idx ?? 0}
        title={lightboxArch ? `${lightboxArch.name} — Naksha` : undefined}
        getSignedUrl={getSignedUrl}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
