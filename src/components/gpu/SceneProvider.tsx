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
import { sceneModeFor, type ModeInputs } from './modes';
import type { Rect } from './rect';
import { copyRegions } from './regions';
import type { SceneMode, SceneRenderer } from './renderer';
import { POCKET_QUERY, sceneOptionsFor } from './sizing';

export interface SceneState {
  /** The scene has drawn its first frame (or its CPU still). */
  ready: boolean;
  /** WebGL2 is available; assumed true until probed after first paint. */
  supported: boolean;
  paused: boolean;
  /** The scene moves: false while paused, and for reduced motion or Save-Data (stills only). */
  animated: boolean;
  togglePaused(): void;
  /** The moment on show, decided here from what is on screen (see modes.ts). */
  mode: SceneMode;
  /** Experience reports whether its career trace is open and on screen. */
  setTraceVisible(visible: boolean): void;
  /** The window the points follow, in viewport px, or null. SceneFollow calls it every frame. */
  setFollow(rect: Rect | null): void;
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
 * which moment it shows (boot, wallpaper, experience, follow), and the region copies that let
 * windows show the scene beneath them.
 */
export function SceneProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = usePausedPreference();
  const stillOnly = usePrefersStill();
  const hidden = useDocumentHidden();
  const supported = useWebGL2Support();
  const pocket = useMediaQuery(POCKET_QUERY);
  const [renderer, setRenderer] = useState<SceneRenderer | null>(null);
  const [active, setActive] = useState(true);
  const [mode, setModeState] = useState<SceneMode>('wallpaper');
  const [ready, setReady] = useState(false);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const modeRef = useRef<SceneMode>('wallpaper');
  // What the mode is decided from. A ref, as SceneFollow reports every frame.
  const inputs = useRef<ModeInputs>({ booting: false, trace: false, following: false });
  const regionsRef = useRef(new Map<string, HTMLCanvasElement>());
  const readyRef = useRef(false);
  // Read by attach(), which must keep a stable identity while these change.
  const latest = useRef({ paused, stillOnly });
  useEffect(() => {
    latest.current = { paused, stillOnly };
  }, [paused, stillOnly]);

  /** Folds a change in what's on screen into the mode, and tells the renderer if it changed. */
  const arbitrate = useCallback((change: Partial<ModeInputs>) => {
    Object.assign(inputs.current, change);
    const next = sceneModeFor(inputs.current);
    if (next === modeRef.current) return;
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
        arbitrate({ booting: false });
      };
      // The boot plays once a session, from the top of the page, and only if it can run to the end.
      const { paused: isPaused, stillOnly: isStill } = latest.current;
      const boots =
        !isPaused && !isStill && !bootedThisSession() && modeRef.current === 'wallpaper';
      if (!boots) {
        next.skipBoot();
        markBooted();
      }
      // A new renderer starts in 'wallpaper': catch it up, unless it is a boot it never began.
      if (modeRef.current !== 'boot') next.setMode(modeRef.current);
      arbitrate({ booting: boots });
    },
    [arbitrate],
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
  const setTraceVisible = useCallback(
    (visible: boolean) => arbitrate({ trace: visible }),
    [arbitrate],
  );
  const setFollow = useCallback(
    (rect: Rect | null) => {
      rendererRef.current?.setFollow(rect);
      arbitrate({ following: rect !== null });
    },
    [arbitrate],
  );
  const registerRegion = useCallback((id: string, canvas: HTMLCanvasElement | null) => {
    if (canvas) regionsRef.current.set(id, canvas);
    else regionsRef.current.delete(id);
  }, []);

  const scene = useMemo<SceneState>(
    () => ({
      ready,
      supported,
      paused,
      animated: !paused && !stillOnly,
      togglePaused,
      mode,
      setTraceVisible,
      setFollow,
      pointCount: sceneOptionsFor(pocket, stillOnly).particles,
      registerRegion,
    }),
    [
      ready,
      supported,
      paused,
      stillOnly,
      togglePaused,
      mode,
      setTraceVisible,
      setFollow,
      pocket,
      registerRegion,
    ],
  );

  return (
    <SceneContext value={scene}>
      <SceneHostContext value={host}>{children}</SceneHostContext>
    </SceneContext>
  );
}
