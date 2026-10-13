import { describe, expect, it } from 'vitest';
import { LATERAL_LIMIT } from '@/components/gpu/formations';
import {
  FollowFormation,
  HALO_GAP,
  HALO_REACH,
  haloArea,
  haloDistance,
  haloPerimeter,
  haloPoint,
} from '@/components/gpu/halo';
import { inkPerPoint } from '@/components/gpu/ink';
import { followTarget, heroArea, sceneModeFor } from '@/components/gpu/modes';
import type { Rect } from '@/components/gpu/rect';
import { gaussian, xorshift32 } from '@/components/gpu/rng';

type Point = { x: number; y: number };

/** How far a point is outside a rect (0 inside it). */
const outside = (r: Rect, p: Point) =>
  Math.hypot(Math.max(r.x - p.x, 0, p.x - r.x - r.w), Math.max(r.y - p.y, 0, p.y - r.y - r.h));

const expectNear = (p: Point, q: Point) => {
  expect(p.x).toBeCloseTo(q.x, 6);
  expect(p.y).toBeCloseTo(q.y, 6);
};

/** Lateral offsets as seedMeta draws them: clamped standard Gaussians. */
const laterals = (n: number, seed: number) => {
  const rng = xorshift32(seed);
  return Array.from({ length: n }, () =>
    Math.max(-LATERAL_LIMIT, Math.min(LATERAL_LIMIT, gaussian(rng))),
  );
};

describe('haloPoint', () => {
  const win = { x: 100, y: 200, w: 400, h: 300 };

  it('puts every point exactly d outside the frame', () => {
    const rng = xorshift32(5);
    for (let i = 0; i < 2000; i++) {
      const d = rng() * 40;
      expect(outside(win, haloPoint(win, rng(), d))).toBeCloseTo(d, 6);
    }
  });

  it('starts at the top-left corner and walks clockwise', () => {
    const d = 10;
    const arc = (Math.PI / 2) * d;
    const along = (s: number) => haloPoint(win, s / haloPerimeter(win, d), d);
    expectNear(along(0), { x: 100, y: 190 });
    expectNear(along(250), { x: 350, y: 190 });
    // Round the top-right corner and down the right side.
    expectNear(along(400 + arc / 2), {
      x: 500 + d * Math.SQRT1_2,
      y: 200 - d * Math.SQRT1_2,
    });
    expectNear(along(400 + arc + 150), { x: 510, y: 350 });
    // Right to left along the bottom, then up the left side.
    expectNear(along(700 + 2 * arc + 100), { x: 400, y: 510 });
    expectNear(along(1100 + 3 * arc + 100), { x: 90, y: 400 });
    // A full turn is back at the start.
    expectNear(haloPoint(win, 1, d), along(0));
  });

  it('spaces equal steps of t equally along the outline, corners included', () => {
    const d = 12;
    const n = 1000;
    const step = haloPerimeter(win, d) / n;
    for (let i = 0; i < n; i++) {
      const a = haloPoint(win, i / n, d);
      const b = haloPoint(win, (i + 1) / n, d);
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(step, 2);
    }
  });
});

describe('halo density', () => {
  const band = HALO_REACH - HALO_GAP;

  it('stays between the gap and the reach', () => {
    expect(haloDistance(0)).toBe(HALO_GAP);
    expect(haloDistance(-LATERAL_LIMIT)).toBe(HALO_REACH);
    expect(haloDistance(99)).toBe(HALO_REACH);
  });

  it('crowds the frame and thins out away from it', () => {
    const distances = laterals(20_000, 11).map(haloDistance);
    const inner = distances.filter((d) => d < HALO_GAP + band / 3).length;
    const outer = distances.filter((d) => d > HALO_REACH - band / 3).length;
    expect(inner).toBeGreaterThan(outer * 5);
  });

  it('inks the band at the frame nearly solid, whatever the window', () => {
    const count = 100_000;
    const distances = laterals(count, 7).map(haloDistance);
    // The points within 1px of the halo's inner edge, spread round the outline there.
    const edge = distances.filter((d) => d < HALO_GAP + 1).length;
    for (const win of [
      { x: 0, y: 0, w: 880, h: 600 },
      { x: 0, y: 0, w: 1248, h: 420 },
    ]) {
      const ink = inkPerPoint({
        count,
        cellArea: 9,
        nameArea: 0,
        tetherLength: 0,
        barArea: 0,
        haloArea: haloArea(win),
        pocket: false,
      }).halo;
      const perPx = edge / haloPerimeter(win, HALO_GAP + 0.5);
      expect(perPx * 9 * ink).toBeCloseTo(0.85, 1);
    }
  });

  it('has no area without a window, and grows with the perimeter', () => {
    const win = { x: 0, y: 0, w: 400, h: 300 };
    expect(haloArea(null)).toBe(0);
    expect(haloArea({ ...win, w: 800, h: 600 })).toBeCloseTo(2 * haloArea(win), 6);
  });
});

