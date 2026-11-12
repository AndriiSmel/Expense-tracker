import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, ExpenseWithCategory } from '../core/types';
import { nunito, typography, spacing, radius } from '../theme/theme';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { usePreferences } from '../hooks/usePreferences';

interface ExpenseItemProps {
  colors: ThemeColors;
  expense: ExpenseWithCategory;
  firstInGroup: boolean;
  lastInGroup: boolean;
  preview?: boolean;
  onRepeat: (expense: ExpenseWithCategory) => void;
  onPress: (expense: ExpenseWithCategory) => void;
}

export default function ExpenseItem({ colors, expense, firstInGroup, lastInGroup, preview, onPress, onRepeat }: ExpenseItemProps) {
  const { currency } = usePreferences();
  const amount = formatCurrency(expense.amountCents, currency);
  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.surface, borderTopColor: colors.border },
      preview ? styles.preview : firstInGroup ? styles.groupTop : styles.divider,
      !preview && lastInGroup && styles.groupBottom,
    ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens expense details"
        onPress={() => onPress(expense)}
        style={({ pressed }) => [styles.detail, pressed && styles.pressed]}
      >
        <View style={styles.description}>
          <View style={[styles.iconCircle, { backgroundColor: expense.category.color + '22' }]}>
            <MaterialCommunityIcons
              name={expense.category.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
              size={18}
              color={expense.category.color}
            />
          </View>
          <View style={styles.textSection}>
            <Text style={[styles.name, preview && styles.previewName, { color: colors.text }]}>
              {preview ? expense.note || expense.category.name : expense.category.name}
            </Text>
            {(preview || !!expense.note) && (
              <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
                {preview
                  ? [expense.note ? expense.category.name : '', formatDateShort(expense.date)].filter(Boolean).join(' · ')
                  : expense.note}
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>
          {preview ? `−${amount}` : amount}
        </Text>
      </Pressable>
      {!preview && <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Repeat ${expense.category.name} expense for today`}
        onPress={() => onRepeat(expense)}
        style={({ pressed }) => [styles.repeat, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="repeat" size={20} color={colors.textSecondary} />
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingLeft: spacing.sm,
  },
  groupTop: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  groupBottom: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  preview: { borderRadius: radius.xl, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  previewName: { ...nunito.bold },
  detail: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    flex: 1,
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textSection: { flex: 1 },
  name: {
    ...typography.body,
  },
  note: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  amount: {
    ...typography.body,
    ...nunito.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    maxWidth: '100%',
    marginLeft: 'auto',
  },
  repeat: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.5 },
});
