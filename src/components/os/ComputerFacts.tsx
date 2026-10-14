'use client';

import clsx from 'clsx';
import { useEffect, useState, version as reactVersion } from 'react';
import { useScene } from '@/components/gpu/SceneProvider';
import styles from './AboutComputer.module.css';
import { gpuLabel, uptimeLabel } from './machine';
import { useWindowManager } from './WindowManager';

/** How often the numbers refresh while the window is open. */
const REFRESH_MS = 500;

interface Readings {
  gpu: string;
  fps: string;
  display: string;
  scale: string;
  uptime: string;
}

/** The interface's scale factor, which large screens set in the --ui custom property. */
function uiScale(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--ui');
  return Number.parseFloat(value) || 1;
}

/** The frame rate, or why there isn't one yet. */
function frameRate(fps: number, paused: boolean, animated: boolean): string {
  if (fps > 0) return `${Math.round(fps)} fps`;
  if (paused) return 'Paused';
  return animated ? 'Starting' : 'Still frame';
}

/**
 * The live half of About This Computer: GPU, points, frame rate, display, uptime and versions,
 * read from the scene and the browser twice a second while the window is open. The server
 * renders placeholders, as it can't know the visitor's machine.
 */
export function ComputerFacts({ nextVersion }: { nextVersion: string }) {
  const { stats, supported, paused, animated, pointCount } = useScene();
  const open = useWindowManager().state.wins.computer?.open ?? false;
  const [readings, setReadings] = useState<Readings | null>(null);

  useEffect(() => {
    if (!open) return;
    const read = () => {
      const scene = stats();
      setReadings({
        gpu: scene ? gpuLabel(scene.gpu) : supported ? 'Starting' : 'None, so the CPU drew a still',
        fps: frameRate(scene?.fps ?? 0, paused, animated),
        display: `${window.innerWidth} × ${window.innerHeight}`,
        scale: `${uiScale()}×`,
        uptime: uptimeLabel(performance.now() / 1000),
      });
    };
    const first = requestAnimationFrame(read);
    const timer = window.setInterval(read, REFRESH_MS);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(timer);
    };
  }, [open, stats, supported, paused, animated]);

  const rows: [string, string][] = [
    ['GPU', readings?.gpu ?? '--'],
    ['Particles', supported ? pointCount.toLocaleString('en-US') : 'None'],
    ['Frame rate', readings?.fps ?? '--'],
    ['Display', readings?.display ?? '--'],
    ['UI scale', readings?.scale ?? '--'],
    ['Uptime', readings?.uptime ?? '--'],
    ['Next.js', nextVersion],
    // Next.js runs the App Router on its own React canary build; name it plainly.
    ['React', reactVersion.replace(/-canary-.*/, ' canary')],
  ];

  return (
    <dl className={clsx(styles.facts, 'pix')}>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.fact}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
