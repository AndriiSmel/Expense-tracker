import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, SectionList, type SectionListRenderItem, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, ExpenseWithCategory } from '../core/types';
import { nunito, typography, spacing, radius } from '../theme/theme';
import { formatDate, formatDateShort } from '../utils/formatters';
import ExpenseItem from './ExpenseItem';
import EmptyState from './EmptyState';

interface ExpenseListProps {
  colors: ThemeColors;
  search: string;
  onSearchChange: (value: string) => void;
  searchAllMonths: boolean;
  onToggleSearchScope: () => void;
  expenses: ExpenseWithCategory[];
  onRepeatExpense: (expense: ExpenseWithCategory) => void;
  onPressExpense: (expense: ExpenseWithCategory) => void;
  selectedCategoryId: string | null;
  onClearFilter?: () => void;
  onSeeAll?: () => void;
  header: React.ReactNode;
  contentContainerStyle: StyleProp<ViewStyle>;
}

export default function ExpenseList({
  colors,
  search,
  onSearchChange,
  searchAllMonths,
  onToggleSearchScope,
  expenses,
  onPressExpense,
  onRepeatExpense,
  selectedCategoryId,
  onClearFilter,
  onSeeAll,
  header,
  contentContainerStyle,
}: ExpenseListProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const hasQuery = search.trim().length > 0;
  const filtered = useMemo(() => selectedCategoryId
    ? expenses.filter((e) => e.categoryId === selectedCategoryId)
    : expenses, [expenses, selectedCategoryId]);

  const sections = useMemo(() => {
    const byDate = new Map<string, ExpenseWithCategory[]>();
    for (const expense of filtered) {
      const group = byDate.get(expense.date);
      if (group) group.push(expense);
      else byDate.set(expense.date, [expense]);
    }
    return Array.from(byDate, ([key, data]) => ({ key, data }));
  }, [filtered]);
  const renderExpense = useCallback<SectionListRenderItem<ExpenseWithCategory>>(({ item, index, section }) => (
    <ExpenseItem
      colors={colors}
      expense={item}
      onPress={onPressExpense}
      onRepeat={onRepeatExpense}
      preview={Boolean(onSeeAll)}
      firstInGroup={index === 0}
      lastInGroup={index === section.data.length - 1}
    />
  ), [colors, onPressExpense, onRepeatExpense, onSeeAll]);

  const selectedCategoryName = selectedCategoryId
    ? expenses.find((e) => e.categoryId === selectedCategoryId)?.category.name ?? 'Filtered'
    : null;

  return (
    <SectionList
      sections={sections}
      style={styles.list}
      contentContainerStyle={contentContainerStyle}
      keyExtractor={(expense) => expense.id}
      renderItem={renderExpense}
      renderSectionHeader={({ section }) => onSeeAll ? null : (
        <Text accessibilityRole="header" style={[styles.date, { color: colors.textSecondary }]}>
          {hasQuery && searchAllMonths ? formatDate(section.key) : formatDateShort(section.key)}
        </Text>
      )}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <>
          {header}
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
                {onSeeAll ? 'Recent expenses' : selectedCategoryName ?? 'Expense history'}
              </Text>
              {onSeeAll ? (
                <TouchableOpacity accessibilityRole="button" onPress={onSeeAll} style={styles.searchToggle}>
                  <Text style={[styles.clearButtonText, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              ) : selectedCategoryId && onClearFilter ? (
                <TouchableOpacity
                  onPress={onClearFilter}
                  accessibilityRole="button"
                  style={[styles.clearButton, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Text style={[styles.clearButtonText, { color: colors.text }]}>Show all</Text>
                  <MaterialCommunityIcons name="close-circle-outline" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.countText, { color: colors.textSecondary }]}>
                  {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
                </Text>
              )}
            </View>
            {!onSeeAll && <View style={[styles.searchBar, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
              <MaterialCommunityIcons name="magnify" size={21} color={colors.textSecondary} />
              <TextInput
                accessibilityLabel="Search expenses"
                placeholder="Search expenses"
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
                value={search}
                onChangeText={onSearchChange}
                returnKeyType="search"
              />
              {!!search && (
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear expense search" onPress={() => onSearchChange('')} style={styles.searchToggle}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>}
            {!onSeeAll && (searchOpen || !!search) && (
              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityLabel="Search all months"
                accessibilityState={{ checked: searchAllMonths }}
                onPress={onToggleSearchScope}
                style={[styles.searchToggle, styles.scope, { backgroundColor: searchAllMonths ? colors.primaryLight : colors.surface }]}
              >
                <Text style={[nunito.regular, { color: colors.text }]}>{searchAllMonths ? 'All months ✓' : 'All months'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      }
      ListEmptyComponent={
        <EmptyState
          colors={colors}
          icon={selectedCategoryId ? 'filter-remove-outline' : 'receipt'}
          title={hasQuery ? 'No matching expenses' : selectedCategoryId ? 'No expenses in this category' : 'No expenses this month'}
          message={
            hasQuery ? 'Try another search or change the filters.' : selectedCategoryId
              ? 'Tap "Show all" to see all expenses.'
              : 'Tap + to log your first expense.'
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.titleMedium,
    flexShrink: 1,
  },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md, marginBottom: spacing.sm },
  searchInput: { ...nunito.regular, flex: 1, minHeight: 44, paddingHorizontal: spacing.sm },
  scope: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  searchToggle: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.md },
  countText: {
    ...typography.caption,
  },
  clearButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  clearButtonText: {
    ...typography.caption,
    ...nunito.semibold,
  },
  date: {
    ...typography.bodySmall,
    ...nunito.semibold,
    marginHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});
