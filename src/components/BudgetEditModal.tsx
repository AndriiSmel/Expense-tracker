import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { ThemeColors } from '../core/types';
import { typography, spacing, radius } from '../theme/theme';
import { parseAmountToCents } from '../utils/formatters';
import { CURRENCY_SYMBOLS } from '../core/constants';
import { usePreferences } from '../hooks/usePreferences';

interface BudgetEditModalProps {
  colors: ThemeColors;
  visible: boolean;
  currentBudgetCents: number;
  title: string;
  onSave: (cents: number) => void;
  onUseDefault?: () => void;
  onClose: () => void;
}

export default function BudgetEditModal({
  colors,
  visible,
  currentBudgetCents,
  title,
  onSave,
  onUseDefault,
  onClose,
}: BudgetEditModalProps) {
  const { currency } = usePreferences();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue((currentBudgetCents / 100).toFixed(2));
    }
  }, [visible, currentBudgetCents]);

  const handleSave = () => {
    const cents = parseAmountToCents(value);
    if (cents !== null) {
      onSave(cents);
      onClose();
    }
  };

  const isValid = parseAmountToCents(value) !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <View style={[styles.inputContainer, { borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>{CURRENCY_SYMBOLS[currency]}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid}
              style={[
                styles.button,
                { backgroundColor: isValid ? colors.primary : colors.surfaceSecondary },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isValid ? '#FFFFFF' : colors.textTertiary },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
          {onUseDefault && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onUseDefault();
                onClose();
              }}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>Use default budget</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: {
    ...typography.titleMedium,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  currencySymbol: {
    ...typography.displayMedium,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.displayMedium,
    padding: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.titleMedium,
  },
});
