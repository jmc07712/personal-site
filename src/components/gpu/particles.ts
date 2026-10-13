/**
 * The particle system: four vec4 attributes per point (position, velocity, targets, constants)
 * in GPU buffers, advanced by transform feedback and splatted into the density buffer. Position
 * and velocity are double-buffered: each step reads one pair and writes the other, then swaps.
 */
import type { BootUniforms } from './boot';
import type { PointState } from './formations';
import { createProgram, type DensityTarget, type Program } from './gl';
import type { HubScreen, TetherClock } from './hub';
import type { InkBudget } from './ink';
import { SIM_FRAGMENT, SIM_VARYINGS, SIM_VERTEX } from './shaders/sim.glsl';
import { SPLAT_FRAGMENT, SPLAT_VERTEX } from './shaders/splat.glsl';

type Vec2 = readonly [number, number];
type Vec4 = readonly [number, number, number, number];

/** Everything the simulation needs for one step. Positions are page px. */
export interface SimFrame {
  time: number;
  dt: number;
  /** Teleport every point onto its target (after a skip, or for a still frame). */
  snap: boolean;
  boot: BootUniforms;
  /** 0 = points on the hub, 1 = points in the role bars. */
  barMix: number;
  /** 0 = points on the hub, 1 = points in the halo round the followed window. */
  followMix: number;
  /** 0..1 through a hop from `haloFrom` to `halo`; 1 when there is none. */
  hop: number;
  /** The followed window and the one a hop is leaving: x, y, w, h page px. */
  halo: Vec4;
  haloFrom: Vec4;
  current: number;
  hub: HubScreen;
  tethers: TetherClock;
  bars: Float32Array;
  barVelocity: Vec2;
  nameSpan: Vec2;
  barSpan: Vec2;
  /** x, y, strength, radius. */
  pointer: Vec4;
  pointerVelocity: Vec2;
  /** x, y, age, strength. */
  ripple: Vec4;
  ink: InkBudget;
}

/** Where the canvas's top-left cell sits on the page, and the grid it splats into. */
export interface SplatStage {
  x: number;
  y: number;
  cell: number;
}

const FLOAT_BYTES = 4;
const COMPONENTS = 4;

export class ParticleSystem {
  readonly count: number;
  private readonly gl: WebGL2RenderingContext;
  private readonly sim: Program;
  private readonly splatProgram: Program;
  private readonly positions: [WebGLBuffer, WebGLBuffer];
  private readonly velocities: [WebGLBuffer, WebGLBuffer];
  private readonly targets: WebGLBuffer;
  private readonly meta: WebGLBuffer;
  private readonly vaos: [WebGLVertexArrayObject, WebGLVertexArrayObject];
  private readonly feedbacks: [WebGLTransformFeedback, WebGLTransformFeedback];
  /** Which buffer pair holds the current state. */
  private current: 0 | 1 = 0;

