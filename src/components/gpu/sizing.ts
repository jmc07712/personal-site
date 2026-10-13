import type { SceneOptions } from './renderer';

/** Points simulated on a laptop or desktop: 2^18. */
export const PARTICLES_DESKTOP = 262_144;
/** Points simulated in Pocket mode: 2^15, light enough not to warm a phone. */
export const PARTICLES_POCKET = 32_768;
/** The widest viewport that gets Pocket mode, matching the CSS breakpoint. */
export const POCKET_MAX_WIDTH = 768;
/** Which variant runs: the pocket screen at that width and below, the desktop layer above. */
export const POCKET_QUERY = `(max-width: ${POCKET_MAX_WIDTH}px)`;
export const DESKTOP_QUERY = `(min-width: ${POCKET_MAX_WIDTH + 1}px)`;

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
 * Renderer settings per variant. The desktop runs uncapped with the full raymarch; the pocket
 * screen is capped at 30fps with fewer points and steps so it stays cool on a phone.
 */
export function sceneOptionsFor(pocket: boolean, reducedMotion: boolean): SceneOptions {
  return pocket
    ? { particles: PARTICLES_POCKET, fpsCap: 30, pixel: 3, steps: 80, pocket, reducedMotion }
    : { particles: PARTICLES_DESKTOP, fpsCap: null, pixel: 3, steps: 140, pocket, reducedMotion };
}
