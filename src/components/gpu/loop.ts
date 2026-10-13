/**
 * The animation clock: requestAnimationFrame with an optional frame-rate cap and clamped time
 * steps, plus coalesced one-off still frames for while the loop is stopped.
 */

/** rAF timestamps jitter; a capped frame may arrive this many ms early and still count. */
const FRAME_SLACK_MS = 4;
/** A long gap (a background tab, a debugger pause) advances the scene by at most this. */
const MAX_STEP = 0.05;

export class FrameLoop {
  private readonly tick: (dt: number) => void;
  private readonly still: () => void;
  private readonly minInterval: number;
  private raf = 0;
  private stillRaf = 0;
  private last = 0;
  private on = false;

  /** `tick` advances and draws a frame; `still` draws one without advancing time. */
  constructor(fpsCap: number | null, tick: (dt: number) => void, still: () => void) {
    this.tick = tick;
    this.still = still;
    this.minInterval = fpsCap ? 1000 / fpsCap - FRAME_SLACK_MS : 0;
  }

  get running(): boolean {
    return this.on;
  }

  start(): void {
    if (this.on) return;
    this.cancelStill();
    this.on = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.on = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Draws a still on the next animation frame. Calls coalesce; a running loop ignores them. */
  requestStill(): void {
    if (this.on || this.stillRaf) return;
    this.stillRaf = requestAnimationFrame(() => {
      this.stillRaf = 0;
      if (!this.on) this.still();
    });
  }

  dispose(): void {
    this.stop();
    this.cancelStill();
  }

  private cancelStill(): void {
    cancelAnimationFrame(this.stillRaf);
    this.stillRaf = 0;
  }

  private readonly frame = (now: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.last && now - this.last < this.minInterval) return;
    const dt = this.last ? Math.min(MAX_STEP, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.tick(dt);
  };
}
