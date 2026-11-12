/**
 * Theme definitions for light and dark modes.
 * Spacing, typography, and color tokens.
 */

import { ThemeColors } from '../core/types';

export const actionFill = '#F37F46';
export const actionText = '#221108';

// ─── Colors ──────────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F0F2',
  text: '#1C1C1E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  primary: '#A83D13',
  primaryLight: '#FFF0E8',
  border: '#E5E7EB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  successLight: '#ECFDF5',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors: ThemeColors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceSecondary: '#252540',
  text: '#F1F1F3',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  primary: '#F69D74',
  primaryLight: '#44271D',
  border: '#2D2D44',
  danger: '#F87171',
  dangerLight: '#3B1111',
  warning: '#FBBF24',
  warningLight: '#3B2F08',
  success: '#34D399',
  successLight: '#0B3B2D',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// ─── Spacing ─────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────

export const nunito = {
  regular: { fontFamily: 'NunitoSans-Regular' },
  semibold: { fontFamily: 'NunitoSans-SemiBold' },
  bold: { fontFamily: 'NunitoSans-Bold' },
  black: { fontFamily: 'NunitoSans-Black' },
} as const;

export const typography = {
  /** Large financial amounts */
  displayLarge: {
    fontSize: 32,
    ...nunito.bold,
    letterSpacing: -0.5,
  },
  /** Medium financial amounts */
  displayMedium: {
    fontSize: 24,
    ...nunito.bold,
    letterSpacing: -0.3,
  },
  /** Section titles */
  titleLarge: {
    fontSize: 20,
    ...nunito.semibold,
  },
  /** Card titles */
  titleMedium: {
    fontSize: 17,
    ...nunito.semibold,
  },
  /** Regular body text */
  body: {
    fontSize: 15,
    ...nunito.regular,
  },
  /** Secondary labels */
  bodySmall: {
    fontSize: 13,
    ...nunito.regular,
  },
  /** Small captions */
  caption: {
    fontSize: 11,
    ...nunito.regular,
    letterSpacing: 0.3,
  },
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

