import { RepeatFrequency, RepeatUnit } from './types';

export const REPEAT_UNITS: RepeatUnit[] = ['day', 'week', 'month', 'year'];

export function isRepeatFrequency(value: unknown): value is RepeatFrequency {
  if (!value || typeof value !== 'object') return false;
  const { interval, unit } = value as RepeatFrequency;
  return Number.isInteger(interval) && interval >= 1 && interval <= 999 && REPEAT_UNITS.includes(unit);
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getNextRepeatDate(
  startDate: string,
  currentDate: string,
  { interval, unit }: RepeatFrequency,
): string {
  const date = new Date(`${currentDate}T00:00:00Z`);
  if (unit === 'day' || unit === 'week') {
    date.setUTCDate(date.getUTCDate() + interval * (unit === 'week' ? 7 : 1));
  } else {
    // Keep the original day of the month after shorter months.
    const anchorDay = Number(startDate.slice(8));
    const months = interval * (unit === 'year' ? 12 : 1);
    date.setUTCMonth(date.getUTCMonth() + months + 1, 0);
    date.setUTCDate(Math.min(anchorDay, date.getUTCDate()));
  }
  return date.toISOString().slice(0, 10);
}

export function formatRepeatFrequency({ interval, unit }: RepeatFrequency): string {
  return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
}
