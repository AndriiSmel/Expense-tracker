import { nunito } from '../src/theme/theme';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  AppState,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../src/hooks/useAppTheme';
import { useExpenses } from '../src/hooks/useExpenses';
import { useBudget } from '../src/hooks/useBudget';
import { useCategories } from '../src/hooks/useCategories';
import { usePreferences } from '../src/hooks/usePreferences';
import { useDriveSync } from '../src/hooks/useDriveSync';
import { usePendingExpenseDeletion } from '../src/hooks/usePendingExpenseDeletion';
import { useDB } from '../src/hooks/useDatabase';
import { calculateCategoryBreakdown, calculateMonthTotal } from '../src/core/calculations';
import { getExpenseHistory, getExpensesForMonth, recordDueRecurringExpenses, subscribeToLocalChanges } from '../src/core/database';

import {
  ExpenseWithCategory,
  ExpenseInput,
  RepeatFrequency,
} from '../src/core/types';
import { getCurrentMonthKey, getToday, shiftMonth } from '../src/utils/formatters';

import Header from '../src/components/Header';
import MonthSelector from '../src/components/MonthSelector';
import BudgetCard from '../src/components/BudgetCard';
import BudgetEditModal from '../src/components/BudgetEditModal';
import CategoryLegend from '../src/components/CategoryLegend';
import ExpenseList from '../src/components/ExpenseList';
import FAB from '../src/components/FAB';
import ExpenseBottomSheet from '../src/components/ExpenseBottomSheet';

export default function DashboardScreen() {
  return <ExpenseOverview />;
}

