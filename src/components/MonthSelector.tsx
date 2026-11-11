import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Text } from 'react-native';
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={styles.arrowTouchable}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialCommunityIcons
          name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
          size={28}
          color={color}
        />
      </Animated.View>
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
    minWidth: 160,
    textAlign: 'center',
  },
});
