import { describe, expect, it } from 'vitest';
import type { Span } from '@/content/types';
import { layoutTrace, traceView, yearTicks } from '@/lib/trace';

const now = new Date('2026-10-12T12:00:00Z');
const span = (s: Partial<Span> & Pick<Span, 'id' | 'kind'>): Span => ({
  name: s.id,
  summary: '',
  metrics: [],
  ...s,
});

const spans: Span[] = [
  span({ id: 'career', kind: 'root', from: '2018-09', to: 'now' }),
  span({ id: 'lab', kind: 'role', parent: 'career', from: '2018-09', to: '2021-05' }),
  span({ id: 'degree', kind: 'event', parent: 'career', at: '2021-05' }),
  span({ id: 'x', kind: 'system', parent: 'lab', from: '2017-01', to: '2030-01', approx: true }),
];

describe('layoutTrace', () => {
  const rows = layoutTrace(spans, '2018-09', now);
  const byId = (id: string) => rows.find((r) => r.id === id)!;

  it('keeps input order', () => expect(rows.map((r) => r.id)).toEqual(spans.map((s) => s.id)));

  it('stretches the root across the whole axis', () => {
    expect(byId('career').leftPct).toBe(0);
    expect(byId('career').widthPct).toBeCloseTo(100, 5);
  });

  it('derives depth from the parent chain', () =>
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 1, 2]));

  it('places events at a point with no width', () => {
    expect(byId('degree').widthPct).toBe(0);
    expect(byId('degree').atPct).toBeGreaterThan(byId('lab').leftPct);
    expect(byId('degree').atPct).toBeLessThan(100);
  });

  it('clamps children inside their parent', () => {
    const lab = byId('lab');
    const x = byId('x');
    expect(x.leftPct).toBeCloseTo(lab.leftPct, 5);
    expect(x.leftPct + x.widthPct).toBeCloseTo(lab.leftPct + lab.widthPct, 5);
  });

  it('carries the approximate flag', () => {
    expect(byId('x').approx).toBe(true);
    expect(byId('lab').approx).toBe(false);
  });
});

describe('yearTicks', () => {
  const ticks = yearTicks('2018-09', '2026-10');
  it('marks each January inside the range', () => {
    expect(ticks.map((t) => t.year)).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  });
  it('keeps ticks inside the axis', () =>
    expect(ticks.every((t) => t.pct > 0 && t.pct < 100)).toBe(true));
});

describe('traceView', () => {
  const view = traceView(
    [
      span({ id: 'career', kind: 'root', from: '2018-09', to: 'now' }),
      span({ id: 'lab', kind: 'role', parent: 'career', from: '2018-09', to: '2021-05' }),
      span({ id: 'degree', kind: 'event', parent: 'career', at: '2021-05' }),
      span({
        id: 'x',
        kind: 'system',
        parent: 'lab',
        from: '2019-01',
        to: '2020-12',
        approx: true,
      }),
      span({ id: 'job', kind: 'role', parent: 'career', from: '2022-08', to: 'now' }),
    ],
    '2018-09',
    new Date('2026-10-12T12:00:00Z'),
  );
  const row = (id: string) => view.rows.find((r) => r.id === id)!;

  it('labels exact spans with months and years', () => {
    expect(row('lab').dates).toBe('Sep 2018 to May 2021');
    expect(row('lab').duration).toBe('2 years 9 months');
  });

  it('labels open-ended spans as running to now', () => {
    expect(row('job').dates).toBe('Aug 2022 to now');
    expect(row('job').duration).toBe('4 years 3 months');
  });

  it('labels approximate spans with years only', () => {
    expect(row('x').dates).toBe('2019 to 2020 (approx.)');
    expect(row('x').duration).toBeNull();
  });

  it('labels events with their month and no duration', () => {
    expect(row('degree').dates).toBe('May 2021');
    expect(row('degree').duration).toBeNull();
  });

  it('records the month the view was computed for', () => expect(view.asOf).toBe('2026-10'));

  it('includes year ticks up to now', () => expect(view.ticks.at(-1)?.year).toBe(2026));
});
