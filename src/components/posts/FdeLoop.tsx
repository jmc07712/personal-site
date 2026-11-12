'use client';

import { useId, useState } from 'react';
import styles from './interactive.module.css';

const stages = [
  {
    label: 'Understand',
    heading: 'Understand the work together',
    customer: '“We want an assistant that answers support questions.”',
    engineering:
      'Work through questions with a support specialist to understand how they find the right policy and check which version applies.',
    product:
      'Explore how the assistant could show the policy behind each answer within the tools the team already uses.',
    signal: 'Establish the current review time and the errors that make an answer unusable.',
  },
  {
    label: 'Build',
    heading: 'Build a first version the team can try',
    customer: 'A specialist tries a narrow prototype on real questions.',
    engineering:
      'Connect the approved documents, preserve access controls, show source passages, and let the specialist correct the draft.',
    product:
      'Review the prototype with the customer to see what works and where the product needs to improve.',
    signal: 'Can the specialist verify and use the answer with less work?',
  },
  {
    label: 'Learn',
    heading: 'Use feedback to improve the product',
    customer: '“The answer cites a policy, but it is last year’s policy.”',
    engineering:
      'Find out why the assistant used an old policy and add a check that catches the same mistake in future answers.',
    product:
      'Show the product team the failure so they can explore better support for document versions.',
    signal: 'Does the change fix stale-policy answers without breaking the cases that worked?',
  },
  {
    label: 'Extend',
    heading: 'Make the improvement useful to other teams',
    customer: 'The team gets a workflow it can use and a way to report failures.',
    engineering:
      'Support the rollout and work out which parts of the solution could be reused for other customers.',
    product:
      'If the need repeats, the product team can turn the learning into a capability other customers can use.',
    signal: 'Track customer outcomes and whether the next deployment needs less custom work.',
  },
] as const;

export function FdeLoop() {
  const id = useId();
  const [stage, setStage] = useState(0);
  const selected = stages[stage] ?? stages[0];

  return (
    <figure className={styles.figure} aria-labelledby={`${id}-caption`}>
      <figcaption id={`${id}-caption`} className={styles.caption}>
        <span className={styles.eyebrow}>01 / Explore an engagement</span>
        <strong className={styles.title}>Building a support assistant together</strong>
        <span>
          Follow a fictional engagement through the customer, engineering, and product work.
        </span>
      </figcaption>

      <svg
        className={styles.diagram}
        viewBox="0 0 600 208"
        role="img"
        aria-labelledby={`${id}-map`}
      >
        <title id={`${id}-map`}>
          Customers, forward deployed engineering, and product teams exchange feedback in both
          directions.
        </title>
        <path d="M170 100H240M360 100H430M100 134V178H500V134" className={styles.wire} />
        <path
          d="m178 96-8 4 8 4m54-8 8 4-8 4m136-8-8 4 8 4m54-8 8 4-8 4M96 142l4-8 4 8m392 0 4-8 4 8"
          className={styles.wire}
        />
        <rect x="30" y="64" width="140" height="70" className={styles.node} />
        <rect x="240" y="64" width="120" height="70" className={styles.activeNode} />
        <rect x="430" y="64" width="140" height="70" className={styles.node} />
        <g className={styles.diagramText} textAnchor="middle">
          <text x="100" y="105">
            Customer
          </text>
          <text x="300" y="105" className={styles.reverseText}>
            FDE
          </text>
          <text x="500" y="105">
            Product
          </text>
          <text x="300" y="35" className={styles.diagramNote}>
            Build together · learn together
          </text>
        </g>
      </svg>

      <div className={styles.steps} role="group" aria-label="Engagement steps">
        {stages.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={stage === index}
            aria-controls={`${id}-detail`}
            onClick={() => setStage(index)}
          >
            <span className={styles.stepNumber}>0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div id={`${id}-detail`} className={styles.detail} aria-live="polite" aria-atomic="true">
        <h3 className={styles.detailTitle}>{selected.heading}</h3>
        <dl className={styles.perspectives}>
          <div>
            <dt>Customer</dt>
            <dd>{selected.customer}</dd>
          </div>
          <div>
            <dt>Engineering</dt>
            <dd>{selected.engineering}</dd>
          </div>
          <div>
            <dt>Product</dt>
            <dd>{selected.product}</dd>
          </div>
        </dl>
        <p className={styles.signal}>
          <strong>Evidence to look for</strong>
          {selected.signal}
        </p>
      </div>
      <p className={styles.footnote}>
        This fictional example shows the process in order, although the steps often overlap and
        repeat.
      </p>
    </figure>
  );
}
