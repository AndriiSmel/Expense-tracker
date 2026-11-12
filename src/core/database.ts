/**
 * SQLite database operations using expo-sqlite (SDK 52+ synchronous API).
 *
 * Every function takes a `db` parameter so the caller owns the connection.
 * Tables: schema_version, categories, expenses, monthly_budgets, preferences, recurring_expenses.
 */

import * as SQLite from 'expo-sqlite';
import {
  Expense,
  Category,
  MonthlyBudget,
  ExpenseWithCategory,
  CategorySpending,
  MonthSummary,
  ExpenseInput,
  CategoryInput,
  BackupData,
  RecurringExpense,
  RepeatFrequency,
} from '../core/types';
import { CurrencyCode, DEFAULT_BUDGET_CENTS, DEFAULT_CATEGORIES, DEFAULT_CURRENCY, SCHEMA_VERSION } from '../core/constants';
import { generateId, getToday, nowISO } from '../utils/formatters';
import { getNextRepeatDate, isCalendarDate, isRepeatFrequency } from './recurrence';
import { calculateCategoryBreakdown } from '../core/calculations';

const localChangeListeners = new WeakMap<SQLite.SQLiteDatabase, Set<() => void>>();

export function subscribeToLocalChanges(db: SQLite.SQLiteDatabase, listener: () => void): () => void {
  const listeners = localChangeListeners.get(db) ?? new Set<() => void>();
  localChangeListeners.set(db, listeners);
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notifyLocalChange(db: SQLite.SQLiteDatabase): void {
  localChangeListeners.get(db)?.forEach((listener) => listener());
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Map a raw row to a Category, converting is_archived int → boolean. */
function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sort_order,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.is_deleted === 1 ? { isDeleted: true } : {}),
    ...(row.monthly_limit_cents == null ? {} : { monthlyLimitCents: row.monthly_limit_cents || null }),
  };
}

