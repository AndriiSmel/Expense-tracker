import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../src/hooks/useAppTheme';
import { useCategories } from '../src/hooks/useCategories';
import { useDB } from '../src/hooks/useDatabase';
import { usePreferences } from '../src/hooks/usePreferences';

import { CURRENCY_SYMBOLS, CurrencyCode } from '../src/core/constants';
import { Category, CategoryInput, RecurringExpense, ThemeMode } from '../src/core/types';
import { getRecurringExpenses, importBackupData, isCategoryInUse, recordDueRecurringExpenses, stopRecurringExpense } from '../src/core/database';
import { formatRepeatFrequency } from '../src/core/recurrence';
import { nunito, typography, spacing, radius, shadows } from '../src/theme/theme';
import {
  shareBackupJSON,
  shareBackupCSV,
  getLastBackupDate,
  pickBackup,
} from '../src/utils/backup';

import DriveSyncSettings from '../src/components/DriveSyncSettings';
import { useDriveSync } from '../src/hooks/useDriveSync';
import CategoryEditModal from '../src/components/CategoryEditModal';
import ConfirmModal from '../src/components/ConfirmModal';
import BudgetEditModal from '../src/components/BudgetEditModal';
import { formatCurrency, formatDate } from '../src/utils/formatters';

const currencyOptions = Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[];

