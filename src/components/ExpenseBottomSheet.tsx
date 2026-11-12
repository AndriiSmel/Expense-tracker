import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Category,
  ExpenseWithCategory,
  ExpenseInput,
  RepeatFrequency,
  RepeatUnit,
  ThemeColors,
} from '../core/types';
import { nunito, actionFill, actionText, typography, spacing, radius } from '../theme/theme';
import { formatDate, getToday, parseAmountToCents } from '../utils/formatters';
import AmountInput from './AmountInput';
import CategoryGrid from './CategoryGrid';
import ReferenceIcon from './TabIcon';
import { isCalendarDate, isRepeatFrequency, REPEAT_UNITS } from '../core/recurrence';

interface ExpenseBottomSheetProps {
  colors: ThemeColors;
  expense: ExpenseWithCategory | null;
  categories: Category[];
  onSave: (input: ExpenseInput, repeat?: RepeatFrequency) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function ExpenseBottomSheet({
  colors,
  expense,
  categories,
  onSave,
  onDelete,
  onClose,
}: ExpenseBottomSheetProps) {
  const isEditing = !!expense;
  const amountInput = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [amountStr, setAmountStr] = useState(() => expense ? (expense.amountCents / 100).toFixed(2) : '');
  const [compactAmount, setCompactAmount] = useState(false);
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? null);
  const [date, setDate] = useState(() => expense?.date ?? getToday());
  const [dateEditorVisible, setDateEditorVisible] = useState(false);
  const [note, setNote] = useState(expense?.note ?? '');
  const [repeats, setRepeats] = useState(false);
  const [interval, setInterval] = useState('1');
  const [unit, setUnit] = useState<RepeatUnit>('month');

  const cents = parseAmountToCents(amountStr);
  const repeat = !isEditing && repeats ? { interval: Number(interval), unit } : undefined;
  const isValidDate = isCalendarDate(date) && (!repeat || date >= getToday());
  const isValid = cents !== null && categoryId !== null && isValidDate
    && (!repeat || isRepeatFrequency(repeat));

