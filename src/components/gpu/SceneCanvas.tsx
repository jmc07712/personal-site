'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useMediaQuery } from './browser';
import type { SceneRenderer } from './renderer';
import styles from './SceneCanvas.module.css';
import { useScene, useSceneHost } from './SceneProvider';
import { onResizeSettled, useIdleSleep, useOnScreen, useSceneRenderer } from './sceneHooks';
import { POCKET_MAX_WIDTH } from './sizing';

const DESKTOP_QUERY = `(min-width: ${POCKET_MAX_WIDTH + 1}px)`;
const POCKET_QUERY = `(max-width: ${POCKET_MAX_WIDTH}px)`;
/** A press on any of these is meant for the page, not the wallpaper. */
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role], [tabindex], [contenteditable]';

/**
 * The desktop scene: a fixed, full-viewport layer under every window. It never takes pointer
 * events; the cursor is followed from window-level listeners so the canvas can't block a click.
 */
function DesktopScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useMediaQuery(DESKTOP_QUERY);
  const { supported } = useScene();
  const { setActive } = useSceneHost();

  useEffect(() => {
    if (enabled) setActive(true);
  }, [enabled, setActive]);

  useSceneRenderer(canvasRef, false, enabled, (renderer) => {
    let last = { x: -1e5, y: -1e5 };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      last = { x: e.clientX, y: e.clientY };
      renderer.setPointer(e.clientX, e.clientY, true);
    };
    const leave = () => renderer.setPointer(last.x, last.y, false);
    const press = (e: PointerEvent) => {
      if (e.target instanceof Element && !e.target.closest(INTERACTIVE)) {
        renderer.ripple(e.clientX, e.clientY);
      }
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
  });

  return (
    <div className={clsx(styles.layer, !supported && styles.still)} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

/**
 * The pocket scene: a square screen in the page flow. It scrolls with the page (touch-action:
 * pan-y, so it never fights a swipe), runs only while on screen, answers a tap with a ripple,
 * and sleeps after 20 s without input until tapped.
 */
function PocketScene() {
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const enabled = useMediaQuery(POCKET_QUERY);
  const { supported, paused, togglePaused } = useScene();
  const { setActive, stillOnly } = useSceneHost();
  const [asleep, setAsleep] = useState(false);
  const onScreen = useOnScreen(screenRef, enabled);
  const animates = enabled && supported && !stillOnly;

  useIdleSleep(animates && !asleep && !paused, () => setAsleep(true));
  useEffect(() => {
    if (enabled) setActive(onScreen && !asleep);
  }, [enabled, onScreen, asleep, setActive]);

  useSceneRenderer(canvasRef, true, enabled, (renderer) => {
    rendererRef.current = renderer;
    const stopResize = onResizeSettled(() => renderer.resize());
    return () => {
      rendererRef.current = null;
      stopResize();
    };
  });

  const tap = (e: MouseEvent<HTMLDivElement>) => {
    if (!animates) return;
    setAsleep(false);
    if (paused) togglePaused();
    const screen = e.currentTarget.getBoundingClientRect();
    // A keyboard press on the wake button has no position: ripple from the centre.
    const fromKeyboard = e.detail === 0;
    rendererRef.current?.ripple(
      fromKeyboard ? screen.left + screen.width / 2 : e.clientX,
      fromKeyboard ? screen.top + screen.height / 2 : e.clientY,
    );
  };

  return (
    <div ref={screenRef} className={styles.screen} onClick={tap}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      {animates && (asleep || paused) && (
        <button type="button" className={styles.wake}>
          Tap to wake
        </button>
      )}
    </div>
  );
}

/**
 * The GPU scene. "desktop" is the wallpaper behind every window; "pocket" is the square screen
 * of Pocket mode. Render both: each only starts a renderer while its media query matches, so
 * exactly one runs at a time.
 */
export function SceneCanvas({ variant }: { variant: 'desktop' | 'pocket' }) {
  return variant === 'desktop' ? <DesktopScene /> : <PocketScene />;
}
