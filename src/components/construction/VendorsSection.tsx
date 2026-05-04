import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

export default function VendorsSection() {
  const { state, setState, askConfirm } = useAppContext();
  const vendors = state.vendors || [];

  const addVendor = () => {
    const name = prompt('Dukandar ka naam? (e.g. Gupta Cement)');
    if (!name) return;
    const type = prompt('Samaan ka type? (e.g. Cement/Rodi/Hardware)');
    const totalBilled = Number(prompt('Ab tak ka total bill (₹)?', '0'));
    setState(prev => ({
      ...prev,
      vendors: [...(prev.vendors || []), {
        id: genId(), name, type: type || 'General', phone: '', totalBilled, payments: [],
      }],
    }));
  };

  const addPayment = (vendorId: string, vendorName: string) => {
    const amount = Number(prompt('Kitna payment (jama) de rahe hain?'));
    if (!amount) return;
    const dateStr = prompt('Date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10));
    const note = prompt('Notes? (e.g. Cash/UPI)') || '';
    setState(prev => ({
      ...prev,
      vendors: prev.vendors.map(v => v.id === vendorId ? {
        ...v,
        payments: [...v.payments, { id: genId(), date: dateStr || '', amount, type: 'payment', note }],
      } : v),
      expenses: [...prev.expenses, {
        id: genId(), date: new Date(dateStr || '').toISOString(),
        amount, category: 'Material', notes: `Paid to ${vendorName} - ${note}`,
      }],
    }));
  };

  const addBill = (vendorId: string) => {
    const amount = Number(prompt('Naya bill kitne ka aaya (₹)?'));
    if (!amount) return;
    setState(prev => ({
      ...prev,
      vendors: prev.vendors.map(v => v.id === vendorId ? { ...v, totalBilled: v.totalBilled + amount } : v),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Dukandar Khata (Udhaar)</h3>
        <button onClick={addVendor} className="p-2 bg-indigo-600 text-white rounded-full">
          <Plus size={20} />
        </button>
      </div>

      {vendors.map(vendor => {
        const totalPaid = vendor.payments.reduce((a, p) => a + p.amount, 0);
        const balance = vendor.totalBilled - totalPaid;
        return (
          <div key={vendor.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{vendor.name}</h4>
                <p className="text-xs text-slate-500 font-bold">{vendor.type}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Bill</p>
                <p className="font-bold text-slate-900">₹{formatNumber(vendor.totalBilled)}</p>
              </div>
            </div>
            <div className="flex justify-between text-xs font-bold border-y border-slate-50 py-2">
              <div>
                <span className="text-slate-400">JAMA KIYA: </span>
                <span className="text-green-600">₹{formatNumber(totalPaid)}</span>
              </div>
              <div>
                <span className="text-slate-400">DENA BAAKI: </span>
                <span className={balance > 0 ? 'text-red-500' : 'text-green-500'}>
                  {balance > 0 ? `₹${formatNumber(balance)}` : `Advance ₹${formatNumber(Math.abs(balance))}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addPayment(vendor.id, vendor.name)}
                className="flex-1 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100"
              >
                Paise Jama
              </button>
              <button
                onClick={() => addBill(vendor.id)}
                className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
              >
                Bill Badao
              </button>
              <button
                onClick={() => askConfirm(`"${vendor.name}" vendor ko delete kar dein?`, () =>
                  setState(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== vendor.id) }))
                )}
                className="p-1.5 bg-red-50 text-red-400 rounded-xl border border-red-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
