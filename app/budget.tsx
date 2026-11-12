import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ReferenceIcon from '../src/components/TabIcon';
import { calculateBudgetUsage, calculateCategoryBreakdown, calculateMonthTotal } from '../src/core/calculations';
import { CURRENCY_SYMBOLS } from '../src/core/constants';
import { getAllCategories, setCategoryMonthlyLimit, subscribeToLocalChanges } from '../src/core/database';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBudget } from '../src/hooks/useBudget';
import { useDB } from '../src/hooks/useDatabase';
import { useDriveSync } from '../src/hooks/useDriveSync';
import { useExpenses } from '../src/hooks/useExpenses';
import { usePendingExpenseDeletion } from '../src/hooks/usePendingExpenseDeletion';
import { usePreferences } from '../src/hooks/usePreferences';
import { nunito, actionFill, actionText } from '../src/theme/theme';
import { formatCurrency, formatCurrencyCompact, formatMonthKey, getCurrentMonthKey, parseAmountToCents, shiftMonth } from '../src/utils/formatters';

export default function BudgetScreen() {
  const { colors, isDark } = useAppTheme();
  const { defaultBudgetCents, currency } = usePreferences();
  const { revision } = useDriveSync();
  const db = useDB();
  const { pendingDeletes } = usePendingExpenseDeletion();
  const focused = useIsFocused();
  const [month, setMonth] = useState(getCurrentMonthKey);
  const [draft, setDraft] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<{ id: string; value: string } | null>(null);
  const [categories, setCategories] = useState(() => getAllCategories(db));
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const { budget, setBudget, clearBudget, refresh: refreshBudget } = useBudget(month);
  const { expenses, refresh: refreshExpenses } = useExpenses(month);

  useEffect(() => {
    if (!focused) return;
    refreshBudget();
    refreshExpenses();
    setCategories(getAllCategories(db));
  }, [db, focused, refreshBudget, refreshExpenses, revision]);

  useEffect(() => subscribeToLocalChanges(db, () => {
    refreshBudget();
    refreshExpenses();
    setCategories(getAllCategories(db));
  }), [db, refreshBudget, refreshExpenses]);

  const budgetCents = budget?.budgetCents ?? defaultBudgetCents;
  const visibleExpenses = useMemo(
    () => expenses.filter(expense => expense.date.startsWith(month) && !pendingDeletes.includes(expense.id)),
    [expenses, month, pendingDeletes],
  );
  const spentCents = calculateMonthTotal(visibleExpenses);
  const categoryBreakdown = new Map(calculateCategoryBreakdown(visibleExpenses, categories)
    .map((entry) => [entry.category.id, entry.totalCents]));
  const budgetCategories = categories.filter((category) =>
    (!category.isArchived && !category.isDeleted) || categoryBreakdown.has(category.id));
  const { percentage } = calculateBudgetUsage(spentCents, budgetCents);
  const remainingCents = budgetCents - spentCents;
  const isOver = remainingCents < 0;
  const accent = isDark ? colors.primary : actionFill;
  const heroText = actionText;
  const cardColor = isDark ? colors.surface : colors.surfaceSecondary;
  const remainingColor = isOver ? (isDark ? '#FF9086' : '#B52D23') : (isDark ? '#74D88F' : '#206C36');
  const money = (cents: number) => formatCurrencyCompact(cents, currency);
  const value = draft ?? (budgetCents / 100).toFixed(2);
  const validBudget = parseAmountToCents(value);
  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();

  function changeMonth(direction: -1 | 1) {
    Keyboard.dismiss();
    setDraft(null);
    setMonth(shiftMonth(month, direction));
  }

  function saveCategoryLimit(id: string, cents: number | null) {
    try {
      setCategoryMonthlyLimit(db, id, cents);
      setCategoryDraft(null);
      Keyboard.dismiss();
    } catch {
      Alert.alert('Category limit could not be saved', 'Please try again.');
    }
  }

  function saveBudget() {
    if (validBudget === null) return;
    try {
      setBudget(validBudget);
      setDraft(null);
      Keyboard.dismiss();
    } catch {
      Alert.alert('Budget could not be saved', 'Please try again.');
    }
  }

  function resetBudget() {
    try {
      clearBudget();
      setDraft(null);
      Keyboard.dismiss();
    } catch {
      Alert.alert('Budget could not be reset', 'Please try again.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.grow}>
              <Text style={[styles.kicker, { color: colors.textSecondary }]}>{formatMonthKey(month)}</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Budget</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={[styles.arrow, { backgroundColor: cardColor }]}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={[styles.arrow, { backgroundColor: cardColor }]}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.hero, { backgroundColor: accent }]}>
            <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.watermark}>
              <ReferenceIcon name="budget" size={96} color={heroText} />
            </View>
            <View style={styles.heroHeader}>
              <Text style={[styles.kicker, styles.grow, { color: heroText }]}>Monthly budget</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit monthly budget"
                onPress={() => {
                  scroll.current?.scrollToEnd({ animated: false });
                  input.current?.focus();
                }}
                style={styles.edit}
              >
                <ReferenceIcon name="edit" size={16} color={heroText} />
                <Text style={[styles.bold, { color: heroText }]}>Edit</Text>
              </Pressable>
            </View>
            <Text style={[styles.heroAmount, { color: heroText }]}>{money(budgetCents)}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.totals}>
              <View style={styles.total}>
                <Text style={[styles.kicker, { color: colors.textSecondary }]}>Spent</Text>
                <Text style={[styles.amount, { color: colors.text }]}>{money(spentCents)}</Text>
              </View>
              <View style={[styles.total, styles.rightTotal]}>
                <Text style={[styles.kicker, { color: colors.textSecondary }]}>{isOver ? 'Over budget' : 'Remaining'}</Text>
                <Text style={[styles.amount, { color: remainingColor }]}>{money(Math.abs(remainingCents))}</Text>
              </View>
            </View>
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Monthly budget used"
              accessibilityValue={{ text: budgetCents > 0 ? `${Math.round(percentage)} percent` : 'Zero budget' }}
              style={[styles.track, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.fill, { backgroundColor: isOver ? colors.danger : accent, width: `${Math.min(100, percentage)}%` }]} />
            </View>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              {budgetCents > 0 ? `${Math.round(percentage)}% of budget used` : 'Monthly budget is zero'}
              {month === getCurrentMonthKey() && ` · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
            </Text>
          </View>

          {(isOver || percentage >= 80) && (
            <View style={[styles.card, styles.row, { backgroundColor: cardColor }]}>
              <View style={[styles.icon, { backgroundColor: colors.surface }]}>
                <ReferenceIcon name="warning" size={20} color={isOver ? colors.danger : accent} />
              </View>
              <View style={styles.grow}>
                <Text style={[styles.bold, { color: colors.text }]}>
                  {isOver ? 'Monthly budget exceeded' : remainingCents === 0 ? 'Monthly budget reached' : 'Near your monthly budget'}
                </Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  {formatCurrency(spentCents, currency)} of {formatCurrency(budgetCents, currency)} spent.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <Text accessibilityRole="header" style={[styles.section, styles.grow, { color: colors.text }]}>Category limits</Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>Monthly</Text>
          </View>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>Limits apply every month. Spending is for the selected month.</Text>
          {budgetCategories.map((category) => {
            const totalCents = categoryBreakdown.get(category.id) ?? 0;
            const limit = category.monthlyLimitCents ?? null;
            const { percentage: used, remainingCents: left } = calculateBudgetUsage(totalCents, limit ?? 0);
            const isEditing = categoryDraft?.id === category.id;
            const draftValue = isEditing ? categoryDraft.value.trim() : '';
            const validLimit = /^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(draftValue)
              ? parseAmountToCents(draftValue) : null;
            return (
              <View key={category.id} style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name={category.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={20} color={category.color} />
                  </View>
                  <View style={styles.grow}>
                    <Text style={[styles.bold, { color: colors.text }]}>{category.name}</Text>
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>
                      {money(totalCents)}{limit === null ? ' spent' : ` of ${money(limit)}`}
                    </Text>
                  </View>
                  {!category.isDeleted && (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${category.name} monthly limit`}
                      onPress={() => setCategoryDraft({ id: category.id, value: limit === null ? '' : (limit / 100).toFixed(2) })}
                      style={styles.limitEdit}>
                      <ReferenceIcon name="edit" size={16} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
                {limit !== null && (
                  <>
                    <View accessible accessibilityRole="progressbar" accessibilityLabel={`${category.name} monthly limit used`}
                      accessibilityValue={{ text: `${Math.round(used)} percent` }} style={[styles.track, { backgroundColor: colors.surface }]}>
                      <View style={[styles.fill, { backgroundColor: left < 0 ? colors.danger : used >= 80 ? colors.warning : accent, width: `${Math.min(100, used)}%` }]} />
                    </View>
                    <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: colors.text }]}>
                      {left < 0 ? `Over limit by ${money(-left)}` : left === 0 ? 'Limit reached' : used >= 80 ? `Near limit · ${money(left)} left` : `${Math.round(used)}% used`}
                    </Text>
                  </>
                )}
                {isEditing && (
                  <>
                    <TextInput
                      accessibilityLabel={`${category.name} monthly limit amount`}
                      value={categoryDraft.value}
                      onChangeText={(value) => setCategoryDraft({ id: category.id, value })}
                      placeholder="Monthly limit"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      style={[styles.input, styles.inputRow, { color: colors.text, backgroundColor: colors.surface }]}
                    />
                    <Pressable accessibilityRole="button" accessibilityState={{ disabled: validLimit === null }}
                      disabled={validLimit === null} onPress={() => { if (validLimit !== null) saveCategoryLimit(category.id, validLimit); }}
                      style={[styles.save, { backgroundColor: validLimit === null ? colors.surface : accent }]}>
                      <Text style={[styles.bold, { color: validLimit === null ? colors.textSecondary : heroText }]}>Save limit</Text>
                    </Pressable>
                    {limit !== null && (
                      <Pressable accessibilityRole="button" style={styles.save} onPress={() => saveCategoryLimit(category.id, null)}>
                        <Text style={[styles.bold, { color: colors.text }]}>Remove limit</Text>
                      </Pressable>
                    )}
                    <Pressable accessibilityRole="button" style={styles.save} onPress={() => { setCategoryDraft(null); Keyboard.dismiss(); }}>
                      <Text style={[styles.bold, { color: colors.text }]}>Cancel</Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}
          {budgetCategories.length === 0 && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>No categories to set limits for.</Text>
          )}

          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]}>Adjust monthly budget</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.bold, { color: colors.textSecondary }]}>{CURRENCY_SYMBOLS[currency]}</Text>
              <TextInput
                ref={input}
                accessibilityLabel="Monthly budget amount"
                value={value}
                onChangeText={setDraft}
                keyboardType="decimal-pad"
                selectTextOnFocus
                style={[styles.input, { color: colors.text }]}
              />
            </View>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: validBudget === null }} disabled={validBudget === null} onPress={saveBudget}
              style={[styles.save, { backgroundColor: validBudget === null ? colors.surface : accent }]}>
              <Text style={[styles.bold, { color: validBudget === null ? colors.textSecondary : heroText }]}>Save budget</Text>
            </Pressable>
            {budget && (
              <Pressable accessibilityRole="button" onPress={resetBudget} style={styles.save}>
                <Text style={[styles.bold, { color: colors.text }]}>Use default budget</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  title: { fontSize: 26, ...nunito.bold, letterSpacing: -0.5 },
  kicker: { fontSize: 10, ...nunito.black, letterSpacing: 0.8, textTransform: 'uppercase' },
  arrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 32, padding: 24, gap: 12, overflow: 'hidden' },
  watermark: { position: 'absolute', right: 8, top: 4, opacity: 0.15 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  edit: { minHeight: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroAmount: { fontSize: 54, ...nunito.black, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  card: { borderRadius: 28, padding: 20, gap: 10 },
  totals: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  total: { flexGrow: 1, flexShrink: 1, gap: 3 },
  rightTotal: { alignItems: 'flex-end' },
  amount: { fontSize: 28, ...nunito.black, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  caption: { fontSize: 12, ...nunito.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bold: { fontSize: 14, ...nunito.bold },
  section: { fontSize: 18, ...nunito.bold },
  limitEdit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  inputRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, borderRadius: 28 },
  input: { flex: 1, fontSize: 16, ...nunito.bold, minHeight: 48 },
  save: { minHeight: 48, borderRadius: 28, alignItems: 'center', justifyContent: 'center', padding: 12 },
});
