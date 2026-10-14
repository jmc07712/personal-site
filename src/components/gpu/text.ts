/**
 * The boot spells the name in particles. These pure helpers size the name, find the pixels its
 * glyphs cover, and deal every point a pixel; glyphs.ts does the rasterising.
 */
import { pick, type Rng } from './rng';

export interface NameLayout {
  lines: string[];
  /** Font size in CSS px, on Jersey 10's 10px grid. */
  size: number;
  lineHeight: number;
}

/**
 * Sizes the name to about 78% of the viewport (wrapping to one word per line, at 86%, below
 * 640px), no wider than 1180px at laptop size (grown with the interface scale `ui`) and no taller
 * than 40% of the stage, snapped to a multiple of 10px so the pixel font stays on its grid.
 * `measure` returns a line's width at 100px.
 */
export function fitName(
  name: string,
  viewportWidth: number,
  stageHeight: number,
  measure: (line: string) => number,
  ui = 1,
): NameLayout {
  const wrap = viewportWidth < 640;
  const lines = wrap ? name.split(' ') : [name];
  const width100 = Math.max(...lines.map(measure)) || 500;
  const byWidth = (100 * Math.min(viewportWidth * (wrap ? 0.86 : 0.78), 1180 * ui)) / width100;
  const byHeight = stageHeight * (wrap ? 0.34 : 0.4);
  const size = Math.max(10, Math.round(Math.min(byWidth, byHeight) / 10) * 10);
  return { lines, size, lineHeight: size * 0.86 };
}

/** The pixels a rasterised name covers: indices into a `width`-wide bitmap, and their bounds. */
export interface InkedPixels {
  width: number;
  indices: Uint32Array;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Collects pixels whose alpha passes `threshold` from RGBA data. Null when nothing is inked. */
export function inkedPixels(
  rgba: Uint8ClampedArray,
  width: number,
  threshold = 110,
): InkedPixels | null {
  const indices: number[] = [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let p = 0; p * 4 < rgba.length; p++) {
    if ((rgba[p * 4 + 3] ?? 0) <= threshold) continue;
    indices.push(p);
    const x = p % width;
    const y = Math.floor(p / width);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  if (indices.length === 0) return null;
  return { width, indices: Uint32Array.from(indices), x0, y0, x1, y1 };
}

/**
 * Deals every point a random inked pixel (jittered within it), centred on (cx, cy) in page px,
 * into targets' x and y. Returns the name's horizontal span: the implosion sweeps along it.
 */
export function writeTextTargets(
  targets: Float32Array,
  pixels: InkedPixels,
  cx: number,
  cy: number,
  rng: Rng,
): { x0: number; width: number } {
  const ox = cx - (pixels.x0 + pixels.x1) / 2;
  const oy = cy - (pixels.y0 + pixels.y1) / 2;
  const count = targets.length / 4;
  for (let i = 0; i < count; i++) {
    const p = pick(pixels.indices, rng);
    targets[i * 4] = ox + (p % pixels.width) + rng();
    targets[i * 4 + 1] = oy + Math.floor(p / pixels.width) + rng();
  }
  return { x0: ox + pixels.x0, width: Math.max(1, pixels.x1 - pixels.x0) };
}
