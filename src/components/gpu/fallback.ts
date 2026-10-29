/**
 * The scene without WebGL2: the hub raymarched once on the CPU at a coarse pixel and dithered to
 * the two inks with the same Bayer matrix. It shows the same pose as the GPU's still frame, with
 * a lighter light model (diffuse and sky on the hub, one soft shadow on the floor), so the one
 * frame it draws takes tens of milliseconds on a laptop.
 */
import { uiScale } from '@/lib/uiScale';
import { dither } from './bayer';
import { knotAngles, knotDistance } from './blossom';
import { cappedDpr, cellSize, hubFraming, type Framing } from './framing';
import {
  CORE,
  FLOOR_Y,
  STILL_TIME,
  TOOL_COUNT,
  coreRadius,
  diveAmount,
  hubCamera,
  toolCycle,
  toolPosition,
  toolRadius,
} from './hub';
import { hexToRgb, INK, PAPER } from './inks';
import { normalize, type Vec3 } from './math';
import { POCKET_MAX_WIDTH } from './sizing';

/** Px per pixel at laptop size: coarser than the GPU's 3px, to keep the CPU work small. */
const PIXEL = 4;
const MAX_STEPS = 90;
const LIGHT = normalize([-0.42, 1, 0.36]);

interface Sphere {
  x: number;
  y: number;
  z: number;
  r: number;
}

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const len3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

/**
 * The hub's distance field at the still pose, written with scalars rather than Vec3 tuples:
 * it runs millions of times, and allocation-free code is several times faster.
 */
function stillField(): (x: number, y: number, z: number) => number {
  const [cx, cy, cz] = CORE;
  const coreR = coreRadius(STILL_TIME, 1, 99);
  const tools: Sphere[] = Array.from({ length: TOOL_COUNT }, (_, i) => {
    const [x, y, z] = toolPosition(i, STILL_TIME, 1, diveAmount(toolCycle(i, STILL_TIME)));
    return { x, y, z, r: toolRadius(i, 1) };
  });
  const [tiltX, tiltY, spin] = knotAngles(STILL_TIME);
  const [cxr, sxr, cyr, syr, czr, szr] = [
    Math.cos(tiltX),
    Math.sin(tiltX),
    Math.cos(tiltY),
    Math.sin(tiltY),
    Math.cos(spin),
    Math.sin(spin),
  ];
  return (x, y, z) => {
    const qx = x - cx;
    const qy = y - cy;
    const qz = z - cz;
    const r = len3(qx, qy, qz);
    if (r - 2.35 > 0.25) return r - 2.35;
    const ly0 = cxr * qy + sxr * qz;
    const lz0 = -sxr * qy + cxr * qz;
    const lx0 = cyr * qx + syr * lz0;
    const lz = -syr * qx + cyr * lz0;
    const lx = czr * lx0 + szr * ly0;
    const ly = -szr * lx0 + czr * ly0;
    let d = knotDistance(lx, ly, lz, coreR);
    for (const t of tools) {
      const bx = t.x - cx;
      const by = t.y - cy;
      const bz = t.z - cz;
      const reach = len3(bx, by, bz);
      const start = coreR * 1.02;
      let tether = 1e3;
      if (reach > start) {
        const h = Math.max(
          start / reach,
          Math.min(1, (qx * bx + qy * by + qz * bz) / (reach * reach)),
        );
        tether = len3(qx - bx * h, qy - by * h, qz - bz * h) - 0.012;
      }
      d = Math.min(d, smin(len3(x - t.x, y - t.y, z - t.z) - t.r, tether, 0.035));
    }
    return d;
  };
}

/**
 * Luminance (0 ink .. 1 paper) for every cell of a cols x rows still, row-major from the top.
 * Pure, so it can be checked without a canvas.
 */
