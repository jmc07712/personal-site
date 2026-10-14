'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from './browser';
import styles from './SceneCanvas.module.css';
import { SceneFollow } from './SceneFollow';
import { useScene, useSceneHost } from './SceneProvider';
import { onResizeSettled, useIdleSleep, useSceneRenderer, type Wire } from './sceneHooks';
import { DESKTOP_QUERY, POCKET_QUERY } from './sizing';

/** A press on any of these is meant for the page, not the wallpaper. */
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role], [tabindex], [contenteditable]';

const onWallpaper = (e: Event): boolean =>
  e.target instanceof Element && !e.target.closest(INTERACTIVE);

/** On a desktop the cursor leans the tools toward it, and a press on the wallpaper ripples. */
const wireDesktop: Wire = (renderer) => {
  let last = { x: -1e5, y: -1e5 };
  const move = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    last = { x: e.clientX, y: e.clientY };
    renderer.setPointer(e.clientX, e.clientY, true);
  };
  const leave = () => renderer.setPointer(last.x, last.y, false);
  const press = (e: PointerEvent) => {
    if (onWallpaper(e)) renderer.ripple(e.clientX, e.clientY);
  };
  // While paused the loop is stopped, but the fixed layer must still follow the page.
  const scroll = () => renderer.renderStill();
  const root = document.documentElement;
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', press, { passive: true });
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('blur', leave);
  root.addEventListener('pointerleave', leave);
  const stopResize = onResizeSettled(() => renderer.resize());
  return () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerdown', press);
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('blur', leave);
    root.removeEventListener('pointerleave', leave);
    stopResize();
  };
};

/** On a phone only a finished tap on the wallpaper ripples, so starting a scroll never does. */
const wirePocket: Wire = (renderer) => {
  const tap = (e: MouseEvent) => {
    if (onWallpaper(e)) renderer.ripple(e.clientX, e.clientY);
  };
  // Asleep, the loop is stopped, but the fixed layer must still follow the page.
  const scroll = () => renderer.renderStill();
  window.addEventListener('click', tap);
  window.addEventListener('scroll', scroll, { passive: true });
  const stopResize = onResizeSettled(() => renderer.resize());
  return () => {
    window.removeEventListener('click', tap);
    window.removeEventListener('scroll', scroll);
    stopResize();
  };
};

/**
 * The GPU scene, a fixed, full-viewport wallpaper under every window. It never takes pointer
 * events, so it can't block a click or a scroll; input reaches it from window-level listeners.
 * Phones get the calm pocket tier, which sleeps after 20 s without input until a touch wakes it.
 */
export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const pocket = useMediaQuery(POCKET_QUERY);
  // Both queries are false until hydration has read the real viewport.
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const { supported, paused, togglePaused } = useScene();
  const { setActive, stillOnly } = useSceneHost();
  const [asleep, setAsleep] = useState(false);
  const sleeps = pocket && supported && !stillOnly;

  useIdleSleep(sleeps && !asleep && !paused, () => setAsleep(true));
  useEffect(() => {
    setActive(!(sleeps && asleep));
  }, [sleeps, asleep, setActive]);
  useSceneRenderer(canvasRef, pocket, pocket || desktop, pocket ? wirePocket : wireDesktop);

  // A touch anywhere wakes the screen, as on a phone. The chip wakes it from its own click
  // instead, so it can't vanish under a finger and hand the tap to whatever lies beneath.
  useEffect(() => {
    if (!asleep) return;
    const wake = (e: Event) => {
      if (e.target !== chipRef.current) setAsleep(false);
    };
    const options = { capture: true, passive: true };
    window.addEventListener('pointerdown', wake, options);
    window.addEventListener('keydown', wake, options);
    return () => {
      window.removeEventListener('pointerdown', wake, options);
      window.removeEventListener('keydown', wake, options);
    };
  }, [asleep]);

  const wakeFromChip = () => {
    setAsleep(false);
    if (paused) togglePaused();
  };

  return (
    <>
      <div className={clsx(styles.layer, !supported && styles.still)} aria-hidden="true">
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      {sleeps && (asleep || paused) && (
        <button
          ref={chipRef}
          type="button"
          className={clsx(styles.wake, 'pix')}
          onClick={wakeFromChip}
        >
          Tap to wake
        </button>
      )}
      <SceneFollow pocket={pocket} asleep={sleeps && asleep} />
    </>
  );
}
