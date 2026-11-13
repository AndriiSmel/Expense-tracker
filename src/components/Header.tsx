import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors } from '../core/types';
import { nunito, typography, spacing } from '../theme/theme';

interface HeaderProps {
  colors: ThemeColors;
  title: string;
  subtitle?: string;
}

export default function Header({ colors, title, subtitle }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  heading: { flexShrink: 1 },
  subtitle: { ...typography.caption, textTransform: 'uppercase', ...nunito.black },
  title: {
    ...typography.titleLarge,
    fontSize: 26,
    ...nunito.black,
    flexShrink: 1,
  },
});
