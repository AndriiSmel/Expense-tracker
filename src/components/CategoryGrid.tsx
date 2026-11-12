import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Category, ThemeColors } from '../core/types';
import { nunito, actionFill, actionText, typography, spacing, radius } from '../theme/theme';

interface CategoryGridProps {
  colors: ThemeColors;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryGrid({
  colors,
  categories,
  selectedId,
  onSelect,
}: CategoryGridProps) {
  const { width, fontScale } = useWindowDimensions();
  const columns = width / fontScale >= 350 ? 3 : width / fontScale >= 215 ? 2 : 1;
  const itemWidth = (width - spacing['2xl'] * 2 - spacing.md * (columns - 1)) / columns;
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const isSelected = category.id === selectedId;
        return (
          <TouchableOpacity
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(category.id)}
            activeOpacity={0.7}
            style={[
              styles.item,
              {
                width: itemWidth,
                backgroundColor: isSelected ? actionFill : colors.surfaceSecondary,
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isSelected ? 'transparent' : colors.surface,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={category.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                size={22}
                color={isSelected ? actionText : category.color}
              />
            </View>
            <Text
              style={[
                styles.name,
                {
                  color: isSelected ? actionText : colors.text,
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    minHeight: 76,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: spacing['2xl'],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.bodySmall,
    ...nunito.bold,
    textAlign: 'center',
  },
});
