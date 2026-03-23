export interface Project {
  id: string;
  name: string;
  location: string;
  type: 'residential' | 'commercial' | 'renovation';
  budget: number;
  startDate: string;
  endDate: string;
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
}

export interface Labour {
  id: string;
  type: string;
  dailyWage: number;
  attendance: { [date: string]: 'present' | 'absent' | 'half' };
}

export interface Theka {
  id: string;
  type: 'lump-sum' | 'sqft' | 'unit';
  description: string;
  totalAmount: number;
  advancePaid: number;
  completionPercentage: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: 'Material' | 'Labour' | 'Theka' | 'Equipment' | 'Transport' | 'Misc';
  notes: string;
}

export interface Milestone {
  id: string;
  phase: string;
  status: 'pending' | 'in-progress' | 'completed';
  delayReason?: string;
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
  type: string;
  quantity: number;
  unit: string;
  dealer: string;
  rate: number;
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
}
