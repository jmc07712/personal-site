'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  bootedThisSession,
  markBooted,
  useDocumentHidden,
  useMediaQuery,
  usePausedPreference,
  usePrefersStill,
  useWebGL2Support,
} from './browser';
import { copyRegions } from './regions';
import type { SceneMode, SceneRenderer } from './renderer';
import { POCKET_MAX_WIDTH, sceneOptionsFor } from './sizing';

export interface SceneState {
  /** The scene has drawn its first frame (or its CPU still). */
  ready: boolean;
  /** WebGL2 is available; assumed true until probed after first paint. */
  supported: boolean;
  paused: boolean;
  togglePaused(): void;
  mode: SceneMode;
  setMode(mode: SceneMode): void;
  /** Points in the current variant's simulation, for the caption. */
  pointCount: number;
  /** A canvas inside a window that shows the scene beneath it (see GpuRegion). Null unregisters. */
  registerRegion(id: string, canvas: HTMLCanvasElement | null): void;
}

/** The channel between the provider and whichever SceneCanvas variant is running. */
export interface SceneHost {
  /** Reduced motion or Save-Data: still frames only. */
  stillOnly: boolean;
  /** Hands over the variant's renderer, or null when it lets go. */
  attach(renderer: SceneRenderer | null): void;
  /** Whether the variant's scene is worth animating right now (on screen, awake). */
  setActive(active: boolean): void;
  /** The CPU still was drawn instead of a renderer. */
  fallbackDrawn(): void;
}

const SceneContext = createContext<SceneState | null>(null);
const SceneHostContext = createContext<SceneHost | null>(null);

/** Inputs that skip the boot, as on any OS: a click, a key, a scroll. */
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

export function useScene(): SceneState {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error('useScene must be used inside <SceneProvider>');
  return scene;
}

export function useSceneHost(): SceneHost {
  const host = useContext(SceneHostContext);
  if (!host) throw new Error('SceneCanvas must be used inside <SceneProvider>');
  return host;
}

/**
 * Owns the scene's lifecycle: whether it runs (paused, tab hidden, off screen, reduced motion),
 * which moment it shows (boot, wallpaper, experience), and the region copies that let windows
 * show the scene beneath them.
 */
export function SceneProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = usePausedPreference();
  const stillOnly = usePrefersStill();
  const hidden = useDocumentHidden();
  const supported = useWebGL2Support();
  const pocket = useMediaQuery(`(max-width: ${POCKET_MAX_WIDTH}px)`);
  const [renderer, setRenderer] = useState<SceneRenderer | null>(null);
  const [active, setActive] = useState(true);
  const [mode, setModeState] = useState<SceneMode>('wallpaper');
  const [ready, setReady] = useState(false);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const modeRef = useRef<SceneMode>('wallpaper');
  const regionsRef = useRef(new Map<string, HTMLCanvasElement>());
  const readyRef = useRef(false);
  // Read by attach(), which must keep a stable identity while these change.
  const latest = useRef({ paused, stillOnly });
  useEffect(() => {
    latest.current = { paused, stillOnly };
  }, [paused, stillOnly]);

  const setMode = useCallback((next: SceneMode) => {
    modeRef.current = next;
    setModeState(next);
    rendererRef.current?.setMode(next);
  }, []);

  const attach = useCallback(
    (next: SceneRenderer | null) => {
      rendererRef.current = next;
      setRenderer(next);
      if (!next) return;
      next.onFrame = (canvas) => {
        if (!readyRef.current) {
          readyRef.current = true;
          setReady(true);
        }
        const boxes = copyRegions(canvas, regionsRef.current.values());
        if (modeRef.current === 'experience') next.setBars(boxes);
      };
      next.onBootDone = () => {
        markBooted();
        if (modeRef.current === 'boot') setMode('wallpaper');
      };
      // The boot plays once a session, and only if it can run to the end.
      const { paused: isPaused, stillOnly: isStill } = latest.current;
      if (isPaused || isStill || bootedThisSession() || modeRef.current !== 'wallpaper') {
        next.skipBoot();
        markBooted();
        setMode(modeRef.current === 'boot' ? 'wallpaper' : modeRef.current);
      } else {
        setMode('boot');
      }
    },
    [setMode],
  );

  const host = useMemo<SceneHost>(
    () => ({ stillOnly, attach, setActive, fallbackDrawn: () => setReady(true) }),
    [stillOnly, attach],
  );

  const running = renderer !== null && !stillOnly && !paused && !hidden && active;
  useEffect(() => {
    if (!renderer) return;
    if (running) {
      renderer.start();
      return;
    }
    // A boot frozen half way would leave the page waiting on it; finish it unless the tab is
    // merely in the background, where it resumes on return.
    if (modeRef.current === 'boot' && !hidden) renderer.skipBoot();
    renderer.stop();
    renderer.renderStill();
  }, [renderer, running, hidden]);

  useEffect(() => {
    if (!renderer || mode !== 'boot') return;
    const skip = () => renderer.skipBoot();
    const options = { capture: true, passive: true };
    SKIP_EVENTS.forEach((type) => window.addEventListener(type, skip, options));
    return () => SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip, options));
  }, [renderer, mode]);

  const togglePaused = useCallback(() => setPaused(!paused), [paused, setPaused]);
  const registerRegion = useCallback((id: string, canvas: HTMLCanvasElement | null) => {
    if (canvas) regionsRef.current.set(id, canvas);
    else regionsRef.current.delete(id);
  }, []);

  const scene = useMemo<SceneState>(
    () => ({
      ready,
      supported,
      paused,
      togglePaused,
      mode,
      setMode,
      pointCount: sceneOptionsFor(pocket, stillOnly).particles,
      registerRegion,
    }),
    [ready, supported, paused, togglePaused, mode, setMode, pocket, stillOnly, registerRegion],
  );

  return (
    <SceneContext value={scene}>
      <SceneHostContext value={host}>{children}</SceneHostContext>
    </SceneContext>
  );
}
