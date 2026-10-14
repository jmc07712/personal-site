'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useScene } from '@/components/gpu/SceneProvider';
import styles from './BootLog.module.css';
import { BOOTING_CLASS } from './bootCurtain';
import { gpuLabel } from './machine';

/** A new line starts this often... */
const LINE_MS = 420;
/** ...and types one character this often. */
const CHAR_MS = 14;
const TICK_MS = 30;

/** A line of the log: a label and its value, or a plain message when there is no value. */
interface Line {
  label: string;
  value?: string;
}

/** The log, from what the scene really set up. */
function bootLines(gpu: string, particles: number, windows: number): Line[] {
  return [
    { label: 'Bitmap BIOS 2.0' },
    { label: 'GPU', value: gpuLabel(gpu) },
    { label: 'Particles', value: `${particles.toLocaleString('en-US')} allocated` },
    { label: 'Shaders', value: '3 programs compiled' },
    { label: 'Windows', value: `${windows} mounted` },
    { label: 'Starting the agent hub' },
  ];
}

/**
 * A BIOS-style log typed out in the bottom-left corner while the particle boot plays. It only
 * watches: it starts when the boot does, only if the boot curtain is up (so never on phones),
 * and fades as the curtain lifts and the desktop appears.
 */
export function BootLog() {
  const { mode, stats, pointCount } = useScene();
  const [log, setLog] = useState<{ lines: Line[]; elapsed: number } | null>(null);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    if (mode !== 'boot') return;
    if (!document.documentElement.classList.contains(BOOTING_CLASS)) return;
    const start = performance.now();
    const lines = bootLines(
      stats()?.gpu ?? 'WebGL2',
      pointCount,
      document.querySelectorAll('[id^="win-"]').length,
    );
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - start;
      setLog({ lines, elapsed });
      if (elapsed > lines.length * LINE_MS) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [mode, stats, pointCount]);

  if (!log || faded) return null;
  return (
    <div
      className={clsx(styles.log, 'pix')}
      aria-hidden="true"
      onAnimationEnd={() => setFaded(true)}
    >
      {log.lines.map(({ label, value }, i) => {
        const typed = Math.max(0, Math.floor((log.elapsed - i * LINE_MS) / CHAR_MS));
        if (typed === 0) return null;
        if (value === undefined) {
          return (
            <span key={label} className={styles.message}>
              {label.slice(0, typed)}
            </span>
          );
        }
        return [
          <span key={label}>{label.slice(0, typed)}</span>,
          <span key={`${label}-value`}>{value.slice(0, Math.max(0, typed - label.length))}</span>,
        ];
      })}
    </div>
  );
}
