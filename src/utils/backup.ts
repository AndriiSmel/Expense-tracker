/**
 * Backup export / import utilities.
 *
 * Uses expo-file-system, expo-sharing, and expo-document-picker.
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BackupData,
} from '../core/types';
import { BACKUP_VERSION } from '../core/constants';
import {
  getAllExpenses,
  getAllCategories,
  getAllBudgets,
  getRecurringExpenses,
} from '../core/database';
import { isCalendarDate, isRepeatFrequency } from '../core/recurrence';
import { nowISO } from '../utils/formatters';

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
const LAST_BACKUP_KEY = 'expense-tracker:last-json-backup';

export function getLastBackupDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_BACKUP_KEY);
}

export async function shareBackupJSON(
  db: SQLite.SQLiteDatabase,
  onPrepared: (date: string) => void,
): Promise<void> {
  const json = exportAsJSON(db);
  const fileName = `expense-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const preparedAt = nowISO();
  await AsyncStorage.setItem(LAST_BACKUP_KEY, preparedAt).catch(() => {});
  onPrepared(preparedAt);

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

  if (typeof obj.version !== 'number' || !Number.isInteger(obj.version) || obj.version < 1) {
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

  if (!isTimestamp(obj.exportedAt)) {
    return { valid: false, error: 'The backup has an invalid export date.' };
  }

  const categoryIds = new Set<string>();
  for (const entry of obj.categories) {
    if (!isRecord(entry) || !isNonEmptyString(entry.id) || categoryIds.has(entry.id)
      || !isNonEmptyString(entry.name) || !isNonEmptyString(entry.icon)
      || typeof entry.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(entry.color)
      || !Number.isSafeInteger(entry.sortOrder) || typeof entry.isArchived !== 'boolean'
      || (entry.isDeleted !== undefined && (entry.isDeleted !== true || !entry.isArchived))
      || (entry.monthlyLimitCents != null && !isPositiveCents(entry.monthlyLimitCents))
      || !hasTimestamps(entry)) {
      return { valid: false, error: 'The backup contains an invalid or duplicate category.' };
    }
    categoryIds.add(entry.id);
  }

  const expenseIds = new Set<string>();
  for (const entry of obj.expenses) {
    if (!isRecord(entry) || !isNonEmptyString(entry.id) || expenseIds.has(entry.id)
      || !isNonEmptyString(entry.categoryId) || !categoryIds.has(entry.categoryId)
      || !isPositiveCents(entry.amountCents) || !isCalendarDate(entry.date)
      || (entry.note !== null && typeof entry.note !== 'string') || !hasTimestamps(entry)) {
      return { valid: false, error: 'The backup contains an invalid expense, duplicate ID, or missing category.' };
    }
    expenseIds.add(entry.id);
  }

  const budgetMonths = new Set<string>();
  for (const entry of obj.budgets) {
    if (!isRecord(entry) || typeof entry.monthKey !== 'string'
      || !/^\d{4}-(0[1-9]|1[0-2])$/.test(entry.monthKey) || budgetMonths.has(entry.monthKey)
      || typeof entry.budgetCents !== 'number' || !Number.isSafeInteger(entry.budgetCents)
      || entry.budgetCents < 0 || !hasTimestamps(entry)) {
      return { valid: false, error: 'The backup contains an invalid or duplicate monthly budget.' };
    }
    budgetMonths.add(entry.monthKey);
  }

  const recurringIds = new Set<string>();
  for (const rule of (obj.recurringExpenses ?? []) as NonNullable<BackupData['recurringExpenses']>) {
    if (recurringIds.has(rule.id) || !categoryIds.has(rule.categoryId)) {
      return { valid: false, error: 'The backup contains a duplicate schedule or a schedule with a missing category.' };
    }
    recurringIds.add(rule.id);
  }

  return { valid: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveCents(value: unknown): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isTimestamp(value: unknown): boolean {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function hasTimestamps(entry: Record<string, unknown>): boolean {
  return isTimestamp(entry.createdAt) && isTimestamp(entry.updatedAt);
}

export async function pickBackup(): Promise<{ name: string; data: BackupData } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const contents = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  const validation = validateBackup(parsed);
  if (!validation.valid) throw new Error(validation.error);

  return { name: asset.name, data: parsed as BackupData };
}
