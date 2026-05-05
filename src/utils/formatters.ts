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
  if (ratio > 1) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
  if (ratio > 0.8) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
};
