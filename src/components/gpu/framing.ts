/**
 * Where the scene's pixels and the hub land on screen. Everything here is pure, so the layout
 * rules can be tested without a GPU.
 */

/** How the hub is framed in its stage: a horizontal/vertical shift (in stage heights) and lens. */
export interface Framing {
  shiftX: number;
  shiftY: number;
  /** Focal length in stage heights: larger is a narrower lens and a smaller hub. */
  focal: number;
}

/**
 * Framing per layout tier, keyed by viewport width like the CSS breakpoints. On wide desktops the
 * About window covers the left of the screen, so the hub moves right into the open space;
 * narrower desktops push it further right with a wider lens; Pocket mode centres it in its
 * square screen. Shifts scale with the stage's aspect so the hub keeps its place on any shape.
 */
export function hubFraming(
  stage: { w: number; h: number },
  viewportWidth: number,
  pocket: boolean,
): Framing {
  const aspect = stage.w / Math.max(1, stage.h);
  if (pocket) return { shiftX: 0, shiftY: 0.035, focal: 2.3 };
  if (viewportWidth >= 1180) return { shiftX: 0.175 * aspect, shiftY: 0, focal: 1.72 };
  if (viewportWidth >= 900) return { shiftX: 0.28 * aspect, shiftY: 0, focal: 1.3 };
  return { shiftX: 0, shiftY: -0.05, focal: aspect < 1 ? 1.78 : 2 };
}

/** Device pixel ratio, capped at 2: beyond that the extra pixels cost GPU time nobody can see. */
export function cappedDpr(devicePixelRatio: number): number {
  return Math.min(devicePixelRatio || 1, 2);
}

/**
 * CSS px per bitmap pixel ("cell"). Rounded so a cell is a whole number of device pixels, which
 * keeps every cell the same size and the dither crisp at any DPR.
 */
export function cellSize(pixel: number, dpr: number): number {
  return Math.max(1, Math.round(pixel * dpr)) / dpr;
}

/**
 * The canvas grid for a frame, with a spare column and row: page-locking shifts the canvas by up
 * to a cell.
 */
export function gridSize(
  width: number,
  height: number,
  cell: number,
): { cols: number; rows: number } {
  return {
    cols: Math.max(8, Math.ceil(width / cell) + 1),
    rows: Math.max(8, Math.ceil(height / cell) + 1),
  };
}

/** A frame's position snapped to the page's cell grid. */
export interface PageLock {
  /** Page column and row of the canvas's top-left cell. */
  col: number;
  row: number;
  /** How far to translate the canvas (CSS px, ≤ 0) so its cells sit on the page grid. */
  offsetX: number;
  offsetY: number;
}

/**
 * Locks the canvas to a grid fixed to the document. A fixed layer would otherwise slide under a
 * fixed dither pattern as the page scrolls and the pattern would appear to swim; snapping the
 * canvas to whole cells of the page (and offsetting the Bayer indices by the same cells) keeps
 * every dot glued to the content.
 */
export function pageLock(pageLeft: number, pageTop: number, cell: number): PageLock {
  const col = Math.floor(pageLeft / cell + 1e-6);
  const row = Math.floor(pageTop / cell + 1e-6);
  return { col, row, offsetX: col * cell - pageLeft, offsetY: row * cell - pageTop };
}
