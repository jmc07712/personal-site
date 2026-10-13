'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { createWM, wmReducer, type WM } from '@/lib/windowManager';
import { pathForWindow, windowForPath } from '@/lib/windowRoutes';

interface WindowManagerValue {
  state: WM;
  open: (id: string, opener?: HTMLElement | null) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  /** The element that opened a window, so focus can return there when it closes. */
  openerOf: (id: string) => HTMLElement | null;
}

const WindowManagerContext = createContext<WindowManagerValue | null>(null);

export const DESKTOP_WINDOWS = [
  'about',
  'experience',
  'writing',
  'counterdex',
  'docly',
  'dateescape',
  'contact',
] as const;

interface WindowManagerProps {
  /** Windows open on first render, in stacking order. A route like /work/x adds `case:x`. */
  initialOpen: string[];
  children: ReactNode;
}

/**
 * Owns which windows are open and their stacking order. Case files and posts also own a
 * URL, so opening one pushes /work/<slug> or /blog/<slug> and the back button closes it.
 */
export function WindowManager({ initialOpen, children }: WindowManagerProps) {
  const [state, dispatch] = useReducer(wmReducer, undefined, () =>
    createWM([...DESKTOP_WINDOWS], initialOpen),
  );
  const openers = useRef(new Map<string, HTMLElement>());
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const open = useCallback((id: string, opener?: HTMLElement | null) => {
    if (opener) openers.current.set(id, opener);
    dispatch({ type: 'open', id });
    const path = pathForWindow(id);
    if (path && window.location.pathname !== path) {
      window.history.pushState({ window: id }, '', path);
    }
  }, []);

  const close = useCallback((id: string) => {
    dispatch({ type: 'close', id });
    const path = pathForWindow(id);
    if (!path || window.location.pathname !== path) return;
    // Undo our own push when we made it. After a direct visit there's nothing to go back to,
    // so replace the URL with the desktop's instead.
    const pushedByUs = (window.history.state as { window?: string } | null)?.window === id;
    if (pushedByUs) window.history.back();
    else window.history.replaceState(null, '', '/');
  }, []);

  const focus = useCallback((id: string) => dispatch({ type: 'focus', id }), []);
  const move = useCallback(
    (id: string, x: number, y: number) => dispatch({ type: 'move', id, x, y }),
    [],
  );
  const openerOf = useCallback((id: string) => openers.current.get(id) ?? null, []);

  // Back and forward: make the routed windows match the URL.
  useEffect(() => {
    const onPopState = () => {
      const target = windowForPath(window.location.pathname);
      for (const win of Object.values(stateRef.current.wins)) {
        if (win.open && pathForWindow(win.id) && win.id !== target) {
          dispatch({ type: 'close', id: win.id });
        }
      }
      if (target && !stateRef.current.wins[target]?.open) dispatch({ type: 'open', id: target });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value = useMemo(
    () => ({ state, open, close, focus, move, openerOf }),
    [state, open, close, focus, move, openerOf],
  );
  return <WindowManagerContext value={value}>{children}</WindowManagerContext>;
}

export function useWindowManager(): WindowManagerValue {
  const value = useContext(WindowManagerContext);
  if (!value) throw new Error('useWindowManager must be used inside <WindowManager>');
  return value;
}
