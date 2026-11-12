'use client';

import { useId, useRef, useState } from 'react';
import { evalCases, evalLabels, type EvalLabel } from '@/content/evalExample';
import styles from './interactive.module.css';

const steps = ['Read traces', 'Group errors', 'Write a check', 'Compare runs'];

export function EvalWorkbench() {
  const id = useId();
  const [step, setStep] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const [labels, setLabels] = useState<Record<string, EvalLabel>>({});
  const [useReference, setUseReference] = useState(false);
  const stepButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const traceSelect = useRef<HTMLSelectElement>(null);
  const goToCase = (index: number) => {
    setCaseIndex(index);
    traceSelect.current?.focus();
  };
  const goToStep = (index: number) => {
    setStep(index);
    stepButtons.current[index]?.focus();
  };
  const current = evalCases[caseIndex] ?? evalCases[0];
  const reviewed = Object.keys(labels).length;
  const beforePasses = evalCases.filter((item) => item.label === 'Pass').length;
  const afterPasses = evalCases.filter((item) => item.afterLabel === 'Pass').length;

  return (
    <figure className={styles.figure} aria-labelledby={`${id}-caption`}>
      <figcaption id={`${id}-caption`} className={styles.caption}>
        <span className={styles.eyebrow}>01 / Try the loop</span>
        <strong className={styles.title}>From a trace to a decision</strong>
        <span>Review six fictional support conversations, then inspect a proposed fix.</span>
      </figcaption>
      <div className={styles.steps} role="group" aria-label="Evaluation steps">
        {steps.map((label, index) => (
          <button
            key={label}
            ref={(element) => {
              stepButtons.current[index] = element;
            }}
            type="button"
            aria-pressed={step === index}
            aria-controls={`${id}-panel`}
            onClick={() => goToStep(index)}
          >
            <span className={styles.stepNumber}>0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div id={`${id}-panel`} className={styles.detail}>
        {step === 0 && (
          <>
            <div className={styles.toolbar}>
              <label htmlFor={`${id}-case`}>Trace</label>
              <select
                ref={traceSelect}
                id={`${id}-case`}
                value={caseIndex}
                onChange={(event) => setCaseIndex(Number(event.target.value))}
              >
                {evalCases.map((item, index) => (
                  <option key={item.id} value={index}>
                    {item.id} / {item.question}
                  </option>
                ))}
              </select>
            </div>
            <dl className={styles.trace}>
              <div>
                <dt>User</dt>
                <dd>{current.question}</dd>
              </div>
              <div>
                <dt>Retrieved evidence / tool result</dt>
                <dd>{current.evidence}</dd>
              </div>
              <div>
                <dt>Assistant</dt>
                <dd>{current.before}</dd>
              </div>
            </dl>
            <fieldset className={styles.choices}>
              <legend>How would you label this response?</legend>
              {evalLabels.map((label) => (
                <label key={label}>
                  <input
                    type="radio"
                    name={`${id}-label`}
                    value={label}
                    checked={labels[current.id] === label}
                    onChange={() => setLabels((previous) => ({ ...previous, [current.id]: label }))}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <div aria-live="polite" className={styles.feedback}>
              {labels[current.id] ? (
                <p>
                  The example label is <strong>{current.label.toLowerCase()}</strong>.{' '}
                  {current.reason}
                </p>
              ) : (
                <p>Read the evidence before choosing. A plausible answer may still fail.</p>
              )}
              <span>
                {reviewed} of {evalCases.length} traces labeled by you.
              </span>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.button}
                disabled={caseIndex === 0}
                onClick={() => goToCase(caseIndex - 1)}
              >
                Previous trace
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() =>
                  caseIndex < evalCases.length - 1 ? goToCase(caseIndex + 1) : goToStep(1)
                }
              >
                {caseIndex < evalCases.length - 1 ? 'Next trace' : 'Group errors'}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className={styles.detailTitle}>Count specific failures</h3>
            <p>
              This exercise provides categories to help you get started. When reviewing your own
              application, write notes first and group similar problems as you find them.
            </p>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={useReference}
                onChange={(event) => setUseReference(event.target.checked)}
              />
              Use the example labels for all six traces
            </label>
            <p className={styles.small}>
              {useReference
                ? 'Showing all 6 example labels.'
                : `Showing your labels for ${reviewed} of 6 traces. ${evalCases.length - reviewed} unreviewed.`}
            </p>
            <div className={styles.bars}>
              {evalLabels.map((label) => {
                const count = evalCases.filter(
                  (item) => (useReference ? item.label : labels[item.id]) === label,
                ).length;
                return (
                  <div key={label} className={styles.barRow}>
                    <span>{label}</span>
                    <div className={styles.barTrack} aria-hidden="true">
                      <span style={{ width: `${(count / evalCases.length) * 100}%` }} />
                    </div>
                    <strong>{count} / 6</strong>
                  </div>
                );
              })}
            </div>
            <p className={styles.signal}>
              <strong>Choose what matters</strong>Unsupported claims appear twice, while the
              unconfirmed cancellation appears once. Consider both how often each failure happens
              and how it affects the user when deciding what to fix first.
            </p>
            <button type="button" className={styles.button} onClick={() => goToStep(2)}>
              Turn a failure into a check
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className={styles.detailTitle}>Decide what a passing answer needs</h3>
            <div className={styles.checkCard}>
              <span className={styles.eyebrow}>Failure / unsupported policy claim</span>
              <p>
                A response <strong>passes</strong> when every policy claim is supported by an
                applicable source and the assistant makes any missing information clear.
              </p>
              <p>
                A response <strong>fails</strong> if it invents a policy, applies one to the wrong
                plan, or treats missing information as proof that something does not exist.
              </p>
            </div>
            <p>
              Code can check that an answer includes a citation, while a person or a validated model
              judge can assess whether the source supports what the answer says.
            </p>
            <p className={styles.signal}>
              <strong>Candidate change</strong>Revise the instructions so the assistant uses
              retrieved policies and explains when information is missing, then compare the results
              across all six examples.
            </p>
            <button type="button" className={styles.button} onClick={() => goToStep(3)}>
              Inspect the candidate
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className={styles.detailTitle}>A better total can still hide a regression</h3>
            <div className={styles.scores}>
              <div>
                <span>Original</span>
                <strong>{beforePasses} / 6</strong>
                <span>traces pass</span>
              </div>
              <span className={styles.scoreArrow} aria-hidden="true">
                →
              </span>
              <div>
                <span>Candidate</span>
                <strong>{afterPasses} / 6</strong>
                <span>traces pass</span>
              </div>
            </div>
            <ul className={styles.results}>
              {evalCases.map((item) => (
                <li key={item.id}>
                  <details>
                    <summary>
                      <span className={styles.resultId}>{item.id}</span>
                      <span>{item.question}</span>
                      <span className={styles.resultState}>
                        {item.label === 'Pass'
                          ? item.afterLabel === 'Pass'
                            ? 'Still passes'
                            : 'Regression'
                          : item.afterLabel === 'Pass'
                            ? 'Fixed'
                            : 'Still fails'}
                      </span>
                    </summary>
                    <div className={styles.resultDetail}>
                      <p>
                        <strong>Original response</strong>
                        <br />
                        {item.before}
                      </p>
                      <p>
                        <strong>Candidate response</strong>
                        <br />
                        {item.after}
                      </p>
                      <p>{item.change}</p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            <p className={styles.signal}>
              <strong>What would you do next?</strong>Review the new error in trace 05 and the
              unresolved cancellation failure before trying another change. Use the existing checks
              and fresh examples to see whether the next version improves.
            </p>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                goToStep(0);
                setCaseIndex(0);
                setLabels({});
                setUseReference(false);
              }}
            >
              Restart the exercise
            </button>
          </>
        )}
      </div>
      <p className={styles.footnote}>
        The conversations and results are fictional examples written for this exercise, which runs
        without a model. They illustrate the process without establishing production reliability.
      </p>
    </figure>
  );
}
