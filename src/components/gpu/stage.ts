/**
 * The canvas on the page: sized in whole cells for the box it fills, locked to the page's cell
 * grid every frame, and the conversions from page px to the canvas's GL cells.
 */
import { uiScale } from '@/lib/uiScale';
import { cappedDpr, cellSize, gridSize, hubFraming, pageLock, type Framing } from './framing';
import type { Rect } from './rect';

/** Where the canvas sits on the page this frame. */
export interface Placement {
  scrollX: number;
  scrollY: number;
  /** Page column and row of the canvas's top-left cell. */
  col: number;
  row: number;
  /** Page px of the canvas's top-left cell. */
  originX: number;
  originY: number;
  /** Where the hub is drawn, page px. */
  hub: Rect;
}

export class CanvasStage {
  /** CSS px per cell. */
  cell = 3;
  framing: Framing = { shiftX: 0, shiftY: 0, focal: 2 };
  private readonly canvas: HTMLCanvasElement;
  private readonly pocket: boolean;
  private transform = '';
  private latest: Placement | null = null;

  constructor(canvas: HTMLCanvasElement, pocket: boolean) {
    this.canvas = canvas;
    this.pocket = pocket;
  }

  get cols(): number {
    return this.canvas.width;
  }

  get rows(): number {
    return this.canvas.height;
  }

  /** The box the canvas fills: its parent, the fixed desktop layer or the pocket screen. */
  private frame(): HTMLElement {
    return this.canvas.parentElement ?? this.canvas;
  }

  /**
   * Sizes the canvas in whole cells of `pixel` px at laptop size, scaled with the interface. Its
   * CSS size is set to match exactly, so each cell is scaled up by a whole number of device
   * pixels; it overhangs its frame by up to a cell, which the frame clips.
   */
  resize(pixel: number): void {
    const frame = this.frame();
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    this.cell = cellSize(pixel, cappedDpr(window.devicePixelRatio), uiScale());
    const { cols, rows } = gridSize(width, height, this.cell);
    this.canvas.width = cols;
    this.canvas.height = rows;
    this.canvas.style.width = `${cols * this.cell}px`;
    this.canvas.style.height = `${rows * this.cell}px`;
    this.framing = hubFraming({ w: width, h: height }, window.innerWidth, this.pocket);
  }

  /** Page-locks the canvas for this frame and reports where everything is. */
  place(): Placement {
    const box = this.frame().getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const left = box.left + scrollX;
    const top = box.top + scrollY;
    const lock = pageLock(left, top, this.cell);
    const transform = `translate3d(${lock.offsetX}px, ${lock.offsetY}px, 0)`;
    if (transform !== this.transform) {
      this.canvas.style.transform = transform;
      this.transform = transform;
    }
    // The layer is fixed to the viewport, but the hub belongs to the top of the page (the
    // desktop's first screen, the phone's home screen) and scrolls away with it.
    const hub = { x: box.left, y: box.top, w: box.width, h: box.height };
    this.latest = {
      scrollX,
      scrollY,
      col: lock.col,
      row: lock.row,
      originX: lock.col * this.cell,
      originY: lock.row * this.cell,
      hub,
    };
    return this.latest;
  }

  /** The hub's stage in viewport px as of the last frame, or null before the first. */
  hubInViewport(): Rect | null {
    if (!this.latest) return null;
    const { hub } = this.latest;
    return { ...hub, x: hub.x - window.scrollX, y: hub.y - window.scrollY };
  }

  /** A page-px rect in GL cells (origin bottom-left) as x0, y0, x1, y1. */
  private toCells(r: Rect, place: Placement): [number, number, number, number] {
    const x0 = (r.x - place.originX) / this.cell;
    const top = (r.y - place.originY) / this.cell;
    return [x0, this.rows - top - r.h / this.cell, x0 + r.w / this.cell, this.rows - top];
  }

  /** The hub's stage in GL cells: x0, y0, w, h. */
  hubCells(place: Placement): [number, number, number, number] {
    const [x0, y0, x1, y1] = this.toCells(place.hub, place);
    return [x0, y0, x1 - x0, y1 - y0];
  }

  /**
   * Writes cut-outs for viewport-px rects into `out` (GL cells, one cell of margin so no hub
   * pixel survives at an edge). Returns how many were written.
   */
  writeCuts(out: Float32Array, rects: readonly Rect[], place: Placement): number {
    out.fill(0);
    const count = Math.min(rects.length, out.length / 4);
    rects.slice(0, count).forEach((r, i) => {
      const page = { ...r, x: r.x + place.scrollX, y: r.y + place.scrollY };
      const [x0, y0, x1, y1] = this.toCells(page, place);
      out.set([x0 - 1, y0 - 1, x1 + 1, y1 + 1], i * 4);
    });
    return count;
  }
}
