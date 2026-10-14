import type { SceneOptions } from './renderer';

/** Points simulated on a laptop or desktop: 2^18. */
export const PARTICLES_DESKTOP = 262_144;
/** Points simulated in Pocket mode: 2^15, light enough not to warm a phone. */
export const PARTICLES_POCKET = 32_768;
/** The widest viewport that gets Pocket mode, matching the CSS breakpoint. */
export const POCKET_MAX_WIDTH = 768;
/** The calm pocket scene runs at that width and below, the full desktop scene above it. */
export const POCKET_QUERY = `(max-width: ${POCKET_MAX_WIDTH}px)`;
export const DESKTOP_QUERY = `(min-width: ${POCKET_MAX_WIDTH + 1}px)`;

/**
 * A phone shows one column, read a window at a time, and the window being read is the one
 * crossing this band of the screen (fractions of its height). The dock marks that window's
 * section and the points follow it, so a short window scrolled to the top doesn't lose them to a
 * long one below.
 */
export const READING_BAND = { top: 0.35, bottom: 0.45 } as const;

const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;

/** READING_BAND as an IntersectionObserver rootMargin, so the observer sees only that band. */
export const READING_BAND_MARGIN = `-${percent(READING_BAND.top)} 0px -${percent(1 - READING_BAND.bottom)} 0px`;

/** Records a month served by the Insights API: the number each point stands in for. */
const RECORDS_PER_MONTH = 1.2e9;

/** The particle tier for a viewport width: Pocket mode at 768px and below. */
export function particlesFor(viewportWidth: number): number {
  return viewportWidth <= POCKET_MAX_WIDTH ? PARTICLES_POCKET : PARTICLES_DESKTOP;
}

/** How many of the Insights API's monthly records one point stands for, e.g. "4,578". */
export function recordsPerPoint(count: number): string {
  return Math.round(RECORDS_PER_MONTH / count).toLocaleString('en-US');
}

/**
 * Renderer settings per tier. The desktop runs uncapped and raymarches in full; the phone
 * wallpaper is capped at 30fps with fewer points and steps so it stays cool in the hand.
 */
export function sceneOptionsFor(pocket: boolean, reducedMotion: boolean): SceneOptions {
  return pocket
    ? { particles: PARTICLES_POCKET, fpsCap: 30, pixel: 3, steps: 80, pocket, reducedMotion }
    : { particles: PARTICLES_DESKTOP, fpsCap: null, pixel: 3, steps: 140, pocket, reducedMotion };
}
