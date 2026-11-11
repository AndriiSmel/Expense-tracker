/**
 * Core data models for the Expense Tracker.
 * These types are portable and can be reused in a future desktop application.
 */

// ─── Database Entities ───────────────────────────────────────────────

export interface Expense {
  id: string;
  amountCents: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex color
  icon: string; // MaterialCommunityIcons name
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudget {
  monthKey: string; // YYYY-MM
  budgetCents: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Computed / View Models ──────────────────────────────────────────

export interface ExpenseWithCategory extends Expense {
  category: Category;
}

export interface CategorySpending {
  category: Category;
  totalCents: number;
  percentage: number;
  expenseCount: number;
}

export interface MonthSummary {
  monthKey: string;
  totalSpentCents: number;
  budgetCents: number;
  remainingCents: number;
  usagePercentage: number;
  categoryBreakdown: CategorySpending[];
}

// ─── Input Types ─────────────────────────────────────────────────────

export interface ExpenseInput {
  amountCents: number;
  categoryId: string;
  date: string;
  note: string | null;
}

export type RepeatUnit = 'day' | 'week' | 'month' | 'year';

export interface RepeatFrequency {
  interval: number;
  unit: RepeatUnit;
}

export interface RecurringExpense extends ExpenseInput, RepeatFrequency {
  id: string;
  nextDate: string;
}

export interface CategoryInput {
  name: string;
  color: string;
  icon: string;
}

// ─── Backup Types ────────────────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  categories: Category[];
  budgets: MonthlyBudget[];
  recurringExpenses?: RecurringExpense[];
}

// ─── Theme Types ─────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  border: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;
  overlay: string;
}

