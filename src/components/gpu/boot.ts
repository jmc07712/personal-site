/**
 * The boot choreography as pure functions of time. Desktop: points stream in on a current and
 * settle into the name (0-3 s), the name implodes into the core while the hub dithers in (3-4 s),
 * then the tethers come alive. Pocket: a 1.2 s inflow from the screen's edges into the core.
 */
import { clamp01 } from './math';

/** The four uniforms that drive the boot in the simulation and composite shaders. */
export interface BootUniforms {
  /** Seconds since the boot began; each point is released from the stream at its own time. */
  intro: number;
  /** 0 = points hold the name, 1 = it has collapsed into the hub (sweeping left to right). */
  implode: number;
  /** How far the hub has resolved through the dither, 0..1. */
  fade: number;
  /** The hub's scale, 0..1. */
  grow: number;
}

/** The state after the boot (and the only state with reduced motion). */
export const SETTLED: BootUniforms = { intro: 99, implode: 1, fade: 1, grow: 1 };

export interface BootScript {
  /** When the tethers start carrying traffic. */
  hubLive: number;
  /** When the page can reveal its windows: the hub has resolved. */
  reveal: number;
  /** When the choreography is over and the boot hands over to the wallpaper. */
  end: number;
  uniforms(t: number): BootUniforms;
}

const easeOutCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;

export const DESKTOP_BOOT: BootScript = {
  hubLive: 3.35,
  reveal: 3.95,
  end: 6,
  uniforms: (t) => ({
    intro: t,
    implode: clamp01((t - 3) / 0.9),
    fade: clamp01((t - 3.05) / 1),
    grow: easeOutCubic((t - 3) / 1.3),
  }),
};

export const POCKET_BOOT: BootScript = {
  hubLive: 0,
  reveal: 1.2,
  end: 1.2,
  uniforms: (t) => ({
    intro: t,
    implode: 1,
    fade: clamp01((t - 0.1) / 0.8),
    grow: easeOutCubic(t / 1),
  }),
};

/** What happened during one step of the boot. */
export interface BootEvents {
  /** The tethers just came alive. */
  live: boolean;
  /** The hub has just resolved: the page may show its windows. */
  reveal: boolean;
  /** The boot is over. */
  end: boolean;
}

/** Plays a boot script, reporting each milestone exactly once. */
export class BootClock {
  private readonly script: BootScript;
  private t = 0;
  private wentLive = false;
  revealed = false;

  constructor(script: BootScript) {
    this.script = script;
  }

  get uniforms(): BootUniforms {
    return this.script.uniforms(this.t);
  }

  advance(dt: number): BootEvents {
    this.t += dt;
    const live = !this.wentLive && this.t >= this.script.hubLive;
    const reveal = !this.revealed && this.t >= this.script.reveal;
    this.wentLive ||= live;
    this.revealed ||= reveal;
    return { live, reveal, end: this.t >= this.script.end };
  }
}