export function stillLuminance(cols: number, rows: number, framing: Framing): Float32Array {
  const field = stillField();
  const camera = hubCamera(STILL_TIME);
  const [ox, oy, oz] = camera.origin;
  const { right, up, forward } = camera;
  const out = new Float32Array(cols * rows);
  const outline = 1.15 / (rows * framing.focal);
  const softShadow = (px: number, py: number, pz: number) => {
    let result = 1;
    for (let s = 0, t = 0.05; s < 24 && result > 0.01 && t < 8; s++) {
      const h = field(px + LIGHT[0] * t, py + LIGHT[1] * t, pz + LIGHT[2] * t);
      result = Math.min(result, (8 * h) / t);
      t += Math.max(0.03, h);
    }
    return Math.max(0, Math.min(1, result));
  };

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u = (i + 0.5 - 0.5 * cols) / rows - framing.shiftX;
      const v = (rows - j - 0.5 - 0.5 * rows) / rows - framing.shiftY;
      const ray: Vec3 = normalize([
        u * right[0] + v * up[0] + framing.focal * forward[0],
        u * right[1] + v * up[1] + framing.focal * forward[1],
        u * right[2] + v * up[2] + framing.focal * forward[2],
      ]);
      let t = 0.5;
      let hit = 0;
      let edge = Infinity;
      for (let s = 0; s < MAX_STEPS && t < 30; s++) {
        const y = oy + ray[1] * t;
        const dHub = field(ox + ray[0] * t, y, oz + ray[2] * t);
        const dFloor = y - FLOOR_Y;
        edge = Math.min(edge, dHub / t);
        if (Math.min(dHub, dFloor) < 0.002) {
          hit = dHub < dFloor ? 1 : 2;
          break;
        }
        t += Math.min(dHub, dFloor);
      }
      const [px, py, pz] = [ox + ray[0] * t, oy + ray[1] * t, oz + ray[2] * t];
      let lum = 1;
      if (hit === 1) {
        const e = 0.002;
        const n = normalize([
          field(px + e, py, pz) - field(px - e, py, pz),
          field(px, py + e, pz) - field(px, py - e, pz),
          field(px, py, pz + e) - field(px, py, pz - e),
        ]);
        const diffuse = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        lum = 0.04 + 0.82 * diffuse + 0.12 * (0.5 + 0.5 * n[1]);
      } else if (hit === 2) {
        lum = 0.48 + 0.52 * softShadow(px, py + 0.002, pz);
        // Fade the floor to paper away from the hub, as the GPU version does.
        const away = Math.min(1, Math.max(0, (Math.hypot(px - 0.4, pz + 0.3) - 0.9) / 1.3));
        lum += (1 - lum) * away;
      }
      if (hit !== 1 && edge < outline) lum = 0;
      out[j * cols + i] = lum;
    }
  }
  return out;
}

const rgba = (hex: string): number[] => [...hexToRgb(hex).map((c) => Math.round(c * 255)), 255];

/** Draws the still into a 2D canvas sized to its parent, in the two inks. */
export function drawFallback(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const frame = canvas.parentElement ?? canvas;
  const cell = cellSize(PIXEL, cappedDpr(window.devicePixelRatio), uiScale());
  const cols = Math.max(8, Math.ceil(frame.clientWidth / cell));
  const rows = Math.max(8, Math.ceil(frame.clientHeight / cell));
  canvas.width = cols;
  canvas.height = rows;
  canvas.style.width = `${cols * cell}px`;
  canvas.style.height = `${rows * cell}px`;
  const pocket = window.innerWidth <= POCKET_MAX_WIDTH;
  const lum = stillLuminance(
    cols,
    rows,
    hubFraming({ w: cols, h: rows }, window.innerWidth, pocket),
  );
  const paper = rgba(PAPER);
  const ink = rgba(INK);
  const image = ctx.createImageData(cols, rows);
  lum.forEach((value, index) => {
    const color = dither(value, index % cols, Math.floor(index / cols)) ? paper : ink;
    image.data.set(color, index * 4);
  });
  ctx.putImageData(image, 0, 0);
}
