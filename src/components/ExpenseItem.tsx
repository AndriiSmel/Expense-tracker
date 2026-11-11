import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, ExpenseWithCategory } from '../core/types';
import { typography, spacing, radius } from '../theme/theme';
import { formatCurrency, formatDateShort } from '../utils/formatters';

interface ExpenseItemProps {
  colors: ThemeColors;
  expense: ExpenseWithCategory;
  onPress: (expense: ExpenseWithCategory) => void;
}

export default function ExpenseItem({ colors, expense, onPress }: ExpenseItemProps) {
  return (
    <Pressable
      onPress={() => onPress(expense)}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {/* Category icon */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: expense.category.color + '22' },
        ]}
      >
        <MaterialCommunityIcons
          name={expense.category.icon as any}
          size={20}
          color={expense.category.color}
        />
      </View>

      {/* Name + note */}
      <View style={styles.textSection}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {expense.category.name}
        </Text>
        {expense.note ? (
          <Text
            style={[styles.note, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {expense.note}
          </Text>
        ) : null}
      </View>

      {/* Date + amount */}
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: colors.text }]}>
          {formatCurrency(expense.amountCents)}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDateShort(expense.date)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.body,
  },
  note: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.body,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
});
