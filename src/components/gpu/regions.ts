/**
 * Region copies. The scene canvas sits beneath every window, so anything drawn there would be
 * hidden by the Experience window's paper background. Instead the window holds small 2D canvases
 * ("regions") and each frame we copy the matching patch of the scene into them: the bars then
 * layer exactly like the DOM around them, under any window dragged on top.
 */
import type { Rect } from './rect';

export interface Size {
  width: number;
  height: number;
}

/** A drawImage call: source rect in the scene's backing pixels, destination in the region's. */
export interface Blit {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Maps a region's box (viewport px) onto the scene canvas's backing store, clipped to what the
 * scene actually covers. Null when they don't overlap or either is empty.
 */
export function regionBlit(
  source: Rect,
  sourceSize: Size,
  region: Rect,
  target: Size,
): Blit | null {
  if (source.w <= 0 || source.h <= 0 || region.w <= 0 || region.h <= 0) return null;
  // Region in source pixels.
  const kx = sourceSize.width / source.w;
  const ky = sourceSize.height / source.h;
  const rx = (region.x - source.x) * kx;
  const ry = (region.y - source.y) * ky;
  const rw = region.w * kx;
  const rh = region.h * ky;
  const x0 = Math.max(0, rx);
  const y0 = Math.max(0, ry);
  const x1 = Math.min(sourceSize.width, rx + rw);
  const y1 = Math.min(sourceSize.height, ry + rh);
  if (x1 <= x0 || y1 <= y0) return null;
  // Source pixels to region pixels.
  const tx = target.width / rw;
  const ty = target.height / rh;
  return {
    sx: x0,
    sy: y0,
    sw: x1 - x0,
    sh: y1 - y0,
    dx: (x0 - rx) * tx,
    dy: (y0 - ry) * ty,
    dw: (x1 - x0) * tx,
    dh: (y1 - y0) * ty,
  };
}

const box = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });

/**
 * Copies the patch of the scene under each region into it, at the region's own resolution with
 * no smoothing so the dither stays crisp. Returns the regions' boxes (viewport px), which double
 * as the role bars' rects. Runs right after a frame is drawn, while the WebGL drawing buffer is
 * still readable.
 */
export function copyRegions(
  source: HTMLCanvasElement,
  regions: Iterable<HTMLCanvasElement>,
): Rect[] {
  const sourceBox = box(source.getBoundingClientRect());
  const boxes: Rect[] = [];
  for (const region of regions) {
    const regionBox = box(region.getBoundingClientRect());
    boxes.push(regionBox);
    const blit = regionBlit(sourceBox, source, regionBox, region);
    const ctx = blit && region.getContext('2d');
    if (!blit || !ctx) continue;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, blit.sx, blit.sy, blit.sw, blit.sh, blit.dx, blit.dy, blit.dw, blit.dh);
  }
  return boxes;
}
