import { describe, expect, it } from 'vitest';
import { formatDuration, formatYM, monthsBetween, resolveYM, ymIndex } from '@/lib/dates';

describe('ymIndex', () => {
  it('counts months from year zero so differences are month gaps', () => {
    expect(ymIndex('2018-09') - ymIndex('2018-01')).toBe(8);
    expect(ymIndex('2019-01') - ymIndex('2018-12')).toBe(1);
  });
});

describe('monthsBetween', () => {
  it('includes both the start and end month', () => {
    expect(monthsBetween('2018-09', '2021-05')).toBe(33);
    expect(monthsBetween('2021-07', '2022-07')).toBe(13);
    expect(monthsBetween('2022-08', '2022-08')).toBe(1);
  });
});

describe('formatDuration', () => {
  it('formats years and months', () => expect(formatDuration(32)).toBe('2 y 8 mo'));
  it('drops a zero month part', () => expect(formatDuration(12)).toBe('1 y'));
  it('drops a zero year part', () => expect(formatDuration(8)).toBe('8 mo'));
  it('never returns an empty string', () => expect(formatDuration(0)).toBe('0 mo'));
});

describe('formatYM', () => {
  it('renders a short month and year', () => expect(formatYM('2022-08')).toBe('Aug 2022'));
});

describe('resolveYM', () => {
  it('passes concrete months through', () =>
    expect(resolveYM('2021-05', new Date())).toBe('2021-05'));
  it('resolves now in UTC', () =>
    expect(resolveYM('now', new Date('2026-10-12T12:00:00Z'))).toBe('2026-10'));
});
