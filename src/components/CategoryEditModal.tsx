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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Category, CategoryInput, ThemeColors } from '../core/types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../core/constants';
import { typography, spacing, radius } from '../theme/theme';

interface CategoryEditModalProps {
  colors: ThemeColors;
  visible: boolean;
  category: Category | null;
  onSave: (input: CategoryInput) => void;
  onClose: () => void;
}

export default function CategoryEditModal({
  colors,
  visible,
  category,
  onSave,
  onClose,
}: CategoryEditModalProps) {
  const isEditing = !!category;

  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);

  useEffect(() => {
    if (visible) {
      if (category) {
        setName(category.name);
        setColor(category.color);
        setIcon(category.icon);
      } else {
        setName('');
        setColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
        setIcon(CATEGORY_ICONS[0]);
      }
    }
  }, [visible, category]);

  const isValid = name.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      color,
      icon,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isEditing ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Preview */}
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.previewCircle,
                    { backgroundColor: color },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={[styles.previewName, { color: colors.text }]}>
                  {name.trim() || 'Category Name'}
                </Text>
              </View>

              {/* Name Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  CATEGORY NAME
                </Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      color: colors.text,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Subscriptions, Gifts..."
                  placeholderTextColor={colors.textTertiary}
                  maxLength={30}
                  autoFocus={!isEditing}
                />
              </View>

              {/* Color Picker */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  COLOR
                </Text>
                <View style={styles.colorGrid}>
                  {CATEGORY_COLORS.map((c) => {
                    const isSelected = c.toLowerCase() === color.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setColor(c)}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: c },
                          isSelected && styles.selectedColorSwatch,
                        ]}
                      >
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Icon Picker */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  ICON
                </Text>
                <View style={styles.iconGrid}>
                  {CATEGORY_ICONS.map((ic) => {
                    const isSelected = ic === icon;
                    return (
                      <TouchableOpacity
                        key={ic}
                        onPress={() => setIcon(ic)}
                        style={[
                          styles.iconItem,
                          {
                            backgroundColor: isSelected
                              ? color + '22'
                              : colors.surfaceSecondary,
                            borderColor: isSelected ? color : 'transparent',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={ic as any}
                          size={24}
                          color={isSelected ? color : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isValid}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: isValid ? colors.primary : colors.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: isValid ? '#FFFFFF' : colors.textTertiary },
                  ]}
                >
                  {isEditing ? 'Save Changes' : 'Create Category'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8882',
  },
  title: {
    ...typography.titleMedium,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  previewName: {
    ...typography.titleMedium,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  nameInput: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorSwatch: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconItem: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  saveButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
});

