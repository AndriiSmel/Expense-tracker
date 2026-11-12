import type { SQLiteDatabase } from 'expo-sqlite';
import type { BackupData, Expense, Category, MonthlyBudget, RecurringExpense } from '../core/types';
import { getAllBudgets, getAllCategories, getAllExpenses, getRecurringExpenses, replaceBackupRows } from '../core/database';
import { BACKUP_VERSION, DEFAULT_CATEGORIES } from '../core/constants';
import { validateBackup } from '../utils/backup';

type Row = Expense | Category | MonthlyBudget | RecurringExpense;
type Table = 'expenses' | 'categories' | 'budgets' | 'recurringExpenses';
export type Change = { table: Table; id: string; clock: number; device: string; value: Row | null };
type State = { rows: Change[]; pending: Change[]; seen: string[]; categoryLimits?: Change[] };
export type SyncFile = { id: string; name: string };
const tables: Table[] = ['expenses', 'categories', 'budgets', 'recurringExpenses'];

function rowId(row: Row): string {
  return 'id' in row ? row.id : row.monthKey;
}

function changeKey(change: Pick<Change, 'table' | 'id'>): string {
  return JSON.stringify([change.table, change.id]);
}

function compare(a: Change, b: Change): number {
  if (a.table === 'categories') {
    const aDeleted = (a.value as Category | null)?.isDeleted === true;
    const bDeleted = (b.value as Category | null)?.isDeleted === true;
    if (aDeleted !== bDeleted) return aDeleted ? 1 : -1;
  }
  // A stopped schedule and a deleted generated occurrence stay deleted even
  // if another offline device advances or regenerates the same occurrence.
  if ((a.table === 'recurringExpenses' || (a.table === 'expenses' && a.id.startsWith('repeat:')))
    && (a.value === null) !== (b.value === null)) {
    return a.value === null ? 1 : -1;
  }
  if (a.table === 'recurringExpenses' && a.value && b.value) {
    const aDate = (a.value as RecurringExpense).nextDate;
    const bDate = (b.value as RecurringExpense).nextDate;
    if (aDate !== bDate) return aDate > bDate ? 1 : -1;
  }
  return a.clock - b.clock || (a.device > b.device ? 1 : a.device < b.device ? -1 : 0);
}

export function readSyncState(db: SQLiteDatabase, scope: string): State {
  db.execSync('CREATE TABLE IF NOT EXISTS drive_sync (scope TEXT PRIMARY KEY, state TEXT NOT NULL)');
  const row = db.getFirstSync<{ state: string }>('SELECT state FROM drive_sync WHERE scope = ?', scope);
  return row ? JSON.parse(row.state) : { rows: [], pending: [], seen: [] };
}

function writeState(db: SQLiteDatabase, scope: string, state: State) {
  db.runSync('INSERT OR REPLACE INTO drive_sync (scope, state) VALUES (?, ?)', scope, JSON.stringify(state));
}

export function parseBatch(text: string): Change[] {
  const batch = JSON.parse(text);
  if (batch?.version !== 1 || !Array.isArray(batch.changes)) throw new Error('Unsupported sync file.');
  for (const change of batch.changes) {
    if (!change || !tables.includes(change.table) || typeof change.id !== 'string' || !change.id
      || !Number.isSafeInteger(change.clock) || change.clock < 1
      || typeof change.device !== 'string' || !change.device
      || (change.value !== null && (typeof change.value !== 'object' || !change.value
        || rowId(change.value) !== change.id))) {
      throw new Error('A Drive sync file contains invalid changes.');
    }
  }
  return batch.changes;
}

