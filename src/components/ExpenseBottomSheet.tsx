import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Switch,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Category,
  ExpenseWithCategory,
  ExpenseInput,
  RepeatFrequency,
  RepeatUnit,
  ThemeColors,
} from '../core/types';
import { typography, spacing, radius } from '../theme/theme';
import { getToday, parseAmountToCents } from '../utils/formatters';
import AmountInput from './AmountInput';
import CategoryGrid from './CategoryGrid';
import { isCalendarDate, isRepeatFrequency, REPEAT_UNITS } from '../core/recurrence';

interface ExpenseBottomSheetProps {
  colors: ThemeColors;
  visible: boolean;
  expense: ExpenseWithCategory | null;
  categories: Category[];
  onSave: (input: ExpenseInput, repeat?: RepeatFrequency) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function ExpenseBottomSheet({
  colors,
  visible,
  expense,
  categories,
  onSave,
  onDelete,
  onClose,
}: ExpenseBottomSheetProps) {
  const isEditing = !!expense;

  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [repeats, setRepeats] = useState(false);
  const [interval, setInterval] = useState('1');
  const [unit, setUnit] = useState<RepeatUnit>('month');

  // Sync state when sheet opens or expense changes
  useEffect(() => {
    if (visible) {
      setRepeats(false);
      setInterval('1');
      setUnit('month');
      if (expense) {
        setAmountStr((expense.amountCents / 100).toFixed(2));
        setCategoryId(expense.categoryId);
        setDate(expense.date);
        setNote(expense.note ?? '');
      } else {
        setAmountStr('');
        // Start without category selected so user actively chooses
        setCategoryId(null);
        setDate(getToday());
        setNote('');
      }
    }
  }, [visible, expense]);

  const cents = parseAmountToCents(amountStr);
  const repeat = !isEditing && repeats ? { interval: Number(interval), unit } : undefined;
  const isValidDate = isCalendarDate(date) && (!repeat || date >= getToday());
  const isValid = cents !== null && categoryId !== null && isValidDate
    && (!repeat || isRepeatFrequency(repeat));

  const handleSave = () => {
    if (!isValid || !categoryId || cents === null) {
      if (!cents) {
        Alert.alert('Amount Required', 'Please enter a valid expense amount.');
      } else if (!categoryId) {
        Alert.alert('Category Required', 'Please select an expense category.');
      }
      return;
    }

    try {
      onSave({
        amountCents: cents,
        categoryId,
        date,
        note: note.trim() || null,
      }, repeat);
      onClose();
    } catch (error) {
      Alert.alert('Could not save expense', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleDelete = () => {
    if (!expense || !onDelete) return;

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(expense.id);
            onClose();
          },
        },
      ],
    );
  };

  const handleSetQuickDate = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        {/* Dismiss backdrop on press */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {/* Header handle & title */}
            <View style={styles.sheetHeader}>
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
              <View style={styles.titleRow}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {isEditing ? 'Edit Expense' : 'Add Expense'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Amount Input */}
              <AmountInput
                colors={colors}
                value={amountStr}
                onChange={setAmountStr}
                autoFocus={!isEditing}
              />

              {/* 2. Category selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  CATEGORY {!categoryId && <Text style={{ color: colors.danger }}>*</Text>}
                </Text>
                <CategoryGrid
                  colors={colors}
                  categories={categories}
                  selectedId={categoryId}
                  onSelect={setCategoryId}
                />
              </View>

              {/* 3. Date selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {repeats && !isEditing ? 'START DATE' : 'DATE'}
                </Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    onPress={() => handleSetQuickDate('today')}
                    style={[
                      styles.quickDateBadge,
                      {
                        backgroundColor:
                          date === getToday() ? colors.primaryLight : colors.surfaceSecondary,
                        borderColor: date === getToday() ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        { color: date === getToday() ? colors.primary : colors.text },
                      ]}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSetQuickDate('yesterday')}
                    style={[
                      styles.quickDateBadge,
                      {
                        backgroundColor: colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text style={[styles.quickDateText, { color: colors.text }]}>
                      Yesterday
                    </Text>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.dateInputWrapper,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="calendar-month-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.dateInput, { color: colors.text }]}
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      maxLength={10}
                    />
                  </View>
                </View>
              </View>

              {!isValidDate && (
                <Text style={[styles.repeatHint, { color: colors.danger }]}>
                  {repeat ? 'Enter a start date of today or later (YYYY-MM-DD).' : 'Enter a valid date (YYYY-MM-DD).'}
                </Text>
              )}

              {!isEditing && (
                <View style={styles.section}>
                  <View style={styles.repeatToggle}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REPEAT EXPENSE</Text>
                    <Switch
                      accessibilityLabel="Repeat expense"
                      value={repeats}
                      onValueChange={setRepeats}
                      trackColor={{ true: colors.primary, false: colors.border }}
                    />
                  </View>
                  {repeats && (
                    <>
                      <View style={styles.repeatOptions}>
                        <Text style={{ color: colors.text }}>Every</Text>
                        <TextInput
                          accessibilityLabel="Repeat interval"
                          keyboardType="number-pad"
                          maxLength={3}
                          value={interval}
                          onChangeText={(value) => setInterval(value.replace(/\D/g, ''))}
                          style={[styles.intervalInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
                        />
                        {REPEAT_UNITS.map((option) => (
                          <TouchableOpacity
                            key={option}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: unit === option }}
                            onPress={() => setUnit(option)}
                            style={[
                              styles.repeatUnit,
                              { backgroundColor: unit === option ? colors.primaryLight : colors.surfaceSecondary },
                            ]}
                          >
                            <Text style={{ color: unit === option ? colors.primary : colors.text }}>
                              {Number(interval) === 1 ? option : `${option}s`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={[styles.repeatHint, { color: colors.textSecondary }]}>
                        Due expenses are added when you open the app, starting on the date above.
                      </Text>
                    </>
                  )}
                </View>
              )}

              {/* Optional Note */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  NOTE (OPTIONAL)
                </Text>
                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      color: colors.text,
                    },
                  ]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Lunch with team, monthly pass..."
                  placeholderTextColor={colors.textTertiary}
                  maxLength={100}
                />
              </View>

              {/* 5. Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isValid}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: isValid ? colors.primary : colors.surfaceSecondary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: isValid ? '#FFFFFF' : colors.textTertiary },
                  ]}
                >
                  {isEditing ? 'Save Changes' : repeat ? 'Save Recurring Expense' : 'Save Expense'}
                </Text>
              </TouchableOpacity>

              {/* 6. Delete Button (Edit mode) */}
              {isEditing && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.deleteButton, { borderColor: colors.danger }]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                  <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
                    Delete Expense
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  repeatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  intervalInput: {
    minWidth: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    borderRadius: radius.md,
  },
  repeatUnit: {
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  repeatHint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing.xl,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sheetTitle: {
    ...typography.titleLarge,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginVertical: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickDateBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  quickDateText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  dateInput: {
    flex: 1,
    ...typography.bodySmall,
    padding: 0,
  },
  noteInput: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  deleteButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});