/** Map a raw row to an Expense. */
function rowToExpense(row: any): Expense {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    categoryId: row.category_id,
    date: row.date,
    note: row.note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a raw joined row to ExpenseWithCategory. */
function rowToExpenseWithCategory(row: any): ExpenseWithCategory {
  return {
    ...rowToExpense(row),
    category: {
      id: row.cat_id ?? row.category_id,
      name: row.cat_name ?? 'Uncategorized',
      color: row.cat_color ?? '#795548',
      icon: row.cat_icon ?? 'dots-horizontal-circle-outline',
      sortOrder: row.cat_sort_order ?? 999,
      isArchived: row.cat_is_archived === 1,
      createdAt: row.cat_created_at ?? row.created_at,
      updatedAt: row.cat_updated_at ?? row.updated_at,
    },
  };
}

/** Map a raw row to MonthlyBudget. */
function rowToBudget(row: any): MonthlyBudget {
  return {
    monthKey: row.month_key,
    budgetCents: row.budget_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Create tables, run migrations, and seed defaults on first run.
 */
export function initDatabase(db: SQLite.SQLiteDatabase): void {
  db.execSync(`PRAGMA journal_mode = WAL;`);
  db.execSync(`PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id          TEXT PRIMARY KEY NOT NULL,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL,
      icon        TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      is_deleted  INTEGER NOT NULL DEFAULT 0,
      monthly_limit_cents INTEGER,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id           TEXT PRIMARY KEY NOT NULL,
      amount_cents INTEGER NOT NULL,
      category_id  TEXT NOT NULL,
      date         TEXT NOT NULL,
      note         TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS monthly_budgets (
      month_key   TEXT PRIMARY KEY NOT NULL,
      budget_cents INTEGER NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      default_budget_cents INTEGER NOT NULL,
      currency TEXT NOT NULL
    );
  `);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount_cents INTEGER NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      start_date TEXT NOT NULL,
      note TEXT,
      repeat_interval INTEGER NOT NULL,
      repeat_unit TEXT NOT NULL,
      next_date TEXT NOT NULL
    );
  `);
  db.runSync(
    'INSERT OR IGNORE INTO preferences (id, default_budget_cents, currency) VALUES (1, ?, ?)',
    DEFAULT_BUDGET_CENTS,
    DEFAULT_CURRENCY,
  );

  // Create index for faster month queries
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  `);

  // Check schema version
  const versionRow = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
  );

  if (!versionRow || versionRow.version < SCHEMA_VERSION) {
    db.withTransactionSync(() => {
      const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(categories)');
      if (!columns.some((column) => column.name === 'is_deleted')) {
        db.execSync('ALTER TABLE categories ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0');
      }
      if (!columns.some((column) => column.name === 'monthly_limit_cents')) {
        db.execSync('ALTER TABLE categories ADD COLUMN monthly_limit_cents INTEGER');
      }
      if (versionRow) db.runSync('UPDATE schema_version SET version = ?', SCHEMA_VERSION);
    });
  }

  if (!versionRow) {
    // First run — seed default categories
    const ts = nowISO();
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      db.runSync(
        `INSERT OR IGNORE INTO categories (id, name, color, icon, sort_order, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        cat.id,
        cat.name,
        cat.color,
        cat.icon,
        i,
        ts,
        ts,
      );
    }
    db.runSync('INSERT INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
  }
}

// ─── Category CRUD ───────────────────────────────────────────────────

export function getAllCategories(db: SQLite.SQLiteDatabase): Category[] {
  const rows = db.getAllSync('SELECT * FROM categories ORDER BY sort_order ASC');
  return rows.map(rowToCategory);
}

export function getActiveCategories(db: SQLite.SQLiteDatabase): Category[] {
  const rows = db.getAllSync(
    'SELECT * FROM categories WHERE is_archived = 0 AND is_deleted = 0 ORDER BY sort_order ASC',
  );
  return rows.map(rowToCategory);
}

export function createCategory(
  db: SQLite.SQLiteDatabase,
  input: CategoryInput,
): Category {
  const id = generateId();
  const ts = nowISO();

  // Determine next sort order
  const maxRow = db.getFirstSync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM categories',
  );
  const sortOrder = (maxRow?.max_order ?? -1) + 1;

  db.runSync(
    `INSERT INTO categories (id, name, color, icon, sort_order, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    id,
    input.name,
    input.color,
    input.icon,
    sortOrder,
    ts,
    ts,
  );
  notifyLocalChange(db);

  return {
    id,
    name: input.name,
    color: input.color,
    icon: input.icon,
    sortOrder,
    isArchived: false,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function updateCategory(
  db: SQLite.SQLiteDatabase,
  id: string,
  input: Partial<CategoryInput>,
): void {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.color !== undefined) {
    fields.push('color = ?');
    values.push(input.color);
  }
  if (input.icon !== undefined) {
    fields.push('icon = ?');
    values.push(input.icon);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(nowISO());
  values.push(id);

  const { changes } = db.runSync(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`,
    ...values,
  );
  if (changes) notifyLocalChange(db);
}

export function setCategoryMonthlyLimit(db: SQLite.SQLiteDatabase, id: string, cents: number | null): void {
  if (cents !== null && (!Number.isSafeInteger(cents) || cents <= 0)) {
    throw new Error('Enter a positive monthly limit.');
  }
  const { changes } = db.runSync(
    'UPDATE categories SET monthly_limit_cents = ?, updated_at = ? WHERE id = ? AND is_deleted = 0',
    cents ?? 0, nowISO(), id,
  );
  if (changes) notifyLocalChange(db);
}

export function archiveCategory(
  db: SQLite.SQLiteDatabase,
  id: string,
): void {
  const { changes } = db.runSync(
    'UPDATE categories SET is_archived = 1, updated_at = ? WHERE id = ? AND is_deleted = 0',
    nowISO(),
    id,
  );
  if (changes) notifyLocalChange(db);
}

export function unarchiveCategory(
  db: SQLite.SQLiteDatabase,
  id: string,
): void {
  const { changes } = db.runSync(
    'UPDATE categories SET is_archived = 0, updated_at = ? WHERE id = ? AND is_deleted = 0',
    nowISO(),
    id,
  );
  if (changes) notifyLocalChange(db);
}

export function isCategoryInUse(db: SQLite.SQLiteDatabase, id: string): boolean {
  return Boolean(db.getFirstSync(
    `SELECT 1 FROM expenses WHERE category_id = ?
     UNION ALL SELECT 1 FROM recurring_expenses WHERE category_id = ? LIMIT 1`,
    id, id,
  ));
}

export function deleteCategory(db: SQLite.SQLiteDatabase, id: string): boolean {
  let deleted = false;
  db.withTransactionSync(() => {
    if (isCategoryInUse(db, id)) return;
    // Retain a deletion marker so sync can preserve references from an offline device.
    const { changes } = db.runSync(
      'UPDATE categories SET is_deleted = 1, is_archived = 1, updated_at = ? WHERE id = ? AND is_deleted = 0',
      nowISO(), id,
    );
    deleted = changes > 0;
  });
  if (deleted) notifyLocalChange(db);
  return deleted;
}

function requireAvailableCategory(db: SQLite.SQLiteDatabase, id: string): void {
  if (db.getFirstSync('SELECT 1 FROM categories WHERE id = ? AND is_deleted = 1', id)) {
    throw new Error('This category was deleted. Choose another category.');
  }
}

// ─── Expense CRUD ────────────────────────────────────────────────────

const EXPENSE_WITH_CATEGORY_QUERY = `
  SELECT
    e.id, e.amount_cents, e.category_id, e.date, e.note, e.created_at, e.updated_at,
    c.id AS cat_id, c.name AS cat_name, c.color AS cat_color, c.icon AS cat_icon,
    c.sort_order AS cat_sort_order, c.is_archived AS cat_is_archived,
    c.created_at AS cat_created_at, c.updated_at AS cat_updated_at
  FROM expenses e
  LEFT JOIN categories c ON e.category_id = c.id
`;

export function getExpensesForMonth(
  db: SQLite.SQLiteDatabase,
  monthKey: string,
): ExpenseWithCategory[] {
  const rows = db.getAllSync(
    `${EXPENSE_WITH_CATEGORY_QUERY}
     WHERE e.date LIKE ? || '%'
     ORDER BY e.date DESC, e.created_at DESC`,
    monthKey,
  );
  return rows.map(rowToExpenseWithCategory);
}

export function getExpenseHistory(db: SQLite.SQLiteDatabase): ExpenseWithCategory[] {
  return db.getAllSync(
    `${EXPENSE_WITH_CATEGORY_QUERY} ORDER BY e.date DESC, e.created_at DESC`,
  ).map(rowToExpenseWithCategory);
}

export function createExpense(
  db: SQLite.SQLiteDatabase,
  input: ExpenseInput,
  id = generateId(),
): Expense {
  requireAvailableCategory(db, input.categoryId);
  const ts = nowISO();
  if (insertExpense(db, input, id, ts)) notifyLocalChange(db);
  return {
    id,
    amountCents: input.amountCents,
    categoryId: input.categoryId,
    date: input.date,
    note: input.note,
    createdAt: ts,
    updatedAt: ts,
  };
}

function insertExpense(db: SQLite.SQLiteDatabase, input: ExpenseInput, id: string, ts: string): number {
  const { changes } = db.runSync(
    `INSERT INTO expenses (id, amount_cents, category_id, date, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
    id,
    input.amountCents,
    input.categoryId,
    input.date,
    input.note,
    ts,
    ts,
  );
  return changes;
}

export function updateExpense(
  db: SQLite.SQLiteDatabase,
  id: string,
  input: ExpenseInput,
): void {
  const existing = db.getFirstSync<{ category_id: string }>('SELECT category_id FROM expenses WHERE id = ?', id);
  if (existing && existing.category_id !== input.categoryId) requireAvailableCategory(db, input.categoryId);
  const { changes } = db.runSync(
    `UPDATE expenses SET amount_cents = ?, category_id = ?, date = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    input.amountCents,
    input.categoryId,
    input.date,
    input.note,
    nowISO(),
    id,
  );
  if (changes) notifyLocalChange(db);
}

export function deleteExpense(
  db: SQLite.SQLiteDatabase,
  id: string,
): void {
  deleteExpenses(db, [id]);
}

export function deleteExpenses(db: SQLite.SQLiteDatabase, ids: string[]): void {
  let changes = 0;
  db.withTransactionSync(() => {
    for (const id of ids) changes += db.runSync('DELETE FROM expenses WHERE id = ?', id).changes;
  });
  if (changes) notifyLocalChange(db);
}

// ─── Recurring expenses ───────────────────────────────────────────────

const recurringExpenseQuery = `
  SELECT id, amount_cents AS amountCents, category_id AS categoryId,
    start_date AS date, note, repeat_interval AS interval, repeat_unit AS unit,
    next_date AS nextDate
  FROM recurring_expenses
`;

export function getRecurringExpenses(db: SQLite.SQLiteDatabase): RecurringExpense[] {
  return db.getAllSync<RecurringExpense>(`${recurringExpenseQuery} ORDER BY next_date, id`);
}

function insertRecurringExpense(db: SQLite.SQLiteDatabase, rule: RecurringExpense): void {
  db.runSync(
    `INSERT INTO recurring_expenses
       (id, amount_cents, category_id, start_date, note, repeat_interval, repeat_unit, next_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    rule.id, rule.amountCents, rule.categoryId, rule.date, rule.note,
    rule.interval, rule.unit, rule.nextDate,
  );
}

export function createRecurringExpense(
  db: SQLite.SQLiteDatabase,
  input: ExpenseInput,
  frequency: RepeatFrequency,
): void {
  const today = getToday();
  if (!isCalendarDate(input.date) || input.date < today || !isRepeatFrequency(frequency)
    || !Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Enter a positive amount, a valid frequency, and a start date of today or later.');
  }
  db.withTransactionSync(() => {
    requireAvailableCategory(db, input.categoryId);
    insertRecurringExpense(db, { ...input, ...frequency, id: generateId(), nextDate: input.date });
    recordDueExpenses(db, today);
  });
  notifyLocalChange(db);
}

function recordDueExpenses(db: SQLite.SQLiteDatabase, throughDate: string): number {
  const due = db.getAllSync<RecurringExpense>(`${recurringExpenseQuery} WHERE next_date <= ?`, throughDate);
  let recorded = 0;
  for (const rule of due) {
    let date = rule.nextDate;
    while (date <= throughDate) {
      insertExpense(db, { ...rule, date }, `repeat:${rule.id}:${date}`, nowISO());
      recorded++;
      date = getNextRepeatDate(rule.date, date, rule);
    }
    db.runSync('UPDATE recurring_expenses SET next_date = ? WHERE id = ?', date, rule.id);
  }
  return recorded;
}

export function recordDueRecurringExpenses(db: SQLite.SQLiteDatabase, throughDate = getToday()): number {
  let recorded = 0;
  db.withTransactionSync(() => {
    recorded = recordDueExpenses(db, throughDate);
  });
  if (recorded) notifyLocalChange(db);
  return recorded;
}

export function stopRecurringExpense(db: SQLite.SQLiteDatabase, id: string): void {
  const { changes } = db.runSync('DELETE FROM recurring_expenses WHERE id = ?', id);
  if (changes) notifyLocalChange(db);
}

export function getAllExpenses(db: SQLite.SQLiteDatabase): Expense[] {
  const rows = db.getAllSync(
    'SELECT * FROM expenses ORDER BY date DESC, created_at DESC',
  );
  return rows.map(rowToExpense);
}

// ─── Budget CRUD ─────────────────────────────────────────────────────

export function getPreferences(db: SQLite.SQLiteDatabase) {
  const row = db.getFirstSync<{ default_budget_cents: number; currency: CurrencyCode }>(
    'SELECT default_budget_cents, currency FROM preferences WHERE id = 1',
  );
  return {
    defaultBudgetCents: row?.default_budget_cents ?? DEFAULT_BUDGET_CENTS,
    currency: row?.currency ?? DEFAULT_CURRENCY,
  };
}

export function setDefaultBudget(db: SQLite.SQLiteDatabase, cents: number): void {
  db.runSync('UPDATE preferences SET default_budget_cents = ? WHERE id = 1', cents);
}

export function setCurrency(db: SQLite.SQLiteDatabase, currency: CurrencyCode): void {
  db.runSync('UPDATE preferences SET currency = ? WHERE id = 1', currency);
}

export function getBudgetForMonth(
  db: SQLite.SQLiteDatabase,
  monthKey: string,
): MonthlyBudget | null {
  const row = db.getFirstSync(
    'SELECT * FROM monthly_budgets WHERE month_key = ?',
    monthKey,
  );
  return row ? rowToBudget(row) : null;
}

export function setBudget(
  db: SQLite.SQLiteDatabase,
  monthKey: string,
  budgetCents: number,
): void {
  const ts = nowISO();
  db.runSync(
    `INSERT INTO monthly_budgets (month_key, budget_cents, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(month_key) DO UPDATE SET budget_cents = excluded.budget_cents, updated_at = excluded.updated_at`,
    monthKey,
    budgetCents,
    ts,
    ts,
  );
  notifyLocalChange(db);
}

export function getAllBudgets(db: SQLite.SQLiteDatabase): MonthlyBudget[] {
  const rows = db.getAllSync(
    'SELECT * FROM monthly_budgets ORDER BY month_key DESC',
  );
  return rows.map(rowToBudget);
}

export function clearBudgetForMonth(db: SQLite.SQLiteDatabase, monthKey: string): void {
  const { changes } = db.runSync('DELETE FROM monthly_budgets WHERE month_key = ?', monthKey);
  if (changes) notifyLocalChange(db);
}

// ─── Month Summary ───────────────────────────────────────────────────

export function getMonthSummary(
  db: SQLite.SQLiteDatabase,
  monthKey: string,
  categories: Category[],
): MonthSummary {
  const expenses = getExpensesForMonth(db, monthKey);
  const budget = getBudgetForMonth(db, monthKey);

  const totalSpentCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const budgetCents = budget?.budgetCents ?? getPreferences(db).defaultBudgetCents;
  const remainingCents = budgetCents - totalSpentCents;
  const usagePercentage = budgetCents > 0 ? (totalSpentCents / budgetCents) * 100 : 0;

  const categoryBreakdown = calculateCategoryBreakdown(expenses, categories);

  return {
    monthKey,
    totalSpentCents,
    budgetCents,
    remainingCents,
    usagePercentage,
    categoryBreakdown,
  };
}

// ─── Backup / Import ─────────────────────────────────────────────────

const backupRevisions = new WeakMap<SQLite.SQLiteDatabase, number>();

export function getBackupRevision(db: SQLite.SQLiteDatabase): number {
  return backupRevisions.get(db) ?? 0;
}

export function importBackupData(
  db: SQLite.SQLiteDatabase,
  data: BackupData,
): void {
  db.execSync('BEGIN TRANSACTION;');
  try {
    replaceBackupRows(db, data);
    recordDueExpenses(db, getToday());

    db.execSync('COMMIT;');
    backupRevisions.set(db, getBackupRevision(db) + 1);
  } catch (error) {
    db.execSync('ROLLBACK;');
    throw error;
  }
  notifyLocalChange(db);
}

/** Replace validated data inside the caller’s SQLite transaction. */
export function replaceBackupRows(db: SQLite.SQLiteDatabase, data: BackupData): void {
  db.execSync('DELETE FROM recurring_expenses;');
  db.execSync('DELETE FROM expenses;');
  db.execSync('DELETE FROM categories;');
  db.execSync('DELETE FROM monthly_budgets;');

  // Import categories first (ensures foreign key consistency)
  for (const cat of data.categories) {
    db.runSync(
      `INSERT INTO categories (id, name, color, icon, sort_order, is_archived, created_at, updated_at, is_deleted, monthly_limit_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      cat.id,
      cat.name,
      cat.color,
      cat.icon,
      cat.sortOrder,
      cat.isArchived ? 1 : 0,
      cat.createdAt,
      cat.updatedAt,
      cat.isDeleted ? 1 : 0,
      cat.monthlyLimitCents === undefined ? null : cat.monthlyLimitCents ?? 0,
    );
  }

  // Import expenses
  for (const exp of data.expenses) {
    db.runSync(
      `INSERT INTO expenses (id, amount_cents, category_id, date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      exp.id,
      exp.amountCents,
      exp.categoryId,
      exp.date,
      exp.note,
      exp.createdAt,
      exp.updatedAt,
    );
  }

  // Import budgets
  for (const b of data.budgets) {
    db.runSync(
      `INSERT INTO monthly_budgets (month_key, budget_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      b.monthKey,
      b.budgetCents,
      b.createdAt,
      b.updatedAt,
    );
  }

  for (const rule of data.recurringExpenses ?? []) {
    insertRecurringExpense(db, rule);
  }
}
