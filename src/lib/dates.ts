import {
  differenceInCalendarMonths,
  format,
  formatDuration as formatDurationFns,
  isValid,
  parse,
} from 'date-fns';
import type { YM } from '@/content/types';

/** Parses a `YYYY-MM` month, failing loudly on typos in content. */
export function parseYM(ym: YM): Date {
  const date = parse(ym, 'yyyy-MM', new Date(2000, 0, 1));
  if (!/^\d{4}-\d{2}$/.test(ym) || !isValid(date)) {
    throw new Error(`Expected a YYYY-MM month, got "${ym}"`);
  }
  return date;
}

/** Signed number of calendar months from `from` to `to`. */
export function monthOffset(from: YM, to: YM): number {
  return differenceInCalendarMonths(parseYM(to), parseYM(from));
}

/** Calendar months covered by a span, counting both the first and last month. */
export function monthsBetween(from: YM, to: YM): number {
  return monthOffset(from, to) + 1;
}

/** Turns the open-ended `'now'` into the current UTC month. */
export function resolveYM(ym: YM | 'now', now: Date): YM {
  return ym === 'now' ? now.toISOString().slice(0, 7) : ym;
}

/** "2 years 8 months", "1 year", "8 months". */
export function formatDuration(months: number): string {
  const label = formatDurationFns(
    { years: Math.floor(months / 12), months: months % 12 },
    { format: ['years', 'months'] },
  );
  return label || '0 months';
}

/** "Aug 2022". */
export function formatYM(ym: YM): string {
  return format(parseYM(ym), 'MMM yyyy');
}