describe('FollowFormation', () => {
  const writing = { x: 40, y: 2400, w: 880, h: 600 };
  const counterdex = { x: 40, y: 3100, w: 1248, h: 520 };

  it('streams into the halo over 1.6 s and back out', () => {
    const f = new FollowFormation();
    f.update(writing);
    f.step(0.8, true);
    expect(f.mix).toBeCloseTo(0.5, 5);
    f.step(1, true);
    expect(f.mix).toBe(1);
    f.step(1.6, false);
    expect(f.mix).toBe(0);
  });

  it('chases a dragged window, and hops to a different one', () => {
    const f = new FollowFormation();
    f.update(writing);
    f.step(1.6, true);
    const dragged = { ...writing, x: writing.x + 24, y: writing.y + 10 };
    f.update(dragged);
    expect(f.hop).toBe(1);
    expect(f.rect).toEqual(dragged);
    f.update(counterdex);
    expect(f.hop).toBe(0);
    expect(f.from).toEqual(dragged);
    f.step(0.65, true);
    expect(f.hop).toBeCloseTo(0.5, 5);
    f.step(1, true);
    expect(f.hop).toBe(1);
  });

  it('needs no hop while the halo is empty', () => {
    const f = new FollowFormation();
    f.update(writing);
    f.update(counterdex);
    expect(f.hop).toBe(1);
    expect(f.rect).toEqual(counterdex);
  });

  it('keeps the last window while the points leave it', () => {
    const f = new FollowFormation();
    f.update(writing);
    f.step(1.6, true);
    f.update(null);
    expect(f.following).toBe(false);
    expect(f.rect).toEqual(writing);
    f.step(0.8, false);
    expect(f.mix).toBeCloseTo(0.5, 5);
  });

  it('jumps straight to the end for still frames', () => {
    const f = new FollowFormation();
    expect(f.jump(true)).toBe(true);
    expect(f.jump(true)).toBe(false);
    f.update(writing);
    f.update(counterdex);
    expect(f.jump(true)).toBe(true);
    expect(f.hop).toBe(1);
  });
});

describe('scene mode', () => {
  const viewport = { width: 1440, height: 900 };
  const modeAt = (scrollY: number, trace: boolean, windows: [string, number][]) =>
    sceneModeFor({
      booting: false,
      trace,
      following: followTarget(new Map(windows), heroArea(scrollY, viewport)) !== null,
    });

  it('lets the boot play undisturbed', () => {
    expect(sceneModeFor({ booting: true, trace: true, following: true })).toBe('boot');
  });

  it('ranks the trace over a followed window over the wallpaper', () => {
    expect(sceneModeFor({ booting: false, trace: true, following: true })).toBe('experience');
    expect(sceneModeFor({ booting: false, trace: false, following: true })).toBe('follow');
    expect(sceneModeFor({ booting: false, trace: false, following: false })).toBe('wallpaper');
  });

  it('walks a visitor down the page and back', () => {
    expect(modeAt(0, false, [])).toBe('wallpaper');
    expect(modeAt(1200, true, [])).toBe('experience');
    expect(modeAt(2200, true, [['writing', 120_000]])).toBe('experience');
    expect(modeAt(2600, false, [['writing', 480_000]])).toBe('follow');
    expect(modeAt(0, false, [])).toBe('wallpaper');
  });

  it('keeps the hub while the hero covers more of the screen than any window', () => {
    // Scrolled 700px with Experience closed: 200px of hero against a peek of Writing.
    expect(modeAt(700, false, [['writing', 600 * 250]])).toBe('wallpaper');
    expect(modeAt(700, false, [['writing', 880 * 400]])).toBe('follow');
  });
});

describe('followTarget', () => {
  it('follows the window covering the most of the viewport', () => {
    const windows = new Map([
      ['counterdex', 300_000],
      ['docly', 380_000],
      ['dateescape', 120_000],
    ]);
    expect(followTarget(windows, 0)).toBe('docly');
  });

  it('follows nothing when the hero wins or nothing is on screen', () => {
    expect(followTarget(new Map([['writing', 50_000]]), 400_000)).toBeNull();
    expect(followTarget(new Map(), 0)).toBeNull();
    expect(followTarget(new Map([['writing', 0]]), 0)).toBeNull();
  });
});

describe('heroArea', () => {
  const viewport = { width: 1440, height: 900 };

  it('shrinks as the first screen scrolls away, and never below nothing', () => {
    expect(heroArea(0, viewport)).toBe(1440 * 900);
    expect(heroArea(600, viewport)).toBe(1440 * 300);
    expect(heroArea(2000, viewport)).toBe(0);
    // Overscroll at the top pulls the page down, but the hero still fills only the screen.
    expect(heroArea(-40, viewport)).toBe(1440 * 900);
  });
});
