/**
 * React hook + context for database initialization.
 *
 * Wrap your app in <DatabaseProvider> and consume with useDB().
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../core/constants';
import { initDatabase, recordDueRecurringExpenses } from '../core/database';

// ─── Context ─────────────────────────────────────────────────────────

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

// ─── Hook: useDatabase (internal) ────────────────────────────────────

export interface UseDatabaseResult {
  db: SQLite.SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

/**
 * Low-level hook that opens the database and runs migrations.
 * Prefer the DatabaseProvider + useDB() pattern instead.
 */
export function useDatabase(): UseDatabaseResult {
  const [db] = useState<SQLite.SQLiteDatabase>(() =>
    SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }),
  );
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      initDatabase(db);
      recordDueRecurringExpenses(db);
      setIsReady(true);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [db]);

  return { db, isReady, error };
}

// ─── Provider ────────────────────────────────────────────────────────

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement | null {
  const { db, isReady, error } = useDatabase();

  const value = useMemo(
    () => (db ? { db, isReady } : null),
    [db, isReady],
  );

  if (error) {
    // Let the consumer decide how to render errors.
    // A production app would show an error boundary here.
    throw error;
  }

  if (!value || !isReady) {
    return null; // or a splash / loading indicator
  }

  return React.createElement(DatabaseContext.Provider, { value }, children);
}

// ─── Consumer Hook ───────────────────────────────────────────────────

/**
 * Access the initialized database from any component inside <DatabaseProvider>.
 */
export function useDB(): SQLite.SQLiteDatabase {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDB must be used within a <DatabaseProvider>');
  }
  return ctx.db;
}
