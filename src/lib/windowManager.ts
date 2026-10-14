/**
 * Window state for the desktop, as a pure reducer so it can be unit-tested without a DOM.
 * Stacking uses an ever-increasing counter: raising a window gives it the next z value.
 */

export interface Win {
  id: string;
  open: boolean;
  z: number;
  /**
   * How many times the window has been asked to open. Opening one that is already open still
   * counts, so the window can scroll into view and take focus when the user asks for it again.
   */
  opens: number;
  /** Where the user dragged it, in CSS px from its default position. */
  pos?: { x: number; y: number };
}

export interface WM {
  wins: Record<string, Win>;
  /** The highest z handed out so far. */
  z: number;
  focused: string | null;
}

export type WMAction =
  | { type: 'open'; id: string }
  | { type: 'close'; id: string }
  | { type: 'focus'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'closeAll' }
  /** Forgets every dragged position, so each window goes back to its slot. */
  | { type: 'cleanUp' };

export function createWM(ids: string[], open: string[]): WM {
  const wins: Record<string, Win> = {};
  for (const id of ids) wins[id] = { id, open: false, z: 0, opens: 0 };
  let z = 0;
  for (const id of open) wins[id] = { id, open: true, z: ++z, opens: 0 };
  return { wins, z, focused: open.at(-1) ?? null };
}

/** The open window drawn on top, or null when the desktop is empty. */
export function topOpen(state: WM): string | null {
  let top: Win | null = null;
  for (const win of Object.values(state.wins)) {
    if (win.open && (!top || win.z > top.z)) top = win;
  }
  return top?.id ?? null;
}

/** Whether any window sits somewhere the user dragged it. */
export function anyMoved(state: WM): boolean {
  return Object.values(state.wins).some((win) => win.pos);
}

function raise(state: WM, win: Win): WM {
  const z = state.z + 1;
  return { wins: { ...state.wins, [win.id]: { ...win, z } }, z, focused: win.id };
}

/** A copy of the state with `change` applied to every window, or the same state if none changed. */
function eachWindow(state: WM, change: (win: Win) => Win): WM {
  let changed = false;
  const wins: Record<string, Win> = {};
  for (const [id, win] of Object.entries(state.wins)) {
    wins[id] = change(win);
    changed ||= wins[id] !== win;
  }
  return changed ? { ...state, wins } : state;
}

export function wmReducer(state: WM, action: WMAction): WM {
  if (action.type === 'closeAll') {
    const next = eachWindow(state, (win) => (win.open ? { ...win, open: false } : win));
    return next === state ? state : { ...next, focused: null };
  }
  if (action.type === 'cleanUp') {
    return eachWindow(state, (win) => (win.pos ? { ...win, pos: undefined } : win));
  }
  const win = state.wins[action.id];
  switch (action.type) {
    case 'open': {
      const current = win ?? { id: action.id, open: false, z: 0, opens: 0 };
      return raise(state, { ...current, open: true, opens: current.opens + 1 });
    }
    case 'focus':
      if (!win?.open || win.z === state.z) return state;
      return raise(state, win);
    case 'close': {
      if (!win?.open) return state;
      const next = { ...state, wins: { ...state.wins, [win.id]: { ...win, open: false } } };
      return { ...next, focused: topOpen(next) };
    }
    case 'move':
      if (!win) return state;
      return {
        ...state,
        wins: { ...state.wins, [win.id]: { ...win, pos: { x: action.x, y: action.y } } },
      };
  }
}
