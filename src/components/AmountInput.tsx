import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemeColors } from '../core/types';
import { usePreferences } from '../hooks/usePreferences';
import { CURRENCY_SYMBOLS } from '../core/constants';
import { nunito, typography, spacing } from '../theme/theme';

interface AmountInputProps {
  colors: ThemeColors;
  value: string;
  compact?: boolean;
  onChange: (value: string) => void;
  inputRef: React.Ref<React.ComponentRef<typeof TextInput>>;
}

export default function AmountInput({
  colors,
  value,
  compact,
  onChange,
  inputRef,
}: AmountInputProps) {
  const { currency } = usePreferences();
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
    <View style={[styles.container, compact && styles.compactContainer, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
      <View style={styles.amountRow}>
        <Text style={[styles.currencyPrefix, { color: colors.primary }]}>{CURRENCY_SYMBOLS[currency]}</Text>
        <TextInput
          ref={inputRef}
          accessibilityLabel={`Amount in ${currency}`}
          style={[styles.input, compact && styles.compactInput, { color: colors.text }]}
          value={value}
          onChangeText={handleChangeText}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          selectionColor={colors.primary}
          selectTextOnFocus
          maxLength={10}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 32,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    ...nunito.black,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  compactContainer: { paddingVertical: spacing.xs },
  compactInput: { fontSize: 44 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 240,
  },
  currencyPrefix: {
    ...typography.displayLarge,
    fontSize: 30,
    ...nunito.black,
    marginRight: spacing.xs,
  },
  input: {
    ...typography.displayLarge,
    fontSize: 64,
    ...nunito.black,
    flexShrink: 1,
    minWidth: 44,
    textAlign: 'center',
    padding: 0,
  },
});
