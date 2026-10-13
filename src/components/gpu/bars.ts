/**
 * The Experience moment: points pour out of the hub into the career trace's role bars. Each point
 * owns a slot (a bar and a position inside it) so the bars fill evenly and keep their shape when
 * the window is dragged.
 */
import { clamp01 } from './math';
import { area, type Rect } from './rect';
import type { Rng } from './rng';

/** The most bars the shaders accept; the trace has three roles. */
export const MAX_BARS = 8;

/** Viewport px a bar must clear at the top before points pour in (the menubar and a margin). */
const TOP_CLEARANCE = 90;

/**
 * Writes each point's bar slot into `targets` (z = bar index + u, w = v, both 0..1), in
 * proportion to the bars' areas so every bar reaches the same tone. The last bar is the current
 * role: like the waterfall's open-ended bar, its right edge thins out instead of stopping hard.
 */
export function writeBarSlots(targets: Float32Array, rects: readonly Rect[], rng: Rng): void {
  const count = targets.length / 4;
  const bars = rects.slice(0, MAX_BARS);
  if (bars.length === 0) return;
  const areas = bars.map(area);
  const total = areas.reduce((sum, a) => sum + a, 0);
  const shares = total > 0 ? areas.map((a) => a / total) : areas.map(() => 1 / bars.length);
  const lastWidth = bars.at(-1)?.w || 200;
  let i = 0;
  shares.forEach((share, bar) => {
    const last = bar === bars.length - 1;
    const n = last ? count - i : Math.min(count - i, Math.round(count * share));
    // Beyond `taper` (the last ~18px), keep a sample with probability falling linearly to 0.
    const taper = last ? 1 - 18 / Math.max(36, lastWidth) : 2;
    for (let k = 0; k < n; k++, i++) {
      let u = rng();
      while (u > taper && rng() > (1 - u) / (1 - taper)) u = rng();
      targets[i * 4 + 2] = bar + Math.min(u, 0.9995);
      targets[i * 4 + 3] = rng();
    }
  });
}

/** Each bar's share of the total area: when these drift, the slots are re-dealt. */
export function barShares(rects: readonly Rect[]): number[] {
  const areas = rects.slice(0, MAX_BARS).map(area);
  const total = areas.reduce((sum, a) => sum + a, 0);
  return areas.map((a) => (total > 0 ? a / total : 0));
}

/**
 * Whether the bars are on screen enough to pour into. Points commit once a quarter of the bars has
 * scrolled into view below the menubar, then stay while any of it is visible, so the pour doesn't
 * flicker at the threshold. `box` and the viewport are in viewport px.
 */
export function barsInView(box: Rect | null, viewportHeight: number, engaged: boolean): boolean {
  if (!box || box.w <= 0 || box.h <= 0) return false;
  const bottom = box.y + box.h;
  if (engaged) return bottom > 0 && box.y < viewportHeight;
  return box.y < viewportHeight - Math.min(box.h, viewportHeight) * 0.25 && bottom > TOP_CLEARANCE;
}

/** Packs bar rects into the shader's vec4 array, shifted from viewport to page px. */
export function packBars(
  out: Float32Array,
  rects: readonly Rect[],
  scrollX: number,
  scrollY: number,
): void {
  out.fill(0);
  rects
    .slice(0, MAX_BARS)
    .forEach((r, i) => out.set([r.x + scrollX, r.y + scrollY, r.w, r.h], i * 4));
}

/** Seconds for the points to pour from the hub into the bars, or back. */
const POUR_SECONDS = 1.7;
const MAX_BAR_SPEED = 3000;
const clampSpeed = (v: number) => Math.max(-MAX_BAR_SPEED, Math.min(MAX_BAR_SPEED, v));
const sameRect = (a: Rect, b: Rect | undefined) =>
  b !== undefined && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/**
 * The bars as the simulation tracks them: where they are, how far the pour has got, and how
 * fast they are moving.
 */
export class BarFormation {
  /** The latest bars, viewport px. */
  rects: Rect[] = [];
  /** 0 = every point on the hub, 1 = every point in the bars. */
  mix = 0;
  /** Whether the points are committed to the bars (see barsInView). */
  engaged = false;
  /** The first bar's page px/s, so points keep up with a dragged window instead of trailing it. */
  velocity: [number, number] = [0, 0];
  private shares: number[] = [];
  private lastPage: { x: number; y: number } | null = null;

  /**
   * Stores new bars. `moved` says whether anything changed; `redeal` says the bars' relative
   * sizes have drifted enough that the points' slots should be dealt again.
   */
  update(rects: readonly Rect[]): { moved: boolean; redeal: boolean } {
    const next = rects.slice(0, MAX_BARS).map((r) => ({ ...r }));
    const moved =
      next.length !== this.rects.length || next.some((r, i) => !sameRect(r, this.rects[i]));
    this.rects = next;
    const shares = barShares(next);
    const drifted =
      shares.length !== this.shares.length ||
      shares.some((s, i) => Math.abs(s - (this.shares[i] ?? 0)) > 0.05);
    const redeal = drifted && shares.some((s) => s > 0);
    if (redeal) this.shares = shares;
    return { moved, redeal };
  }

  /** Eases the pour toward `wanted` and measures how fast the bars are being dragged. */
  step(dt: number, wanted: boolean, scrollX: number, scrollY: number): void {
    this.engaged = wanted;
    this.mix = clamp01(this.mix + (wanted ? dt : -dt) / POUR_SECONDS);
    const first = this.rects[0];
    const page = first ? { x: first.x + scrollX, y: first.y + scrollY } : null;
    this.velocity =
      page && this.lastPage && dt > 0
        ? [clampSpeed((page.x - this.lastPage.x) / dt), clampSpeed((page.y - this.lastPage.y) / dt)]
        : [0, 0];
    this.lastPage = page;
  }

  /** For still frames: finish the pour at once. True if the mix changed, so points must snap. */
  jump(wanted: boolean): boolean {
    const target = wanted ? 1 : 0;
    this.engaged = wanted;
    this.velocity = [0, 0];
    if (this.mix === target) return false;
    this.mix = target;
    return true;
  }
}
