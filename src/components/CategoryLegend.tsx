import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, CategorySpending } from '../core/types';
import { typography, spacing, radius } from '../theme/theme';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface CategoryLegendProps {
  colors: ThemeColors;
  data: CategorySpending[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryLegend({
  colors,
  data,
  selectedCategoryId,
  onSelectCategory,
}: CategoryLegendProps) {
  return (
    <View style={styles.container}>
      {data
        .filter((item) => item.totalCents > 0)
        .map((item) => {
          const isSelected = selectedCategoryId === item.category.id;
          return (
            <TouchableOpacity
              key={item.category.id}
              onPress={() =>
                onSelectCategory(isSelected ? null : item.category.id)
              }
              activeOpacity={0.7}
              style={[
                styles.row,
                {
                  backgroundColor: isSelected
                    ? item.category.color + '18'
                    : 'transparent',
                  borderRadius: radius.sm,
                },
              ]}
            >
              <View style={styles.leftSection}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: item.category.color + '22' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.category.icon as any}
                    size={16}
                    color={item.category.color}
                  />
                </View>
                <Text
                  style={[styles.name, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.category.name}
                </Text>
              </View>
              <View style={styles.rightSection}>
                <Text style={[styles.amount, { color: colors.text }]}>
                  {formatCurrency(item.totalCents)}
                </Text>
                <Text style={[styles.percentage, { color: colors.textSecondary }]}>
                  {formatPercentage(item.percentage)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  name: {
    ...typography.body,
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.body,
    fontWeight: '600',
  },
  percentage: {
    ...typography.caption,
  },
});
