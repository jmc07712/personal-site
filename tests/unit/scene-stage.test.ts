import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameLoop } from '@/components/gpu/loop';
import { CanvasStage, type Placement } from '@/components/gpu/stage';

describe('CanvasStage cell conversions', () => {
  // A 480x300 cell canvas at 3 CSS px per cell; only its size matters here.
  const canvas = { width: 480, height: 300, style: {}, parentElement: null };
  const stage = new CanvasStage(canvas as unknown as HTMLCanvasElement, false);
  const place: Placement = {
    scrollX: 0,
    scrollY: 600,
    col: 0,
    row: 200,
    originX: 0,
    originY: 600,
    hub: { x: 0, y: 0, w: 1440, h: 900 },
  };

  it('puts the hub in GL cells, counted from the bottom', () => {
    // Scrolled 600px: the hub's top is 200 cells above the canvas, its bottom 100 cells down.
    expect(stage.hubCells(place)).toEqual([0, 200, 480, 300]);
  });

  it('cuts viewport rects out with a cell of margin', () => {
    const cuts = new Float32Array(8);
    const count = stage.writeCuts(cuts, [{ x: 30, y: 300, w: 60, h: 12 }], place);
    expect(count).toBe(1);
    // Viewport y 300 is page y 900: cells 100 to 104 from the top, so GL rows 196 to 200.
    expect([...cuts.subarray(0, 4)]).toEqual([9, 195, 31, 201]);
    expect([...cuts.subarray(4)]).toEqual([0, 0, 0, 0]);
  });

  it('never writes more cuts than the buffer holds', () => {
    const cuts = new Float32Array(4);
    const rect = { x: 0, y: 0, w: 3, h: 3 };
    expect(stage.writeCuts(cuts, [rect, rect, rect], place)).toBe(1);
  });
});

describe('FrameLoop', () => {
  let queue: FrameRequestCallback[] = [];
  const frame = (time: number) => {
    const callbacks = queue;
    queue = [];
    callbacks.forEach((callback) => callback(time));
  };

  beforeEach(() => {
    queue = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queue.push(callback);
      return queue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      queue = [];
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('ticks every display frame when uncapped, with clamped steps', () => {
    const steps: number[] = [];
    const loop = new FrameLoop(
      null,
      (dt) => steps.push(dt),
      () => {},
    );
    loop.start();
    [0, 16.7, 33.4, 1033.4].forEach(frame);
    expect(steps).toHaveLength(4);
    expect(steps[1]).toBeCloseTo(0.0167, 4);
    expect(steps[3]).toBe(0.05);
  });

  it('holds a 30fps cap on a 60Hz display', () => {
    let ticks = 0;
    const loop = new FrameLoop(
      30,
      () => (ticks += 1),
      () => {},
    );
    loop.start();
    for (let i = 0; i <= 60; i++) frame(i * (1000 / 60));
    expect(ticks).toBe(31);
  });

  it('coalesces still requests and ignores them while running', () => {
    let stills = 0;
    const loop = new FrameLoop(
      null,
      () => {},
      () => (stills += 1),
    );
    loop.requestStill();
    loop.requestStill();
    frame(0);
    expect(stills).toBe(1);
    loop.start();
    loop.requestStill();
    frame(16);
    expect(stills).toBe(1);
  });

  it('stops ticking when stopped', () => {
    let ticks = 0;
    const loop = new FrameLoop(
      null,
      () => (ticks += 1),
      () => {},
    );
    loop.start();
    frame(0);
    loop.stop();
    frame(16);
    expect(ticks).toBe(1);
    expect(loop.running).toBe(false);
  });
});