export function ExpenseOverview({ ledger = false }: { ledger?: boolean }) {
  const router = useRouter();
  const { month, category, expense: expenseParam } = useLocalSearchParams();
  const routeMonth = ledger && typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;
  const routeCategory = ledger && typeof category === 'string' && category ? category : null;
  const db = useDB();
  const { revision: driveRevision } = useDriveSync();
  const { colors } = useAppTheme();
  const { defaultBudgetCents } = usePreferences();

  // State
  const [dashboardMonth, setDashboardMonth] = useState(getCurrentMonthKey);
  const selectedMonth = ledger ? routeMonth ?? getCurrentMonthKey() : dashboardMonth;
  const selectedCategoryId = routeCategory;

  const { pendingDeletes, queueDelete, undoDelete } = usePendingExpenseDeletion();
  const [search, setSearch] = useState('');
  const [searchAllMonths, setSearchAllMonths] = useState(false);

  // Modals / Sheet state
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [expenseSheetVisible, setExpenseSheetVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);

  // Data hooks
  const {
    expenses,
    addExpense,
    updateExpense,
    refresh: refreshExpenses,
  } = useExpenses(selectedMonth);
  const routedExpense = ledger && typeof expenseParam === 'string' && expenseParam
    ? expenses.find((expense) => expense.id === expenseParam) ?? null
    : null;
  const displayedExpense = editingExpense ?? routedExpense;

  const {
    budget,
    setBudget,
    clearBudget,
    refresh: refreshBudget,
  } = useBudget(selectedMonth);

  const {
    activeCategories,
    categories,
    refresh: refreshCategories,
  } = useCategories();

  useEffect(() => subscribeToLocalChanges(db, refreshExpenses), [db, refreshExpenses]);

  // Auto-refresh when dashboard is focused (e.g. returning from Settings)
  useFocusEffect(
    useCallback(() => {
      const refreshDashboard = () => {
        recordDueRecurringExpenses(db);
        refreshExpenses();
        refreshBudget();
        refreshCategories();
      };
      refreshDashboard();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refreshDashboard();
      });
      return () => subscription.remove();
    }, [db, driveRevision, refreshExpenses, refreshBudget, refreshCategories]),
  );

  // Month change
  const handleMonthChange = (newMonth: string) => {
    if (ledger) router.setParams({ month: newMonth, category: '', expense: '' });
    else setDashboardMonth(newMonth);
  };

  // Budget management
  const currentBudgetCents = budget?.budgetCents ?? defaultBudgetCents;

  const handleSaveBudget = (newBudgetCents: number) => {
    setBudget(newBudgetCents);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }
  };

  // Open Add Sheet
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseSheetVisible(true);
  };

  // Open Edit Sheet
  const handleOpenEditExpense = (expense: ExpenseWithCategory) => {
    if (!ledger) {
      openLedger(undefined, expense.id);
      return;
    }
    setEditingExpense(expense);
    setExpenseSheetVisible(true);
  };

  // Close Sheet
  const handleCloseSheet = () => {
    setExpenseSheetVisible(false);
    setEditingExpense(null);
    if (routedExpense) router.setParams({ expense: '' });
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = (input: ExpenseInput, repeat?: RepeatFrequency) => {
    if (displayedExpense) {
      updateExpense(displayedExpense.id, input);
    } else {
      addExpense(input, repeat);
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }
  };

  // A manual repeat creates one independent expense, never a recurring rule.
  const handleRepeatExpense = (expense: ExpenseWithCategory) => {
    try {
      const today = getToday();
      addExpense({
        amountCents: expense.amountCents,
        categoryId: expense.categoryId,
        note: expense.note,
        date: today,
      });
      setSearch('');
      handleMonthChange(today.slice(0, 7));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      Alert.alert('Could not repeat expense', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const visibleExpenses = useMemo(
    () => expenses.filter((expense) => !pendingDeletes.includes(expense.id)),
    [expenses, pendingDeletes],
  );
  const spentCents = calculateMonthTotal(visibleExpenses);
  const breakdown = calculateCategoryBreakdown(visibleExpenses, categories);
  const previousSpentCents = ledger ? 0 : calculateMonthTotal(
    getExpensesForMonth(db, shiftMonth(selectedMonth, -1)).filter((expense) => !pendingDeletes.includes(expense.id)),
  );
  const openLedger = (categoryId?: string, expenseId?: string) => router.navigate({
    pathname: '/expenses',
    params: { month: selectedMonth, category: categoryId ?? '', expense: expenseId ?? '' },
  });
  const query = search.trim().toLocaleLowerCase();
  const useAllMonths = Boolean(query && searchAllMonths);
  const history = useMemo(
    () => useAllMonths ? getExpenseHistory(db) : expenses,
    [db, useAllMonths, expenses],
  );
  const historyResults = query
    ? history.filter((expense) => !pendingDeletes.includes(expense.id) &&
        [expense.note, expense.category.name].some((value) => value?.toLocaleLowerCase().includes(query)))
    : visibleExpenses;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Header
          colors={colors}
          title={ledger ? 'Expenses' : 'Hello'}
          subtitle={ledger ? undefined : new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          onSettingsPress={() => router.push('/settings')}
        />

        <ExpenseList
          colors={colors}
          expenses={ledger ? historyResults : visibleExpenses.slice(0, 3)}
          onSeeAll={ledger ? undefined : () => openLedger()}
          search={search}
          onSearchChange={setSearch}
          searchAllMonths={searchAllMonths}
          onToggleSearchScope={() => setSearchAllMonths((all) => !all)}
          onRepeatExpense={handleRepeatExpense}
          onPressExpense={handleOpenEditExpense}
          selectedCategoryId={selectedCategoryId}
          onClearFilter={() => router.setParams({ category: '' })}
          header={
            <>
              <MonthSelector colors={colors} monthKey={selectedMonth} onChangeMonth={handleMonthChange} />
              {!ledger && <BudgetCard
                colors={colors}
                budgetCents={currentBudgetCents}
                spentCents={spentCents}
                previousSpentCents={previousSpentCents}
                onEditPress={() => setBudgetModalVisible(true)}
              />}
              {!ledger && breakdown.length > 0 && (
                <CategoryLegend
                  colors={colors}
                  data={breakdown}
                  totalCents={spentCents}
                  previousSpentCents={previousSpentCents}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={(id) => { if (id) openLedger(id); }}
                />
              )}
            </>
          }
          contentContainerStyle={pendingDeletes.length > 0 ? styles.scrollContentWithUndo : styles.scrollContent}
        />

        {/* Floating Action Button */}
        <FAB onPress={handleOpenAddExpense} />

        {pendingDeletes.length > 0 && (
          <View style={[styles.undoBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityLiveRegion="polite" style={[styles.undoMessage, { color: colors.text }]}>
              {pendingDeletes.length === 1 ? 'Expense deleted' : `${pendingDeletes.length} expenses deleted`}
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={undoDelete} style={styles.undoAction}>
              <Text style={[styles.undoButton, { color: colors.text }]}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Budget Edit Modal */}
        <BudgetEditModal
          colors={colors}
          title="Edit Budget for This Month"
          visible={budgetModalVisible}
          currentBudgetCents={currentBudgetCents}
          onSave={handleSaveBudget}
          onUseDefault={budget ? () => {
            clearBudget();
          } : undefined}
          onClose={() => setBudgetModalVisible(false)}
        />

        {/* Expense Add/Edit Bottom Sheet */}
        {(expenseSheetVisible || routedExpense) && (
          <ExpenseBottomSheet
            colors={colors}
            expense={displayedExpense}
            categories={activeCategories}
            onSave={handleSaveExpense}
            onDelete={queueDelete}
            onClose={handleCloseSheet}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  scrollContentWithUndo: {
    paddingBottom: 160,
  },
  undoBar: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 20,
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoMessage: { ...nunito.regular, flex: 1 },
  undoAction: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  undoButton: { ...nunito.bold, paddingVertical: 8 },
});
