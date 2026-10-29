/**
 * The agent hub's geometry on the CPU: the OpenAI knot, six tool nodes orbiting it on tethers,
 * and the camera that films them. The composite shader raymarches the same shapes
 * (shaders/hub.glsl.ts mirrors these formulas); this copy tells the particle simulation where
 * each tether lands on screen, and draws the no-WebGL still.
 */
import type { Framing } from './framing';
import {
  type Vec3,
  add,
  cross,
  dot,
  fract,
  length,
  mix,
  normalize,
  scale,
  smoothstep,
  sub,
} from './math';
import type { Rect } from './rect';

export const CORE: Vec3 = [0, 0.05, 0];
export const FLOOR_Y = -1.42;
export const TOOL_COUNT = 6;
/** The scene time still frames show: every tool out on its tether but one, mid tool call. */
export const STILL_TIME = 15.5;

export interface Camera {
  origin: Vec3;
  right: Vec3;
  up: Vec3;
  forward: Vec3;
}

/** The camera sways slowly on a circle around the hub, looking just below the core. */
export function hubCamera(t: number): Camera {
  const angle = 0.22 * Math.sin(t * 0.045) - 0.12;
  const origin: Vec3 = [9 * Math.sin(angle), 1.75, 9 * Math.cos(angle)];
  const forward = normalize(sub([0, -0.12, 0], origin));
  const right = normalize(cross(forward, [0, 1, 0]));
  return { origin, right, up: cross(right, forward), forward };
}

/** Where tool i is in its call cycle (0..1). Each dives into the core every ~14 s, staggered. */
export const toolCycle = (i: number, t: number): number => fract(t * 0.07 + i * 0.1667);

/** 1 while a tool is down in the core (the call), easing in and out. */
export const diveAmount = (cycle: number): number =>
  smoothstep(0, 0.08, cycle) * (1 - smoothstep(0.1, 0.26, cycle));

/** Right after the dive the tether surges: the call's result streaming back. */
export const surgeAmount = (cycle: number): number =>
  smoothstep(0.08, 0.14, cycle) * (1 - smoothstep(0.2, 0.42, cycle));

/** Rotates (a, b) by angle, as GLSL's `v *= mat2(c, s, -s, c)` does. */
function rotate(a: number, b: number, angle: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * a + s * b, -s * a + c * b];
}

/**
 * Tool i's centre before it leans toward the cursor. Each orbit is tilted differently and
 * alternate tools orbit in opposite directions, so the six never line up; `grow` (0..1) scales
 * the whole hub in during the boot, and `dive` pulls the tool into the core.
 */
export function toolPosition(i: number, t: number, grow: number, dive: number): Vec3 {
  const phase = i * 2.0944 + t * 0.2 * (i % 2 === 0 ? 1 : -1);
  const radius = mix(1.6 + 0.14 * Math.sin(i * 2.3), 0.92, dive) * mix(0.3, 1, grow);
  let x = Math.cos(phase) * radius;
  let y = 0;
  let z = Math.sin(phase) * radius;
  [y, z] = rotate(y, z, 0.5 + 0.22 * i);
  [x, y] = rotate(x, y, i * 1.0472 + 0.2);
  return add(CORE, [x, y * 0.7, z]);
}

export const toolRadius = (i: number, grow: number): number =>
  (0.084 + 0.021 * ((i * 7) % 3)) * smoothstep(0.15, 0.7, grow);

/** Outer bound of the knot. It grows with the boot and rings after a click (`sincePing` s). */
export const coreRadius = (t: number, grow: number, sincePing: number): number =>
  (1.18 + 0.016 * Math.sin(t * 0.9)) * mix(0.25, 1, grow) +
  0.06 * Math.exp(-sincePing * 2.6) * Math.sin(sincePing * 13);

/**
 * The point in the hub the cursor reaches for: its ray, cut by the plane through the core facing
 * the camera, clamped to a shell around the core so tools lean out but never leave.
 */
export function cursorTarget(
  camera: Camera,
  cursor: { x: number; y: number },
  focal: number,
): Vec3 {
  const ray = normalize(
    add(
      add(scale(camera.right, cursor.x), scale(camera.up, cursor.y)),
      scale(camera.forward, focal),
    ),
  );
  const along = dot(sub(CORE, camera.origin), camera.forward) / dot(ray, camera.forward);
  const offset = sub(add(camera.origin, scale(ray, along)), CORE);
  const distance = Math.max(length(offset), 1e-3);
  return add(CORE, scale(offset, Math.min(Math.max(distance, 1.2), 2.3) / distance));
}

