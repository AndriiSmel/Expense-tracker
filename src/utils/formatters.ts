/**
 * Formatting utilities for currency, dates, and percentages.
 * Portable — no React Native dependencies.
 */

import { CURRENCY_SYMBOLS, CurrencyCode, DEFAULT_CURRENCY } from '../core/constants';

/** Format cents with the selected currency symbol. */
export function formatCurrency(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const isNegative = cents < 0;
  const formatted = (Math.abs(cents) / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${CURRENCY_SYMBOLS[currency]}${formatted}`;
}

/**
 * Format cents to a compact display (no decimals for whole amounts).
 * Example: 15000 → "€150", 15099 → "€150.99", -15000 → "-€150"
 */
export function formatCurrencyCompact(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const amount = absCents / 100;
  const formatted = absCents % 100 === 0
    ? amount.toLocaleString('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : amount.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${isNegative ? '-' : ''}${CURRENCY_SYMBOLS[currency]}${formatted}`;
}

/**
 * Parse a user-entered amount string to cents.
 * Accepts both comma and period as decimal separators.
 * Supports up to two decimal places.
 * Returns null if invalid or <= 0.
 */
export function parseAmountToCents(input: string): number | null {
  if (!input || input.trim() === '') return null;

  // Normalize: replace comma with period
  let normalized = input.trim().replace(',', '.');

  // If user typed e.g. ".50", convert to "0.50"
  if (normalized.startsWith('.')) {
    normalized = '0' + normalized;
  }

  // Remove any non-numeric characters except period
  normalized = normalized.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = normalized.split('.');
  if (parts.length > 2) return null;

  // Reject more than two decimal places
  if (parts[1] && parts[1].length > 2) return null;

  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed <= 0) return null;

  const cents = Math.round(parsed * 100);
  if (cents <= 0) return null;
  if (cents > 99999999) return null; // Max ~€999,999.99

  return cents;
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 * Example: "2024-03-15" → "15 Mar 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date string for short display.
 * Example: "2024-03-15" → "15 Mar"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get the current month key as YYYY-MM.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format a month key for display.
 * Example: "2024-03" → "March 2024"
 */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Navigate to the previous or next month.
 */
export function shiftMonth(monthKey: string, direction: -1 | 1): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + direction);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format a percentage.
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Generate a UUID v4.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get ISO timestamp string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}
