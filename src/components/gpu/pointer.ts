/**
 * The cursor has two audiences. The points want its position and velocity in px and a strength
 * that rises with speed, so a flick scatters them and a still cursor barely does. The hub's tools
 * want it in the hub's own coordinates, eased, so they lean toward it slowly.
 */
import type { Framing } from './framing';
import type { Rect } from './rect';

const MAX_SPEED = 4000;
const clampSpeed = (v: number) => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, v));

export class PointerTracker {
  /** Viewport px; far off-screen until the first move. */
  x = -1e5;
  y = -1e5;
  vx = 0;
  vy = 0;
  /** 0..1: how hard the cursor pushes points this frame. */
  strength = 0;
  private active = false;
  private lastTime = 0;

  move(x: number, y: number, active: boolean, timeMs: number): void {
    if (active && this.active && this.lastTime) {
      const dt = Math.max(1, timeMs - this.lastTime) / 1000;
      // Smooth the velocity estimate: raw pointer deltas are noisy at high event rates.
      this.vx += (clampSpeed((x - this.x) / dt) - this.vx) * 0.35;
      this.vy += (clampSpeed((y - this.y) / dt) - this.vy) * 0.35;
    }
    this.x = x;
    this.y = y;
    this.active = active;
    this.lastTime = active ? timeMs : 0;
  }

  step(dt: number): void {
    const speed = Math.hypot(this.vx, this.vy);
    const want = this.active ? 0.3 + 0.7 * Math.min(1, speed / 1400) : 0;
    // Rise fast, fall slowly, so a flick's push lingers for a moment.
    const rate = want > this.strength ? 14 : 3;
    this.strength += (want - this.strength) * (1 - Math.exp(-dt * rate));
    const decay = Math.exp(-dt * 5);
    this.vx *= decay;
    this.vy *= decay;
  }
}

/**
 * The cursor in hub space (stage heights from the lens centre), or null when it is away from the
 * hub (more than 60px below its stage), so the tools let go.
 */
export function hubCursorTarget(
  x: number,
  y: number,
  stage: Rect,
  framing: Framing,
): { x: number; y: number } | null {
  if (stage.w <= 0 || stage.h <= 0 || y > stage.y + stage.h + 60) return null;
  return {
    x: (x - stage.x - stage.w / 2) / stage.h - framing.shiftX,
    y: (stage.y + stage.h / 2 - y) / stage.h - framing.shiftY,
  };
}

/** The tools' view of the cursor, eased toward its target. */
export class HubCursor {
  x = 0;
  y = 0;
  on = 0;
  private target = { x: 0, y: 0, on: 0 };

  aim(target: { x: number; y: number } | null): void {
    if (target) this.target = { ...target, on: 1 };
    else this.target.on = 0;
  }

  step(dt: number): void {
    const k = 1 - Math.exp(-dt * 5);
    this.x += (this.target.x - this.x) * k;
    this.y += (this.target.y - this.y) * k;
    this.on += (this.target.on - this.on) * k * 0.7;
  }
}
