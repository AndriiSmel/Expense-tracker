/**
 * Default categories, colors, and app constants.
 * Portable — no React Native dependencies.
 */

import { CategoryInput } from './types';

// ─── Default Categories ──────────────────────────────────────────────

export interface DefaultCategory extends CategoryInput {
  id: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'groceries',      name: 'Groceries',         color: '#4CAF50', icon: 'cart-outline' },
  { id: 'eating-out',     name: 'Eating Out & Coffee', color: '#FF9800', icon: 'coffee-outline' },
  { id: 'transport',      name: 'Transport',          color: '#2196F3', icon: 'bus' },
  { id: 'rent-utilities', name: 'Rent & Utilities',   color: '#9C27B0', icon: 'home-outline' },
  { id: 'shopping',       name: 'Shopping',           color: '#E91E63', icon: 'shopping-outline' },
  { id: 'entertainment',  name: 'Entertainment',      color: '#F44336', icon: 'movie-open-outline' },
  { id: 'health',         name: 'Health',             color: '#00BCD4', icon: 'medical-bag' },
  { id: 'subscriptions',  name: 'Subscriptions',      color: '#607D8B', icon: 'cellphone' },
  { id: 'travel',         name: 'Travel',             color: '#FF5722', icon: 'airplane' },
  { id: 'other',          name: 'Other',              color: '#795548', icon: 'dots-horizontal-circle-outline' },
];

// ─── Budget Defaults ─────────────────────────────────────────────────

export const DEFAULT_BUDGET_CENTS = 200000;

export const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF ',
  CAD: 'CA$',
  AUD: 'A$',
  INR: '₹',
  PLN: 'PLN ',
  SEK: 'SEK ',
  NOK: 'NOK ',
  DKK: 'DKK ',
} as const;

export type CurrencyCode = keyof typeof CURRENCY_SYMBOLS;
export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

// ─── Backup Version ──────────────────────────────────────────────────

export const BACKUP_VERSION = 2;

// ─── Database ────────────────────────────────────────────────────────

export const DB_NAME = 'expense-tracker.db';
export const SCHEMA_VERSION = 1;

// ─── Category Color Palette (for new categories) ─────────────────────

export const CATEGORY_COLORS = [
  '#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#E91E63',
  '#F44336', '#00BCD4', '#607D8B', '#FF5722', '#795548',
  '#3F51B5', '#009688', '#CDDC39', '#FFC107', '#8BC34A',
  '#673AB7', '#03A9F4', '#FFEB3B', '#FF6F00', '#546E7A',
];

// ─── Available Icons ─────────────────────────────────────────────────

export const CATEGORY_ICONS = [
  'cart-outline',
  'coffee-outline',
  'bus',
  'home-outline',
  'shopping-outline',
  'movie-open-outline',
  'medical-bag',
  'cellphone',
  'airplane',
  'dots-horizontal-circle-outline',
  'food-fork-drink',
  'car-outline',
  'train',
  'bicycle',
  'dumbbell',
  'book-outline',
  'music-note',
  'gamepad-variant-outline',
  'gift-outline',
  'paw',
  'baby-carriage',
  'school-outline',
  'tools',
  'flower-outline',
  'lightning-bolt',
  'water-outline',
  'wifi',
  'cash-multiple',
  'credit-card-outline',
  'basket-outline',
];

