import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, CategorySpending } from '../core/types';
import { nunito, typography, spacing, radius } from '../theme/theme';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { usePreferences } from '../hooks/usePreferences';
import DonutChart from './DonutChart';

interface CategoryLegendProps {
  colors: ThemeColors;
  data: CategorySpending[];
  totalCents: number;
  previousSpentCents: number;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryLegend({
  colors,
  data,
  totalCents,
  previousSpentCents,
  selectedCategoryId,
  onSelectCategory,
}: CategoryLegendProps) {
  const { currency } = usePreferences();
  const { width, fontScale } = useWindowDimensions();
  const stack = width / fontScale < 370;
  const difference = totalCents - previousSpentCents;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>Spending by category</Text>
        <View style={[styles.breakdown, stack && styles.stacked]}>
          <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden pointerEvents="none">
            <DonutChart colors={colors} data={data} totalCents={totalCents} selectedCategoryId={selectedCategoryId} onSelectCategory={onSelectCategory} size={144} />
          </View>
          <View style={styles.legend}>
            {data.map((item) => {
              const selected = item.category.id === selectedCategoryId;
              return (
                <TouchableOpacity
                  key={item.category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityHint="Opens expenses in this category"
                  onPress={() => onSelectCategory(selected ? null : item.category.id)}
                  style={[styles.row, selected && { backgroundColor: colors.primaryLight }]}
                >
                  <View style={[styles.dot, { backgroundColor: item.category.color }]} />
                  <Text style={[styles.name, { color: colors.text }]}>{item.category.name}</Text>
                  <Text style={[styles.percentage, { color: colors.text }]}>{formatPercentage(item.percentage)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.insights}>
        <View style={[styles.insight, { backgroundColor: colors.surface }]}>
          <View style={[styles.insightIcon, { backgroundColor: colors.background }]}>
            <MaterialCommunityIcons name="star-circle" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.insightValue, { color: colors.text }]}>{data[0].category.name}</Text>
          <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Top category</Text>
        </View>
        {previousSpentCents > 0 && (
          <View style={[styles.insight, { backgroundColor: colors.surface }]}>
            <View style={[styles.insightIcon, { backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name={difference > 0 ? 'trending-up' : difference < 0 ? 'trending-down' : 'minus'} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.insightValue, { color: colors.text }]}>
              {difference > 0 ? '+' : ''}{formatCurrency(difference, currency)}
            </Text>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>vs last month</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.lg },
  card: { padding: spacing.xl, borderRadius: 28, gap: spacing.md },
  heading: { ...typography.titleMedium, ...nunito.black },
  breakdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  legend: { flexGrow: 1, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: spacing.sm, borderRadius: radius.sm },
  dot: { width: 9, height: 9, borderRadius: radius.full },
  name: { ...typography.bodySmall, ...nunito.semibold, flex: 1 },
  percentage: { ...typography.bodySmall, ...nunito.black, fontVariant: ['tabular-nums'] },
  insights: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  insight: { flexBasis: 125, flexGrow: 1, padding: spacing.lg, borderRadius: 28, gap: spacing.xs },
  insightIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  insightValue: { ...typography.titleMedium, ...nunito.black },
  insightLabel: { ...typography.caption, ...nunito.bold, textTransform: 'uppercase' },
});
