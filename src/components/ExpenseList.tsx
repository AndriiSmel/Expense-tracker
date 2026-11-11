import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, ExpenseWithCategory } from '../core/types';
import { typography, spacing, radius } from '../theme/theme';
import ExpenseItem from './ExpenseItem';
import EmptyState from './EmptyState';

interface ExpenseListProps {
  colors: ThemeColors;
  expenses: ExpenseWithCategory[];
  onPressExpense: (expense: ExpenseWithCategory) => void;
  selectedCategoryId: string | null;
  onClearFilter?: () => void;
}

export default function ExpenseList({
  colors,
  expenses,
  onPressExpense,
  selectedCategoryId,
  onClearFilter,
}: ExpenseListProps) {
  const filtered = selectedCategoryId
    ? expenses.filter((e) => e.categoryId === selectedCategoryId)
    : expenses;

  const selectedCategoryName = selectedCategoryId
    ? expenses.find((e) => e.categoryId === selectedCategoryId)?.category.name ?? 'Filtered'
    : null;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {selectedCategoryName ? `${selectedCategoryName} Expenses` : 'Recent Expenses'}
        </Text>
        {selectedCategoryId && onClearFilter ? (
          <TouchableOpacity
            onPress={onClearFilter}
            style={[styles.clearButton, { backgroundColor: colors.surfaceSecondary }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.clearButtonText, { color: colors.primary }]}>Show all</Text>
            <MaterialCommunityIcons name="close-circle-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.countText, { color: colors.textTertiary }]}>
            {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
          </Text>
        )}
      </View>

      {/* Expense Items or Empty State */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            colors={colors}
            icon={selectedCategoryId ? 'filter-remove-outline' : 'receipt'}
            title={selectedCategoryId ? 'No expenses in this category' : 'No expenses this month'}
            message={
              selectedCategoryId
                ? 'Tap "Show all" to see all expenses.'
                : 'Tap the + button below to log your first expense.'
            }
          />
        </View>
      ) : (
        <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
          {filtered.map((expense, index) => (
            <React.Fragment key={expense.id}>
              <ExpenseItem
                colors={colors}
                expense={expense}
                onPress={onPressExpense}
              />
              {index < filtered.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingBottom: spacing['4xl'], // Room above FAB
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.titleMedium,
  },
  countText: {
    ...typography.caption,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  clearButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  listCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56 + spacing.md, // indent past icon
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
  },
});
