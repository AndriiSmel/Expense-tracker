/**
 * Pure calculation functions for expense analysis.
 * No database or React dependencies — fully portable.
 */

import {
  Expense,
  ExpenseWithCategory,
  Category,
  CategorySpending,
} from '../core/types';

// ─── Budget Usage ────────────────────────────────────────────────────

export interface BudgetUsage {
  remainingCents: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

/**
 * Calculate how much budget has been used.
 * - "normal"   → under 80%
 * - "warning"  → 80–100%
 * - "exceeded" → over 100%
 */
export function calculateBudgetUsage(
  spentCents: number,
  budgetCents: number,
): BudgetUsage {
  if (budgetCents <= 0) {
    return { remainingCents: 0, percentage: 0, status: 'normal' };
  }

  const remainingCents = budgetCents - spentCents;
  const percentage = (spentCents / budgetCents) * 100;

  let status: BudgetUsage['status'] = 'normal';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 80) {
    status = 'warning';
  }

  return { remainingCents, percentage, status };
}

// ─── Category Breakdown ──────────────────────────────────────────────

/**
 * Group expenses by category and compute each category's total + percentage.
 * Returns entries sorted by totalCents descending.
 */
export function calculateCategoryBreakdown(
  expenses: ExpenseWithCategory[],
  categories: Category[],
): CategorySpending[] {
  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  // Accumulate per category
  const map = new Map<string, { totalCents: number; count: number }>();
  for (const expense of expenses) {
    const entry = map.get(expense.categoryId) ?? { totalCents: 0, count: 0 };
    entry.totalCents += expense.amountCents;
    entry.count += 1;
    map.set(expense.categoryId, entry);
  }

  // Build result for categories that have at least one expense
  const result: CategorySpending[] = [];

  for (const [categoryId, data] of map) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) continue;

    result.push({
      category,
      totalCents: data.totalCents,
      percentage: totalCents > 0 ? (data.totalCents / totalCents) * 100 : 0,
      expenseCount: data.count,
    });
  }

  // Sort by spend descending
  result.sort((a, b) => b.totalCents - a.totalCents);

  return result;
}

// ─── Month Total ─────────────────────────────────────────────────────

/**
 * Sum the amountCents of a list of expenses.
 */
export function calculateMonthTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountCents, 0);
}
