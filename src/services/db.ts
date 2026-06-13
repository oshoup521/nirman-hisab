import { supabase } from '../utils/supabaseClient';
import type {
  AppState, Project, Material, Labour, LabourDayEntry,
  Theka, ThekaPayment, DemolitionTheka, Expense, MiscExpense,
  Milestone, DemolitionProject, BrickRecovery, MalwaEntry, ScrapEntry,
  Vendor, VendorPayment, RentalProperty, RentPayment, ElectricityReading,
  DiaryEntry, Architect, ArchitectPayment,
} from '../types';

// ─── Row ↔ Domain converters ──────────────────────────────────

function projectToRow(p: Project, userId: string) {
  return {
    // Legacy blobs may not have a project id — fall back to userId (stable, one project per user)
    id: p.id || userId,
    user_id: userId,
    name: p.name, location: p.location, type: p.type,
    budget: p.budget ?? 0, master_budget: p.masterBudget ?? 0,
    start_date: p.startDate, end_date: p.endDate,
    plot_length: p.plotLength ?? null, plot_width: p.plotWidth ?? null,
    floors: p.floors ?? null, total_area: p.totalArea ?? null,
    site_plans: p.sitePlans ?? [],
    updated_at: new Date().toISOString(),
  };
}
function rowToProject(r: any): Project {
  return {
    id: r.id, name: r.name, location: r.location, type: r.type,
    budget: r.budget, masterBudget: r.master_budget,
    startDate: r.start_date, endDate: r.end_date,
    plotLength: r.plot_length ?? undefined, plotWidth: r.plot_width ?? undefined,
    floors: r.floors ?? undefined, totalArea: r.total_area ?? undefined,
    sitePlans: r.site_plans ?? [],
  };
}

function materialToRow(m: Material, userId: string) {
  return {
    id: m.id, user_id: userId, name: m.name, unit: m.unit,
    purchased: m.purchased, used: m.used, rate: m.rate,
    vendor: m.vendor, date: m.date, bill_number: m.billNumber,
    min_stock: m.minStock, photos: m.photos ?? [],
    purchases: m.purchases ?? [],
    updated_at: new Date().toISOString(),
  };
}
function rowToMaterial(r: any): Material {
  return {
    id: r.id, name: r.name, unit: r.unit, purchased: r.purchased,
    used: r.used, rate: r.rate, vendor: r.vendor, date: r.date,
    billNumber: r.bill_number, minStock: r.min_stock, photos: r.photos ?? [],
    purchases: r.purchases ?? [],
  };
}

function labourToRow(l: Labour, userId: string) {
  return {
    id: l.id, user_id: userId, type: l.type,
    daily_wage: l.dailyWage, attendance: l.attendance, payment_by: l.paymentBy,
  };
}
function rowToLabour(r: any): Labour {
  return {
    id: r.id, type: r.type, dailyWage: r.daily_wage,
    attendance: r.attendance ?? {}, paymentBy: r.payment_by,
  };
}

function ldToRow(e: LabourDayEntry, userId: string) {
  return {
    id: e.id, user_id: userId, date: e.date, worker_type: e.workerType,
    count: e.count, daily_wage: e.dailyWage, day_type: e.dayType,
    payment_by: e.paymentBy, notes: e.notes ?? '', expense_id: e.expenseId ?? null,
  };
}
function rowToLD(r: any): LabourDayEntry {
  return {
    id: r.id, date: r.date, workerType: r.worker_type, count: r.count,
    dailyWage: r.daily_wage, dayType: r.day_type, paymentBy: r.payment_by,
    notes: r.notes || undefined, expenseId: r.expense_id || undefined,
  };
}

