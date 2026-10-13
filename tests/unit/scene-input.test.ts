import { describe, expect, it } from 'vitest';
import { hubFraming } from '@/components/gpu/framing';
import { HubCursor, PointerTracker, hubCursorTarget } from '@/components/gpu/pointer';
import { regionBlit } from '@/components/gpu/regions';

describe('PointerTracker', () => {
  it('pushes harder the faster the cursor moves', () => {
    const slow = new PointerTracker();
    const fast = new PointerTracker();
    for (let i = 0; i < 10; i++) {
      slow.move(100 + i, 100, true, i * 16);
      fast.move(100 + i * 40, 100, true, i * 16);
      slow.step(0.016);
      fast.step(0.016);
    }
    expect(fast.strength).toBeGreaterThan(slow.strength);
    expect(slow.strength).toBeGreaterThan(0.2);
  });

  it('lets go when the cursor leaves', () => {
    const p = new PointerTracker();
    p.move(10, 10, true, 0);
    for (let i = 0; i < 30; i++) p.step(0.016);
    p.move(10, 10, false, 500);
    for (let i = 0; i < 120; i++) p.step(0.016);
    expect(p.strength).toBeLessThan(0.01);
  });

  it('does not invent velocity from the first move', () => {
    const p = new PointerTracker();
    p.move(900, 500, true, 1000);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });
});

describe('hub cursor', () => {
  const stage = { x: 0, y: 0, w: 1440, h: 900 };
  const framing = hubFraming(stage, 1440, false);

  it('maps the lens centre to the origin of hub space', () => {
    const target = hubCursorTarget(720 + framing.shiftX * 900, 450, stage, framing);
    expect(target?.x).toBeCloseTo(0, 6);
    expect(target?.y).toBeCloseTo(0, 6);
  });

  it('lets the tools go once the cursor is well below the hub', () => {
    expect(hubCursorTarget(720, 1000, stage, framing)).toBeNull();
  });

  it('eases toward its target', () => {
    const cursor = new HubCursor();
    cursor.aim({ x: 1, y: -1 });
    cursor.step(0.1);
    expect(cursor.x).toBeGreaterThan(0);
    expect(cursor.x).toBeLessThan(1);
    for (let i = 0; i < 200; i++) cursor.step(0.05);
    expect(cursor.x).toBeCloseTo(1, 3);
    expect(cursor.on).toBeCloseTo(1, 3);
    cursor.aim(null);
    for (let i = 0; i < 200; i++) cursor.step(0.05);
    expect(cursor.on).toBeCloseTo(0, 3);
  });
});

describe('regionBlit', () => {
  // A 480x300 cell canvas drawn 3 CSS px per cell, shifted up 1px by the page lock.
  const source = { x: 0, y: -1, w: 1440, h: 900 };
  const sourceSize = { width: 480, height: 300 };

  it('copies the cells under a region at the region’s own resolution', () => {
    const blit = regionBlit(
      source,
      sourceSize,
      { x: 300, y: 599, w: 600, h: 12 },
      { width: 1200, height: 24 },
    );
    expect(blit).toEqual({ sx: 100, sy: 200, sw: 200, sh: 4, dx: 0, dy: 0, dw: 1200, dh: 24 });
  });

  it('clips a region hanging off the scene', () => {
    const blit = regionBlit(
      source,
      sourceSize,
      { x: 1380, y: 299, w: 120, h: 30 },
      { width: 120, height: 30 },
    );
    expect(blit).toMatchObject({ sx: 460, sw: 20, dx: 0, dw: 60 });
  });

  it('skips regions that miss the scene or have no size', () => {
    expect(
      regionBlit(source, sourceSize, { x: 0, y: 1200, w: 50, h: 50 }, { width: 50, height: 50 }),
    ).toBeNull();
    expect(
      regionBlit(source, sourceSize, { x: 0, y: 0, w: 0, h: 50 }, { width: 0, height: 50 }),
    ).toBeNull();
  });
});
