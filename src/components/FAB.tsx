import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import ReferenceIcon from './TabIcon';
import { actionFill, actionText, radius } from '../theme/theme';

interface FABProps {
  onPress: () => void;
}

export default function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add expense"
      onPress={onPress}
      style={styles.fab}
    >
      <ReferenceIcon name="add" size={32} color={actionText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    backgroundColor: actionFill,
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
