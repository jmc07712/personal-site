import { describe, expect, it } from 'vitest';
import {
  BLOSSOM_BOUND,
  BLOSSOM_SIZE,
  blossomDistance,
  blossomPixels,
  knotAngles,
  knotDistance,
} from '@/components/gpu/blossom';

describe('official OpenAI knot geometry', () => {
  it('keeps its central opening and each of the six surrounding openings clear', () => {
    expect(blossomDistance(0, 0)).toBeGreaterThan(0.19);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      expect(blossomDistance(0.4 * Math.cos(angle), 0.4 * Math.sin(angle))).toBeGreaterThan(0.025);
    }
  });

  it('contains all six ribbons around the center and in the outer weave', () => {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      expect(blossomDistance(0.29 * Math.cos(angle), 0.29 * Math.sin(angle))).toBeLessThan(-0.01);
      expect(blossomDistance(0.55 * Math.cos(angle), 0.55 * Math.sin(angle))).toBeLessThan(-0.025);
    }
  });

  it('never repeats edge ink outside its texture and stays positive far from the mark', () => {
    for (const [x, y] of [
      [1.04, 0],
      [-1.5, 0.5],
      [0, 2],
      [4, 4],
    ] as const) {
      expect(blossomDistance(x, y)).toBeGreaterThan(0.02);
    }
    expect(blossomDistance(4, 4)).toBeGreaterThan(3);
  });

  it('extrudes the ribbons on both sides while preserving the openings through its full depth', () => {
    for (const z of [-0.12, 0, 0.12]) {
      expect(knotDistance(0.29, 0, z, BLOSSOM_BOUND)).toBeLessThan(0);
      expect(knotDistance(0, 0, z, BLOSSOM_BOUND)).toBeGreaterThan(0.19);
      expect(knotDistance(0.4, 0, z, BLOSSOM_BOUND)).toBeGreaterThan(0.025);
    }
    expect(knotDistance(0.29, 0, 0.2, BLOSSOM_BOUND)).toBeGreaterThan(0.02);
    expect(knotDistance(0.29, 0, -0.2, BLOSSOM_BOUND)).toBeGreaterThan(0.02);
  });

  it('decodes one reusable texture and turns without ever presenting an edge-on face', () => {
    expect(blossomPixels()).toBe(blossomPixels());
    expect(blossomPixels()).toHaveLength(BLOSSOM_SIZE * BLOSSOM_SIZE);
    for (let t = 0; t <= 240; t += 2) {
      const [x, y, spin] = knotAngles(t);
      expect(Math.abs(x)).toBeLessThan(0.24);
      expect(Math.abs(y)).toBeLessThan(0.31);
      expect(Number.isFinite(spin)).toBe(true);
    }
    expect(knotAngles(63)[2] - knotAngles(0)[2]).toBeGreaterThan(Math.PI * 2);
  });
});
