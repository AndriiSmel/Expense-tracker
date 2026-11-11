/**
 * Hook for monthly budget operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { MonthlyBudget } from '../core/types';
import {
  getBudgetForMonth,
  clearBudgetForMonth,
  setBudget as dbSetBudget,
} from '../core/database';
import { useDB } from './useDatabase';

export interface UseBudgetResult {
  budget: MonthlyBudget | null;
  setBudget: (budgetCents: number) => void;
  clearBudget: () => void;
  loading: boolean;
  refresh: () => void;
}

export function useBudget(monthKey: string): UseBudgetResult {
  const db = useDB();
  const [budget, setBudgetState] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = getBudgetForMonth(db, monthKey);
    setBudgetState(data);
    setLoading(false);
  }, [db, monthKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setBudget = useCallback(
    (budgetCents: number) => {
      dbSetBudget(db, monthKey, budgetCents);
      refresh();
    },
    [db, monthKey, refresh],
  );

  const clearBudget = () => {
    clearBudgetForMonth(db, monthKey);
    refresh();
  };

  return { budget: budget?.monthKey === monthKey ? budget : null, setBudget, clearBudget, loading, refresh };
}
