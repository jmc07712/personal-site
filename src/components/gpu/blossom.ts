/** The official OpenAI knot as one shared, precomputed distance field for WebGL and its still. */
import { BLOSSOM_BASE64, BLOSSOM_EXTENT, BLOSSOM_RANGE, BLOSSOM_SIZE } from './blossom-data';

export { BLOSSOM_EXTENT, BLOSSOM_RANGE, BLOSSOM_SIZE } from './blossom-data';

/** Conservative radial bound of the normalized SVG, whose outermost ink is at radius 1.014. */
export const BLOSSOM_BOUND = 1.025;
export const KNOT_DEPTH = 0.17;
export const KNOT_BEVEL = 0.038;

let pixels: Uint8Array<ArrayBuffer> | undefined;

/** Decode once. The same R8 samples are uploaded to GL and bilinearly sampled by the CPU. */
export function blossomPixels(): Uint8Array<ArrayBuffer> {
  if (!pixels) {
    const binary = atob(BLOSSOM_BASE64);
    pixels = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) pixels[i] = binary.charCodeAt(i);
  }
  return pixels;
}

/** Signed distance in normalized SVG units: negative on the ribbons, positive in the holes. */
export function blossomDistance(x: number, y: number): number {
  const data = blossomPixels();
  const px = Math.max(
    0,
    Math.min(BLOSSOM_SIZE - 1, ((x / BLOSSOM_EXTENT + 1) * BLOSSOM_SIZE) / 2 - 0.5),
  );
  const py = Math.max(
    0,
    Math.min(BLOSSOM_SIZE - 1, ((1 - y / BLOSSOM_EXTENT) * BLOSSOM_SIZE) / 2 - 0.5),
  );
  const ix = Math.min(BLOSSOM_SIZE - 2, Math.floor(px));
  const iy = Math.min(BLOSSOM_SIZE - 2, Math.floor(py));
  const fx = px - ix;
  const fy = py - iy;
  const a =
    (data[iy * BLOSSOM_SIZE + ix] ?? 255) * (1 - fx) +
    (data[iy * BLOSSOM_SIZE + ix + 1] ?? 255) * fx;
  const b =
    (data[(iy + 1) * BLOSSOM_SIZE + ix] ?? 255) * (1 - fx) +
    (data[(iy + 1) * BLOSSOM_SIZE + ix + 1] ?? 255) * fx;
  const distance = ((a * (1 - fy) + b * fy) / 255 - 0.5) * (2 * BLOSSOM_RANGE);
  // Outside the padded texture, use a conservative positive bound rather than extending an
  // edge texel to infinity. max keeps the raymarch step below the true distance to the ink.
  const outside = Math.hypot(
    Math.max(Math.abs(x) - BLOSSOM_EXTENT, 0),
    Math.max(Math.abs(y) - BLOSSOM_EXTENT, 0),
  );
  return outside > 0 ? Math.max(outside, distance) : distance;
}

/** A full planar turn every ~63 s; bounded tilt keeps the face and its six openings visible. */
export function knotAngles(t: number): readonly [number, number, number] {
  return [0.13 + 0.1 * Math.sin(t * 0.17), -0.16 + 0.14 * Math.sin(t * 0.13), t * 0.1];
}

/** Rounded extrusion. Scalar arguments avoid allocations in the CPU raymarcher's hot path. */
export function knotDistance(x: number, y: number, z: number, radius: number): number {
  const scale = radius / BLOSSOM_BOUND;
  const bevel = KNOT_BEVEL * scale;
  const a = blossomDistance(x / scale, y / scale) * scale + bevel;
  const b = Math.abs(z) - (KNOT_DEPTH * scale - bevel);
  return Math.min(Math.max(a, b), 0) + Math.hypot(Math.max(a, 0), Math.max(b, 0)) - bevel;
}