function thekaToRow(t: Theka, userId: string) {
  return {
    id: t.id, user_id: userId, name: t.name, work_type: t.workType,
    total_amount: t.totalAmount, start_date: t.startDate, notes: t.notes,
    rate_per_sq_ft: t.ratePerSqFt ?? null, area_sq_ft: t.areaSqFt ?? null,
    extras: t.extras ?? [],
    updated_at: new Date().toISOString(),
  };
}
function rowToTheka(r: any, payments: ThekaPayment[]): Theka {
  return {
    id: r.id, name: r.name, workType: r.work_type, totalAmount: r.total_amount,
    payments, extras: r.extras ?? [],
    startDate: r.start_date, notes: r.notes,
    ratePerSqFt: r.rate_per_sq_ft ?? undefined, areaSqFt: r.area_sq_ft ?? undefined,
  };
}
function thekaPaymentToRow(p: ThekaPayment, thekaId: string, userId: string) {
  return { id: p.id, theka_id: thekaId, user_id: userId, date: p.date, amount: p.amount, note: p.note };
}
function rowToThekaPayment(r: any): ThekaPayment {
  return { id: r.id, date: r.date, amount: r.amount, note: r.note };
}

function dThekaToRow(t: DemolitionTheka, userId: string) {
  return {
    id: t.id, user_id: userId, name: t.name, work_type: t.workType,
    total_amount: t.totalAmount, start_date: t.startDate, notes: t.notes,
    updated_at: new Date().toISOString(),
  };
}
function rowToDTheka(r: any, payments: ThekaPayment[]): DemolitionTheka {
  return { id: r.id, name: r.name, workType: r.work_type, totalAmount: r.total_amount, payments, startDate: r.start_date, notes: r.notes };
}
function dThekaPaymentToRow(p: ThekaPayment, dThekaId: string, userId: string) {
  return { id: p.id, demolition_theka_id: dThekaId, user_id: userId, date: p.date, amount: p.amount, note: p.note };
}

function expenseToRow(e: Expense, userId: string) {
  return { id: e.id, user_id: userId, date: e.date, amount: e.amount, category: e.category, notes: e.notes, photos: e.photos ?? [] };
}
function rowToExpense(r: any): Expense {
  return { id: r.id, date: r.date, amount: r.amount, category: r.category, notes: r.notes, photos: r.photos ?? [] };
}

function miscToRow(e: MiscExpense, userId: string) {
  return { id: e.id, user_id: userId, date: e.date, amount: e.amount, category: e.category, notes: e.notes };
}
function rowToMisc(r: any): MiscExpense {
  return { id: r.id, date: r.date, amount: r.amount, category: r.category, notes: r.notes };
}

function milestoneToRow(m: Milestone, userId: string) {
  return {
    id: m.id, user_id: userId, phase: m.phase, status: m.status,
    delay_reason: m.delayReason ?? null, start_date: m.startDate ?? null,
    end_date: m.endDate ?? null, photos: m.photos ?? [],
    updated_at: new Date().toISOString(),
  };
}
function rowToMilestone(r: any): Milestone {
  return {
    id: r.id, phase: r.phase, status: r.status,
    delayReason: r.delay_reason ?? undefined, startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined, photos: r.photos ?? [],
  };
}

function demolitionProjectToRow(d: DemolitionProject, userId: string) {
  return { id: d.id, user_id: userId, name: d.name, type: d.type, start_date: d.startDate, end_date: d.endDate, area: d.area };
}
function rowToDemolitionProject(r: any): DemolitionProject {
  return { id: r.id, name: r.name, type: r.type, startDate: r.start_date, endDate: r.end_date, area: r.area };
}

function brickToRow(b: BrickRecovery, userId: string) {
  return { id: b.id, user_id: userId, date: b.date, estimated: b.estimated, recovered: b.recovered, broken: b.broken, rate_per_brick: b.ratePerBrick };
}
function rowToBrick(r: any): BrickRecovery {
  return { id: r.id, date: r.date, estimated: r.estimated, recovered: r.recovered, broken: r.broken, ratePerBrick: r.rate_per_brick };
}

function malwaToRow(m: MalwaEntry, userId: string) {
  return { id: m.id, user_id: userId, date: m.date, generated: m.generated, disposed: m.disposed, cost_per_trip: m.costPerTrip, vendor: m.vendor };
}
function rowToMalwa(r: any): MalwaEntry {
  return { id: r.id, date: r.date, generated: r.generated, disposed: r.disposed, costPerTrip: r.cost_per_trip, vendor: r.vendor };
}

