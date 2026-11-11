import React, { createContext, useContext, useState } from 'react';
import { CurrencyCode } from '../core/constants';
import { getPreferences, setCurrency, setDefaultBudget } from '../core/database';
import { useDB } from './useDatabase';

interface PreferencesContextValue {
  defaultBudgetCents: number;
  currency: CurrencyCode;
  saveDefaultBudget: (cents: number) => void;
  saveCurrency: (currency: CurrencyCode) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const db = useDB();
  const [preferences, setPreferences] = useState(() => getPreferences(db));

  const saveDefaultBudget = (cents: number) => {
    setDefaultBudget(db, cents);
    setPreferences((current) => ({ ...current, defaultBudgetCents: cents }));
  };

  const saveCurrency = (currency: CurrencyCode) => {
    setCurrency(db, currency);
    setPreferences((current) => ({ ...current, currency }));
  };

  return React.createElement(
    PreferencesContext.Provider,
    { value: { ...preferences, saveDefaultBudget, saveCurrency } },
    children,
  );
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) {
    throw new Error('usePreferences must be used within a <PreferencesProvider>');
  }
  return preferences;
}
