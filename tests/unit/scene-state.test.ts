import { describe, expect, it } from 'vitest';
import { BarFormation } from '@/components/gpu/bars';
import { BootClock, DESKTOP_BOOT, POCKET_BOOT } from '@/components/gpu/boot';
import { stillLuminance } from '@/components/gpu/fallback';
import { hubFraming } from '@/components/gpu/framing';

describe('BootClock', () => {
  it('reports each desktop milestone exactly once, in order', () => {
    const clock = new BootClock(DESKTOP_BOOT);
    const seen: string[] = [];
    for (let t = 0; t < 7; t += 1 / 60) {
      const events = clock.advance(1 / 60);
      if (events.live) seen.push('live');
      if (events.reveal) seen.push('reveal');
      if (events.end && !seen.includes('end')) seen.push('end');
    }
    expect(seen).toEqual(['live', 'reveal', 'end']);
    expect(clock.revealed).toBe(true);
  });

  it('brings the pocket hub live at once and reveals as the short boot ends', () => {
    const clock = new BootClock(POCKET_BOOT);
    expect(clock.advance(1 / 30)).toEqual({ live: true, reveal: false, end: false });
    const last = clock.advance(1.2);
    expect(last.reveal).toBe(true);
    expect(last.end).toBe(true);
  });
});

describe('BarFormation', () => {
  const bars = [
    { x: 100, y: 500, w: 200, h: 12 },
    { x: 320, y: 534, w: 80, h: 12 },
    { x: 420, y: 568, w: 400, h: 12 },
  ];

  it('deals slots for new bars, and again only when their proportions drift', () => {
    const f = new BarFormation();
    expect(f.update(bars)).toEqual({ moved: true, redeal: true });
    expect(f.update(bars)).toEqual({ moved: false, redeal: false });
    // Dragging the window moves the bars without changing their sizes.
    const dragged = bars.map((b) => ({ ...b, x: b.x + 40 }));
    expect(f.update(dragged)).toEqual({ moved: true, redeal: false });
    const resized = dragged.map((b, i) => (i === 2 ? { ...b, w: b.w * 2 } : b));
    expect(f.update(resized).redeal).toBe(true);
  });

  it('waits for bars with an area before dealing', () => {
    expect(new BarFormation().update([{ x: 0, y: 0, w: 0, h: 0 }]).redeal).toBe(false);
  });

  it('pours over 1.7 s and drains back', () => {
    const f = new BarFormation();
    f.update(bars);
    f.step(0.85, true, 0, 0);
    expect(f.mix).toBeCloseTo(0.5, 5);
    f.step(1, true, 0, 0);
    expect(f.mix).toBe(1);
    f.step(1.7, false, 0, 0);
    expect(f.mix).toBe(0);
  });

  it('tracks how fast the window is dragged, in page px', () => {
    const f = new BarFormation();
    f.update(bars);
    f.step(0.1, true, 0, 0);
    f.update(bars.map((b) => ({ ...b, x: b.x + 30 })));
    f.step(0.1, true, 0, 0);
    expect(f.velocity[0]).toBeCloseTo(300, 5);
    // Scrolling moves the bars in the viewport but not on the page.
    f.update(bars.map((b) => ({ ...b, x: b.x + 30, y: b.y - 50 })));
    f.step(0.1, true, 0, 50);
    expect(f.velocity).toEqual([0, 0]);
  });

  it('jumps straight to the end of the pour for still frames', () => {
    const f = new BarFormation();
    expect(f.jump(true)).toBe(true);
    expect(f.mix).toBe(1);
    expect(f.jump(true)).toBe(false);
  });
});

describe('stillLuminance', () => {
  const cols = 96;
  const rows = 60;
  const lum = stillLuminance(cols, rows, hubFraming({ w: cols, h: rows }, 1440, false));
  const at = (i: number, j: number) => lum[j * cols + i]!;

  it('stays within paper and ink', () => {
    for (const v of lum) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('leaves the corners as paper and draws the hub right of centre', () => {
    expect(at(0, 0)).toBe(1);
    expect(at(cols - 1, 0)).toBe(1);
    let leftInk = 0;
    let rightInk = 0;
    lum.forEach((v, index) => {
      if (v > 0.5) return;
      if (index % cols < cols / 2) leftInk += 1;
      else rightInk += 1;
    });
    expect(rightInk).toBeGreaterThan(100);
    expect(rightInk).toBeGreaterThan(leftInk * 4);
  });
});
