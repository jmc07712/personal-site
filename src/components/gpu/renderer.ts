/**
 * The scene: one GPU, one dither. A raymarched agent hub and up to 262,144 simulated points
 * render into one low-resolution luminance buffer, and a single 8x8 Bayer pass reduces the whole
 * frame to the site's two inks.
 *
 *   1. simulate   transform feedback moves every point (particles.ts, shaders/sim.glsl.ts)
 *   2. splat      each point adds its ink to one cell of a half-float buffer (splat.glsl.ts)
 *   3. composite  raymarch the hub, multiply the ink in, dither once (compositor.ts)
 *
 * This class is the scene's state machine: boot, wallpaper, experience, follow. It knows nothing
 * about React: callers feed it the pointer, the role-bar rects, the followed window and a mode, and
 * get pixels back. All simulation coordinates are page px, so formations stay attached to the
 * document as it scrolls.
 */
import { identity } from '@/content/resume';
import { BarFormation, barsInView, MAX_BARS, packBars, writeBarSlots } from './bars';
import { BootClock, DESKTOP_BOOT, POCKET_BOOT, SETTLED, type BootUniforms } from './boot';
import { CompositePass, type CompositeFrame } from './compositor';
import { RIVER_CURRENT, seedInflow, seedMeta, seedRiver } from './formations';
import { clearTarget, createDensityTarget, deleteDensityTarget, type DensityTarget } from './gl';
import { loadFont, rasterizeName } from './glyphs';
import { FollowFormation, haloArea } from './halo';
import { createHubScreen, STILL_TIME, TetherClock, updateHubScreen } from './hub';
import { inkPerPoint } from './ink';
import { FrameLoop } from './loop';
import { ParticleSystem, type SimFrame } from './particles';
import { HubCursor, hubCursorTarget, PointerTracker } from './pointer';
import { area, boundingBox, type Rect } from './rect';
import { xorshift32 } from './rng';
import { CanvasStage, type Placement } from './stage';
import { writeTextTargets, type InkedPixels } from './text';

export type { Rect } from './rect';

export type SceneMode = 'boot' | 'wallpaper' | 'experience' | 'follow';

export interface SceneOptions {
  /** How many points to simulate (see sizing.ts). */
  particles: number;
  /** Frames per second ceiling, or null for the display's rate. */
  fpsCap: number | null;
  /** CSS px per bitmap pixel. */
  pixel: number;
  /** Raymarch step budget per cell. */
  steps: number;
  /** Pocket mode: the canvas is a square screen in the page flow, not a fixed desktop layer. */
  pocket: boolean;
  /** Never animate: still frames only, no boot. */
  reducedMotion: boolean;
}

/** GPU resources, rebuilt from scratch if the context is lost and restored. */
interface Gpu {
  particles: ParticleSystem;
  composite: CompositePass;
  density: DensityTarget;
}

/**
 * unseeded: nothing simulated yet. awaiting-font: a boot is waiting for the pixel font (bare
 * paper meanwhile). booting: the boot choreography is playing. live: the wallpaper.
 */
type Phase = 'unseeded' | 'awaiting-font' | 'booting' | 'live';

const POINTER_RADIUS = 120;
const RIPPLE_SECONDS = 2.5;
/** Adaptive quality: after this many slow frames in a row, use bigger pixels, up to MAX_PIXEL. */
const SLOW_FRAME_LIMIT = 45;
const MAX_PIXEL = 5;

/** A rect as a shader vec4 (x, y, w, h), zeros for none. */
const rectUniform = (r: Rect | null): [number, number, number, number] =>
  r ? [r.x, r.y, r.w, r.h] : [0, 0, 0, 0];

export class SceneRenderer {
  /** Called once per boot, when the hub has resolved and the page can reveal its windows. */
  onBootDone: (() => void) | null = null;
  /** Called after every drawn frame, while the drawing buffer is still readable (region copies). */
  onFrame: ((canvas: HTMLCanvasElement) => void) | null = null;

