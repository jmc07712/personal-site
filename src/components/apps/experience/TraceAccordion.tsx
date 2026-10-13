'use client';

import * as Accordion from '@radix-ui/react-accordion';
import clsx from 'clsx';
import type { TraceView, TraceViewRow } from '@/lib/trace';
import { caseFileForSpan, spanById } from './lookup';
import styles from './TraceAccordion.module.css';

interface TraceAccordionProps {
  trace: TraceView;
  onOpenCase: (slug: string, opener: HTMLElement) => void;
}

/**
 * Pocket mode's version of the trace: newest role first, tap a role to see its systems,
 * tap a system to see its numbers. Radix handles the disclosure semantics and keyboard support.
 */
export function TraceAccordion({ trace, onOpenCase }: TraceAccordionProps) {
  const roles = trace.rows.filter((r) => r.kind === 'role').reverse();
  const event = trace.rows.find((r) => r.kind === 'event');
  const childrenOf = (id: string) =>
    trace.rows.filter((r) => spanById(r.id)?.parent === id).reverse();

  return (
    <Accordion.Root type="multiple" className={styles.root}>
      {roles.map((role) => (
        <Accordion.Item key={role.id} value={role.id} className={styles.role}>
          <Accordion.Header asChild>
            <h3 className={styles.header}>
              <Accordion.Trigger className={styles.trigger}>
                <span className={clsx(styles.name, 'pix')}>{role.name}</span>
                <span className={styles.dates}>{role.dates}</span>
                <span className={styles.share} aria-hidden="true">
                  <i style={{ marginLeft: `${role.leftPct}%`, width: `${role.widthPct}%` }} />
                </span>
              </Accordion.Trigger>
            </h3>
          </Accordion.Header>
          <Accordion.Content className={styles.content}>
            <p className={styles.summary}>{spanById(role.id)?.summary}</p>
            <Accordion.Root type="single" collapsible className={styles.systems}>
              {childrenOf(role.id).map((system) => (
                <SystemItem key={system.id} row={system} onOpenCase={onOpenCase} />
              ))}
            </Accordion.Root>
          </Accordion.Content>
        </Accordion.Item>
      ))}
      {event && (
        <p className={clsx(styles.event, 'pix')}>
          {spanById(event.id)?.title}, {event.dates}
        </p>
      )}
    </Accordion.Root>
  );
}

function SystemItem({
  row,
  onOpenCase,
}: {
  row: TraceViewRow;
  onOpenCase: TraceAccordionProps['onOpenCase'];
}) {
  const span = spanById(row.id);
  const caseFile = caseFileForSpan(row.id);
  if (!span) return null;
  return (
    <Accordion.Item value={row.id} className={styles.system}>
      <Accordion.Header asChild>
        <h4 className={styles.header}>
          <Accordion.Trigger className={styles.trigger}>
            <span className={clsx(styles.systemName, 'pix')}>{row.name}</span>
            <span className={styles.dates}>{row.dates}</span>
          </Accordion.Trigger>
        </h4>
      </Accordion.Header>
      <Accordion.Content className={styles.content}>
        {span.metrics.length > 0 && (
          <dl className={styles.metrics}>
            {span.metrics.map((metric) => (
              <div key={metric.label}>
                <dd className="pix">{metric.value}</dd>
                <dt>{metric.label}</dt>
              </div>
            ))}
          </dl>
        )}
        <p className={styles.summary}>{span.summary}</p>
        {caseFile && (
          <button
            type="button"
            className="btn"
            data-variant="solid"
            onClick={(e) => onOpenCase(caseFile.slug, e.currentTarget)}
          >
            Read the case file
          </button>
        )}
      </Accordion.Content>
    </Accordion.Item>
  );
}