export function mergeSync(
  db: SQLiteDatabase,
  scope: string,
  device: string,
  downloaded: { id: string; changes: Change[] }[],
): { pending: Change[]; changed: boolean } {
  const state = readSyncState(db, scope);
  const local = {
    expenses: getAllExpenses(db),
    categories: getAllCategories(db),
    budgets: getAllBudgets(db),
    recurringExpenses: getRecurringExpenses(db),
  };
  const before = new Map(state.rows.map((row) => [changeKey(row), row]));
  const winners = new Map(before);
  const queued = new Map(state.pending.map((row) => [changeKey(row), row]));
  // Legacy category edits omit the limit, so retain the explicit limit edit's clock separately.
  const limits = new Map((state.categoryLimits ?? state.rows.filter((row) =>
    row.table === 'categories' && (row.value as Category | null)?.monthlyLimitCents !== undefined,
  )).map((row) => [changeKey(row), row]));
  let clock = state.rows.reduce((highest, row) => Math.max(highest, row.clock), 0);
  const accept = (candidate: Change) => {
    const key = changeKey(candidate);
    const limit = limits.get(key);
    if (candidate.table === 'categories' && (candidate.value as Category | null)?.monthlyLimitCents !== undefined
      && (!limit || compare(candidate, limit) > 0)) {
      limits.set(key, candidate);
    }
    const current = winners.get(key);
    if (!current) {
      winners.set(key, candidate);
      return;
    }
    if (compare(candidate, current) > 0) winners.set(key, candidate);
  };
  const remoteCategories = new Set(downloaded.flatMap((file) =>
    file.changes.filter((change) => change.table === 'categories').map((change) => change.id),
  ));
  const defaultCategories = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));
  const currentKeys = new Set<string>();
  const localChanges: Pick<Change, 'table' | 'id' | 'value'>[] = [];
  for (const table of tables) {
    for (const value of local[table]) {
      const id = rowId(value);
      const key = changeKey({ table, id });
      currentKeys.add(key);
      const seeded = defaultCategories.get(id);
      if (table === 'categories' && !before.has(key) && remoteCategories.has(id)
        && seeded && 'isArchived' in value && !value.isArchived
        && value.monthlyLimitCents === undefined
        && value.name === seeded.name && value.icon === seeded.icon && value.color === seeded.color) continue;
      if (JSON.stringify(value) !== JSON.stringify(before.get(key)?.value)) {
        localChanges.push({ table, id, value });
      }
    }
  }
  for (const [key, old] of before) {
    if (!old.value || currentKeys.has(key)) continue;
    // Keep category references valid when a backup removes a category used by
    // an expense from another device.
    const value = old.table === 'categories'
      ? { ...(old.value as Category), isArchived: true }
      : null;
    localChanges.push({ table: old.table, id: old.id, value });
  }

  // Stamp local changes against the last known state, so changes made offline
  // compete deterministically with changes discovered in this download.
  for (const change of localChanges) {
    const next = { ...change, device, clock: ++clock };
    accept(next);
    queued.set(changeKey(next), next);
  }
  for (const file of downloaded) {
    for (const change of file.changes) accept(change);
  }

  const rows = [...winners].map(([key, winner]) => {
    const limit = (limits.get(key)?.value as Category | undefined)?.monthlyLimitCents;
    return winner.table === 'categories' && winner.value && limit !== undefined
      ? { ...winner, value: { ...winner.value, monthlyLimitCents: limit } }
      : winner;
  });
  const values = <T extends Row>(table: Table) =>
    rows.filter((row) => row.table === table && row.value !== null).map((row) => row.value as T);
  const data: BackupData = {
    version: BACKUP_VERSION, exportedAt: new Date().toISOString(),
    expenses: values<Expense>('expenses'), categories: values<Category>('categories'),
    budgets: values<MonthlyBudget>('budgets'), recurringExpenses: values<RecurringExpense>('recurringExpenses'),
  };
  const validation = validateBackup(data);
  if (!validation.valid) throw new Error(validation.error);
  const changed = tables.some((table) => {
    const merged = new Map(data[table]?.map((row) => [rowId(row), JSON.stringify(row)]));
    return merged.size !== local[table].length ||
      local[table].some((row) => merged.get(rowId(row)) !== JSON.stringify(row));
  });
  const pending = [...queued.values()].filter((row) => {
    const key = changeKey(row);
    return [winners.get(key), limits.get(key)].some((winner) => JSON.stringify(winner) === JSON.stringify(row));
  });
  db.withTransactionSync(() => {
    if (changed) replaceBackupRows(db, data);
    writeState(db, scope, { rows, pending, categoryLimits: [...limits.values()], seen: [...new Set([...state.seen, ...downloaded.map((file) => file.id)])] });
  });
  return { pending, changed };
}

export function markUploaded(db: SQLiteDatabase, scope: string, fileId: string) {
  const state = readSyncState(db, scope);
  writeState(db, scope, { ...state, pending: [], seen: [...state.seen, fileId] });
}
