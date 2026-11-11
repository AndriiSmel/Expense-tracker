/**
 * Hook for expense operations scoped to a month.
 */

import { useState, useEffect, useCallback } from 'react';
import { ExpenseWithCategory, ExpenseInput } from '../core/types';
import {
  getExpensesForMonth,
  createExpense as dbCreateExpense,
  updateExpense as dbUpdateExpense,
  deleteExpense as dbDeleteExpense,
} from '../core/database';
import { useDB } from './useDatabase';

export interface UseExpensesResult {
  expenses: ExpenseWithCategory[];
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  loading: boolean;
  refresh: () => void;
}

export function useExpenses(monthKey: string): UseExpensesResult {
  const db = useDB();
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = getExpensesForMonth(db, monthKey);
    setExpenses(data);
    setLoading(false);
  }, [db, monthKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExpense = useCallback(
    (input: ExpenseInput) => {
      dbCreateExpense(db, input);
      refresh();
    },
    [db, refresh],
  );

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput) => {
      dbUpdateExpense(db, id, input);
      refresh();
    },
    [db, refresh],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      dbDeleteExpense(db, id);
      refresh();
    },
    [db, refresh],
  );

  return { expenses, addExpense, updateExpense, deleteExpense, loading, refresh };
}
