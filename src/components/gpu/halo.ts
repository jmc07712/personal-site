/**
 * The follow moment: below the hero, the points leave the hub and gather in a dithered halo
 * hugging the outside of the window the visitor is reading, and chase it when it moves. A point's
 * place in the halo comes from constants it already has (see seedMeta): its phase says how far
 * round the frame it sits, and its clamped Gaussian lateral offset how far outside, so the halo is
 * densest at the frame and thins out to nothing over HALO_REACH px. The simulation shader mirrors
 * haloPoint(); this copy is the tested reference and sizes the ink.
 */
import { LATERAL_LIMIT } from './formations';
import { clamp01, fract } from './math';
import type { Rect } from './rect';

/** Px between the frame and the halo's densest edge. */
export const HALO_GAP = 2;
/** Px from the frame to the halo's outer edge. */
export const HALO_REACH = 34;
/** How fast the halo creeps clockwise round its window, px/s, so it reads as particles. */
export const HALO_DRIFT = 10;

/** How far outside the frame a point sits. |lateral| is half-normal, so most sit near the frame. */
export function haloDistance(lateral: number): number {
  const k = Math.min(Math.abs(lateral), LATERAL_LIMIT) / LATERAL_LIMIT;
  return HALO_GAP + k * (HALO_REACH - HALO_GAP);
}

/** The length of the outline d px outside a rect: its four sides plus four quarter circles. */
export const haloPerimeter = (r: Rect, d: number): number => 2 * (r.w + r.h) + 2 * Math.PI * d;

/**
 * The point d px outside `r`, `t` (0..1) of the way round it clockwise from the top-left corner.
 * The outline is the rect grown by d with rounded corners, so every point is exactly d from the
 * frame and equal steps of t are equal distances along it.
 */
export function haloPoint(r: Rect, t: number, d: number): { x: number; y: number } {
  const arc = (Math.PI / 2) * d;
  let s = fract(t) * haloPerimeter(r, d);
  // Walk the sides clockwise on screen (y down), each followed by its corner's arc.
  let x = r.x;
  let y = r.y;
  let dx = 1;
  let dy = 0;
  for (const side of [r.w, r.h, r.w, r.h]) {
    // Outward is the walking direction turned a quarter anticlockwise.
    const nx = dy;
    const ny = -dx;
    if (s < side) return { x: x + dx * s + nx * d, y: y + dy * s + ny * d };
    s -= side;
    x += dx * side;
    y += dy * side;
    if (s < arc) {
      const a = s / d;
      return {
        x: x + d * (nx * Math.cos(a) + dx * Math.sin(a)),
        y: y + d * (ny * Math.cos(a) + dy * Math.sin(a)),
      };
    }
    s -= arc;
    [dx, dy] = [-dy, dx];
  }
  // Rounding carried s to the full perimeter, which is the start again.
  return { x: r.x, y: r.y - d };
}

/**
 * The width a uniform band at the halo's edge tone would need to hold all its points: one over
 * the peak density of the half-normal distances (px).
 */
const EDGE_WIDTH = ((HALO_REACH - HALO_GAP) / LATERAL_LIMIT) * Math.sqrt(Math.PI / 2);

/** CSS px² the halo round `r` covers at its edge tone, for the ink budget (0 without a window). */
export function haloArea(r: Rect | null): number {
  return r ? 2 * (Math.max(0, r.w) + Math.max(0, r.h)) * EDGE_WIDTH : 0;
}

/** Seconds for the points to stream from the hub into a halo, or back. */
const FOLLOW_SECONDS = 1.6;
/** Seconds for the halo to stream from one window to the next. */
const HOP_SECONDS = 1.3;
/** Page px a followed window can move in one frame and still be the same window being dragged. */
const HOP_DISTANCE = 160;

const jumped = (a: Rect, b: Rect): boolean => Math.hypot(b.x - a.x, b.y - a.y) > HOP_DISTANCE;

/**
 * The halo as the simulation tracks it: which window it hugs (page px, so scrolling leaves it
 * attached to the page), how far the points have streamed into it, and any hop under way from
 * one window to the next.
 */
export class FollowFormation {
  /** The followed window, page px. Kept after it is let go, so the points can leave it smoothly. */
  rect: Rect | null = null;
  /** The window a hop is leaving, page px. */
  from: Rect | null = null;
  /** Whether a window is followed right now. */
  following = false;
  /** 0 = every point elsewhere, 1 = every point in the halo. */
  mix = 0;
  /** 0..1 through a hop from `from` to `rect`; 1 when there is none. */
  hop = 1;

  /** The window to follow (page px), or null to let go. A jump to another window starts a hop. */
  update(rect: Rect | null): void {
    this.following = rect !== null;
    if (!rect) return;
    if (this.rect && this.mix > 0 && jumped(this.rect, rect)) {
      this.from = this.rect;
      this.hop = 0;
    }
    this.rect = { ...rect };
  }

  /** Eases the points into the halo (or out of it) and along any hop. */
  step(dt: number, wanted: boolean): void {
    this.mix = clamp01(this.mix + (wanted ? dt : -dt) / FOLLOW_SECONDS);
    this.hop = this.mix > 0 ? clamp01(this.hop + dt / HOP_SECONDS) : 1;
  }

  /** For still frames: finish at once. True if anything changed, so points must snap. */
  jump(wanted: boolean): boolean {
    const target = wanted ? 1 : 0;
    const changed = this.mix !== target || this.hop !== 1;
    this.mix = target;
    this.hop = 1;
    return changed;
  }
}
