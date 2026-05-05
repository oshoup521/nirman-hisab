import { AppState } from '../types';

export const INITIAL_STATE: AppState = {
  project: null,
  materials: [],
  labours: [],
  thekas: [],
  expenses: [],
  milestones: [
    { id: 'demolition', phase: 'Demolition', status: 'pending' },
    { id: '1', phase: 'Foundation', status: 'pending' },
    { id: '2', phase: 'Plinth', status: 'pending' },
    { id: '3', phase: 'Slab', status: 'pending' },
    { id: '4', phase: 'Brickwork', status: 'pending' },
    { id: '5', phase: 'Plaster', status: 'pending' },
    { id: '6', phase: 'Flooring', status: 'pending' },
    { id: '7', phase: 'Finishing', status: 'pending' },
  ],
  demolition: null,
  brickRecovery: [],
  malwa: [],
  scrap: [],
  demolitionThekas: [],
  rentals: [],
  miscExpenses: [],
  vendors: [],
  diary: [],
};
