import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../core/types';
import { nunito, typography, spacing } from '../theme/theme';

interface HeaderProps {
  colors: ThemeColors;
  title: string;
  subtitle?: string;
  onSettingsPress: () => void;
}

export default function Header({ colors, title, subtitle, onSettingsPress }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <TouchableOpacity
        onPress={onSettingsPress}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={[styles.settingsButton, { backgroundColor: colors.surface }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
