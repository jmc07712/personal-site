/** The hooks behind SceneCanvas: renderer lifecycle, idle sleep, visibility and resize. */
import { useEffect, useEffectEvent, useState, type RefObject } from 'react';
import { afterFirstPaint } from './browser';
import { drawFallback } from './fallback';
import { SceneRenderer } from './renderer';
import { useSceneHost } from './SceneProvider';
import { sceneOptionsFor } from './sizing';

/** The pocket screen sleeps after this long without input. */
const IDLE_MS = 20_000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

export type Wire = (renderer: SceneRenderer, canvas: HTMLCanvasElement) => () => void;

/**
 * Creates this variant's renderer once the browser is idle after first paint, while `enabled`
 * (its media query matches), and hands it to the provider. `wire` attaches the variant's input
 * listeners and returns their cleanup. Without WebGL2 the CPU still is drawn instead.
 */
export function useSceneRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  pocket: boolean,
  enabled: boolean,
  wire: Wire,
): void {
  const { attach, fallbackDrawn, stillOnly } = useSceneHost();
  const wireListeners = useEffectEvent(wire);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    let renderer: SceneRenderer | null = null;
    let unwire = () => {};
    const cancel = afterFirstPaint(() => {
      if (!SceneRenderer.supported()) {
        drawFallback(canvas);
        fallbackDrawn();
        return;
      }
      renderer = new SceneRenderer(canvas, sceneOptionsFor(pocket, stillOnly));
      attach(renderer);
      unwire = wireListeners(renderer, canvas);
    });
    return () => {
      cancel();
      unwire();
      if (renderer) {
        attach(null);
        renderer.dispose();
      }
    };
  }, [canvasRef, pocket, enabled, stillOnly, attach, fallbackDrawn]);
}

/** Debounces resize: the canvas and its buffers are reallocated once the window settles. */
export function onResizeSettled(callback: () => void): () => void {
  let timer = 0;
  const handler = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(callback, 80);
  };
  window.addEventListener('resize', handler);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('resize', handler);
  };
}

/** Sleeps after IDLE_MS without input. Any input restarts the countdown; only a tap wakes. */
export function useIdleSleep(enabled: boolean, onSleep: () => void): void {
  const sleep = useEffectEvent(onSleep);
  useEffect(() => {
    if (!enabled) return;
    let lastInput = performance.now();
    const note = () => {
      lastInput = performance.now();
    };
    const check = () => {
      const idle = performance.now() - lastInput;
      if (idle >= IDLE_MS) sleep();
      else timer = window.setTimeout(check, IDLE_MS - idle);
    };
    let timer = window.setTimeout(check, IDLE_MS);
    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, note, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, note));
    };
  }, [enabled]);
}

/** Tracks whether an element is in the viewport. */
export function useOnScreen(ref: RefObject<Element | null>, enabled: boolean): boolean {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled]);
  return onScreen;
}
