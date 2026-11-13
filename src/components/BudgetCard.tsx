import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ReferenceIcon from './TabIcon';
import { ThemeColors } from '../core/types';
import { usePreferences } from '../hooks/usePreferences';
import { nunito, actionFill, actionText, heroFill, spacing, radius } from '../theme/theme';
import { formatCurrency } from '../utils/formatters';

interface BudgetCardProps {
  colors: ThemeColors;
  budgetCents: number;
  spentCents: number;
  previousSpentCents: number;
  onEditPress: () => void;
}

export default function BudgetCard({ colors, budgetCents, spentCents, previousSpentCents, onEditPress }: BudgetCardProps) {
  const { currency } = usePreferences();
  const remaining = budgetCents - spentCents;
  const budgetUsed = budgetCents > 0 ? spentCents / budgetCents : spentCents > 0 ? 1 : 0;
  const progress = Math.min(budgetUsed, 1) * 100;
  const change = previousSpentCents > 0 ? Math.round((spentCents / previousSpentCents - 1) * 100) : null;
  const budgetLabel = formatCurrency(budgetCents, currency);
  const spendLabel = formatCurrency(spentCents, currency);

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.watermark}>
          <ReferenceIcon name="walletMoney" size={100} color={actionText} />
        </View>
        <View style={styles.inline}>
          <ReferenceIcon name="calendar" size={18} color={actionText} />
          <Text accessibilityRole="header" style={[styles.eyebrow, { color: actionText }]}>Total spent this month</Text>
        </View>
        <Text style={styles.total} accessibilityLabel={spendLabel}>
          {spendLabel.slice(0, -3)}<Text style={styles.decimal}>{spendLabel.slice(-3)}</Text>
        </Text>
        {change !== null && (
          <View style={[styles.inline, styles.change]}>
            <MaterialCommunityIcons name={change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'minus'} size={16} color={actionText} />
            <Text style={styles.changeText}>
              {change === 0 ? 'Same as previous month' : `${Math.abs(change)}% ${change < 0 ? 'less' : 'more'} than previous month`}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Edit monthly budget, ${budgetLabel}`}
          onPress={onEditPress}
          style={styles.budgetHeading}
        >
          <View style={[styles.budgetIcon, { backgroundColor: colors.background }]}>
            <ReferenceIcon name="pie" size={20} color={colors.success} />
          </View>
          <View style={styles.budgetTitle}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{remaining < 0 ? 'Over budget' : 'Remaining budget'}</Text>
            <Text style={[styles.balance, { color: colors.text }]}>{formatCurrency(Math.abs(remaining), currency)}</Text>
          </View>
          {budgetCents > 0 && (
            <Text style={[styles.pill, { color: colors.text, backgroundColor: remaining < 0 ? colors.dangerLight : colors.successLight }]}>
              {remaining < 0 ? 'Over budget' : `${Math.round((1 - budgetUsed) * 100)}% left`}
            </Text>
          )}
        </TouchableOpacity>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Monthly budget used"
          accessibilityValue={{ text: budgetCents > 0 ? `${Math.round(budgetUsed * 100)}%` : 'Budget is zero' }}
          style={[styles.track, { backgroundColor: colors.background }]}
        >
          <View style={[styles.fill, { backgroundColor: remaining < 0 ? colors.danger : actionFill, width: `${progress}%` }]} />
        </View>
        <View style={styles.totals}>
          <Text style={[nunito.regular, { color: colors.textSecondary }]}>{spendLabel} spent</Text>
          <Text style={[nunito.regular, { color: colors.textSecondary }]}>of {budgetLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { marginHorizontal: spacing.lg, gap: spacing.lg },
  hero: { padding: spacing['2xl'], borderRadius: 32, backgroundColor: heroFill, overflow: 'hidden', gap: spacing.md },
  watermark: { position: 'absolute', top: 4, right: 6, opacity: 0.12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { fontSize: 12, ...nunito.black, letterSpacing: 0.8, textTransform: 'uppercase' },
  total: { fontSize: 52, ...nunito.black, letterSpacing: -2, fontVariant: ['tabular-nums'], color: '#FFFFFF' },
  decimal: { fontSize: 24, letterSpacing: -0.5 },
  change: { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: '#FFFFFF55', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  changeText: { color: actionText, fontSize: 13, ...nunito.bold, flexShrink: 1 },
  card: { borderRadius: 28, padding: spacing.xl, gap: spacing.sm },
  budgetHeading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  budgetIcon: { width: 40, height: 40, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  budgetTitle: { flexGrow: 1, flexShrink: 1 },
  balance: { fontSize: 21, ...nunito.black, fontVariant: ['tabular-nums'] },
  pill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: 12, ...nunito.black },
  track: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  totals: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
});
