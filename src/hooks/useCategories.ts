/**
 * Hook for category management.
 */

import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryInput } from '../core/types';
import {
  getAllCategories,
  getActiveCategories,
  createCategory as dbCreateCategory,
  updateCategory as dbUpdateCategory,
  archiveCategory as dbArchiveCategory,
  unarchiveCategory as dbUnarchiveCategory,
  deleteCategory as dbDeleteCategory,
} from '../core/database';
import { useDB } from './useDatabase';

export interface UseCategoriesResult {
  categories: Category[];
  activeCategories: Category[];
  createCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, input: Partial<CategoryInput>) => void;
  archiveCategory: (id: string) => void;
  unarchiveCategory: (id: string) => void;
  deleteCategory: (id: string) => boolean;
  loading: boolean;
  refresh: () => void;
}

export function useCategories(): UseCategoriesResult {
  const db = useDB();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setCategories(getAllCategories(db));
    setActiveCategories(getActiveCategories(db));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCategory = useCallback(
    (input: CategoryInput): Category => {
      const cat = dbCreateCategory(db, input);
      refresh();
      return cat;
    },
    [db, refresh],
  );

  const updateCategory = useCallback(
    (id: string, input: Partial<CategoryInput>) => {
      dbUpdateCategory(db, id, input);
      refresh();
    },
    [db, refresh],
  );

  const archiveCategory = useCallback(
    (id: string) => {
      dbArchiveCategory(db, id);
      refresh();
    },
    [db, refresh],
  );

  const unarchiveCategory = useCallback(
    (id: string) => {
      dbUnarchiveCategory(db, id);
      refresh();
    },
    [db, refresh],
  );

  const deleteCategory = useCallback((id: string) => {
    const deleted = dbDeleteCategory(db, id);
    refresh();
    return deleted;
  }, [db, refresh]);

  return {
    categories,
    activeCategories,
    createCategory,
    updateCategory,
    archiveCategory,
    unarchiveCategory,
    deleteCategory,
    loading,
    refresh,
  };
}
