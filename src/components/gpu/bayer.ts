/**
 * Ordered dithering. Every grey in the scene becomes a pattern of the two inks by comparing its
 * luminance with a fixed threshold per cell. The 8x8 Bayer matrix spreads those thresholds so any
 * tone turns into an even, stable pattern that reads as a grey at a distance.
 */

import { fract } from './math';

const bayer2 = (x: number, y: number) => {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  return fract(fx * 0.5 + fy * fy * 0.75);
};

/**
 * The threshold for a cell, in [0, 1). This is the branch-free closed form the composite shader
 * uses (`bayer8` in shaders/composite.glsl.ts); the tests prove it equals the classic recursive 8x8
 * matrix divided by 64. It tiles every 8 cells in both directions, so offsetting the indices by
 * the page scroll locks the pattern to the document.
 */
export function bayerThreshold(x: number, y: number): number {
  const bayer4 = (u: number, v: number) => bayer2(u * 0.5, v * 0.5) * 0.25 + bayer2(u, v);
  return bayer4(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);
}

/** True when a cell of the given luminance (0 ink .. 1 paper) is drawn in paper. */
export function dither(luminance: number, x: number, y: number): boolean {
  return luminance > bayerThreshold(x, y) + 0.0005;
}