function scrapToRow(s: ScrapEntry, userId: string) {
  return { id: s.id, user_id: userId, date: s.date, type: s.type, quantity: s.quantity, unit: s.unit, dealer: s.dealer, rate: s.rate };
}
function rowToScrap(r: any): ScrapEntry {
  return { id: r.id, date: r.date, type: r.type, quantity: r.quantity, unit: r.unit, dealer: r.dealer, rate: r.rate };
}

function vendorToRow(v: Vendor, userId: string) {
  return { id: v.id, user_id: userId, name: v.name, type: v.type, phone: v.phone, total_billed: v.totalBilled, updated_at: new Date().toISOString() };
}
function rowToVendor(r: any, payments: VendorPayment[]): Vendor {
  return { id: r.id, name: r.name, type: r.type, phone: r.phone, totalBilled: r.total_billed, payments };
}
function vendorPaymentToRow(p: VendorPayment, vendorId: string, userId: string) {
  return { id: p.id, vendor_id: vendorId, user_id: userId, date: p.date, amount: p.amount, type: p.type, note: p.note };
}
function rowToVendorPayment(r: any): VendorPayment {
  return { id: r.id, date: r.date, amount: r.amount, type: r.type, note: r.note };
}

function rentalToRow(r: RentalProperty | any, userId: string) {
  // Handle legacy `depositPaid: boolean` field from old blob format
  const depositStatus = r.depositStatus ?? ((r as any).depositPaid === true ? 'paid' : 'pending');
  return {
    id: r.id, user_id: userId, name: r.name, type: r.type,
    monthly_rent: r.monthlyRent, deposit: r.deposit, deposit_status: depositStatus,
    owner_name: r.ownerName, owner_phone: r.ownerPhone,
    start_date: r.startDate, agreement_end_date: r.agreementEndDate, agreement_note: r.agreementNote,
    has_rent: r.hasRent ?? true,
    has_electricity: r.hasElectricity ?? false,
    electricity_rate_per_unit: r.electricityRatePerUnit ?? null,
    updated_at: new Date().toISOString(),
  };
}
function rowToRental(r: any, payments: RentPayment[], electricityReadings: ElectricityReading[]): RentalProperty {
  return {
    id: r.id, name: r.name, type: r.type, monthlyRent: r.monthly_rent,
    deposit: r.deposit, depositStatus: r.deposit_status,
    ownerName: r.owner_name, ownerPhone: r.owner_phone,
    startDate: r.start_date, agreementEndDate: r.agreement_end_date, agreementNote: r.agreement_note,
    payments,
    hasRent: r.has_rent ?? true,
    hasElectricity: r.has_electricity,
    electricityRatePerUnit: r.electricity_rate_per_unit ?? undefined, electricityReadings,
  };
}
function rentPaymentToRow(p: RentPayment, rentalId: string, userId: string) {
  return { id: p.id, rental_id: rentalId, user_id: userId, date: p.date, amount: p.amount, month: p.month, note: p.note, paid_from_deposit: p.paidFromDeposit ?? false };
}
function rowToRentPayment(r: any): RentPayment {
  return { id: r.id, date: r.date, amount: r.amount, month: r.month, note: r.note, paidFromDeposit: r.paid_from_deposit };
}
function electricityToRow(e: ElectricityReading, rentalId: string, userId: string) {
  return {
    id: e.id, rental_id: rentalId, user_id: userId, date: e.date,
    current_reading: e.currentReading, previous_reading: e.previousReading,
    rate_per_unit: e.ratePerUnit, fixed_charge: e.fixedCharge, note: e.note, paid: e.paid,
  };
}
function rowToElectricity(r: any): ElectricityReading {
  return {
    id: r.id, date: r.date, currentReading: r.current_reading, previousReading: r.previous_reading,
    ratePerUnit: r.rate_per_unit, fixedCharge: r.fixed_charge, note: r.note, paid: r.paid,
  };
}

