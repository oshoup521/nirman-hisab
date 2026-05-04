import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { AppState, RentalProperty } from '../types';

export function useAppCalculations(state: AppState) {
  const totalSpent = useMemo(
    () => (state.expenses || []).reduce((acc, curr) => acc + curr.amount, 0),
    [state.expenses]
  );

  const budget = state.project?.budget || 0;
  const masterBudget = state.project?.masterBudget || 0;

  const scrapIncome = useMemo(
    () => (state.scrap || []).reduce((acc, curr) => acc + curr.quantity * curr.rate, 0),
    [state.scrap]
  );

  const brickRecoveryValue = useMemo(
    () => (state.brickRecovery || []).reduce((acc, curr) => acc + curr.recovered * curr.ratePerBrick, 0),
    [state.brickRecovery]
  );

  const totalRecovery = scrapIncome + brickRecoveryValue;

  const malwaCost = useMemo(
    () => (state.malwa || []).reduce((acc, curr) => acc + curr.disposed * curr.costPerTrip, 0),
    [state.malwa]
  );

  const demolitionThekaCost = useMemo(
    () => (state.demolitionThekas || []).reduce((acc, t) => acc + t.payments.reduce((a, p) => a + p.amount, 0), 0),
    [state.demolitionThekas]
  );

  const demolitionThekaPending = useMemo(
    () => (state.demolitionThekas || []).reduce(
      (acc, t) => acc + (t.totalAmount - t.payments.reduce((a, p) => a + p.amount, 0)),
      0
    ),
    [state.demolitionThekas]
  );

  const totalRentPaid = useMemo(
    () => (state.rentals || []).reduce((a, r) => a + r.payments.reduce((s, p) => s + p.amount, 0), 0),
    [state.rentals]
  );

  const totalCashRentPaid = useMemo(
    () => (state.rentals || []).reduce(
      (a, r) => a + r.payments.filter(p => !p.paidFromDeposit).reduce((s, p) => s + p.amount, 0),
      0
    ),
    [state.rentals]
  );

  const getDepositStatus = useCallback(
    (r: RentalProperty | any): 'pending' | 'paid' | 'refunded' | 'forfeited' => {
      if (r.depositStatus) return r.depositStatus;
      if (r.depositPaid === true) return 'paid';
      return 'pending';
    },
    []
  );

  const depositPaid = useMemo(
    () => (state.rentals || [])
      .filter(r => { const s = getDepositStatus(r); return s === 'paid' || s === 'forfeited'; })
      .reduce((a, r) => a + (r.deposit || 0), 0),
    [state.rentals, getDepositStatus]
  );

  const depositPending = useMemo(
    () => (state.rentals || [])
      .filter(r => getDepositStatus(r) === 'pending')
      .reduce((a, r) => a + (r.deposit || 0), 0),
    [state.rentals, getDepositStatus]
  );

  const depositWapas = useMemo(
    () => (state.rentals || [])
      .filter(r => getDepositStatus(r) === 'paid')
      .reduce((a, r) => {
        const usedForRent = r.payments.filter(p => p.paidFromDeposit).reduce((s, p) => s + p.amount, 0);
        return a + Math.max(0, (r.deposit || 0) - usedForRent);
      }, 0),
    [state.rentals, getDepositStatus]
  );

  const currentMonthRent = useMemo(() => {
    const m = format(new Date(), 'yyyy-MM');
    return (state.rentals || []).reduce((a, r) => {
      const paid = r.payments.filter(p => p.month === m).reduce((s, p) => s + p.amount, 0);
      return a + (r.monthlyRent - paid);
    }, 0);
  }, [state.rentals]);

  const totalMisc = useMemo(
    () => (state.miscExpenses || []).reduce((a, e) => a + e.amount, 0),
    [state.miscExpenses]
  );

  const totalKharcha = useMemo(
    () => totalSpent + demolitionThekaCost + malwaCost + totalCashRentPaid + depositPaid + totalMisc,
    [totalSpent, demolitionThekaCost, malwaCost, totalCashRentPaid, depositPaid, totalMisc]
  );

  const masterRemaining = masterBudget > 0 ? masterBudget - totalKharcha : 0;
  const masterBurnRate = masterBudget > 0 ? (totalKharcha / masterBudget) * 100 : 0;

  return {
    totalSpent,
    budget,
    masterBudget,
    scrapIncome,
    brickRecoveryValue,
    totalRecovery,
    malwaCost,
    demolitionThekaCost,
    demolitionThekaPending,
    totalRentPaid,
    totalCashRentPaid,
    depositPaid,
    depositPending,
    depositWapas,
    currentMonthRent,
    totalMisc,
    totalKharcha,
    masterRemaining,
    masterBurnRate,
    getDepositStatus,
  };
}

export type AppCalculations = ReturnType<typeof useAppCalculations>;
