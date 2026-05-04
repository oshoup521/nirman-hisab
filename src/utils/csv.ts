import { format } from 'date-fns';
import { AppState, Expense, Theka, ThekaPayment, MiscExpense, DemolitionTheka, MalwaEntry, ScrapEntry, BrickRecovery, RentalProperty, RentPayment } from '../types';

function esc(val: unknown) {
  return `"${String(val ?? '').replace(/"/g, '""')}"`;
}

function safeDate(d: unknown) {
  if (!d) return '';
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? '' : format(dt, 'yyyy-MM-dd');
}

export function downloadCSV(state: AppState) {
  const rows: string[] = [];
  rows.push(['Date', 'Section', 'Type/Category', 'Description', 'Amount', 'Notes'].join(','));

  (state.expenses || []).forEach((e: Expense) => {
    rows.push([safeDate(e.date), 'Construction', esc(e.category), esc(e.category), e.amount, esc(e.notes)].join(','));
  });

  (state.thekas || []).forEach((t: Theka) => {
    (t.payments || []).forEach((p: ThekaPayment) => {
      rows.push([safeDate(p.date), 'Construction Theka', esc(t.name), esc(`Theka: ${t.name}`), p.amount, esc(p.note || '')].join(','));
    });
  });

  (state.miscExpenses || []).forEach((e: MiscExpense) => {
    rows.push([safeDate(e.date), 'Misc', esc(e.category), esc(e.category), e.amount, esc(e.notes || '')].join(','));
  });

  (state.demolitionThekas || []).forEach((t: DemolitionTheka) => {
    (t.payments || []).forEach((p: ThekaPayment) => {
      rows.push([safeDate(p.date), 'Demolition Theka', esc(t.name), esc(`Theka: ${t.name}`), p.amount, esc(p.note || '')].join(','));
    });
  });

  (state.malwa || []).forEach((m: MalwaEntry) => {
    const amt = (m.disposed || 0) * (m.costPerTrip || 0);
    rows.push([safeDate(m.date), 'Demolition', 'Malwa Disposal', esc(`${m.disposed} trips @ ₹${m.costPerTrip} (${m.vendor})`), amt, ''].join(','));
  });

  (state.scrap || []).forEach((s: ScrapEntry) => {
    const amt = (s.quantity || 0) * (s.rate || 0);
    rows.push([safeDate(s.date), 'Demolition Income', 'Scrap Sale', esc(`${s.type}: ${s.quantity} ${s.unit} @ ₹${s.rate} (${s.dealer})`), amt, ''].join(','));
  });

  (state.brickRecovery || []).forEach((b: BrickRecovery) => {
    const amt = (b.recovered || 0) * (b.ratePerBrick || 0);
    rows.push([safeDate(b.date), 'Demolition Income', 'Brick Recovery', esc(`${b.recovered} bricks @ ₹${b.ratePerBrick}`), amt, ''].join(','));
  });

  (state.rentals || []).forEach((r: RentalProperty) => {
    (r.payments || []).forEach((p: RentPayment) => {
      rows.push([safeDate(p.date), 'Kiraya', esc(r.name), esc(`Rent: ${r.name} (${p.month})`), p.amount, esc(p.note || '')].join(','));
    });
  });

  const csvContent = '﻿' + rows.join('\n');
  const fileName = `NirmanHisaab_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
  const a = document.createElement('a');
  a.setAttribute('href', dataUri);
  a.setAttribute('download', fileName);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
