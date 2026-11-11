import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../src/hooks/useAppTheme';
import { useExpenses } from '../src/hooks/useExpenses';
import { useBudget } from '../src/hooks/useBudget';
import { useCategories } from '../src/hooks/useCategories';
import { useMonthSummary } from '../src/hooks/useMonthSummary';

import {
  ExpenseWithCategory,
  ExpenseInput,
} from '../src/core/types';
import { getCurrentMonthKey } from '../src/utils/formatters';
import { DEFAULT_BUDGET_CENTS } from '../src/core/constants';

import Header from '../src/components/Header';
import MonthSelector from '../src/components/MonthSelector';
import BudgetCard from '../src/components/BudgetCard';
import BudgetEditModal from '../src/components/BudgetEditModal';
import DonutChart from '../src/components/DonutChart';
import CategoryLegend from '../src/components/CategoryLegend';
import ExpenseList from '../src/components/ExpenseList';
import FAB from '../src/components/FAB';
import ExpenseBottomSheet from '../src/components/ExpenseBottomSheet';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modals / Sheet state
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [expenseSheetVisible, setExpenseSheetVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);

  // Data hooks
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh: refreshExpenses,
  } = useExpenses(selectedMonth);

  const {
    budget,
    setBudget,
    refresh: refreshBudget,
  } = useBudget(selectedMonth);

  const {
    activeCategories,
    refresh: refreshCategories,
  } = useCategories();

  const {
    summary,
    refresh: refreshSummary,
  } = useMonthSummary(selectedMonth);

  // Auto-refresh when dashboard is focused (e.g. returning from Settings)
  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshBudget();
      refreshCategories();
      refreshSummary();
    }, [refreshExpenses, refreshBudget, refreshCategories, refreshSummary]),
  );

  // Month change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setSelectedCategoryId(null); // Clear category filter when changing month
  };

  // Budget management
  const currentBudgetCents = budget ? budget.budgetCents : DEFAULT_BUDGET_CENTS;

  const handleSaveBudget = (newBudgetCents: number) => {
    setBudget(newBudgetCents);
    refreshSummary();
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
    setEditingExpense(expense);
    setExpenseSheetVisible(true);
  };

  // Close Sheet
  const handleCloseSheet = () => {
    setExpenseSheetVisible(false);
    setEditingExpense(null);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = (input: ExpenseInput) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, input);
    } else {
      addExpense(input);
    }
    refreshSummary();
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    refreshSummary();
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore
    }
  };

  // Category filter toggle
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const spentCents = summary ? summary.totalSpentCents : 0;
  const breakdown = summary ? summary.categoryBreakdown : [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Header
          colors={colors}
          onSettingsPress={() => router.push('/settings')}
        />

        {/* Scrollable Dashboard Body */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Month Selector */}
          <MonthSelector
            colors={colors}
            monthKey={selectedMonth}
            onChangeMonth={handleMonthChange}
          />

          {/* Monthly Budget Card */}
          <BudgetCard
            colors={colors}
            budgetCents={currentBudgetCents}
            spentCents={spentCents}
            onEditPress={() => setBudgetModalVisible(true)}
          />

          {/* Expense Breakdown Donut Chart */}
          <View style={styles.chartWrapper}>
            <DonutChart
              colors={colors}
              data={breakdown}
              totalCents={spentCents}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              size={210}
            />
          </View>

          {/* Category Breakdown Legend */}
          {breakdown.length > 0 && (
            <CategoryLegend
              colors={colors}
              data={breakdown}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {/* Recent Expenses List */}
          <ExpenseList
            colors={colors}
            expenses={expenses}
            onPressExpense={handleOpenEditExpense}
            selectedCategoryId={selectedCategoryId}
            onClearFilter={() => setSelectedCategoryId(null)}
          />
        </ScrollView>

        {/* Floating Action Button */}
        <FAB colors={colors} onPress={handleOpenAddExpense} />

        {/* Budget Edit Modal */}
        <BudgetEditModal
          colors={colors}
          visible={budgetModalVisible}
          currentBudgetCents={currentBudgetCents}
          onSave={handleSaveBudget}
          onClose={() => setBudgetModalVisible(false)}
        />

        {/* Expense Add/Edit Bottom Sheet */}
        <ExpenseBottomSheet
          colors={colors}
          visible={expenseSheetVisible}
          expense={editingExpense}
          categories={activeCategories}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          onClose={handleCloseSheet}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for FAB
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
});
