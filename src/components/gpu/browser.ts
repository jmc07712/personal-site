/**
 * Browser state the scene reacts to, as external stores for useSyncExternalStore: they render
 * the same on the server and the first client pass, then update without effects that set state.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { SceneRenderer } from './renderer';

export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

function subscribeVisibility(notify: () => void): () => void {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
}

/** True while the tab is in the background. */
export function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );
}

/** Whether the visitor asked to save data (Chrome's Save-Data / Lite mode). */
function saveDataRequested(): boolean {
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean } };
  return connection?.saveData === true;
}

/** Reduced motion or Save-Data: show a still frame and never animate. */
export function usePrefersStill(): boolean {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const saveData = useSyncExternalStore(noSubscription, saveDataRequested, () => false);
  return reducedMotion || saveData;
}

function noSubscription(): () => void {
  return () => {};
}

// ------------------------------------------------------------------ the pause preference

const PAUSED_KEY = 'scene-paused';
const pausedListeners = new Set<() => void>();
/** In memory too, so the choice holds for the page even where storage is blocked. */
let pausedValue: boolean | null = null;

function readPaused(): boolean {
  if (pausedValue === null) {
    try {
      pausedValue = window.localStorage.getItem(PAUSED_KEY) === '1';
    } catch {
      pausedValue = false;
    }
  }
  return pausedValue;
}

function writePaused(paused: boolean): void {
  pausedValue = paused;
  try {
    window.localStorage.setItem(PAUSED_KEY, paused ? '1' : '0');
  } catch {
    // Storage is blocked (private mode, a strict policy): the choice lasts for this page only.
  }
  pausedListeners.forEach((notify) => notify());
}

function subscribePaused(notify: () => void): () => void {
  pausedListeners.add(notify);
  return () => pausedListeners.delete(notify);
}

/** The visitor's "Pause scene" choice, persisted across visits. */
export function usePausedPreference(): [boolean, (paused: boolean) => void] {
  const paused = useSyncExternalStore(subscribePaused, readPaused, () => false);
  return [paused, writePaused];
}

// ------------------------------------------------------------------ the boot, once a session

const BOOTED_KEY = 'booted';

export function bootedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(BOOTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBooted(): void {
  try {
    window.sessionStorage.setItem(BOOTED_KEY, '1');
  } catch {
    // Storage is blocked: the boot plays again next visit, which is harmless.
  }
}

// ------------------------------------------------------------------ WebGL2 support

let support: boolean | undefined;

/**
 * Probing WebGL2 creates a GL context, too slow to do during hydration. Until the probe has run
 * (when the browser is next idle) we assume support, which is true for nearly every visitor.
 */
function subscribeSupport(notify: () => void): () => void {
  if (support !== undefined) return () => {};
  return afterFirstPaint(() => {
    support = SceneRenderer.supported();
    notify();
  });
}

export function useWebGL2Support(): boolean {
  return useSyncExternalStore(
    subscribeSupport,
    () => support ?? true,
    () => true,
  );
}

/** Runs `callback` once the browser is idle after first paint. Returns a cancel function. */
export function afterFirstPaint(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 600 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 60);
  return () => window.clearTimeout(id);
}