function architectToRow(a: Architect, userId: string) {
  return {
    id: a.id, user_id: userId, name: a.name, firm: a.firm ?? '', phone: a.phone ?? '',
    role: a.role, fee_type: a.feeType, total_fee: a.totalFee,
    rate_per_sq_ft: a.ratePerSqFt ?? null, area_sq_ft: a.areaSqFt ?? null,
    rate_per_visit: a.ratePerVisit ?? null,
    percentage_rate: a.percentageRate ?? null, project_value: a.projectValue ?? null,
    package_visits: a.packageVisits ?? 0, extra_visit_rate: a.extraVisitRate ?? 0,
    scope_notes: a.scopeNotes ?? '', start_date: a.startDate ?? '',
    visits: a.visits ?? [], deliverables: a.deliverables ?? [], photos: a.photos ?? [],
    updated_at: new Date().toISOString(),
  };
}
function rowToArchitect(r: any, payments: ArchitectPayment[]): Architect {
  return {
    id: r.id, name: r.name, firm: r.firm || undefined, phone: r.phone || undefined,
    role: r.role, feeType: r.fee_type, totalFee: r.total_fee,
    ratePerSqFt: r.rate_per_sq_ft ?? undefined, areaSqFt: r.area_sq_ft ?? undefined,
    ratePerVisit: r.rate_per_visit ?? undefined,
    percentageRate: r.percentage_rate ?? undefined, projectValue: r.project_value ?? undefined,
    packageVisits: r.package_visits ?? 0, extraVisitRate: r.extra_visit_rate ?? 0,
    scopeNotes: r.scope_notes || undefined, startDate: r.start_date || '',
    visits: r.visits ?? [], deliverables: r.deliverables ?? [], photos: r.photos ?? [],
    payments,
  };
}
function architectPaymentToRow(p: ArchitectPayment, architectId: string, userId: string) {
  return { id: p.id, architect_id: architectId, user_id: userId, date: p.date, amount: p.amount, note: p.note };
}
function rowToArchitectPayment(r: any): ArchitectPayment {
  return { id: r.id, date: r.date, amount: r.amount, note: r.note };
}

function diaryToRow(d: DiaryEntry, userId: string) {
  return {
    id: d.id, user_id: userId, date: d.date, weather: d.weather ?? null,
    who_came: d.whoCame ?? '', work_done: d.workDone ?? '',
    delivered: d.delivered ?? '', problems: d.problems ?? '',
    photos: d.photos ?? [], updated_at: new Date().toISOString(),
  };
}
function rowToDiary(r: any): DiaryEntry {
  return {
    id: r.id, date: r.date, weather: r.weather ?? undefined,
    whoCame: r.who_came || undefined, workDone: r.work_done || undefined,
    delivered: r.delivered || undefined, problems: r.problems || undefined,
    photos: r.photos ?? [],
  };
}

// ─── Load all tables in parallel and assemble AppState ────────

