import clsx from 'clsx';
import type { TraceViewRow } from '@/lib/trace';
import { caseFileForSpan, spanById } from './lookup';
import styles from './Experience.module.css';

interface InspectorProps {
  row: TraceViewRow | undefined;
  onOpenCase: (slug: string, opener: HTMLElement) => void;
}

/** The selected span's numbers, like a span's attributes in a tracing UI. */
export function Inspector({ row, onOpenCase }: InspectorProps) {
  const span = row && spanById(row.id);
  if (!row || !span) return <div className={styles.inspector} />;
  const parent = span.parent ? spanById(span.parent) : undefined;
  const caseFile = caseFileForSpan(span.id);
  const context = span.org ?? parent?.org ?? parent?.name;

  return (
    <div className={styles.inspector} aria-live="polite">
      {context && <p className={styles.context}>{context}</p>}
      <h3 className={clsx(styles.inspectorTitle, 'pix')}>{span.name}</h3>
      <p className={clsx(styles.meta, 'pix')}>
        {[span.title, row.dates, row.duration].filter(Boolean).join(', ')}
      </p>
      {span.metrics.length > 0 && (
        <dl className={styles.metrics}>
          {span.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className="pix">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className={styles.summary}>{span.summary}</p>
      {span.stack && (
        <p className={styles.stack}>
          <b>Stack</b> {span.stack.join(', ')}
        </p>
      )}
      {caseFile && (
        <button
          type="button"
          className={clsx('btn', styles.openCase)}
          data-variant="solid"
          data-opens={`case:${caseFile.slug}`}
          onClick={(e) => onOpenCase(caseFile.slug, e.currentTarget)}
        >
          Open case file
        </button>
      )}
    </div>
  );
}