export default function SettingsScreen() {
  const router = useRouter();
  const db = useDB();
  const drive = useDriveSync();
  const { revision: driveRevision } = drive;
  const { colors, mode, setMode } = useAppTheme();
  const { currency, defaultBudgetCents, saveCurrency, saveDefaultBudget } = usePreferences();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState(() => getRecurringExpenses(db));

  useFocusEffect(useCallback(() => {
    const refreshSchedules = () => {
      recordDueRecurringExpenses(db);
      setRecurringExpenses(getRecurringExpenses(db));
    };
    refreshSchedules();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshSchedules();
    });
    return () => subscription.remove();
  }, [db]));
  const {
    categories,
    createCategory,
    updateCategory,
    archiveCategory,
    unarchiveCategory,
    deleteCategory,
    refresh: refreshCategories,
  } = useCategories();

  useEffect(() => {
    refreshCategories();
    setRecurringExpenses(getRecurringExpenses(db));
  }, [db, driveRevision, refreshCategories]);

  // Category Edit state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Backup restore state
  const [backupPreview, setBackupPreview] = useState<Awaited<ReturnType<typeof pickBackup>>>(null);
  const [isPickingBackup, setIsPickingBackup] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLastBackupDate().then((date) => {
      if (active) setLastBackupDate(date);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [isExporting, setIsExporting] = useState(false);

  // Handle open category modal
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryModalVisible(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = (input: CategoryInput) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, input);
    } else {
      createCategory(input);
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    const showCategoryInUse = () => Alert.alert(
      'Category in use',
      category.isArchived
        ? 'This category is linked to an expense or recurring schedule.'
        : 'This category is linked to an expense or recurring schedule. You can archive it to hide it from new entries.',
    );

    try {
      if (isCategoryInUse(db, category.id)) {
        showCategoryInUse();
        return;
      }
      Alert.alert('Delete category?', `Delete “${category.name}”?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              if (!deleteCategory(category.id) && isCategoryInUse(db, category.id)) showCategoryInUse();
            } catch {
              Alert.alert('Could not delete category', 'Please try again.');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('Could not check category', 'Please try again.');
    }
  };

  const renderDeleteCategoryButton = (category: Category) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Delete ${category.name} category`}
      onPress={() => confirmDeleteCategory(category)}
      style={styles.iconButton}
    >
      <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
    </TouchableOpacity>
  );

  const confirmStopRecurring = (rule: RecurringExpense) => {
    Alert.alert('Stop recurring expense?', 'Expenses already recorded will stay in your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop repeating',
        style: 'destructive',
        onPress: () => {
          stopRecurringExpense(db, rule.id);
          setRecurringExpenses(getRecurringExpenses(db));
        },
      },
    ]);
  };

  // Backups
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      await shareBackupJSON(db, setLastBackupDate);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Could not export JSON backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await shareBackupCSV(db);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Could not export CSV file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePickBackup = async () => {
    setIsPickingBackup(true);
    try {
      setBackupPreview(await pickBackup());
    } catch (error) {
      Alert.alert('Could not open backup', error instanceof Error ? error.message : 'Please try another file.');
    } finally {
      setIsPickingBackup(false);
    }
  };

  const handleRestoreBackup = () => {
    if (!backupPreview) return;
    try {
      importBackupData(db, backupPreview.data);
      setBackupPreview(null);
      refreshCategories();
      setRecurringExpenses(getRecurringExpenses(db));
      Alert.alert('Backup restored', 'Expenses, categories, budgets, and recurring schedules were replaced.');
    } catch (error) {
      Alert.alert('Could not restore backup', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const activeCats = categories.filter((c) => !c.isArchived);
  const archivedCats = categories.filter((c) => c.isArchived && !c.isDeleted);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Navigation Bar */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.navigate('/')}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BUDGET & CURRENCY</Text>
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setBudgetModalVisible(true)}
                style={styles.themeOptionRow}
              >
                <View style={styles.preferenceLabel}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Default monthly budget</Text>
                  <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                    Used for months without a custom budget.
                  </Text>
                </View>
                <Text style={[styles.optionLabel, { color: colors.primary }]}>
                  {formatCurrency(defaultBudgetCents, currency)}
                </Text>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ expanded: currencyExpanded }}
                onPress={() => setCurrencyExpanded((expanded) => !expanded)}
                style={styles.themeOptionRow}
              >
                <View style={styles.preferenceLabel}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Currency</Text>
                  <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                    Changes the currency shown for all amounts.
                  </Text>
                </View>
                <Text style={[styles.optionLabel, { color: colors.primary }]}>{currency}</Text>
                <MaterialCommunityIcons
                  name={currencyExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {currencyExpanded && currencyOptions.map((code) => (
                <React.Fragment key={code}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity
                    accessibilityRole="radio"
                    accessibilityState={{ checked: code === currency }}
                    onPress={() => {
                      saveCurrency(code);
                      setCurrencyExpanded(false);
                    }}
                    style={styles.themeOptionRow}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{code}</Text>
                    <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>
                      {CURRENCY_SYMBOLS[code].trim() === code ? '' : CURRENCY_SYMBOLS[code]}
                    </Text>
                    {code === currency && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECURRING EXPENSES</Text>
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
              {recurringExpenses.length === 0 ? (
                <Text style={[styles.recurringEmpty, { color: colors.textSecondary }]}>
                  Turn on Repeat expense when adding an expense to set up a schedule.
                </Text>
              ) : recurringExpenses.map((rule, index) => {
                const category = categories.find((item) => item.id === rule.categoryId)?.name ?? 'Uncategorized';
                return (
                  <React.Fragment key={rule.id}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <View style={styles.themeOptionRow}>
                      <View style={styles.preferenceLabel}>
                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                          {formatCurrency(rule.amountCents, currency)} · {category}
                        </Text>
                        {!!rule.note && (
                          <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>{rule.note}</Text>
                        )}
                        <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                          {formatRepeatFrequency(rule)} · Next {formatDate(rule.nextDate)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => confirmStopRecurring(rule)}
                        hitSlop={8}
                      >
                        <Text style={[styles.optionLabel, { color: colors.danger }]}>Stop</Text>
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Appearance / Theme */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              APPEARANCE
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map((m, idx) => {
                const isSelected = mode === m;
                const label = m === 'system' ? 'System Default' : m === 'light' ? 'Light' : 'Dark';
                const iconName =
                  m === 'system'
                    ? 'theme-light-dark'
                    : m === 'light'
                    ? 'white-balance-sunny'
                    : 'moon-waning-crescent';

                return (
                  <React.Fragment key={m}>
                    <TouchableOpacity
                      onPress={() => setMode(m)}
                      style={styles.themeOptionRow}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <MaterialCommunityIcons
                          name={iconName as any}
                          size={22}
                          color={colors.textSecondary}
                        />
                        <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                    {idx < 2 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* 2. Categories Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                CATEGORIES ({activeCats.length})
              </Text>
              <TouchableOpacity
                onPress={handleOpenAddCategory}
                style={[styles.addButton, { backgroundColor: colors.primaryLight }]}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>New</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
              {activeCats.length === 0 && (
                <Text style={[styles.categoryRow, { color: colors.textSecondary }]}>No active categories</Text>
              )}
              {activeCats.map((cat, index) => (
                <React.Fragment key={cat.id}>
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIconCircle,
                          { backgroundColor: cat.color + '22' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon as any}
                          size={18}
                          color={cat.color}
                        />
                      </View>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {cat.name}
                      </Text>
                    </View>

                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        onPress={() => handleOpenEditCategory(cat)}
                        style={styles.iconButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => archiveCategory(cat.id)}
                        style={styles.iconButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons
                          name="archive-arrow-down-outline"
                          size={20}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                      {renderDeleteCategoryButton(cat)}
                    </View>
                  </View>
                  {index < activeCats.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Archived Categories if any */}
            {archivedCats.length > 0 && (
              <View style={styles.archivedSection}>
                <Text style={[styles.archivedTitle, { color: colors.textTertiary }]}>
                  Archived Categories ({archivedCats.length})
                </Text>
                <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
                  {archivedCats.map((cat, index) => (
                    <React.Fragment key={cat.id}>
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryLeft}>
                          <View
                            style={[
                              styles.categoryIconCircle,
                              { backgroundColor: colors.surfaceSecondary },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={cat.icon as any}
                              size={18}
                              color={colors.textTertiary}
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryName,
                              { color: colors.textSecondary, textDecorationLine: 'line-through' },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </View>

                        <View style={styles.categoryActions}>
                          <TouchableOpacity
                            onPress={() => unarchiveCategory(cat.id)}
                            style={[styles.unarchiveButton, { backgroundColor: colors.surfaceSecondary }]}
                          >
                            <MaterialCommunityIcons
                              name="archive-arrow-up-outline"
                              size={16}
                              color={colors.primary}
                            />
                            <Text style={[styles.unarchiveText, { color: colors.primary }]}>
                              Restore
                            </Text>
                          </TouchableOpacity>
                          {renderDeleteCategoryButton(cat)}
                        </View>
                      </View>
                      {index < archivedCats.length - 1 && (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}
          </View>

          <DriveSyncSettings colors={colors} />

          {/* 3. Backup and Restore */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              DATA & BACKUPS
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
              <TouchableOpacity
                onPress={handleExportJSON}
                disabled={isExporting || isPickingBackup}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <View>
                    <Text style={[styles.actionLabel, { color: colors.text }]}>
                      Export JSON Backup
                    </Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                      {lastBackupDate
                        ? `Last prepared: ${new Date(lastBackupDate).toLocaleDateString()}`
                        : 'No JSON export recorded'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                onPress={handleExportCSV}
                disabled={isExporting || isPickingBackup}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <MaterialCommunityIcons
                    name="file-delimited-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <View>
                    <Text style={[styles.actionLabel, { color: colors.text }]}>
                      Export CSV Spreadsheet
                    </Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                      Table of expenses for Excel / Numbers
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                onPress={handlePickBackup}
                disabled={isExporting || isPickingBackup}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <MaterialCommunityIcons
                    name="file-download-outline"
                    size={22}
                    color={colors.warning}
                  />
                  <View>
                    <Text style={[styles.actionLabel, { color: colors.text }]}>
                      Restore from JSON Backup
                    </Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                      Select a previously exported file
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Privacy & Backup Warning Card */}
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={22}
                color={colors.primary}
                style={styles.noticeIcon}
              />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                Export a JSON backup to keep a recoverable copy of your data. Backup files contain readable expense data.
              </Text>
            </View>
          </View>

          {/* 4. About */}
          <View style={styles.aboutSection}>
            <Text style={[styles.aboutTitle, { color: colors.textTertiary }]}>
              Expense Tracker • V1.0.0 (Offline & Private)
            </Text>
          </View>
        </ScrollView>

        <BudgetEditModal
          colors={colors}
          visible={budgetModalVisible}
          title="Default Monthly Budget"
          currentBudgetCents={defaultBudgetCents}
          onSave={saveDefaultBudget}
          onClose={() => setBudgetModalVisible(false)}
        />

        {/* Category Edit / Create Modal */}
        <CategoryEditModal
          colors={colors}
          visible={categoryModalVisible}
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setCategoryModalVisible(false);
            setEditingCategory(null);
          }}
        />

        {/* Restore Confirmation Modal */}
        <ConfirmModal
          colors={colors}
          visible={backupPreview !== null}
          title="Replace data from backup?"
          message={backupPreview ? [
            backupPreview.name,
            `${backupPreview.data.expenses.length} expenses · ${backupPreview.data.categories.filter((category) => !category.isDeleted).length} categories`,
            `${backupPreview.data.budgets.length} budgets · ${backupPreview.data.recurringExpenses?.length ?? 0} recurring schedules`,
            'Restoring permanently replaces your current expenses, categories, budgets, and recurring schedules.',
          ].join('\n\n') : ''}
          confirmLabel="Replace Data"
          confirmDestructive={true}
          onConfirm={handleRestoreBackup}
          onCancel={() => setBackupPreview(null)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleLarge,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    ...nunito.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  optionLabel: {
    ...typography.body,
    ...nunito.regular,
  },
  preferenceLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  recurringEmpty: {
    ...typography.body,
    padding: spacing.lg,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  addButtonText: {
    ...typography.caption,
    ...nunito.bold,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    ...typography.body,
    ...nunito.regular,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedSection: {
    marginTop: spacing.md,
  },
  archivedTitle: {
    ...typography.caption,
    ...nunito.semibold,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  unarchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  unarchiveText: {
    ...typography.caption,
    ...nunito.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  actionLabel: {
    ...typography.body,
    ...nunito.semibold,
  },
  actionDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  noticeCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  aboutTitle: {
    ...typography.caption,
  },
});
