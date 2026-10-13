import clsx from 'clsx';
import { identity } from '@/content/resume';
import styles from './About.module.css';
import { OpenWindowButton } from './OpenWindowButton';

const FACTS = [
  { value: '5,000', label: 'sellers use the Pitching Agent I architected' },
  { value: '100s of PB', label: 'a month through 2,000+ Spark jobs I orchestrate' },
  { value: '1.2B', label: 'records a month through the Insights API' },
];

export function About() {
  return (
    <>
      <h1 className={clsx(styles.name, 'pix')} id="about-name">
        {identity.name}
      </h1>
      <p className={styles.lede}>{identity.positioning}</p>
      <dl className={styles.facts}>
        {FACTS.map((fact) => (
          <div key={fact.value}>
            <dt>{fact.label}</dt>
            <dd className="pix">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.more}>
        {identity.about.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
      <div className={clsx(styles.actions, 'pix')}>
        <OpenWindowButton window="experience" className="btn" variant="solid">
          Open experience
        </OpenWindowButton>
        <a className="btn" href={`mailto:${identity.email}`}>
          Email me
        </a>
        <a className="btn" href={identity.linkedin} rel="me noreferrer" target="_blank">
          LinkedIn
        </a>
        <a className="btn" href={identity.github} rel="me noreferrer" target="_blank">
          GitHub
        </a>
      </div>
    </>
  );
}

export function AboutStatus() {
  return (
    <>
      <span>
        Now: {identity.employer}, {identity.level}
      </span>
      <a className={styles.source} href={identity.source}>
        Source
      </a>
    </>
  );
}