  const handleSave = () => {
    if (!isValid || !categoryId || cents === null) return;

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

    onDelete(expense.id);
    onClose();
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
      animationType={Platform.OS === 'ios' ? 'slide' : 'none'}
      onRequestClose={onClose}
      onShow={() => {
        // Android's dialog can dispatch onShow before it can accept keyboard focus.
        if (!isEditing) setTimeout(() => amountInput.current?.focus(), Platform.OS === 'android' ? 150 : 0);
      }}
    >
      <SafeAreaView edges={['top']} style={[styles.backdrop, { backgroundColor: colors.surface }]}>
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoid}>
          <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                style={styles.cancelButton}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.text }]}>
                {isEditing ? 'Edit expense' : 'Add expense'}
              </Text>
            </View>

            <ScrollView
              style={styles.form}
              contentContainerStyle={styles.scrollContent}
              onLayout={({ nativeEvent }) => setCompactAmount(nativeEvent.layout.height < 300)}
              keyboardShouldPersistTaps="always"
            >
              {/* 1. Amount Input */}
              <AmountInput
                compact={compactAmount}
                colors={colors}
                value={amountStr}
                onChange={setAmountStr}
                inputRef={amountInput}
              />

              {/* 2. Category selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Category
                </Text>
                <CategoryGrid
                  colors={colors}
                  categories={categories}
                  selectedId={categoryId}
                  onSelect={setCategoryId}
                />
              </View>

              {/* Optional Note */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Note (optional)
                </Text>
                <TextInput
                  accessibilityLabel="Note (optional)"
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      color: colors.text,
                    },
                  ]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="What was it for?"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={100}
                />
              </View>

              {/* 3. Date selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {repeats && !isEditing ? 'Start date' : 'Date'}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: dateEditorVisible }}
                  onPress={() => setDateEditorVisible((visible) => !visible)}
                  style={[styles.dateInputWrapper, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <ReferenceIcon name="calendar" size={20} color={colors.primary} />
                  <Text style={[styles.dateInput, { color: colors.text }]}>
                    {date === getToday() ? `Today, ${formatDate(date)}` : isCalendarDate(date) ? formatDate(date) : date || 'Choose date'}
                  </Text>
                  <MaterialCommunityIcons
                    name={dateEditorVisible ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                {dateEditorVisible && (
                  <>
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        onPress={() => handleSetQuickDate('today')}
                        accessibilityRole="button"
                        accessibilityState={{ selected: date === getToday() }}
                        style={[
                          styles.quickDateBadge,
                          {
                            backgroundColor:
                              date === getToday() ? colors.primaryLight : colors.surfaceSecondary,
                            borderColor: date === getToday() ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickDateText,
                            { color: colors.text },
                          ]}
                        >
                          Today
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleSetQuickDate('yesterday')}
                        accessibilityRole="button"
                        style={[
                          styles.quickDateBadge,
                          {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.quickDateText, { color: colors.text }]}>
                          Yesterday
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={[
                        styles.dateInputWrapper,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="calendar-month"
                        size={20}
                        color={colors.primary}
                      />
                      <TextInput
                        accessibilityLabel="Expense date, year month day"
                        style={[styles.dateInput, { color: colors.text }]}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                        maxLength={10}
                      />
                    </View>
                  </>
                )}
              </View>

              {!isValidDate && (
                <Text accessibilityRole="alert" style={[styles.repeatHint, { color: colors.text }]}>
                  {repeat ? 'Enter a start date of today or later (YYYY-MM-DD).' : 'Enter a valid date (YYYY-MM-DD).'}
                </Text>
              )}

              {!isEditing && (
                <View style={styles.section}>
                  <View style={styles.repeatToggle}>
                    <Text style={[styles.sectionLabel, styles.repeatLabel, { color: colors.textSecondary }]}>Repeat expense</Text>
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
                        <Text style={[nunito.regular, { color: colors.text }]}>Every</Text>
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
                              {
                                backgroundColor: unit === option ? colors.primaryLight : colors.surfaceSecondary,
                                borderColor: unit === option ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text style={[nunito.regular, { color: colors.text }]}>
                              {Number(interval) === 1 ? option : `${option}s`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {repeat && !isRepeatFrequency(repeat) && (
                        <Text accessibilityRole="alert" style={[styles.repeatHint, { color: colors.text }]}>
                          Enter a repeat interval from 1 to 999.
                        </Text>
                      )}
                      <Text style={[styles.repeatHint, { color: colors.textSecondary }]}>
                        Due expenses are added when you open the app, starting on the date above.
                      </Text>
                    </>
                  )}
                </View>
              )}

              {isEditing && (
                <TouchableOpacity
                  onPress={handleDelete}
                  accessibilityRole="button"
                  style={[styles.deleteButton, { borderColor: colors.danger }]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                  <Text style={[styles.deleteButtonText, { color: colors.text }]}>Delete expense</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityState={{ disabled: !isValid }}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: isValid ? actionFill : colors.surfaceSecondary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <ReferenceIcon
                  name="save"
                  size={22}
                  color={isValid ? actionText : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: isValid ? actionText : colors.textSecondary },
                  ]}
                >
                  {isEditing ? 'Save changes' : repeat ? 'Save recurring expense' : 'Save expense'}
                </Text>
              </TouchableOpacity>
              <View style={styles.privacy}>
                <ReferenceIcon name="lock" size={13} color={colors.textSecondary} />
                <Text style={[typography.caption, styles.privacyText, { color: colors.textSecondary }]}>
                  Saved on this device
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  repeatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatLabel: { flexShrink: 1 },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  intervalInput: {
    ...nunito.regular,
    minWidth: 44,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    borderRadius: radius.md,
  },
  repeatUnit: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  repeatHint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  backdrop: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.sm,
    columnGap: spacing.sm,
  },
  sheetTitle: {
    ...typography.titleLarge,
    ...nunito.black,
    flex: 1,
    textAlign: 'center',
    marginRight: spacing['5xl'],
  },
  cancelButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  cancelText: { ...typography.body, ...nunito.bold },
  form: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  section: {
    marginVertical: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    ...nunito.black,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickDateBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  quickDateText: {
    ...typography.bodySmall,
    ...nunito.semibold,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: radius.full,
    gap: spacing.md,
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
    borderRadius: radius.full,
  },
  saveButton: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...typography.body,
    ...nunito.black,
    flexShrink: 1,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: spacing['2xl'], paddingVertical: spacing.sm },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    marginTop: spacing.sm,
  },
  privacyText: { flexShrink: 1 },
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
    ...nunito.semibold,
    flexShrink: 1,
  },
});
