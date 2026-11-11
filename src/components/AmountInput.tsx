import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemeColors } from '../core/types';
import { typography, spacing, radius } from '../theme/theme';

interface AmountInputProps {
  colors: ThemeColors;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export default function AmountInput({
  colors,
  value,
  onChange,
  autoFocus = true,
}: AmountInputProps) {
  const handleChangeText = (text: string) => {
    // Replace comma with period for numeric check
    let normalized = text.replace(',', '.');
    
    // Auto-prefix leading decimal with '0' e.g. .50 -> 0.50
    if (normalized.startsWith('.')) {
      normalized = '0' + normalized;
    }
    
    // Check if valid partial amount (digits and optional single dot with up to 2 decimals)
    if (normalized === '' || /^\d+(\.\d{0,2})?$/.test(normalized) || /^\d+\.$/.test(normalized)) {
      onChange(text.startsWith(',') ? '0' + text : text);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>€</Text>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={handleChangeText}
        placeholder="0.00"
        placeholderTextColor={colors.textTertiary}
        keyboardType="decimal-pad"
        autoFocus={autoFocus}
        selectTextOnFocus
        maxLength={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  currencyPrefix: {
    ...typography.displayLarge,
    fontSize: 34,
    marginRight: spacing.xs,
  },
  input: {
    ...typography.displayLarge,
    fontSize: 34,
    minWidth: 140,
    textAlign: 'left',
    padding: 0,
  },
});
