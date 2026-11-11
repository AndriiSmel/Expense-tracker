import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Category, ThemeColors } from '../core/types';
import { typography, spacing, radius } from '../theme/theme';

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
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const isSelected = category.id === selectedId;
        return (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelect(category.id)}
            activeOpacity={0.7}
            style={[
              styles.item,
              isSelected && {
                backgroundColor: category.color + '1A',
                borderColor: category.color,
              },
              !isSelected && {
                borderColor: 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isSelected ? category.color : category.color + '22',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={category.icon as any}
                size={22}
                color={isSelected ? '#FFFFFF' : category.color}
              />
            </View>
            <Text
              style={[
                styles.name,
                {
                  color: isSelected ? category.color : colors.text,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
              numberOfLines={1}
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
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
  item: {
    width: '31%', // 3 columns nicely fitting titles
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.caption,
    textAlign: 'center',
  },
});
