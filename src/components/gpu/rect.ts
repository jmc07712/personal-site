/** An axis-aligned box in CSS px. The renderer's public API takes these in viewport coordinates. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The smallest box containing every rect, or null when there are none. */
export function boundingBox(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const area = (r: Rect): number => Math.max(0, r.w) * Math.max(0, r.h);
