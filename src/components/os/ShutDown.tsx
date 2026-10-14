'use client';

import clsx from 'clsx';
import { useEffect, useSyncExternalStore } from 'react';
import { useScene } from '@/components/gpu/SceneProvider';
import { REDUCED_MOTION_QUERY } from '@/lib/useMedia';
import { topOpen } from '@/lib/windowManager';
import { restart } from './SceneChrome';
import styles from './ShutDown.module.css';
import { useWindowManager } from './WindowManager';

/**
 * on: running. closing: windows close one by one. collapsing: the points fall into the core.
 * crt: the picture shrinks to a line, then a dot. off: the safe-to-turn-off screen.
 */
type Power = 'on' | 'closing' | 'collapsing' | 'crt' | 'off';

/** The pause between one window closing and the next. */
const CLOSE_GAP_MS = 140;
/** Keys that don't count as "any key" on the off screen. */
const IGNORED_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'Tab']);

// The power state lives outside React so the menubar can start Shut Down and this overlay can
// play it without a shared parent.
let power: Power = 'on';
const listeners = new Set<() => void>();

function setPower(next: Power) {
  power = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** Shut Down, from the menus. With reduced motion it goes straight to the last screen. */
export function shutDown() {
  if (power !== 'on') return;
  setPower(window.matchMedia(REDUCED_MOTION_QUERY).matches ? 'off' : 'closing');
}

/**
 * Plays Shut Down: close every window, topmost first, pull every point into the core, switch
 * off like an old CRT, then wait on "It's now safe to turn off your computer." Power on, or any
 * key, restarts the page, which replays the boot.
 */
export function ShutDown() {
  const stage = useSyncExternalStore(
    subscribe,
    () => power,
    () => 'on' as const,
  );
  const { state, close } = useWindowManager();
  const { shutDown: collapse } = useScene();

  useEffect(() => {
    if (stage !== 'closing') return;
    const top = topOpen(state);
    if (!top) {
      setPower('collapsing');
      return;
    }
    const timer = window.setTimeout(() => close(top), CLOSE_GAP_MS);
    return () => window.clearTimeout(timer);
  }, [stage, state, close]);

  useEffect(() => {
    if (stage === 'closing') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage]);

  useEffect(() => {
    if (stage !== 'collapsing') return;
    let current = true;
    void collapse().then(() => current && setPower('crt'));
    return () => {
      current = false;
    };
  }, [stage, collapse]);

  const dark = stage === 'crt' || stage === 'off';
  useEffect(() => {
    if (!dark) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = '';
    };
  }, [dark]);

  useEffect(() => {
    if (stage !== 'off') return;
    const onKey = (event: KeyboardEvent) => {
      if (!IGNORED_KEYS.has(event.key) && !event.repeat) restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);

  if (stage === 'on') return null;
  return (
    <div className={clsx(styles.screen, styles[stage])}>
      {stage === 'crt' && <div className={styles.beam} onAnimationEnd={() => setPower('off')} />}
      {stage === 'off' && (
        <div
          className={clsx(styles.off, 'pix')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="power-off"
        >
          <h2 id="power-off">It&rsquo;s now safe to turn off your computer.</h2>
          <button type="button" className={styles.power} onClick={restart} autoFocus>
            Power on
          </button>
          <p>Or press any key.</p>
        </div>
      )}
    </div>
  );
}
