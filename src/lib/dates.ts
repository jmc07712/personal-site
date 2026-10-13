import type { YM } from '@/content/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parse(ym: YM): [year: number, month: number] {
  const [year = NaN, month = NaN] = ym.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Expected a YYYY-MM month, got "${ym}"`);
  }
  return [year, month];
}

/** Months since year zero, so subtracting two indices gives the gap in months. */
export function ymIndex(ym: YM): number {
  const [year, month] = parse(ym);
  return year * 12 + (month - 1);
}

/** Turns the open-ended `'now'` into the current UTC month. */
export function resolveYM(ym: YM | 'now', now: Date): YM {
  if (ym !== 'now') return ym;
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Calendar months covered by a span, counting both the first and last month. */
export function monthsBetween(from: YM, to: YM): number {
  return ymIndex(to) - ymIndex(from) + 1;
}

/** "2 y 8 mo", "1 y", "8 mo". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [years ? `${years} y` : '', rest ? `${rest} mo` : ''].filter(Boolean);
  return parts.length ? parts.join(' ') : '0 mo';
}

/** "Aug 2022". */
export function formatYM(ym: YM): string {
  const [year, month] = parse(ym);
  return `${MONTHS[month - 1]} ${year}`;
}
