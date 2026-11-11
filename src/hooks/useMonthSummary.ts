/**
 * Hook that computes a full MonthSummary from expenses, budget, and categories.
 */

import { useState, useEffect, useCallback } from 'react';
import { MonthSummary } from '../core/types';
import { getMonthSummary, getAllCategories } from '../core/database';
import { useDB } from './useDatabase';

export interface UseMonthSummaryResult {
  summary: MonthSummary | null;
  loading: boolean;
  refresh: () => void;
}

export function useMonthSummary(monthKey: string): UseMonthSummaryResult {
  const db = useDB();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const categories = getAllCategories(db);
    const data = getMonthSummary(db, monthKey, categories);
    setSummary(data);
    setLoading(false);
  }, [db, monthKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}