  private static support: boolean | undefined;

  private readonly canvas: HTMLCanvasElement;
  private readonly options: SceneOptions;
  private readonly gl: WebGL2RenderingContext;
  private readonly stage: CanvasStage;
  private readonly loop: FrameLoop;
  private gpu: Gpu | null = null;
  private readonly rng = xorshift32();
  private readonly meta: Float32Array;
  /** Per point: name target xy (page px), bar slot (index + u), bar v. */
  private readonly targets: Float32Array;

  private mode: SceneMode = 'wallpaper';
  private phase: Phase = 'unseeded';
  private boot: BootClock | null = null;
  /** Bumped to cancel a boot still waiting for its font. */
  private bootRequest = 0;
  private uniforms: BootUniforms = SETTLED;
  private time = STILL_TIME;
  private snapNext = false;
  private pingTime = -100;
  private readonly rippleState = { x: 0, y: 0, age: RIPPLE_SECONDS, strength: 0 };
  private readonly pointer = new PointerTracker();
  private readonly cursor = new HubCursor();
  private readonly hub = createHubScreen();
  private readonly tethers = new TetherClock();
  private readonly bars = new BarFormation();
  private readonly follow = new FollowFormation();
  private readonly packedBars = new Float32Array(MAX_BARS * 4);
  private readonly cuts = new Float32Array(MAX_BARS * 4);
  private nameSpan: [number, number] = [0, 1];
  private nameArea = 0;
  private pixel: number;
  private slowFrames = 0;
  private disposed = false;

