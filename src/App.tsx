import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Construction, 
  Hammer, 
  Plus, 
  Settings, 
  TrendingUp, 
  Users, 
  Package, 
  Clock, 
  Trash2, 
  IndianRupee,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfToday } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AppState, Project, Material, Labour, Theka, Expense, Milestone, DemolitionProject, BrickRecovery, MalwaEntry, ScrapEntry } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { formatCurrency, formatNumber, getStatusColor } from './utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: AppState = {
  project: null,
  materials: [],
  labours: [],
  thekas: [],
  expenses: [],
  milestones: [
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
};

const MATERIAL_TYPES = [
  'Cement bags', 'Bricks', 'Sand', 'Gravel/Gitti', 'Steel rods', 
  'TMT bars', 'AAC blocks', 'Tiles', 'Paint', 'Wood', 'PVC pipes', 
  'Wiring', 'Aggregates', 'Water-proofing'
];

const LABOUR_TYPES = [
  'Mistri', 'Beldar', 'Thekedar', 'Electrician', 'Plumber', 'Painter', 'Fabricator'
];

export default function App() {
  const [state, setState] = useLocalStorage<AppState>('nirman_hisaab_data', INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'construction' | 'demolition' | 'settings'>('dashboard');
  const [subTab, setSubTab] = useState<string>('overview');

  const totalSpent = useMemo(() => state.expenses.reduce((acc, curr) => acc + curr.amount, 0), [state.expenses]);
  const budget = state.project?.budget || 0;
  const remainingBudget = budget - totalSpent;
  const burnRate = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const scrapIncome = useMemo(() => state.scrap.reduce((acc, curr) => acc + (curr.quantity * curr.rate), 0), [state.scrap]);
  const brickRecoveryValue = useMemo(() => state.brickRecovery.reduce((acc, curr) => acc + (curr.recovered * curr.ratePerBrick), 0), [state.brickRecovery]);
  const totalRecovery = scrapIncome + brickRecoveryValue;
  
  const malwaCost = useMemo(() => state.malwa.reduce((acc, curr) => acc + (curr.disposed * curr.costPerTrip), 0), [state.malwa]);

  const exportToCSV = () => {
    const expensesCsv = state.expenses.map(e => `${e.date},${e.category},${e.amount},"${e.notes}"`).join('\n');
    const header = "Date,Category,Amount,Notes\n";
    const blob = new Blob([header + expensesCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NirmaNHisaab_Expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const renderDashboard = () => {
    const chartData = [
      { name: 'Spent', value: totalSpent, fill: '#ef4444' },
      { name: 'Remaining', value: Math.max(0, remainingBudget), fill: '#22c55e' }
    ];

    const categoryData = [
      { name: 'Material', value: state.expenses.filter(e => e.category === 'Material').reduce((a, b) => a + b.amount, 0) },
      { name: 'Labour', value: state.expenses.filter(e => e.category === 'Labour').reduce((a, b) => a + b.amount, 0) },
      { name: 'Theka', value: state.expenses.filter(e => e.category === 'Theka').reduce((a, b) => a + b.amount, 0) },
      { name: 'Other', value: state.expenses.filter(e => !['Material', 'Labour', 'Theka'].includes(e.category)).reduce((a, b) => a + b.amount, 0) },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6 pb-20">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hisaab-Kitaab</h1>
            <p className="text-slate-500 text-sm">Project Overview</p>
          </div>
          <button onClick={exportToCSV} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
            <Download size={20} />
          </button>
        </header>

        {/* Budget Card */}
        <div className={cn("p-6 rounded-3xl border shadow-sm", getStatusColor(totalSpent, budget))}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Budget</p>
              <h2 className="text-3xl font-bold">{formatCurrency(budget)}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Spent So Far</p>
              <h2 className="text-3xl font-bold">{formatCurrency(totalSpent)}</h2>
            </div>
          </div>
          
          <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden mb-2">
            <div 
              className={cn("h-full transition-all duration-500", totalSpent > budget ? 'bg-red-500' : 'bg-current')} 
              style={{ width: `${Math.min(100, burnRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold uppercase">
            <span>{burnRate.toFixed(1)}% Used</span>
            <span>{formatCurrency(remainingBudget)} Left</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Package size={16} />
              <span className="text-xs font-bold uppercase">Low Stock</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {state.materials.filter(m => m.purchased - m.used <= m.minStock).length} Items
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase">Active Phases</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {state.milestones.filter(m => m.status === 'in-progress').length}
            </p>
          </div>
        </div>

        {/* Demolition Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={20} className="text-orange-400" />
            <h3 className="font-bold text-lg">Tod-Phod Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold mb-1">Scrap Income</p>
              <p className="text-xl font-bold text-green-400">+{formatCurrency(scrapIncome)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold mb-1">Malwa Cost</p>
              <p className="text-xl font-bold text-red-400">-{formatCurrency(malwaCost)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold mb-1">Brick Recovery</p>
              <p className="text-xl font-bold text-blue-400">+{formatNumber(state.brickRecovery.reduce((a, b) => a + b.recovered, 0))} Pcs</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold mb-1">Net Recovery</p>
              <p className="text-xl font-bold">{formatCurrency(totalRecovery - malwaCost)}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Kharcha Breakup</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderConstruction = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'materials', label: 'Samaan', icon: Package },
      { id: 'labour', label: 'Mazdoor', icon: Users },
      { id: 'expenses', label: 'Kharcha', icon: IndianRupee },
      { id: 'timeline', label: 'Raftaar', icon: Clock },
    ];

    return (
      <div className="space-y-6 pb-20">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Naya Kaam</h1>
          <p className="text-slate-500 text-sm">Construction Tracker</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                subTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "bg-white text-slate-600 border border-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {subTab === 'overview' && (
          <div className="space-y-4">
            {!state.project ? (
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">No Project Found</h3>
                  <p className="text-slate-500 text-sm">Settings mein jaake project setup karein.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm"
                >
                  Setup Project
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{state.project.name}</h3>
                    <p className="text-slate-500 text-sm">{state.project.location}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase">
                    {state.project.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Start Date</p>
                    <p className="font-bold text-slate-700">{format(new Date(state.project.startDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">End Date</p>
                    <p className="font-bold text-slate-700">{format(new Date(state.project.endDate), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {subTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Samaan ka Stock</h3>
              <button 
                onClick={() => {
                  const name = prompt('Material Name?');
                  if (!name) return;
                  const unit = prompt('Unit (e.g. bags, tons)?');
                  const purchased = Number(prompt('Quantity Purchased?'));
                  const rate = Number(prompt('Rate per unit?'));
                  const minStock = Number(prompt('Low Stock Alert at?'));
                  
                  const newMaterial: Material = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    unit: unit || 'units',
                    purchased,
                    used: 0,
                    rate,
                    vendor: '',
                    date: new Date().toISOString(),
                    billNumber: '',
                    minStock
                  };
                  
                  setState(prev => ({
                    ...prev,
                    materials: [...prev.materials, newMaterial],
                    expenses: [...prev.expenses, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString(),
                      amount: purchased * rate,
                      category: 'Material',
                      notes: `Purchased ${purchased} ${unit} of ${name}`
                    }]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.materials.map(material => {
              const stock = material.purchased - material.used;
              const isLow = stock <= material.minStock;
              return (
                <div key={material.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900">{material.name}</h4>
                    <p className="text-xs text-slate-500">{material.purchased} {material.unit} Purchased</p>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-lg font-bold", isLow ? "text-red-500" : "text-green-600")}>
                      {stock} {material.unit}
                    </div>
                    <button 
                      onClick={() => {
                        const used = Number(prompt(`How many ${material.unit} used?`));
                        if (isNaN(used)) return;
                        setState(prev => ({
                          ...prev,
                          materials: prev.materials.map(m => m.id === material.id ? { ...m, used: m.used + used } : m)
                        }));
                      }}
                      className="text-[10px] font-bold uppercase text-indigo-600 underline"
                    >
                      Update Usage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {subTab === 'labour' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Mazdoor & Theka</h3>
              <button 
                onClick={() => {
                  const type = prompt('Labour Type (Mistri/Beldar/etc)?');
                  if (!type) return;
                  const wage = Number(prompt('Daily Wage?'));
                  
                  const newLabour: Labour = {
                    id: Math.random().toString(36).substr(2, 9),
                    type,
                    dailyWage: wage,
                    attendance: {}
                  };
                  
                  setState(prev => ({
                    ...prev,
                    labours: [...prev.labours, newLabour]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.labours.map(labour => (
              <div key={labour.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-900">{labour.type}</h4>
                  <p className="text-sm font-bold text-slate-600">{formatCurrency(labour.dailyWage)}/day</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const date = format(new Date(), 'yyyy-MM-dd');
                      setState(prev => ({
                        ...prev,
                        labours: prev.labours.map(l => l.id === labour.id ? { ...l, attendance: { ...l.attendance, [date]: 'present' } } : l),
                        expenses: [...prev.expenses, {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date().toISOString(),
                          amount: labour.dailyWage,
                          category: 'Labour',
                          notes: `Daily wage for ${labour.type}`
                        }]
                      }));
                    }}
                    className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100"
                  >
                    Present
                  </button>
                  <button 
                    onClick={() => {
                      const date = format(new Date(), 'yyyy-MM-dd');
                      setState(prev => ({
                        ...prev,
                        labours: prev.labours.map(l => l.id === labour.id ? { ...l, attendance: { ...l.attendance, [date]: 'half' } } : l),
                        expenses: [...prev.expenses, {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date().toISOString(),
                          amount: labour.dailyWage / 2,
                          category: 'Labour',
                          notes: `Half day wage for ${labour.type}`
                        }]
                      }));
                    }}
                    className="flex-1 py-2 bg-yellow-50 text-yellow-600 rounded-xl text-xs font-bold border border-yellow-100"
                  >
                    Half Day
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Kharcha Paani</h3>
              <button 
                onClick={() => {
                  const amount = Number(prompt('Amount?'));
                  if (!amount) return;
                  const category = prompt('Category (Material/Labour/Theka/Equipment/Transport/Misc)?') as any;
                  const notes = prompt('Notes?');
                  
                  setState(prev => ({
                    ...prev,
                    expenses: [{
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString(),
                      amount,
                      category: category || 'Misc',
                      notes: notes || ''
                    }, ...prev.expenses]
                  }));
                }}
                className="p-2 bg-indigo-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {state.expenses.slice(0, 20).map(expense => (
                <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{expense.category}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{format(new Date(expense.date), 'dd MMM, HH:mm')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[100px]">{expense.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Kaam ki Raftaar</h3>
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {state.milestones.map((milestone, idx) => (
                <div key={milestone.id} className="relative">
                  <div className={cn(
                    "absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10",
                    milestone.status === 'completed' ? 'bg-green-500' : 
                    milestone.status === 'in-progress' ? 'bg-indigo-500' : 'bg-slate-200'
                  )} />
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">{milestone.phase}</h4>
                      <select 
                        value={milestone.status}
                        onChange={(e) => {
                          setState(prev => ({
                            ...prev,
                            milestones: prev.milestones.map(m => m.id === milestone.id ? { ...m, status: e.target.value as any } : m)
                          }));
                        }}
                        className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-0"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDemolition = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'bricks', label: 'Eent Bachao', icon: TrendingUp },
      { id: 'malwa', label: 'Malwa', icon: Trash2 },
      { id: 'scrap', label: 'Kabaad', icon: Package },
    ];

    return (
      <div className="space-y-6 pb-20">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Tod-Phod</h1>
          <p className="text-slate-500 text-sm">Demolition Tracker</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                subTab === tab.id 
                  ? "bg-orange-600 text-white shadow-md shadow-orange-100" 
                  : "bg-white text-slate-600 border border-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {subTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900">P&L Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Total Cost (Malwa)</span>
                  <span className="font-bold text-red-500">-{formatCurrency(malwaCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Scrap Income</span>
                  <span className="font-bold text-green-600">+{formatCurrency(scrapIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Brick Value</span>
                  <span className="font-bold text-green-600">+{formatCurrency(brickRecoveryValue)}</span>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Net Savings</span>
                  <span className="text-xl font-bold text-indigo-600">{formatCurrency(totalRecovery - malwaCost)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'bricks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Eent Bachao Counter</h3>
              <button 
                onClick={() => {
                  const recovered = Number(prompt('Bricks Recovered today?'));
                  const broken = Number(prompt('Bricks Broken?'));
                  const rate = Number(prompt('Rate per brick (₹)?'));
                  
                  setState(prev => ({
                    ...prev,
                    brickRecovery: [...prev.brickRecovery, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString(),
                      estimated: recovered + broken,
                      recovered,
                      broken,
                      ratePerBrick: rate || 7
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.brickRecovery.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{format(new Date(entry.date), 'dd MMM yyyy')}</h4>
                    <p className="text-xs text-slate-500">Recovery Rate: {((entry.recovered / (entry.recovered + entry.broken)) * 100).toFixed(1)}%</p>
                  </div>
                  <p className="font-bold text-green-600">+{formatCurrency(entry.recovered * entry.ratePerBrick)}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1 bg-green-50 p-2 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-green-600 uppercase">Recovered</p>
                    <p className="font-bold text-green-700">{entry.recovered}</p>
                  </div>
                  <div className="flex-1 bg-red-50 p-2 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-red-600 uppercase">Broken</p>
                    <p className="font-bold text-red-700">{entry.broken}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'malwa' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Malwa Report</h3>
              <button 
                onClick={() => {
                  const trips = Number(prompt('Trolley/Trips disposed?'));
                  const cost = Number(prompt('Cost per trip?'));
                  const vendor = prompt('Vendor Name?');
                  
                  setState(prev => ({
                    ...prev,
                    malwa: [...prev.malwa, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString(),
                      generated: trips,
                      disposed: trips,
                      costPerTrip: cost,
                      vendor: vendor || ''
                    }],
                    expenses: [...prev.expenses, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString(),
                      amount: trips * cost,
                      category: 'Transport',
                      notes: `Malwa disposal: ${trips} trips`
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.malwa.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900">{entry.disposed} Trolleys</h4>
                  <p className="text-xs text-slate-500">{format(new Date(entry.date), 'dd MMM yyyy')} • {entry.vendor}</p>
                </div>
                <p className="font-bold text-red-500">-{formatCurrency(entry.disposed * entry.costPerTrip)}</p>
              </div>
            ))}
          </div>
        )}

        {subTab === 'scrap' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Kabaad se Kamai</h3>
              <button 
                onClick={() => {
                  const type = prompt('Scrap Type (Iron/Steel/Copper)?');
                  const qty = Number(prompt('Quantity?'));
                  const unit = prompt('Unit (kg/pcs)?');
                  const rate = Number(prompt('Rate per unit?'));
                  
                  setState(prev => ({
                    ...prev,
                    scrap: [...prev.scrap, {
                      id: Math.random().toString(36).substr(2, 9),
                      type: type || 'Misc',
                      quantity: qty,
                      unit: unit || 'kg',
                      dealer: '',
                      rate
                    }]
                  }));
                }}
                className="p-2 bg-orange-600 text-white rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>

            {state.scrap.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900">{entry.type}</h4>
                  <p className="text-xs text-slate-500">{entry.quantity} {entry.unit} @ {formatCurrency(entry.rate)}</p>
                </div>
                <p className="font-bold text-green-600">+{formatCurrency(entry.quantity * entry.rate)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6 pb-20">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Project Taiyari</p>
        </header>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Project Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Project Name</label>
              <input 
                type="text" 
                value={state.project?.name || ''} 
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), name: e.target.value } }))}
                className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sharma Sadan"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
              <input 
                type="text" 
                value={state.project?.location || ''} 
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), location: e.target.value } }))}
                className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sector 15, Noida"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Total Budget (₹)</label>
              <input 
                type="number" 
                value={state.project?.budget || ''} 
                onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), budget: Number(e.target.value) } }))}
                className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 5000000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                <input 
                  type="date" 
                  value={state.project?.startDate || ''} 
                  onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), startDate: e.target.value } }))}
                  className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
                <input 
                  type="date" 
                  value={state.project?.endDate || ''} 
                  onChange={(e) => setState(prev => ({ ...prev, project: { ...(prev.project || {} as Project), endDate: e.target.value } }))}
                  className="w-full mt-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if (confirm('Are you sure you want to reset all data?')) {
              setState(INITIAL_STATE);
            }
          }}
          className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-bold border border-red-100"
        >
          Reset All Data
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-md mx-auto px-4 pt-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'construction' && renderConstruction()}
        {activeTab === 'demolition' && renderDemolition()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => { setActiveTab('dashboard'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-indigo-600" : "text-slate-400")}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase">Hisaab</span>
        </button>
        <button 
          onClick={() => { setActiveTab('construction'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'construction' ? "text-indigo-600" : "text-slate-400")}
        >
          <Construction size={24} />
          <span className="text-[10px] font-bold uppercase">Naya Kaam</span>
        </button>
        <button 
          onClick={() => { setActiveTab('demolition'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'demolition' ? "text-indigo-600" : "text-slate-400")}
        >
          <Hammer size={24} />
          <span className="text-[10px] font-bold uppercase">Tod-Phod</span>
        </button>
        <button 
          onClick={() => { setActiveTab('settings'); setSubTab('overview'); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-indigo-600" : "text-slate-400")}
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold uppercase">Taiyari</span>
        </button>
      </nav>
    </div>
  );
}