/** Tools near the cursor target lean toward it, with a Gaussian falloff. */
export function leanToward(position: Vec3, target: Vec3, strength: number): Vec3 {
  const d = sub(position, target);
  const weight = Math.exp(-dot(d, d) * 0.42) * strength;
  return add(position, scale(sub(target, position), 0.7 * weight));
}

/** A world-space point projected into a stage (page px), with its depth along the camera. */
export function project(
  point: Vec3,
  camera: Camera,
  framing: Framing,
  stage: Rect,
): { x: number; y: number; depth: number } {
  const q = sub(point, camera.origin);
  const depth = dot(q, camera.forward);
  const u = (framing.focal * dot(q, camera.right)) / depth + framing.shiftX;
  const v = (framing.focal * dot(q, camera.up)) / depth + framing.shiftY;
  return { x: stage.x + stage.w / 2 + u * stage.h, y: stage.y + stage.h / 2 - v * stage.h, depth };
}

/** The hub as the particle simulation sees it: everything in page px. */
export interface HubScreen {
  core: { x: number; y: number; radius: number };
  /** Per tool: x, y, on-screen radius, surge (0..1). */
  tools: Float32Array;
  /**
   * Per tool, along the tether (s = 0 at the core, 1 at the tool): where it leaves the core's
   * surface, how much the tool's sphere hides, and 1 if the tool is in front of the core.
   */
  spans: Float32Array;
  /** Total on-screen tether length, which sets how much ink each tether point carries. */
  tetherLength: number;
}

export function createHubScreen(): HubScreen {
  return {
    core: { x: 0, y: 0, radius: 1 },
    tools: new Float32Array(TOOL_COUNT * 4),
    spans: new Float32Array(TOOL_COUNT * 4),
    tetherLength: 0,
  };
}

export interface HubPose {
  t: number;
  grow: number;
  sincePing: number;
  /** The cursor in hub space and how present it is (0..1). */
  cursor: { x: number; y: number; on: number };
  framing: Framing;
  stage: Rect;
}

/** Fills `out` with the hub's on-screen layout for a pose, reusing its arrays (runs per frame). */
export function updateHubScreen(out: HubScreen, pose: HubPose): void {
  const camera = hubCamera(pose.t);
  const pxPerUnit = pose.framing.focal * pose.stage.h;
  const target = cursorTarget(camera, pose.cursor, pose.framing.focal);
  const coreR = coreRadius(pose.t, pose.grow, pose.sincePing);
  const core = project(CORE, camera, pose.framing, pose.stage);
  out.core.x = core.x;
  out.core.y = core.y;
  out.core.radius = Math.max(1, (coreR * pxPerUnit) / core.depth);

  let tetherLength = 0;
  for (let i = 0; i < TOOL_COUNT; i++) {
    const cycle = toolCycle(i, pose.t);
    const orbit = toolPosition(i, pose.t, pose.grow, diveAmount(cycle));
    const position = leanToward(orbit, target, pose.cursor.on * pose.grow);
    const radius = toolRadius(i, pose.grow);
    const tool = project(position, camera, pose.framing, pose.stage);
    const reach = Math.max(length(sub(position, CORE)), 1e-3);
    out.tools.set([tool.x, tool.y, (radius * pxPerUnit) / tool.depth, surgeAmount(cycle)], i * 4);
    out.spans.set(
      [
        Math.min(0.95, coreR / reach),
        Math.min(0.5, radius / reach),
        tool.depth < core.depth ? 1 : 0,
        0,
      ],
      i * 4,
    );
    tetherLength += Math.hypot(tool.x - core.x, tool.y - core.y);
  }
  out.tetherLength = tetherLength;
}

/**
 * Each tether's traffic phase, integrated per frame so a surge can speed one tether up without
 * its points jumping. Points on a tether are "born" once its phase has wrapped past `origin`.
 */
export class TetherClock {
  /** Tether cycles per second at rest. */
  static readonly SPEED = 0.2;
  readonly phase = new Float32Array(TOOL_COUNT);
  readonly previous = new Float32Array(TOOL_COUNT);
  readonly origin = new Float32Array(TOOL_COUNT).fill(-2);

  advance(dt: number, tools: Float32Array): void {
    this.previous.set(this.phase);
    for (let i = 0; i < TOOL_COUNT; i++) {
      const surge = tools[i * 4 + 3] ?? 0;
      this.phase[i] = (this.phase[i] ?? 0) + dt * TetherClock.SPEED * (1 + 2.2 * surge);
    }
  }

  /** Empties every tether: points wait in the core and stream out as their tether cycles. */
  restart(): void {
    this.origin.set(this.phase);
  }

  /** Fills every tether at once. */
  settle(): void {
    for (let i = 0; i < TOOL_COUNT; i++) this.origin[i] = (this.phase[i] ?? 0) - 2;
  }
}
