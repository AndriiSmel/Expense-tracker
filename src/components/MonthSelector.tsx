import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../core/types';
import { typography, spacing } from '../theme/theme';
import { shiftMonth, formatMonthKey } from '../utils/formatters';

interface MonthSelectorProps {
  colors: ThemeColors;
  monthKey: string;
  onChangeMonth: (monthKey: string) => void;
}

function ArrowButton({
  direction,
  onPress,
  color,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={direction === 'left' ? 'Previous month' : 'Next month'}
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.arrowTouchable}
    >
      <MaterialCommunityIcons
        name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
        size={28}
        color={color}
      />
    </TouchableOpacity>
  );
}

export default function MonthSelector({ colors, monthKey, onChangeMonth }: MonthSelectorProps) {
  return (
    <View style={styles.container}>
      <ArrowButton
        direction="left"
        onPress={() => onChangeMonth(shiftMonth(monthKey, -1))}
        color={colors.text}
      />
      <Text style={[styles.monthText, { color: colors.text }]}>
        {formatMonthKey(monthKey)}
      </Text>
      <ArrowButton
        direction="right"
        onPress={() => onChangeMonth(shiftMonth(monthKey, 1))}
        color={colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  arrowTouchable: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    ...typography.titleMedium,
    flex: 1,
    textAlign: 'center',
  },
});
