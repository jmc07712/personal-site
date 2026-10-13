/**
 * The site's only two colours, mirroring --paper and --ink in globals.css. The scene never
 * outputs anything else: every tone is a dither of these.
 */
export const PAPER = '#c9cebb';
export const INK = '#262e1b';

export type Rgb = readonly [number, number, number];

/** "#rrggbb" to channels in 0..1, as shaders want them. */
export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}
