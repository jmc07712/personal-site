import clsx from 'clsx';
import type { CaseFile as CaseFileData } from '@/content/types';
import styles from './CaseFile.module.css';
import { Schematic } from './Schematic';

/** The body of a case-file window: problem, what I built, the architecture, decisions, impact. */
export function CaseFile({ file }: { file: CaseFileData }) {
  const headingId = `case-${file.slug}`;
  return (
    <article aria-labelledby={headingId}>
      <header className={styles.header}>
        <p className={clsx(styles.meta, 'pix')}>
          {file.role}, {file.when}
        </p>
        <h2 className={clsx(styles.title, 'pix')} id={headingId}>
          {file.title}
        </h2>
        <p className={styles.summary}>{file.summary}</p>
      </header>

      <section className={styles.section}>
        <h3 className={clsx(styles.heading, 'pix')}>The problem</h3>
        {file.problem.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <section className={styles.section}>
        <h3 className={clsx(styles.heading, 'pix')}>What I built</h3>
        <ul className={styles.list}>
          {file.built.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={clsx(styles.heading, 'pix')}>How it fits together</h3>
        <Schematic diagram={file.diagram} title={file.title} />
      </section>

      <section className={styles.section}>
        <h3 className={clsx(styles.heading, 'pix')}>Decisions</h3>
        <dl className={styles.decisions}>
          {file.decisions.map((decision) => (
            <div key={decision.title}>
              <dt className="pix">{decision.title}</dt>
              <dd>{decision.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {file.impact.length > 0 && (
        <section className={styles.section}>
          <h3 className={clsx(styles.heading, 'pix')}>Impact</h3>
          <dl className={styles.impact}>
            {file.impact.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd className="pix">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className={styles.stack}>
        <b>Stack</b> {file.stack.join(', ')}
      </p>
    </article>
  );
}
