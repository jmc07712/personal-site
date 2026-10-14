import { describe, expect, it } from 'vitest';
import { MAX_BARS, barShares, barsInView, packBars, writeBarSlots } from '@/components/gpu/bars';
import {
  RIVER_CURRENT,
  seedInflow,
  seedMeta,
  seedRiver,
  writeCoreTargets,
} from '@/components/gpu/formations';
import { inkPerPoint } from '@/components/gpu/ink';
import { gaussian, pick, xorshift32 } from '@/components/gpu/rng';
import { fitName, inkedPixels, writeTextTargets } from '@/components/gpu/text';

const COUNT = 6_000;

describe('rng', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = xorshift32(7);
    const b = xorshift32(7);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('draws Gaussians centred on zero with unit spread', () => {
    const rng = xorshift32(3);
    const samples = Array.from({ length: 20_000 }, () => gaussian(rng));
    const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
    const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / samples.length;
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(variance).toBeCloseTo(1, 1);
  });

  it('refuses to pick from an empty list', () => {
    expect(() => pick([], xorshift32())).toThrow(RangeError);
  });
});

describe('writeBarSlots', () => {
  const bars = [
    { x: 0, y: 0, w: 300, h: 12 },
    { x: 320, y: 34, w: 100, h: 12 },
    { x: 440, y: 68, w: 600, h: 12 },
  ];

  it('deals points to bars in proportion to their area', () => {
    const targets = new Float32Array(COUNT * 4);
    writeBarSlots(targets, bars, xorshift32());
    const perBar = [0, 0, 0];
    for (let i = 0; i < COUNT; i++) perBar[Math.floor(targets[i * 4 + 2]!)]! += 1;
    expect(perBar.reduce((s, n) => s + n, 0)).toBe(COUNT);
    expect(perBar[0]! / COUNT).toBeCloseTo(0.3, 2);
    expect(perBar[1]! / COUNT).toBeCloseTo(0.1, 2);
    expect(perBar[2]! / COUNT).toBeCloseTo(0.6, 2);
  });

  it('keeps every slot inside its bar', () => {
    const targets = new Float32Array(COUNT * 4);
    writeBarSlots(targets, bars, xorshift32());
    for (let i = 0; i < COUNT; i++) {
      const u = targets[i * 4 + 2]! % 1;
      const v = targets[i * 4 + 3]!;
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('thins out the open right edge of the last bar only', () => {
    const targets = new Float32Array(COUNT * 4);
    writeBarSlots(targets, bars, xorshift32());
    const edgeShare = (bar: number) => {
      let total = 0;
      let edge = 0;
      for (let i = 0; i < COUNT; i++) {
        const slot = targets[i * 4 + 2]!;
        if (Math.floor(slot) !== bar) continue;
        total += 1;
        if (slot % 1 > 0.97) edge += 1;
      }
      return edge / total;
    };
    expect(edgeShare(2)).toBeLessThan(0.02);
    expect(edgeShare(0)).toBeGreaterThan(0.02);
  });

  it('shares points evenly while the bars are not laid out yet', () => {
    expect(barShares([{ x: 0, y: 0, w: 0, h: 0 }])).toEqual([0]);
    const targets = new Float32Array(400 * 4);
    writeBarSlots(
      targets,
      [
        { x: 0, y: 0, w: 0, h: 0 },
        { x: 0, y: 0, w: 0, h: 0 },
      ],
      xorshift32(),
    );
    const first = Array.from({ length: 400 }, (_, i) => targets[i * 4 + 2]!).filter((s) => s < 1);
    expect(first).toHaveLength(200);
  });
});

describe('barsInView', () => {
  const vh = 900;
  it('commits once a quarter of the bars is on screen', () => {
    expect(barsInView({ x: 0, y: 880, w: 600, h: 100 }, vh, false)).toBe(false);
    expect(barsInView({ x: 0, y: 700, w: 600, h: 100 }, vh, false)).toBe(true);
  });

  it('holds while any part is visible, then lets go', () => {
    expect(barsInView({ x: 0, y: 880, w: 600, h: 100 }, vh, true)).toBe(true);
    expect(barsInView({ x: 0, y: -120, w: 600, h: 100 }, vh, true)).toBe(false);
    expect(barsInView(null, vh, true)).toBe(false);
  });
});

describe('packBars', () => {
  it('moves bars to page px and caps them at the shader limit', () => {
    const out = new Float32Array(MAX_BARS * 4).fill(9);
    const rects = Array.from({ length: MAX_BARS + 2 }, (_, i) => ({ x: i, y: 10, w: 5, h: 2 }));
    packBars(out, rects, 0, 500);
    expect([...out.subarray(0, 4)]).toEqual([0, 510, 5, 2]);
    expect(out[(MAX_BARS - 1) * 4]).toBe(MAX_BARS - 1);
  });
});

describe('name sampling', () => {
  const measure = (line: string) => line.length * 40;

  it('fits one line on desktop, snapped to the 10px grid and capped by height', () => {
    const wide = fitName('Jared Chester', 1440, 900, measure);
    expect(wide.lines).toEqual(['Jared Chester']);
    expect(wide.size % 10).toBe(0);
    expect(wide.size).toBeLessThanOrEqual(900 * 0.4);
    expect(fitName('Jared Chester', 1440, 300, measure).size).toBeLessThanOrEqual(120);
  });

  it('grows the width cap with the interface scale on a big screen', () => {
    const at4k = (ui: number) => fitName('Jared Chester', 3840, 2160, measure, ui).size;
    expect(at4k(2.5)).toBeGreaterThan(at4k(1) * 2);
  });

  it('wraps to one word per line below 640px', () => {
    expect(fitName('Jared Chester', 600, 900, measure).lines).toEqual(['Jared', 'Chester']);
  });

  it('collects inked pixels and their bounds', () => {
    const width = 4;
    const rgba = new Uint8ClampedArray(width * 3 * 4);
    rgba[(1 * width + 2) * 4 + 3] = 255;
    rgba[(2 * width + 1) * 4 + 3] = 200;
    rgba[(0 * width + 0) * 4 + 3] = 50;
    const pixels = inkedPixels(rgba, width);
    expect(pixels && [...pixels.indices]).toEqual([6, 9]);
    expect(pixels).toMatchObject({ x0: 1, y0: 1, x1: 2, y1: 2 });
    expect(inkedPixels(new Uint8ClampedArray(16), 2)).toBeNull();
  });

  it('places every point on an inked pixel, centred where asked', () => {
    const width = 10;
    const rgba = new Uint8ClampedArray(width * 10 * 4);
    for (const p of [11, 18, 81, 88]) rgba[p * 4 + 3] = 255;
    const pixels = inkedPixels(rgba, width)!;
    const targets = new Float32Array(500 * 4);
    const span = writeTextTargets(targets, pixels, 100, 50, xorshift32());
    expect(span.width).toBe(7);
    for (let i = 0; i < 500; i++) {
      const x = targets[i * 4]!;
      const y = targets[i * 4 + 1]!;
      expect(x).toBeGreaterThanOrEqual(96.5);
      expect(x).toBeLessThan(104.5);
      expect(y).toBeGreaterThanOrEqual(46.5);
      expect(y).toBeLessThan(54.5);
    }
  });
});

describe('seeds', () => {
  it('assigns lanes round-robin to six tethers, alternating out and back', () => {
    const meta = seedMeta(24, xorshift32());
    const lanes = Array.from({ length: 24 }, (_, i) => meta[i * 4]);
    expect(lanes.slice(0, 12)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (let i = 0; i < 24; i++) expect(Math.abs(meta[i * 4 + 2]!)).toBeLessThanOrEqual(2.6);
  });

  it('releases the river left to right, each point upstream of its letter', () => {
    const targets = new Float32Array(COUNT * 4);
    const rng = xorshift32();
    for (let i = 0; i < COUNT; i++) targets[i * 4] = rng() * 1000;
    const { positions, velocities } = seedRiver(targets, 400, 300, rng);
    let leftRelease = 0;
    let rightRelease = 0;
    for (let i = 0; i < COUNT; i++) {
      const tx = targets[i * 4]!;
      const release = positions[i * 4 + 3]!;
      if (tx < 100) leftRelease = Math.max(leftRelease, release);
      if (tx > 900) rightRelease = Math.max(rightRelease, release);
      // The current carries a point roughly to its letter by its release time.
      const arrival = positions[i * 4]! + RIVER_CURRENT * release;
      expect(arrival - tx).toBeLessThanOrEqual(140);
      expect(arrival - tx).toBeGreaterThanOrEqual(-380);
      expect(velocities[i * 4]).toBeGreaterThan(0);
    }
    expect(leftRelease).toBeLessThan(rightRelease);
  });

  it('starts the pocket inflow outside the screen', () => {
    const stage = { x: 0, y: 1000, w: 360, h: 360 };
    const { positions } = seedInflow(COUNT, stage, xorshift32());
    for (let i = 0; i < COUNT; i++) {
      const d = Math.hypot(positions[i * 4]! - 180, positions[i * 4 + 1]! - 1180);
      expect(d).toBeGreaterThan(180 * 0.9);
    }
  });

  it('gathers every shutdown target inside the core and keeps the bar slots', () => {
    const targets = new Float32Array(COUNT * 4).fill(7);
    writeCoreTargets(targets, { x: 500, y: 300, radius: 40 }, xorshift32());
    for (let i = 0; i < COUNT; i++) {
      expect(Math.hypot(targets[i * 4]! - 500, targets[i * 4 + 1]! - 300)).toBeLessThanOrEqual(40);
      expect([targets[i * 4 + 2], targets[i * 4 + 3]]).toEqual([7, 7]);
    }
  });
});

describe('inkPerPoint', () => {
  const base = {
    count: 262_144,
    cellArea: 9,
    nameArea: 60_000,
    tetherLength: 1500,
    barArea: 20_000,
    haloArea: 45_000,
    pocket: false,
  };

  it('spreads a formation’s tone across its points', () => {
    const ink = inkPerPoint(base);
    expect(ink.name).toBeCloseTo((0.95 * 60_000) / 9 / 262_144, 6);
    expect(ink.halo).toBeCloseTo((0.85 * 45_000) / 9 / 262_144, 6);
    expect(inkPerPoint({ ...base, count: base.count / 2 }).name).toBeCloseTo(ink.name * 2, 6);
    expect(inkPerPoint({ ...base, haloArea: 0 }).halo).toBe(0);
  });

  it('caps every budget and gives bars a faint default before they are measured', () => {
    const huge = inkPerPoint({
      ...base,
      count: 10,
      nameArea: 1e9,
      tetherLength: 1e9,
      barArea: 1e9,
      haloArea: 1e9,
    });
    expect(huge.name).toBe(0.5);
    expect(huge.hub).toBe(0.08);
    expect(huge.bar).toBe(1);
    expect(huge.halo).toBe(0.5);
    expect(inkPerPoint({ ...base, barArea: 0 }).bar).toBe(0.004);
  });

  it('keeps flying grain visible with fewer points', () => {
    expect(inkPerPoint(base).flight).toBeCloseTo(0.075, 6);
    expect(inkPerPoint({ ...base, count: 65_536 }).flight).toBeCloseTo(0.15, 6);
    expect(inkPerPoint({ ...base, pocket: true }).flight).toBe(0.12);
  });
});
