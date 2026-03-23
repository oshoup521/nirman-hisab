export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getStatusColor = (spent: number, budget: number) => {
  const ratio = spent / budget;
  if (ratio > 1) return 'text-red-600 bg-red-50 border-red-200';
  if (ratio > 0.8) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-green-600 bg-green-50 border-green-200';
};