  /** Whether this browser can run the scene. Cached: probing creates a WebGL context. */
  static supported(): boolean {
    if (SceneRenderer.support === undefined) {
      const gl = document.createElement('canvas').getContext('webgl2');
      SceneRenderer.support = gl !== null;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return SceneRenderer.support;
  }

  /** Throws if WebGL2 is unavailable or a shader fails to compile. */
  constructor(canvas: HTMLCanvasElement, options: SceneOptions) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: options.pocket ? 'low-power' : 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is unavailable');
    this.canvas = canvas;
    this.options = options;
    this.gl = gl;
    this.pixel = options.pixel;
    this.stage = new CanvasStage(canvas, options.pocket);
    this.loop = new FrameLoop(options.fpsCap, this.tick, this.drawStill);
    this.meta = seedMeta(options.particles, this.rng);
    this.targets = new Float32Array(options.particles * 4);
    this.stage.resize(this.pixel);
    this.gpu = this.createGpu();
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  // ---------------------------------------------------------------- public API

  /** The cursor, in viewport px. `active` is false once it leaves the window. */
  setPointer(x: number, y: number, active: boolean): void {
    this.pointer.move(x, y, active, performance.now());
    const hub = this.stage.hubInViewport();
    this.cursor.aim(active && hub ? hubCursorTarget(x, y, hub, this.stage.framing) : null);
  }

  /** A tap or click at viewport px: a ring through the points and a ping of the core. */
  ripple(x: number, y: number): void {
    Object.assign(this.rippleState, {
      x: x + window.scrollX,
      y: y + window.scrollY,
      age: 0,
      strength: this.options.pocket ? 0.55 : 1,
    });
    this.pingTime = this.time;
  }

  /** The role bars in viewport px, oldest role first. Points pour into them in 'experience'. */
  setBars(rects: Rect[]): void {
    const { moved, redeal } = this.bars.update(rects);
    if (redeal) {
      writeBarSlots(this.targets, this.bars.rects, this.rng);
      this.gpu?.particles.uploadTargets(this.targets);
    }
    if (moved) this.renderStill();
  }

  /**
   * The window the points gather round in 'follow', in viewport px, or null for none. Call it every
   * frame so the halo chases a dragged window. It is kept in page px, so scrolling doesn't move it.
   */
  setFollow(rect: Rect | null): void {
    this.follow.update(rect && { ...rect, x: rect.x + window.scrollX, y: rect.y + window.scrollY });
  }

  setMode(mode: SceneMode): void {
    if (this.disposed) return;
    this.mode = mode;
    if (mode === 'boot') this.beginBoot();
    else this.renderStill();
  }

  /** Jumps to the end of the boot (any input during it, or a repeat visit). */
  skipBoot(): void {
    if (this.disposed) return;
    const pending =
      (this.phase === 'awaiting-font' || this.phase === 'booting') && !this.boot?.revealed;
    this.settle();
    this.renderStill();
    if (pending) this.onBootDone?.();
  }

  start(): void {
    if (this.disposed) return;
    if (this.options.reducedMotion) this.renderStill();
    else this.loop.start();
  }

  /** Stops the loop. The last frame stays on screen. */
  stop(): void {
    this.loop.stop();
  }

  /**
   * Draws one frame without advancing time, on the next animation frame. Cheap to call often:
   * calls coalesce, and it does nothing while the loop runs. Call it on scroll while stopped so
   * the fixed layer stays locked to the page.
   */
  renderStill(): void {
    if (!this.disposed) this.loop.requestStill();
  }

  /** Call when the canvas's frame changes size. A boot in progress skips to its end. */
  resize(): void {
    if (this.disposed) return;
    if (this.phase === 'awaiting-font' || this.phase === 'booting') this.skipBoot();
    this.relayout();
    this.renderStill();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.dispose();
    this.bootRequest += 1;
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    if (this.gpu) this.deleteGpu(this.gpu);
    this.gpu = null;
    this.onBootDone = null;
    this.onFrame = null;
  }

  // ---------------------------------------------------------------- frames

  private readonly tick = (dt: number): void => {
    if (!this.gpu) return;
    if (this.phase === 'unseeded') this.settle();
    const place = this.stage.place();
    this.advance(dt, place);
    this.draw(dt, place, this.takeSnap());
    this.adaptQuality(dt);
  };

  private readonly drawStill = (): void => {
    if (!this.gpu) return;
    if (this.phase === 'unseeded') this.settle();
    const place = this.stage.place();
    this.updateHub(place);
    // Stopped: snap the points straight into (or out of) the bars and the halo.
    const barsJumped = this.bars.jump(this.wantsBars());
    const haloJumped = this.follow.jump(this.wantsHalo());
    this.draw(0, place, this.takeSnap() || barsJumped || haloJumped);
  };

  private advance(dt: number, place: Placement): void {
    this.time += dt;
    if (this.boot) this.advanceBoot(dt);
    this.pointer.step(dt);
    this.cursor.step(dt);
    this.rippleState.age += dt;
    this.updateHub(place);
    this.tethers.advance(dt, this.hub.tools);
    this.bars.step(dt, this.wantsBars(), place.scrollX, place.scrollY);
    this.follow.step(dt, this.wantsHalo());
  }

  private draw(dt: number, place: Placement, snap: boolean): void {
    const gpu = this.gpu;
    if (!gpu) return;
    if (this.phase === 'booting' || this.phase === 'live') {
      if (dt > 0 || snap) gpu.particles.simulate(this.simFrame(dt, snap, place));
      gpu.particles.splat(gpu.density, {
        x: place.originX,
        y: place.originY,
        cell: this.stage.cell,
      });
    } else {
      clearTarget(this.gl, gpu.density);
    }
    gpu.composite.draw(this.compositeFrame(place), gpu.density);
    this.onFrame?.(this.canvas);
  }

  private takeSnap(): boolean {
    const snap = this.snapNext;
    this.snapNext = false;
    return snap;
  }

  /** On a slow device, trade resolution for frame rate rather than stutter. */
  private adaptQuality(dt: number): void {
    const budget = this.options.fpsCap ? 1.5 / this.options.fpsCap : 0.026;
    if (dt <= budget) {
      this.slowFrames = Math.max(0, this.slowFrames - 1);
    } else if (++this.slowFrames > SLOW_FRAME_LIMIT && this.pixel < MAX_PIXEL) {
      this.pixel += 1;
      this.slowFrames = 0;
      this.relayout();
    }
  }

  private relayout(): void {
    this.stage.resize(this.pixel);
    if (!this.gpu) return;
    deleteDensityTarget(this.gl, this.gpu.density);
    this.gpu.density = createDensityTarget(this.gl, this.stage.cols, this.stage.rows);
  }

  private updateHub(place: Placement): void {
    updateHubScreen(this.hub, {
      t: this.time,
      grow: this.uniforms.grow,
      sincePing: this.time - this.pingTime,
      cursor: this.cursor,
      framing: this.stage.framing,
      stage: place.hub,
    });
  }

  /** Points pour into the bars on the desktop only, after the boot, while the bars are visible. */
  private wantsBars(): boolean {
    return (
      !this.options.pocket &&
      this.mode === 'experience' &&
      this.phase === 'live' &&
      barsInView(boundingBox(this.bars.rects), window.innerHeight, this.bars.engaged)
    );
  }

  /**
   * Points rest in a halo round the followed window instead of on the hub. Experience counts too:
   * the bars lie over the halo, so points drain from them straight into the next window's halo
   * rather than flying back to the hub, which has scrolled off the top of the page by then.
   */
  private wantsHalo(): boolean {
    return (
      !this.options.pocket &&
      (this.mode === 'follow' || this.mode === 'experience') &&
      this.phase === 'live' &&
      this.follow.following
    );
  }

  // ---------------------------------------------------------------- boot

  private beginBoot(): void {
    if (this.options.reducedMotion) {
      this.skipBoot();
      return;
    }
    const request = ++this.bootRequest;
    this.phase = 'awaiting-font';
    this.boot = null;
    this.uniforms = DESKTOP_BOOT.uniforms(0);
    if (this.options.pocket) {
      this.startBoot(null);
      return;
    }
    const family = this.fontFamily();
    void loadFont(family).then(() => {
      if (this.disposed || request !== this.bootRequest) return;
      const stageHeight = this.stage.place().hub.h;
      this.startBoot(rasterizeName(identity.name, family, window.innerWidth, stageHeight));
    });
  }

  /** Seeds the boot: the river that writes the name on desktop, the inflow in the pocket. */
  private startBoot(name: InkedPixels | null): void {
    const gpu = this.gpu;
    if (!gpu || (!this.options.pocket && !name)) {
      this.skipBoot();
      return;
    }
    const place = this.stage.place();
    this.updateHub(place);
    this.tethers.restart();
    if (name) {
      const cx = place.hub.x + place.hub.w / 2;
      const cy = place.hub.y + place.hub.h * 0.47;
      const span = writeTextTargets(this.targets, name, cx, cy, this.rng);
      this.nameSpan = [span.x0, span.width];
      this.nameArea = name.indices.length;
      gpu.particles.uploadTargets(this.targets);
      const spread = Math.min(window.innerHeight * 0.55, place.hub.h * 0.7);
      gpu.particles.uploadState(seedRiver(this.targets, cy, spread, this.rng));
      this.boot = new BootClock(DESKTOP_BOOT);
    } else {
      gpu.particles.uploadState(seedInflow(this.options.particles, place.hub, this.rng));
      this.boot = new BootClock(POCKET_BOOT);
    }
    this.uniforms = this.boot.uniforms;
    this.phase = 'booting';
    this.renderStill();
  }

  private advanceBoot(dt: number): void {
    if (!this.boot) return;
    const events = this.boot.advance(dt);
    this.uniforms = this.boot.uniforms;
    // Tethers start empty: points wait in the core and stream out as each tether cycles.
    if (events.live) this.tethers.restart();
    if (events.reveal) this.onBootDone?.();
    if (events.end) {
      this.boot = null;
      this.uniforms = SETTLED;
      this.phase = 'live';
    }
  }

  /** The finished wallpaper: every point snapped onto its tether. */
  private settle(): void {
    this.bootRequest += 1;
    this.boot = null;
    this.uniforms = SETTLED;
    this.tethers.settle();
    this.phase = 'live';
    this.snapNext = true;
  }

  /** The pixel font's family as next/font registered it on the root element. */
  private fontFamily(): string {
    return getComputedStyle(this.canvas).getPropertyValue('--font-chrome').trim() || '"Jersey 10"';
  }

  // ---------------------------------------------------------------- per-pass inputs

  private simFrame(dt: number, snap: boolean, place: Placement): SimFrame {
    const { scrollX, scrollY } = place;
    packBars(this.packedBars, this.bars.rects, scrollX, scrollY);
    const box = boundingBox(this.bars.rects);
    const ripple = this.rippleState;
    return {
      time: this.time,
      dt,
      snap,
      boot: this.uniforms,
      barMix: this.bars.mix,
      followMix: this.follow.mix,
      hop: this.follow.hop,
      halo: rectUniform(this.follow.rect),
      haloFrom: rectUniform(this.follow.from),
      current: RIVER_CURRENT,
      hub: this.hub,
      tethers: this.tethers,
      bars: this.packedBars,
      barVelocity: this.bars.velocity,
      nameSpan: this.nameSpan,
      barSpan: box ? [box.x + scrollX, Math.max(1, box.w)] : [0, 1],
      pointer: [
        this.pointer.x + scrollX,
        this.pointer.y + scrollY,
        this.pointer.strength,
        POINTER_RADIUS,
      ],
      pointerVelocity: [this.pointer.vx, this.pointer.vy],
      ripple: [ripple.x, ripple.y, ripple.age, ripple.age < RIPPLE_SECONDS ? ripple.strength : 0],
      ink: inkPerPoint({
        count: this.options.particles,
        cellArea: this.stage.cell ** 2,
        nameArea: this.nameArea,
        tetherLength: this.hub.tetherLength,
        barArea: this.bars.rects.reduce((sum, r) => sum + area(r), 0),
        haloArea: haloArea(this.follow.rect),
        pocket: this.options.pocket,
      }),
    };
  }

  private compositeFrame(place: Placement): CompositeFrame {
    // In Experience the hub gives way to paper inside the bars, so they read cleanly over it.
    const cutting = !this.options.pocket && this.mode === 'experience';
    const cutCount = this.stage.writeCuts(this.cuts, cutting ? this.bars.rects : [], place);
    return {
      hubRect: this.stage.hubCells(place),
      cuts: this.cuts,
      cutCount,
      shift: [this.stage.framing.shiftX, this.stage.framing.shiftY],
      time: this.time,
      fade: this.uniforms.fade,
      grow: this.uniforms.grow,
      sincePing: this.time - this.pingTime,
      focal: this.stage.framing.focal,
      cursor: this.cursor,
      steps: this.options.steps,
      pageCol: place.col,
      pageRow: place.row,
    };
  }

  // ---------------------------------------------------------------- GPU resources

  private createGpu(): Gpu {
    const particles = new ParticleSystem(this.gl, this.options.particles);
    particles.uploadMeta(this.meta);
    particles.uploadTargets(this.targets);
    return {
      particles,
      composite: new CompositePass(this.gl),
      density: createDensityTarget(this.gl, this.stage.cols, this.stage.rows),
    };
  }

  private deleteGpu(gpu: Gpu): void {
    gpu.particles.dispose();
    gpu.composite.dispose();
    deleteDensityTarget(this.gl, gpu.density);
  }

  private readonly handleContextLost = (event: Event): void => {
    // Without preventDefault the browser never tries to restore the context.
    event.preventDefault();
    this.gpu = null;
  };

  /** Everything on the GPU is gone: rebuild it and resume from the settled wallpaper. */
  private readonly handleContextRestored = (): void => {
    this.gpu = this.createGpu();
    this.settle();
    this.renderStill();
  };
}
