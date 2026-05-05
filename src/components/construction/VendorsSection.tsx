import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X, Store } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../utils/formatters';
import { genId } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { Vendor } from '../../types';

const VENDOR_TYPES = ['Cement', 'Sariya', 'Sand / Rodi', 'Hardware', 'Electrical', 'Plumbing', 'Tiles', 'Paint', 'Other'];

type VendorForm = {
  name: string;
  type: string;
  customType: string;
  phone: string;
  totalBilled: string;
};

type PayForm = {
  vendorId: string;
  amount: string;
  date: string;
  note: string;
};

type BillForm = {
  vendorId: string;
  amount: string;
};

const blankVendor = (): VendorForm => ({
  name: '', type: 'Cement', customType: '', phone: '', totalBilled: '',
});

export default function VendorsSection() {
  const { state, setState, askConfirm } = useAppContext();
  const vendors = state.vendors || [];

  const [vendorForm, setVendorForm] = useState<VendorForm | null>(null);
  const [vendorEditId, setVendorEditId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PayForm | null>(null);
  const [billForm, setBillForm] = useState<BillForm | null>(null);

  const openAddVendor = () => { setVendorEditId(null); setVendorForm(blankVendor()); };

  const openEditVendor = (v: Vendor) => {
    setVendorEditId(v.id);
    const isPreset = VENDOR_TYPES.includes(v.type);
    setVendorForm({
      name: v.name,
      type: isPreset ? v.type : 'Other',
      customType: isPreset ? '' : v.type,
      phone: v.phone || '',
      totalBilled: String(v.totalBilled),
    });
  };

  const closeVendorForm = () => { setVendorForm(null); setVendorEditId(null); };

  const finalType = (f: VendorForm) =>
    f.type === 'Other' ? (f.customType.trim() || 'Other') : f.type;

  const saveVendor = () => {
    if (!vendorForm?.name) return;
    const type = finalType(vendorForm);
    const totalBilled = Number(vendorForm.totalBilled) || 0;
    if (vendorEditId) {
      setState(prev => ({
        ...prev,
        vendors: (prev.vendors || []).map(v => v.id === vendorEditId
          ? { ...v, name: vendorForm.name, type, phone: vendorForm.phone, totalBilled }
          : v),
      }));
    } else {
      setState(prev => ({
        ...prev,
        vendors: [...(prev.vendors || []), {
          id: genId(), name: vendorForm.name, type, phone: vendorForm.phone, totalBilled, payments: [],
        }],
      }));
    }
    closeVendorForm();
  };

  const openAddPay = (v: Vendor) => setPayForm({
    vendorId: v.id, amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '',
  });
  const closePayForm = () => setPayForm(null);

  const savePay = () => {
    if (!payForm) return;
    const amount = Number(payForm.amount);
    if (!amount) return;
    const vendor = vendors.find(v => v.id === payForm.vendorId);
    if (!vendor) return;
    const isoDate = new Date(payForm.date).toISOString();
    const id = genId();
    setState(prev => ({
      ...prev,
      vendors: (prev.vendors || []).map(v => v.id === payForm.vendorId
        ? { ...v, payments: [...v.payments, { id, date: payForm.date, amount, type: 'payment', note: payForm.note }] }
        : v),
      expenses: [...prev.expenses, {
        id: genId(), date: isoDate, amount, category: 'Material',
        notes: `Paid to ${vendor.name}${payForm.note ? ` - ${payForm.note}` : ''}`,
      }],
    }));
    closePayForm();
  };

  const openAddBill = (v: Vendor) => setBillForm({ vendorId: v.id, amount: '' });
  const closeBillForm = () => setBillForm(null);

  const saveBill = () => {
    if (!billForm) return;
    const amount = Number(billForm.amount);
    if (!amount) return;
    setState(prev => ({
      ...prev,
      vendors: prev.vendors.map(v => v.id === billForm.vendorId
        ? { ...v, totalBilled: v.totalBilled + amount }
        : v),
    }));
    closeBillForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900">Dukandar Khata (Udhaar)</h3>
          <p className="text-xs text-slate-400 mt-0.5">{vendors.length} vendors</p>
        </div>
        <button
          onClick={openAddVendor}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-sm">Koi vendor nahi abhi tak</p>
          <button onClick={openAddVendor} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100">
            + Vendor Add Karein
          </button>
        </div>
      ) : (
        vendors.map(vendor => {
          const totalPaid = vendor.payments.reduce((a, p) => a + p.amount, 0);
          const balance = vendor.totalBilled - totalPaid;
          return (
            <div key={vendor.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900">{vendor.name}</h4>
                  <p className="text-xs text-slate-500 font-bold">{vendor.type}{vendor.phone ? ` • ${vendor.phone}` : ''}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-right mr-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Bill</p>
                    <p className="font-bold text-slate-900">₹{formatNumber(vendor.totalBilled)}</p>
                  </div>
                  <button onClick={() => openEditVendor(vendor)} className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => askConfirm(`"${vendor.name}" vendor ko delete kar dein?`, () =>
                      setState(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== vendor.id) }))
                    )}
                    className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100"
                  >
                    <Trash2 size={12} />
                  </button>
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
                  onClick={() => openAddPay(vendor)}
                  className="flex-1 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100"
                >
                  + Paise Jama
                </button>
                <button
                  onClick={() => openAddBill(vendor)}
                  className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100"
                >
                  + Bill Badao
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Vendor Form Sheet */}
      {vendorForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeVendorForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto overflow-y-auto max-h-[92vh]" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{vendorEditId ? 'Vendor Edit' : 'Naya Vendor'}</h3>
                <button onClick={closeVendorForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Dukandar Naam</label>
                <input type="text" autoFocus value={vendorForm.name}
                  onChange={e => setVendorForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Gupta Cement" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Samaan ka Type</label>
                <div className="flex flex-wrap gap-2">
                  {VENDOR_TYPES.map(t => (
                    <button key={t} onClick={() => setVendorForm(f => f ? { ...f, type: t } : f)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                        vendorForm.type === t ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                      {t}
                    </button>
                  ))}
                </div>
                {vendorForm.type === 'Other' && (
                  <input type="text" value={vendorForm.customType}
                    onChange={e => setVendorForm(f => f ? { ...f, customType: e.target.value } : f)}
                    className="w-full mt-2 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Custom type likho..." />
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Phone (optional)</label>
                <input type="tel" value={vendorForm.phone}
                  onChange={e => setVendorForm(f => f ? { ...f, phone: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="9XXXXXXXXX" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Ab tak ka Total Bill (₹)</label>
                <input type="number" inputMode="numeric" value={vendorForm.totalBilled}
                  onChange={e => setVendorForm(f => f ? { ...f, totalBilled: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-xl"
                  placeholder="0" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeVendorForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={saveVendor} disabled={!vendorForm.name}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200">
                  {vendorEditId ? 'Update Karein' : 'Save Karo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Form Sheet */}
      {payForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closePayForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Paise Jama</h3>
                <button onClick={closePayForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={payForm.amount}
                  onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-xl"
                  placeholder="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Date</label>
                <input type="date" value={payForm.date}
                  onChange={e => setPayForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Note (Cash/UPI/Cheque)</label>
                <input type="text" value={payForm.note}
                  onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Cash diya" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closePayForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={savePay} disabled={!payForm.amount || Number(payForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200">
                  Save Karo
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bill Form Sheet */}
      {billForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeBillForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <div className="p-6 space-y-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Naya Bill Add</h3>
                <button onClick={closeBillForm} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><X size={16} /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Bill Amount (₹)</label>
                <input type="number" inputMode="numeric" autoFocus value={billForm.amount}
                  onChange={e => setBillForm(f => f ? { ...f, amount: e.target.value } : f)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-xl"
                  placeholder="0" />
                <p className="text-[10px] text-slate-400 font-bold mt-1.5">Yeh amount total bill mein add ho jayega</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeBillForm} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                <button onClick={saveBill} disabled={!billForm.amount || Number(billForm.amount) <= 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 shadow-sm shadow-indigo-200">
                  Save Karo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