  constructor(gl: WebGL2RenderingContext, count: number) {
    this.gl = gl;
    this.count = count;
    this.sim = createProgram(gl, SIM_VERTEX, SIM_FRAGMENT, SIM_VARYINGS);
    this.splatProgram = createProgram(gl, SPLAT_VERTEX, SPLAT_FRAGMENT);
    const bytes = count * COMPONENTS * FLOAT_BYTES;
    const buffer = (usage: GLenum) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, bytes, usage);
      return b;
    };
    this.positions = [buffer(gl.DYNAMIC_COPY), buffer(gl.DYNAMIC_COPY)];
    this.velocities = [buffer(gl.DYNAMIC_COPY), buffer(gl.DYNAMIC_COPY)];
    this.targets = buffer(gl.DYNAMIC_DRAW);
    this.meta = buffer(gl.STATIC_DRAW);
    this.vaos = [this.createVao(0), this.createVao(1)];
    this.feedbacks = [this.createFeedback(0), this.createFeedback(1)];
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /** A vertex array reading state pair `side` plus the shared targets and constants. */
  private createVao(side: 0 | 1): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    [this.positions[side], this.velocities[side], this.targets, this.meta].forEach(
      (b, location) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, COMPONENTS, gl.FLOAT, false, 0, 0);
      },
    );
    gl.bindVertexArray(null);
    return vao;
  }

  /** A transform feedback object writing into state pair `side`. */
  private createFeedback(side: 0 | 1): WebGLTransformFeedback {
    const gl = this.gl;
    const feedback = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedback);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.positions[side]);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.velocities[side]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    return feedback;
  }

  private upload(buffer: WebGLBuffer, data: Float32Array): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  uploadMeta(meta: Float32Array): void {
    this.upload(this.meta, meta);
  }

  uploadTargets(targets: Float32Array): void {
    this.upload(this.targets, targets);
  }

  /** Replaces the state in both pairs, so the next step starts from it whichever is current. */
  uploadState(state: PointState): void {
    for (const side of [0, 1] as const) {
      this.upload(this.positions[side], state.positions);
      this.upload(this.velocities[side], state.velocities);
    }
  }

  /** Advances every point by one step on the GPU. */
  simulate(frame: SimFrame): void {
    const gl = this.gl;
    gl.useProgram(this.sim.handle);
    this.setSimUniforms(frame);
    const next = this.current === 0 ? 1 : 0;
    gl.bindVertexArray(this.vaos[this.current]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.feedbacks[next]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
    this.current = next;
  }

  private setSimUniforms(f: SimFrame): void {
    const gl = this.gl;
    const u = (name: string) => this.sim.uniform(name);
    gl.uniform1f(u('u_time'), f.time);
    gl.uniform1f(u('u_dt'), f.dt);
    gl.uniform1f(u('u_intro'), f.boot.intro);
    gl.uniform1f(u('u_implode'), f.boot.implode);
    gl.uniform1f(u('u_bars'), f.barMix);
    gl.uniform1f(u('u_follow'), f.followMix);
    gl.uniform1f(u('u_hop'), f.hop);
    gl.uniform4f(u('u_halo'), ...f.halo);
    gl.uniform4f(u('u_haloFrom'), ...f.haloFrom);
    gl.uniform1f(u('u_snap'), f.snap ? 1 : 0);
    gl.uniform1f(u('u_current'), f.current);
    gl.uniform3f(u('u_core'), f.hub.core.x, f.hub.core.y, f.hub.core.radius);
    gl.uniform4fv(u('u_tool'), f.hub.tools);
    gl.uniform4fv(u('u_span'), f.hub.spans);
    gl.uniform1fv(u('u_phase'), f.tethers.phase);
    gl.uniform1fv(u('u_phasePrev'), f.tethers.previous);
    gl.uniform1fv(u('u_phaseOrigin'), f.tethers.origin);
    gl.uniform4fv(u('u_bar'), f.bars);
    gl.uniform2f(u('u_barVel'), ...f.barVelocity);
    gl.uniform2f(u('u_nameSpan'), ...f.nameSpan);
    gl.uniform2f(u('u_barSpan'), ...f.barSpan);
    gl.uniform4f(u('u_pointer'), ...f.pointer);
    gl.uniform2f(u('u_pointerVel'), ...f.pointerVelocity);
    gl.uniform4f(u('u_ripple'), ...f.ripple);
    gl.uniform4f(u('u_ink'), f.ink.name, f.ink.hub, f.ink.bar, f.ink.flight);
    gl.uniform1f(u('u_inkHalo'), f.ink.halo);
  }

  /** Adds every point's ink into its cell of the density buffer (cleared first). */
  splat(target: DensityTarget, stage: SplatStage): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.splatProgram.handle);
    gl.uniform3f(this.splatProgram.uniform('u_stage'), stage.x, stage.y, stage.cell);
    gl.uniform2f(this.splatProgram.uniform('u_grid'), target.width, target.height);
    gl.bindVertexArray(this.vaos[this.current]);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  dispose(): void {
    const gl = this.gl;
    [...this.positions, ...this.velocities, this.targets, this.meta].forEach((b) =>
      gl.deleteBuffer(b),
    );
    this.vaos.forEach((v) => gl.deleteVertexArray(v));
    this.feedbacks.forEach((f) => gl.deleteTransformFeedback(f));
    gl.deleteProgram(this.sim.handle);
    gl.deleteProgram(this.splatProgram.handle);
  }
}
