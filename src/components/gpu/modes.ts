/**
 * Which moment the scene shows, decided from what is on screen. Pure, so the rules can be tested:
 * Shut Down overrides everything; the boot plays undisturbed; then the role bars win while the
 * career trace is on screen; then a halo round whichever window covers the most of the viewport,
 * if it covers more than the hero; otherwise the wallpaper.
 */
import type { SceneMode } from './renderer';

export interface ModeInputs {
  /** Shut Down was chosen. Only a reload brings the scene back. */
  shutdown?: boolean;
  booting: boolean;
  /** The career trace is open and on screen. */
  trace: boolean;
  /** A window below the hero is being followed (see followTarget). */
  following: boolean;
}

export function sceneModeFor({ shutdown, booting, trace, following }: ModeInputs): SceneMode {
  if (shutdown) return 'shutdown';
  if (booting) return 'boot';
  if (trace) return 'experience';
  return following ? 'follow' : 'wallpaper';
}

/**
 * The window to follow: of the windows on screen (px² visible, by id), the one covering the most
 * of the viewport, provided it covers more than the hero does. Null when the hero wins or no
 * window is on screen.
 */
export function followTarget(windows: ReadonlyMap<string, number>, hero: number): string | null {
  let best: string | null = null;
  let bestArea = Math.max(0, hero);
  for (const [id, area] of windows) {
    if (area > bestArea) {
      best = id;
      bestArea = area;
    }
  }
  return best;
}

/** Px² of the viewport the page's first screen still covers. That screen is the hub's stage. */
export function heroArea(scrollY: number, viewport: { width: number; height: number }): number {
  const visible = Math.min(viewport.height, viewport.height - scrollY);
  return Math.max(0, visible) * viewport.width;
}
