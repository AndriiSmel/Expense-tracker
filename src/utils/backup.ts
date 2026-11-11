/**
 * Backup export / import utilities.
 *
 * Uses expo-file-system, expo-sharing, and expo-document-picker.
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  BackupData,
  Expense,
  Category,
  MonthlyBudget,
} from '../core/types';
import { BACKUP_VERSION } from '../core/constants';
import {
  getAllExpenses,
  getAllCategories,
  getAllBudgets,
  getRecurringExpenses,
  importBackupData,
} from '../core/database';
import { isCalendarDate, isRepeatFrequency } from '../core/recurrence';
import { nowISO, formatDate } from '../utils/formatters';

// ─── Export ──────────────────────────────────────────────────────────

/**
 * Build a BackupData object and return it as a JSON string.
 */
export function exportAsJSON(db: SQLite.SQLiteDatabase): string {
  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: nowISO(),
    expenses: getAllExpenses(db),
    categories: getAllCategories(db),
    budgets: getAllBudgets(db),
    recurringExpenses: getRecurringExpenses(db),
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Build a CSV string containing all expenses.
 * Columns: date, amount, category, note
 */
export function exportAsCSV(db: SQLite.SQLiteDatabase): string {
  const expenses = getAllExpenses(db);
  const categories = getAllCategories(db);

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
  }

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines: string[] = ['Date,Amount,Category,Note'];

  for (const exp of expenses) {
    const amount = (exp.amountCents / 100).toFixed(2);
    const categoryName = categoryMap.get(exp.categoryId) ?? 'Unknown';
    const note = exp.note ?? '';
    lines.push(
      `${exp.date},${amount},${escapeCSV(categoryName)},${escapeCSV(note)}`,
    );
  }

  return lines.join('\n');
}

/**
 * Export JSON to a temp file and open the system share sheet.
 */
export async function shareBackupJSON(db: SQLite.SQLiteDatabase): Promise<void> {
  const json = exportAsJSON(db);
  const fileName = `expense-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Export Expense Backup',
  });
}

/**
 * Export CSV to a temp file and open the system share sheet.
 */
export async function shareBackupCSV(db: SQLite.SQLiteDatabase): Promise<void> {
  const csv = exportAsCSV(db);
  const fileName = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Expenses CSV',
  });
}

// ─── Import ──────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that an unknown value conforms to the BackupData shape.
 */
export function validateBackup(data: unknown): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Backup data must be a JSON object.' };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number') {
    return { valid: false, error: 'Missing or invalid "version" field.' };
  }

  if (obj.version > BACKUP_VERSION) {
    return {
      valid: false,
      error: `Backup version ${obj.version} is newer than supported version ${BACKUP_VERSION}.`,
    };
  }

  if (!Array.isArray(obj.expenses)) {
    return { valid: false, error: 'Missing or invalid "expenses" array.' };
  }

  if (!Array.isArray(obj.categories)) {
    return { valid: false, error: 'Missing or invalid "categories" array.' };
  }

  if (!Array.isArray(obj.budgets)) {
    return { valid: false, error: 'Missing or invalid "budgets" array.' };
  }

  if (obj.version >= 2 || obj.recurringExpenses !== undefined) {
    if (!Array.isArray(obj.recurringExpenses) || obj.recurringExpenses.some((entry: unknown) => {
      if (!isRepeatFrequency(entry)) return true;
      const rule = entry as unknown as Record<string, unknown>;
      return typeof rule.id !== 'string' || !rule.id
        || typeof rule.categoryId !== 'string'
        || typeof rule.amountCents !== 'number' || !Number.isSafeInteger(rule.amountCents)
        || rule.amountCents <= 0
        || !isCalendarDate(rule.date) || !isCalendarDate(rule.nextDate)
        || rule.nextDate < rule.date
        || (rule.note !== null && typeof rule.note !== 'string');
    })) {
      return { valid: false, error: 'Recurring expenses have invalid structure.' };
    }
  }

  // Spot-check a few required fields in first entries
  if (obj.expenses.length > 0) {
    const first = obj.expenses[0] as Record<string, unknown>;
    if (typeof first.id !== 'string' || typeof first.amountCents !== 'number') {
      return { valid: false, error: 'Expense entries have invalid structure.' };
    }
  }

  if (obj.categories.length > 0) {
    const first = obj.categories[0] as Record<string, unknown>;
    if (typeof first.id !== 'string' || typeof first.name !== 'string') {
      return { valid: false, error: 'Category entries have invalid structure.' };
    }
  }

  return { valid: true };
}

/**
 * Parse and import a JSON backup string into the database.
 * Returns a ValidationResult indicating success or reason for failure.
 */
export function importFromJSON(
  db: SQLite.SQLiteDatabase,
  jsonString: string,
): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, error: 'Invalid JSON format.' };
  }

  const validation = validateBackup(parsed);
  if (!validation.valid) {
    return validation;
  }

  importBackupData(db, parsed as BackupData);
  return { valid: true };
}

/**
 * Open a document picker, read the selected JSON file, and import it.
 * Returns a ValidationResult or null if the user cancelled.
 */
export async function pickAndImportBackup(
  db: SQLite.SQLiteDatabase,
): Promise<ValidationResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  const contents = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return importFromJSON(db, contents);
}
