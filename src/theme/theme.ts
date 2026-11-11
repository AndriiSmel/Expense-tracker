/**
 * Theme definitions for light and dark modes.
 * Spacing, typography, and color tokens.
 */

import { ThemeColors } from '../core/types';

// ─── Colors ──────────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F0F2',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
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
  primary: '#6366F1',
  primaryLight: '#1E1B4B',
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

export const typography = {
  /** Large financial amounts */
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  /** Medium financial amounts */
  displayMedium: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  /** Section titles */
  titleLarge: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  /** Card titles */
  titleMedium: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  /** Regular body text */
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  /** Secondary labels */
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  /** Small captions */
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
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

