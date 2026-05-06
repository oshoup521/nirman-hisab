export interface MiscExpense {
  id: string;
  date: string;
  amount: number;
  category: string;
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  type: 'residential' | 'commercial' | 'mixed' | 'renovation' | 'other';
  budget: number;        // construction budget
  masterBudget: number;  // total overall budget
  startDate: string;
  endDate: string;
  plotLength?: number;
  plotWidth?: number;
  floors?: number;
  totalArea?: number;
  sitePlans?: { id: string; path: string; caption: string }[];
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  purchased: number;
  used: number;
  rate: number;
  vendor: string;
  date: string;
  billNumber: string;
  minStock: number;
  photos?: { path: string; caption?: string }[];
}

export interface Labour {
  id: string;
  type: string;
  dailyWage: number;
  attendance: { [date: string]: 'present' | 'absent' | 'half' };
}

export interface ThekaPayment {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface Theka {
  id: string;
  name: string;
  workType: 'Civil' | 'Electrical' | 'Plumbing' | 'Painting' | 'Flooring' | 'Other';
  totalAmount: number;
  payments: ThekaPayment[];
  startDate: string;
  notes: string;
  ratePerSqFt?: number;
  areaSqFt?: number;
}

export interface DemolitionTheka {
  id: string;
  name: string;
  workType: 'Tod-Phod' | 'Malwa Hatao' | 'Cutting' | 'Other';
  totalAmount: number;
  payments: ThekaPayment[];
  startDate: string;
  notes: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: 'Material' | 'Labour' | 'Theka' | 'Equipment' | 'Transport' | 'Misc';
  notes: string;
  photos?: { path: string; caption?: string }[];
}

export interface Milestone {
  id: string;
  phase: string;
  status: 'pending' | 'in-progress' | 'completed';
  delayReason?: string;
  startDate?: string;
  endDate?: string;
  photos?: { path: string; caption?: string }[];
}

export interface DemolitionProject {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  area: number;
}

export interface BrickRecovery {
  id: string;
  date: string;
  estimated: number;
  recovered: number;
  broken: number;
  ratePerBrick: number;
}

export interface MalwaEntry {
  id: string;
  date: string;
  generated: number; // trolley count
  disposed: number;
  costPerTrip: number;
  vendor: string;
}

export interface ScrapEntry {
  id: string;
  date: string;
  type: string;
  quantity: number;
  unit: string;
  dealer: string;
  rate: number;
}

export interface RentPayment {
  id: string;
  date: string;
  amount: number;
  month: string; // e.g. "2026-03"
  note: string;
  paidFromDeposit?: boolean; // true = deposit se kata, cash nahi gaya
}

export interface RentalProperty {
  id: string;
  name: string;
  type: 'Basement' | '1BHK' | '2BHK' | 'Shop' | 'Other';
  monthlyRent: number;
  deposit: number;
  // 'pending'   = deposit dena baaki hai mujhe
  // 'paid'      = maine de diya, wapas milega jab khaali karunga
  // 'refunded'  = makan malik ne wapas kar diya
  // 'forfeited' = deposit kaat liya gaya
  depositStatus: 'pending' | 'paid' | 'refunded' | 'forfeited';
  ownerName: string;
  ownerPhone: string;
  startDate: string;
  agreementEndDate: string;
  agreementNote: string;
  payments: RentPayment[];
}

export interface VendorPayment {
  id: string;
  date: string;
  amount: number;
  type: 'advance' | 'payment';
  note: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  phone: string;
  totalBilled: number;
  payments: VendorPayment[];
}

export type Weather = 'sunny' | 'cloudy' | 'rain' | 'hot' | 'cold';

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD — unique per date
  weather?: Weather;
  whoCame?: string;
  workDone?: string;
  delivered?: string;
  problems?: string;
  photos?: { path: string; caption?: string }[];
}

export interface AppState {
  project: Project | null;
  materials: Material[];
  labours: Labour[];
  thekas: Theka[];
  expenses: Expense[];
  milestones: Milestone[];
  demolition: DemolitionProject | null;
  brickRecovery: BrickRecovery[];
  malwa: MalwaEntry[];
  scrap: ScrapEntry[];
  demolitionThekas: DemolitionTheka[];
  rentals: RentalProperty[];
  miscExpenses: MiscExpense[];
  vendors: Vendor[];
  diary: DiaryEntry[];
}
