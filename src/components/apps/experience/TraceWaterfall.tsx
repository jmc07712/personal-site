'use client';

import clsx from 'clsx';
import type { KeyboardEvent, ReactNode } from 'react';
import { PixelIcon } from '@/components/os/PixelIcon';
import type { TraceView, TraceViewRow } from '@/lib/trace';
import { barLabel, spanById } from './lookup';
import styles from './Experience.module.css';

interface TraceWaterfallProps {
  trace: TraceView;
  selected: string;
  onSelect: (id: string) => void;
  /** Enter or double-click on a row. */
  onActivate: (id: string, row: HTMLElement) => void;
  /** Extra content for a role's bar cell, such as the GPU region the particles pour into. */
  renderRoleBar?: (id: string) => ReactNode;
}

/** The career as a distributed-trace waterfall: roles as spans, systems as child spans. */
export function TraceWaterfall({
  trace,
  selected,
  onSelect,
  onActivate,
  renderRoleBar,
}: TraceWaterfallProps) {
  const ids = trace.rows.map((r) => r.id);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = ids.indexOf(selected);
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: ids.length - 1,
    };
    const target = targets[event.key];
    const next =
      target === undefined ? undefined : ids[Math.max(0, Math.min(target, ids.length - 1))];
    if (next) {
      event.preventDefault();
      onSelect(next);
      document.getElementById(`row-${next}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      const row = document.getElementById(`row-${selected}`);
      if (row) onActivate(selected, row);
    }
  };

  return (
    <div className={styles.trace}>
      <div className={clsx(styles.axis, 'pix')} aria-hidden="true">
        <div className={styles.axisHead}>
          <span>span</span>
          <span>duration</span>
        </div>
        <div className={styles.axisTicks}>
          {trace.ticks.map((tick) => (
            <span key={tick.year} className={styles.year} style={{ left: `${tick.pct}%` }}>
              {tick.year}
            </span>
          ))}
          <span className={styles.now}>now</span>
        </div>
      </div>
      <div
        className={styles.rows}
        role="listbox"
        tabIndex={0}
        aria-label="Career spans. Arrow keys move, Enter opens the case file."
        aria-activedescendant={`row-${selected}`}
        onKeyDown={onKeyDown}
      >
        <div className={styles.gridlines} aria-hidden="true">
          {trace.ticks.map((tick) => (
            <i key={tick.year} style={{ left: `${tick.pct}%` }} />
          ))}
        </div>
        {trace.rows.map((row) => (
          <div
            key={row.id}
            id={`row-${row.id}`}
            role="option"
            aria-selected={row.id === selected}
            className={clsx(styles.row, styles[`depth${row.depth}`])}
            onClick={() => onSelect(row.id)}
            onDoubleClick={(e) => onActivate(row.id, e.currentTarget)}
          >
            <span className={clsx(styles.label, 'pix')}>
              <span className={styles.rowName}>{row.name}</span>
              <span className={styles.duration}>
                {row.kind === 'event' ? 'event' : shortDuration(row)}
              </span>
            </span>
            <span className={styles.track}>
              <Bar row={row}>{row.kind === 'role' && renderRoleBar?.(row.id)}</Bar>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ row, children }: { row: TraceViewRow; children?: ReactNode }) {
  if (row.kind === 'event') {
    return (
      <span className={styles.event} style={{ left: `${row.atPct}%` }}>
        <PixelIcon name="diamond" scale={2} />
        <span className={clsx(styles.eventLabel, 'pix')}>{row.dates}</span>
      </span>
    );
  }
  const label = row.kind === 'system' ? barLabel(spanById(row.id)) : null;
  return (
    <span
      className={clsx(styles.bar, styles[row.kind])}
      style={{ left: `${row.leftPct}%`, width: `${row.widthPct}%` }}
      data-cutout={row.kind === 'role' ? row.id : undefined}
    >
      <b />
      {children}
      {label && (
        <span className={clsx(styles.barLabel, row.leftPct > 50 && styles.barLabelEnd, 'pix')}>
          {label}
        </span>
      )}
    </span>
  );
}

/** "2 years 9 months" → "2 y 9 mo", to fit the label column. */
function shortDuration(row: TraceViewRow): string {
  if (!row.duration) return 'approx.';
  return row.duration.replace(/ years?/, ' y').replace(/ months?/, ' mo');
}
