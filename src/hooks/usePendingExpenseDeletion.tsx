import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { deleteExpenses, getBackupRevision, subscribeToLocalChanges } from '../core/database';
import { useDB } from './useDatabase';

type PendingDeletion = { ids: string[]; expiresAt: number; backupRevision: number };
const noPendingDeletes: string[] = [];

const PendingExpenseDeletionContext = createContext<{
  pendingDeletes: string[];
  queueDelete: (id: string) => void;
  undoDelete: () => void;
} | null>(null);

export function PendingExpenseDeletionProvider({ children }: { children: React.ReactNode }) {
  const db = useDB();
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const revision = getBackupRevision(db);
  const queueDelete = useCallback((id: string) => {
    const backupRevision = getBackupRevision(db);
    setPending((current) => ({
      ids: current?.backupRevision === backupRevision ? [...current.ids, id] : [id],
      expiresAt: Date.now() + 6000,
      backupRevision,
    }));
  }, [db]);

  useEffect(() => subscribeToLocalChanges(db, () => {
    setPending((current) => current?.backupRevision === getBackupRevision(db) ? current : null);
  }), [db]);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      try {
        if (pending.backupRevision === getBackupRevision(db)) deleteExpenses(db, pending.ids);
      } catch {
        Alert.alert('Could not delete expenses', 'Please try again.');
      }
      setPending((current) => current === pending ? null : current);
    }, Math.max(0, pending.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [db, pending]);

  return (
    <PendingExpenseDeletionContext.Provider value={{
      pendingDeletes: pending?.backupRevision === revision ? pending.ids : noPendingDeletes,
      queueDelete,
      undoDelete: () => setPending(null),
    }}>
      {children}
    </PendingExpenseDeletionContext.Provider>
  );
}

export function usePendingExpenseDeletion() {
  const context = useContext(PendingExpenseDeletionContext);
  if (!context) throw new Error('PendingExpenseDeletionProvider is required.');
  return context;
}