export async function loadAllData(userId: string): Promise<AppState | null> {
  const [
    projectRes, materialsRes, laboursRes, ldRes,
    thekasRes, thekaPayRes,
    dThekasRes, dThekaPayRes,
    expensesRes, miscRes, milestonesRes,
    demolitionRes, brickRes, malwaRes, scrapRes,
    vendorsRes, vendorPayRes,
    rentalsRes, rentPayRes, electricityRes,
    diaryRes,
    architectsRes, architectPayRes,
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('materials').select('*').eq('user_id', userId),
    supabase.from('labours').select('*').eq('user_id', userId),
    supabase.from('labour_day_entries').select('*').eq('user_id', userId),
    supabase.from('thekas').select('*').eq('user_id', userId),
    supabase.from('theka_payments').select('*').eq('user_id', userId),
    supabase.from('demolition_thekas').select('*').eq('user_id', userId),
    supabase.from('demolition_theka_payments').select('*').eq('user_id', userId),
    supabase.from('expenses').select('*').eq('user_id', userId),
    supabase.from('misc_expenses').select('*').eq('user_id', userId),
    supabase.from('milestones').select('*').eq('user_id', userId),
    supabase.from('demolition_projects').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('brick_recovery').select('*').eq('user_id', userId),
    supabase.from('malwa_entries').select('*').eq('user_id', userId),
    supabase.from('scrap_entries').select('*').eq('user_id', userId),
    supabase.from('vendors').select('*').eq('user_id', userId),
    supabase.from('vendor_payments').select('*').eq('user_id', userId),
    supabase.from('rentals').select('*').eq('user_id', userId),
    supabase.from('rent_payments').select('*').eq('user_id', userId),
    supabase.from('electricity_readings').select('*').eq('user_id', userId),
    supabase.from('diary_entries').select('*').eq('user_id', userId),
    supabase.from('architects').select('*').eq('user_id', userId),
    supabase.from('architect_payments').select('*').eq('user_id', userId),
  ]);

  // No data at all → new user, haven't migrated yet
  const hasAnyData =
    projectRes.data != null ||
    (milestonesRes.data && milestonesRes.data.length > 0) ||
    (materialsRes.data && materialsRes.data.length > 0);

  if (!hasAnyData) return null;

  // Build lookup maps for nested entities
  const thekaPayMap: Record<string, ThekaPayment[]> = {};
  for (const r of thekaPayRes.data ?? []) {
    (thekaPayMap[r.theka_id] ??= []).push(rowToThekaPayment(r));
  }

  const dThekaPayMap: Record<string, ThekaPayment[]> = {};
  for (const r of dThekaPayRes.data ?? []) {
    (dThekaPayMap[r.demolition_theka_id] ??= []).push(rowToThekaPayment(r));
  }

  const vendorPayMap: Record<string, VendorPayment[]> = {};
  for (const r of vendorPayRes.data ?? []) {
    (vendorPayMap[r.vendor_id] ??= []).push(rowToVendorPayment(r));
  }

  const rentPayMap: Record<string, RentPayment[]> = {};
  for (const r of rentPayRes.data ?? []) {
    (rentPayMap[r.rental_id] ??= []).push(rowToRentPayment(r));
  }

  const electricityMap: Record<string, ElectricityReading[]> = {};
  for (const r of electricityRes.data ?? []) {
    (electricityMap[r.rental_id] ??= []).push(rowToElectricity(r));
  }

  const architectPayMap: Record<string, ArchitectPayment[]> = {};
  for (const r of architectPayRes.data ?? []) {
    (architectPayMap[r.architect_id] ??= []).push(rowToArchitectPayment(r));
  }

  return {
    project:         projectRes.data ? rowToProject(projectRes.data) : null,
    materials:       (materialsRes.data ?? []).map(rowToMaterial),
    labours:         (laboursRes.data ?? []).map(rowToLabour),
    labourDayEntries:(ldRes.data ?? []).map(rowToLD),
    thekas:          (thekasRes.data ?? []).map(r => rowToTheka(r, thekaPayMap[r.id] ?? [])),
    expenses:        (expensesRes.data ?? []).map(rowToExpense),
    milestones:      (milestonesRes.data ?? []).map(rowToMilestone),
    demolition:      demolitionRes.data ? rowToDemolitionProject(demolitionRes.data) : null,
    brickRecovery:   (brickRes.data ?? []).map(rowToBrick),
    malwa:           (malwaRes.data ?? []).map(rowToMalwa),
    scrap:           (scrapRes.data ?? []).map(rowToScrap),
    demolitionThekas:(dThekasRes.data ?? []).map(r => rowToDTheka(r, dThekaPayMap[r.id] ?? [])),
    rentals:         (rentalsRes.data ?? []).map(r => rowToRental(r, rentPayMap[r.id] ?? [], electricityMap[r.id] ?? [])),
    miscExpenses:    (miscRes.data ?? []).map(rowToMisc),
    vendors:         (vendorsRes.data ?? []).map(r => rowToVendor(r, vendorPayMap[r.id] ?? [])),
    diary:           (diaryRes.data ?? []).map(rowToDiary),
    architects:      (architectsRes.data ?? []).map(r => rowToArchitect(r, architectPayMap[r.id] ?? [])),
  };
}

