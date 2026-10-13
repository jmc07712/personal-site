import type { Span, SpanKind, YM } from '@/content/types';
import { formatDuration, formatYM, monthOffset, monthsBetween, resolveYM } from './dates';

/** A span positioned on the trace's time axis, in percent of the axis width. */
export interface TraceRow {
  id: string;
  depth: number;
  kind: SpanKind;
  leftPct: number;
  widthPct: number;
  /** For events: the point on the axis. */
  atPct?: number;
  approx: boolean;
}

/**
 * Lays spans out like a distributed-trace waterfall. The axis runs from the start of `start`
 * to the end of the current month. Children are clamped inside their parent so approximate
 * dates can never draw a system outside the role it belongs to. Both the DOM waterfall and the
 * GPU particle targets use this, so the two can't disagree.
 */
export function layoutTrace(spans: Span[], start: YM, now: Date): TraceRow[] {
  const axisMonths = monthOffset(start, resolveYM('now', now)) + 1;
  // Month positions are offsets from the axis start; a span ends at the end of its last month.
  const at = (ym: YM | 'now') => monthOffset(start, resolveYM(ym, now));
  const pct = (month: number) => (month / axisMonths) * 100;
  const byId = new Map(spans.map((s) => [s.id, s]));
  const parentOf = (s: Span) => (s.parent ? byId.get(s.parent) : undefined);

  const depth = (s: Span): number => {
    const parent = parentOf(s);
    return parent ? depth(parent) + 1 : 0;
  };

  const range = (s: Span): [number, number] => {
    if (!s.from || !s.to) throw new Error(`Span "${s.id}" needs from/to dates`);
    let from = at(s.from);
    let to = at(s.to) + 1;
    const parent = parentOf(s);
    if (parent?.from) {
      const [parentFrom, parentTo] = range(parent);
      from = Math.max(from, parentFrom);
      to = Math.min(to, parentTo);
    }
    return [from, to];
  };

  return spans.map((s) => {
    const base = { id: s.id, depth: depth(s), kind: s.kind, approx: Boolean(s.approx) };
    if (s.kind === 'event') {
      if (!s.at) throw new Error(`Event "${s.id}" needs an \`at\` month`);
      return { ...base, leftPct: 0, widthPct: 0, atPct: pct(at(s.at) + 0.5) };
    }
    const [from, to] = range(s);
    return { ...base, leftPct: pct(from), widthPct: pct(to) - pct(from) };
  });
}

/** January of every year strictly inside the axis, as percent offsets. */
export function yearTicks(start: YM, end: YM): { year: number; pct: number }[] {
  const axisMonths = monthOffset(start, end) + 1;
  const firstYear = Number(start.slice(0, 4)) + 1;
  const lastYear = Number(end.slice(0, 4));
  const ticks: { year: number; pct: number }[] = [];
  for (let year = firstYear; year <= lastYear; year++) {
    ticks.push({ year, pct: (monthOffset(start, `${year}-01`) / axisMonths) * 100 });
  }
  return ticks;
}

/** A trace row with the labels the UI shows next to it. */
export interface TraceViewRow extends TraceRow {
  name: string;
  /** "Sep 2018 to May 2021", "Aug 2022 to now", "2023 to 2025 (approx.)", or an event's month. */
  dates: string;
  /** "2 years 9 months"; null for events and approximate spans. */
  duration: string | null;
}

export interface TraceView {
  rows: TraceViewRow[];
  ticks: { year: number; pct: number }[];
  /** The month "now" resolved to when this view was built. */
  asOf: YM;
}

function spanLabels(span: Span, asOf: YM): Pick<TraceViewRow, 'dates' | 'duration'> {
  if (span.kind === 'event') {
    if (!span.at) throw new Error(`Event "${span.id}" needs an \`at\` month`);
    return { dates: formatYM(span.at), duration: null };
  }
  if (!span.from || !span.to) throw new Error(`Span "${span.id}" needs from/to dates`);
  const open = span.to === 'now';
  if (span.approx) {
    const end = open ? 'now' : span.to.slice(0, 4);
    return { dates: `${span.from.slice(0, 4)} to ${end} (approx.)`, duration: null };
  }
  return {
    dates: `${formatYM(span.from)} to ${open ? 'now' : formatYM(span.to)}`,
    duration: formatDuration(monthsBetween(span.from, open ? asOf : span.to)),
  };
}

/** Everything the Experience window renders: positioned rows, their labels, and year ticks. */
export function traceView(spans: Span[], start: YM, now: Date): TraceView {
  const asOf = resolveYM('now', now);
  const rows = layoutTrace(spans, start, now);
  return {
    asOf,
    ticks: yearTicks(start, asOf),
    rows: spans.map((span, i) => {
      const row = rows[i];
      if (!row) throw new Error(`No layout for span "${span.id}"`);
      return { ...row, name: span.name, ...spanLabels(span, asOf) };
    }),
  };
}
