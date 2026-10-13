import { describe, expect, it } from 'vitest';
import { DESKTOP_BOOT, POCKET_BOOT, SETTLED } from '@/components/gpu/boot';
import { cellSize, gridSize, hubFraming, pageLock } from '@/components/gpu/framing';
import {
  CORE,
  TOOL_COUNT,
  TetherClock,
  createHubScreen,
  diveAmount,
  hubCamera,
  project,
  surgeAmount,
  toolPosition,
  updateHubScreen,
} from '@/components/gpu/hub';
import { length, sub } from '@/components/gpu/math';

const stage = { x: 0, y: 0, w: 1440, h: 900 };

describe('hubFraming', () => {
  it('moves the hub right on wide desktops, where the About window covers the left', () => {
    const wide = hubFraming(stage, 1440, false);
    const camera = hubCamera(0);
    const core = project(CORE, camera, wide, stage);
    expect(core.x).toBeGreaterThan(stage.w * 0.6);
  });

  it('centres the hub in the pocket screen', () => {
    const square = { x: 0, y: 0, w: 360, h: 360 };
    const core = project(CORE, hubCamera(0), hubFraming(square, 360, true), square);
    expect(core.x).toBeGreaterThan(150);
    expect(core.x).toBeLessThan(210);
  });
});

describe('grid and page lock', () => {
  it('rounds cells to whole device pixels', () => {
    expect(cellSize(3, 1)).toBe(3);
    expect(cellSize(3, 2)).toBe(3);
    expect(cellSize(2.5, 1)).toBe(3);
    expect(cellSize(2.5, 2)).toBe(2.5);
    expect(cellSize(3, 1.5) * 1.5).toBe(Math.round(3 * 1.5));
  });

  it('covers the frame with a spare row and column for the page-lock shift', () => {
    const { cols, rows } = gridSize(1440, 900, 3);
    expect(cols * 3).toBeGreaterThanOrEqual(1440 + 3);
    expect(rows * 3).toBeGreaterThanOrEqual(900 + 3);
  });

  it('snaps the canvas to the page grid, shifting it by less than a cell', () => {
    for (const top of [0, 1, 2.9, 1000, 1001.5]) {
      const lock = pageLock(0, top, 3);
      expect(lock.row * 3).toBeLessThanOrEqual(top + 1e-6);
      expect(lock.offsetY).toBeLessThanOrEqual(1e-6);
      expect(lock.offsetY).toBeGreaterThan(-3);
      expect(lock.row * 3 - top).toBeCloseTo(lock.offsetY, 9);
    }
  });
});

describe('tools', () => {
  it('dives during the first quarter of each cycle and surges right after', () => {
    expect(diveAmount(0.09)).toBe(1);
    expect(diveAmount(0.5)).toBe(0);
    expect(surgeAmount(0.05)).toBe(0);
    expect(surgeAmount(0.16)).toBe(1);
    expect(surgeAmount(0.6)).toBe(0);
  });

  it('pulls a diving tool in toward the core', () => {
    const out = length(sub(toolPosition(2, 4, 1, 0), CORE));
    const dived = length(sub(toolPosition(2, 4, 1, 1), CORE));
    expect(dived).toBeLessThan(out * 0.65);
  });

  it('grows the hub in from a third of its size', () => {
    const small = length(sub(toolPosition(0, 1, 0, 0), CORE));
    const full = length(sub(toolPosition(0, 1, 1, 0), CORE));
    expect(small / full).toBeCloseTo(0.3, 5);
  });
});

describe('updateHubScreen', () => {
  const pose = {
    t: 20,
    grow: 1,
    sincePing: 99,
    cursor: { x: 0, y: 0, on: 0 },
    framing: hubFraming(stage, 1440, false),
    stage,
  };

  it('places the core and every tool inside the stage with sensible radii', () => {
    const screen = createHubScreen();
    updateHubScreen(screen, pose);
    expect(screen.core.radius).toBeGreaterThan(40);
    for (let i = 0; i < TOOL_COUNT; i++) {
      const [x, y, r, surge] = screen.tools.subarray(i * 4, i * 4 + 4);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(stage.w);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(stage.h);
      expect(r).toBeLessThan(screen.core.radius);
      expect(surge).toBeGreaterThanOrEqual(0);
      expect(surge).toBeLessThanOrEqual(1);
    }
    expect(screen.tetherLength).toBeGreaterThan(300);
  });

  it('scales with the stage, so the same hub fits any screen', () => {
    const big = createHubScreen();
    const small = createHubScreen();
    updateHubScreen(big, pose);
    updateHubScreen(small, { ...pose, stage: { x: 0, y: 0, w: 720, h: 450 } });
    expect(small.tetherLength).toBeCloseTo(big.tetherLength / 2, 3);
  });
});

describe('TetherClock', () => {
  it('runs a surging tether faster', () => {
    const clock = new TetherClock();
    const tools = new Float32Array(TOOL_COUNT * 4);
    tools[3] = 1;
    clock.advance(1, tools);
    expect(clock.phase[0]).toBeCloseTo(TetherClock.SPEED * 3.2, 5);
    expect(clock.phase[1]).toBeCloseTo(TetherClock.SPEED, 5);
    expect(clock.previous[0]).toBe(0);
  });

  it('restarts tethers empty and settles them full', () => {
    const clock = new TetherClock();
    clock.advance(2, new Float32Array(TOOL_COUNT * 4));
    clock.restart();
    expect([...clock.origin]).toEqual([...clock.phase]);
    clock.settle();
    expect(clock.origin[0]).toBeCloseTo((clock.phase[0] ?? 0) - 2, 5);
  });
});

describe('boot scripts', () => {
  it('starts on bare paper and ends settled', () => {
    for (const script of [DESKTOP_BOOT, POCKET_BOOT]) {
      const start = script.uniforms(0);
      expect(start.fade).toBe(0);
      expect(start.grow).toBe(0);
      const end = script.uniforms(script.end);
      expect(end.fade).toBe(SETTLED.fade);
      expect(end.grow).toBe(SETTLED.grow);
      expect(end.implode).toBe(SETTLED.implode);
    }
  });

  it('holds the name until 3 s on desktop, then reveals once the hub has resolved', () => {
    expect(DESKTOP_BOOT.uniforms(2.9).implode).toBe(0);
    expect(DESKTOP_BOOT.uniforms(3.5).implode).toBeGreaterThan(0);
    expect(DESKTOP_BOOT.uniforms(DESKTOP_BOOT.reveal).fade).toBeGreaterThan(0.85);
    expect(DESKTOP_BOOT.hubLive).toBeLessThan(DESKTOP_BOOT.reveal);
  });

  it('keeps the pocket boot to about 1.2 s', () => {
    expect(POCKET_BOOT.end).toBeLessThanOrEqual(1.25);
  });
});
