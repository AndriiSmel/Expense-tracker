import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../core/types';
import { typography, spacing, radius, shadows } from '../theme/theme';
import { formatCurrency } from '../utils/formatters';

interface BudgetCardProps {
  colors: ThemeColors;
  budgetCents: number;
  spentCents: number;
  onEditPress: () => void;
}

export default function BudgetCard({
  colors,
  budgetCents,
  spentCents,
  onEditPress,
}: BudgetCardProps) {
  const { currency } = usePreferences();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const percentage = budgetCents > 0 ? (spentCents / budgetCents) * 100 : 0;
  const remainingCents = budgetCents - spentCents;
  const isExceeded = remainingCents < 0;
  const isWarning = percentage >= 80 && !isExceeded;
  const clampedPercentage = Math.min(percentage, 100);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedPercentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clampedPercentage]);

  const barColor = isExceeded
    ? colors.danger
    : isWarning
    ? colors.warning
    : colors.success;

  const barBgColor = isExceeded
    ? colors.dangerLight
    : isWarning
    ? colors.warningLight
    : colors.successLight;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>Monthly Budget</Text>
          {isExceeded ? (
            <View style={[styles.badge, { backgroundColor: colors.dangerLight }]}>
              <MaterialCommunityIcons name="alert-circle" size={12} color={colors.danger} />
              <Text style={[styles.badgeText, { color: colors.danger }]}>Exceeded</Text>
            </View>
          ) : isWarning ? (
            <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
              <MaterialCommunityIcons name="alert" size={12} color={colors.warning} />
              <Text style={[styles.badgeText, { color: colors.warning }]}>80% Used</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onEditPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.editButton}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.amount, { color: colors.text }]}>
        {formatCurrency(budgetCents, currency)}
      </Text>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: barBgColor }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: barColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Spent: {formatCurrency(spentCents, currency)} ({Math.round(percentage)}%)
        </Text>
        <Text
          style={[
            styles.summaryText,
            {
              color: isExceeded ? colors.danger : colors.textSecondary,
              fontWeight: isExceeded ? '700' : '400',
            },
          ]}
        >
          {isExceeded
            ? `Over by: ${formatCurrency(Math.abs(remainingCents), currency)}`
            : `Remaining: ${formatCurrency(remainingCents, currency)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    ...typography.displayMedium,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    ...typography.bodySmall,
  },
});
import { usePreferences } from '../hooks/usePreferences';