// ─── Generic flat-table sync (upsert current + delete removed) ─

async function syncFlat<T extends { id: string }>(
  table: string,
  userId: string,
  items: T[],
  toRow: (item: T) => any,
): Promise<void> {
  if (items.length > 0) {
    const { error } = await supabase.from(table).upsert(items.map(toRow), { onConflict: 'id' });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
  // Delete any rows for this user whose IDs are no longer present
  const ids = items.map(i => i.id);
  if (ids.length > 0) {
    await supabase.from(table).delete().eq('user_id', userId).not('id', 'in', `(${ids.join(',')})`);
  } else {
    await supabase.from(table).delete().eq('user_id', userId);
  }
}

// ─── Entity-specific sync functions ──────────────────────────

export async function syncProject(userId: string, project: Project | null): Promise<void> {
  if (!project) {
    await supabase.from('projects').delete().eq('user_id', userId);
    return;
  }
  const { error } = await supabase.from('projects').upsert(projectToRow(project, userId), { onConflict: 'id' });
  if (error) throw new Error(`projects upsert: ${error.message}`);
}

export function syncMaterials(userId: string, items: Material[]) {
  return syncFlat('materials', userId, items, m => materialToRow(m, userId));
}

export function syncLabours(userId: string, items: Labour[]) {
  return syncFlat('labours', userId, items, l => labourToRow(l, userId));
}

export function syncLabourDayEntries(userId: string, items: LabourDayEntry[]) {
  return syncFlat('labour_day_entries', userId, items, e => ldToRow(e, userId));
}

export function syncExpenses(userId: string, items: Expense[]) {
  return syncFlat('expenses', userId, items, e => expenseToRow(e, userId));
}

export function syncMiscExpenses(userId: string, items: MiscExpense[]) {
  return syncFlat('misc_expenses', userId, items, e => miscToRow(e, userId));
}

export function syncMilestones(userId: string, items: Milestone[]) {
  return syncFlat('milestones', userId, items, m => milestoneToRow(m, userId));
}

export function syncBrickRecovery(userId: string, items: BrickRecovery[]) {
  return syncFlat('brick_recovery', userId, items, b => brickToRow(b, userId));
}

export function syncMalwaEntries(userId: string, items: MalwaEntry[]) {
  return syncFlat('malwa_entries', userId, items, m => malwaToRow(m, userId));
}

export function syncScrapEntries(userId: string, items: ScrapEntry[]) {
  return syncFlat('scrap_entries', userId, items, s => scrapToRow(s, userId));
}

export function syncDiaryEntries(userId: string, items: DiaryEntry[]) {
  return syncFlat('diary_entries', userId, items, d => diaryToRow(d, userId));
}

export async function syncDemolitionProject(userId: string, demolition: DemolitionProject | null): Promise<void> {
  if (!demolition) {
    await supabase.from('demolition_projects').delete().eq('user_id', userId);
    return;
  }
  const { error } = await supabase.from('demolition_projects').upsert(demolitionProjectToRow(demolition, userId), { onConflict: 'id' });
  if (error) throw new Error(`demolition_projects upsert: ${error.message}`);
}

export async function syncThekas(userId: string, thekas: Theka[]): Promise<void> {
  const thekaRows  = thekas.map(t => thekaToRow(t, userId));
  const payRows    = thekas.flatMap(t => t.payments.map(p => thekaPaymentToRow(p, t.id, userId)));
  const thekaIds   = thekaRows.map(r => r.id);
  const payIds     = payRows.map(r => r.id);

  if (thekaRows.length > 0) {
    const { error } = await supabase.from('thekas').upsert(thekaRows, { onConflict: 'id' });
    if (error) throw new Error(`thekas upsert: ${error.message}`);
  }
  if (payRows.length > 0) {
    const { error } = await supabase.from('theka_payments').upsert(payRows, { onConflict: 'id' });
    if (error) throw new Error(`theka_payments upsert: ${error.message}`);
  }

  if (thekaIds.length > 0) {
    await supabase.from('thekas').delete().eq('user_id', userId).not('id', 'in', `(${thekaIds.join(',')})`);
  } else {
    await supabase.from('thekas').delete().eq('user_id', userId);
  }
  if (payIds.length > 0) {
    await supabase.from('theka_payments').delete().eq('user_id', userId).not('id', 'in', `(${payIds.join(',')})`);
  } else {
    await supabase.from('theka_payments').delete().eq('user_id', userId);
  }
}

export async function syncDemolitionThekas(userId: string, thekas: DemolitionTheka[]): Promise<void> {
  const thekaRows = thekas.map(t => dThekaToRow(t, userId));
  const payRows   = thekas.flatMap(t => t.payments.map(p => dThekaPaymentToRow(p, t.id, userId)));
  const thekaIds  = thekaRows.map(r => r.id);
  const payIds    = payRows.map(r => r.id);

  if (thekaRows.length > 0) {
    const { error } = await supabase.from('demolition_thekas').upsert(thekaRows, { onConflict: 'id' });
    if (error) throw new Error(`demolition_thekas upsert: ${error.message}`);
  }
  if (payRows.length > 0) {
    const { error } = await supabase.from('demolition_theka_payments').upsert(payRows, { onConflict: 'id' });
    if (error) throw new Error(`demolition_theka_payments upsert: ${error.message}`);
  }

  if (thekaIds.length > 0) {
    await supabase.from('demolition_thekas').delete().eq('user_id', userId).not('id', 'in', `(${thekaIds.join(',')})`);
  } else {
    await supabase.from('demolition_thekas').delete().eq('user_id', userId);
  }
  if (payIds.length > 0) {
    await supabase.from('demolition_theka_payments').delete().eq('user_id', userId).not('id', 'in', `(${payIds.join(',')})`);
  } else {
    await supabase.from('demolition_theka_payments').delete().eq('user_id', userId);
  }
}

export async function syncVendors(userId: string, vendors: Vendor[]): Promise<void> {
  const vendorRows = vendors.map(v => vendorToRow(v, userId));
  const payRows    = vendors.flatMap(v => v.payments.map(p => vendorPaymentToRow(p, v.id, userId)));
  const vendorIds  = vendorRows.map(r => r.id);
  const payIds     = payRows.map(r => r.id);

  if (vendorRows.length > 0) {
    const { error } = await supabase.from('vendors').upsert(vendorRows, { onConflict: 'id' });
    if (error) throw new Error(`vendors upsert: ${error.message}`);
  }
  if (payRows.length > 0) {
    const { error } = await supabase.from('vendor_payments').upsert(payRows, { onConflict: 'id' });
    if (error) throw new Error(`vendor_payments upsert: ${error.message}`);
  }

  if (vendorIds.length > 0) {
    await supabase.from('vendors').delete().eq('user_id', userId).not('id', 'in', `(${vendorIds.join(',')})`);
  } else {
    await supabase.from('vendors').delete().eq('user_id', userId);
  }
  if (payIds.length > 0) {
    await supabase.from('vendor_payments').delete().eq('user_id', userId).not('id', 'in', `(${payIds.join(',')})`);
  } else {
    await supabase.from('vendor_payments').delete().eq('user_id', userId);
  }
}

export async function syncRentals(userId: string, rentals: RentalProperty[]): Promise<void> {
  const rentalRows      = rentals.map(r => rentalToRow(r, userId));
  const rentPayRows     = rentals.flatMap(r => r.payments.map(p => rentPaymentToRow(p, r.id, userId)));
  const electricityRows = rentals.flatMap(r => (r.electricityReadings ?? []).map(e => electricityToRow(e, r.id, userId)));
  const rentalIds       = rentalRows.map(r => r.id);
  const rentPayIds      = rentPayRows.map(r => r.id);
  const electricityIds  = electricityRows.map(r => r.id);

  if (rentalRows.length > 0) {
    const { error } = await supabase.from('rentals').upsert(rentalRows, { onConflict: 'id' });
    if (error) throw new Error(`rentals upsert: ${error.message}`);
  }
  if (rentPayRows.length > 0) {
    const { error } = await supabase.from('rent_payments').upsert(rentPayRows, { onConflict: 'id' });
    if (error) throw new Error(`rent_payments upsert: ${error.message}`);
  }
  if (electricityRows.length > 0) {
    const { error } = await supabase.from('electricity_readings').upsert(electricityRows, { onConflict: 'id' });
    if (error) throw new Error(`electricity_readings upsert: ${error.message}`);
  }

  if (rentalIds.length > 0) {
    await supabase.from('rentals').delete().eq('user_id', userId).not('id', 'in', `(${rentalIds.join(',')})`);
  } else {
    await supabase.from('rentals').delete().eq('user_id', userId);
  }
  if (rentPayIds.length > 0) {
    await supabase.from('rent_payments').delete().eq('user_id', userId).not('id', 'in', `(${rentPayIds.join(',')})`);
  } else {
    await supabase.from('rent_payments').delete().eq('user_id', userId);
  }
  if (electricityIds.length > 0) {
    await supabase.from('electricity_readings').delete().eq('user_id', userId).not('id', 'in', `(${electricityIds.join(',')})`);
  } else {
    await supabase.from('electricity_readings').delete().eq('user_id', userId);
  }
}

export async function syncArchitects(userId: string, architects: Architect[]): Promise<void> {
  const archRows = architects.map(a => architectToRow(a, userId));
  const payRows  = architects.flatMap(a => (a.payments ?? []).map(p => architectPaymentToRow(p, a.id, userId)));
  const archIds  = archRows.map(r => r.id);
  const payIds   = payRows.map(r => r.id);

  if (archRows.length > 0) {
    const { error } = await supabase.from('architects').upsert(archRows, { onConflict: 'id' });
    if (error) throw new Error(`architects upsert: ${error.message}`);
  }
  if (payRows.length > 0) {
    const { error } = await supabase.from('architect_payments').upsert(payRows, { onConflict: 'id' });
    if (error) throw new Error(`architect_payments upsert: ${error.message}`);
  }

  if (archIds.length > 0) {
    await supabase.from('architects').delete().eq('user_id', userId).not('id', 'in', `(${archIds.join(',')})`);
  } else {
    await supabase.from('architects').delete().eq('user_id', userId);
  }
  if (payIds.length > 0) {
    await supabase.from('architect_payments').delete().eq('user_id', userId).not('id', 'in', `(${payIds.join(',')})`);
  } else {
    await supabase.from('architect_payments').delete().eq('user_id', userId);
  }
}

// ─── One-time migration from old JSON blob ────────────────────

export async function migrateFromBlob(userId: string, blob: AppState): Promise<void> {
  await Promise.all([
    syncProject(userId, blob.project),
    syncMaterials(userId, blob.materials),
    syncLabours(userId, blob.labours),
    syncLabourDayEntries(userId, blob.labourDayEntries),
    syncThekas(userId, blob.thekas),
    syncDemolitionThekas(userId, blob.demolitionThekas ?? []),
    syncExpenses(userId, blob.expenses),
    syncMiscExpenses(userId, blob.miscExpenses ?? []),
    syncMilestones(userId, blob.milestones),
    syncDemolitionProject(userId, blob.demolition),
    syncBrickRecovery(userId, blob.brickRecovery ?? []),
    syncMalwaEntries(userId, blob.malwa ?? []),
    syncScrapEntries(userId, blob.scrap ?? []),
    syncVendors(userId, blob.vendors ?? []),
    syncRentals(userId, blob.rentals ?? []),
    syncDiaryEntries(userId, blob.diary ?? []),
    syncArchitects(userId, blob.architects ?? []),
  ]);
}
