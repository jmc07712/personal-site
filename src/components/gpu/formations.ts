/**
 * Initial particle states. Positions are page px; `position.w` is the time (s into the boot) at
 * which a point leaves the stream and starts homing on its target, and `velocity.w` is the ink it
 * lays down, which the simulation computes, so seeds leave it at 0.
 */
import { TOOL_COUNT } from './hub';
import type { Rect } from './rect';
import { gaussian, pick, type Rng } from './rng';

export interface PointState {
  positions: Float32Array;
  velocities: Float32Array;
}

/** The boot current, in px/s: the stream drifts right at this speed until points peel off. */
export const RIVER_CURRENT = 760;

const emptyState = (count: number): PointState => ({
  positions: new Float32Array(count * 4),
  velocities: new Float32Array(count * 4),
});

/**
 * Per-point constants: x = tether lane (0-5 outbound calls, 6-11 inbound results), y = phase
 * along the tether, z = lateral offset (a clamped Gaussian, so traffic is densest on the line),
 * w = a uniform random used to vary each point.
 */
export function seedMeta(count: number, rng: Rng): Float32Array {
  const meta = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const lane = Math.floor(i / TOOL_COUNT) % 2;
    meta.set(
      [
        (i % TOOL_COUNT) + TOOL_COUNT * lane,
        rng(),
        Math.max(-2.6, Math.min(2.6, gaussian(rng))),
        rng(),
      ],
      i * 4,
    );
  }
  return meta;
}

/**
 * The desktop boot: points enter from the left in 56 meandering strands. Points are released in
 * order of their letter's x, each placed so the current carries it past its letter at about its
 * release time, so the name writes itself left to right.
 */
export function seedRiver(
  targets: Float32Array,
  centerY: number,
  spread: number,
  rng: Rng,
): PointState {
  const count = targets.length / 4;
  const state = emptyState(count);
  const order = Uint32Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => (targets[a * 4] ?? 0) - (targets[b * 4] ?? 0),
  );
  const strands = Array.from({ length: 56 }, () => ({
    offset: (rng() - 0.5) * spread,
    amplitude: 14 + rng() * 60,
    frequency: 0.0022 + rng() * 0.005,
    phase: rng() * 2 * Math.PI,
  }));
  order.forEach((i, rank) => {
    const release = 0.12 + 1.15 * (rank / count) + rng() * 0.22;
    const x = (targets[i * 4] ?? 0) - RIVER_CURRENT * release + 140 - rng() * 520;
    const strand = pick(strands, rng);
    const y =
      centerY + strand.offset + Math.sin(x * strand.frequency + strand.phase) * strand.amplitude;
    state.positions.set([x, y + gaussian(rng) * 2, 0, release], i * 4);
    state.velocities[i * 4] = RIVER_CURRENT * (0.85 + rng() * 0.3);
  });
  return state;
}

/** The pocket boot: points circle in from beyond the screen's edges and sink into the core. */
export function seedInflow(count: number, stage: Rect, rng: Rng): PointState {
  const state = emptyState(count);
  const cx = stage.x + stage.w / 2;
  const cy = stage.y + stage.h / 2;
  const reach = Math.max(stage.w, stage.h) * 0.62;
  for (let i = 0; i < count; i++) {
    const angle = rng() * 2 * Math.PI;
    const r = reach * (0.75 + rng() * 0.45);
    state.positions.set(
      [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 0, rng() * 0.35],
      i * 4,
    );
    state.velocities.set([-Math.sin(angle) * 90, Math.cos(angle) * 90, 0, 0], i * 4);
  }
  return state;
}
