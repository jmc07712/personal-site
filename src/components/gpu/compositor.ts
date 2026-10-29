/** The raymarch-and-dither pass that turns the hub and the splatted ink into the final two inks. */
import { MAX_BARS } from './bars';
import { BLOSSOM_SIZE, blossomPixels } from './blossom';
import { createProgram, type DensityTarget, type Program } from './gl';
import { hexToRgb, INK, PAPER } from './inks';
import { COMPOSITE_FRAGMENT, COMPOSITE_VERTEX } from './shaders/composite.glsl';

export interface CompositeFrame {
  /** The hub's stage in GL cells (origin bottom-left): x0, y0, w, h. */
  hubRect: readonly [number, number, number, number];
  /** Cells where the hub gives way to paper (the role bars), GL x0, y0, x1, y1 each. */
  cuts: Float32Array;
  cutCount: number;
  shift: readonly [number, number];
  time: number;
  fade: number;
  grow: number;
  sincePing: number;
  focal: number;
  cursor: { x: number; y: number; on: number };
  steps: number;
  /** Page column and row of the canvas's top-left cell, for the page-locked dither. */
  pageCol: number;
  pageRow: number;
}

const PAPER_RGB = hexToRgb(PAPER);
const INK_RGB = hexToRgb(INK);

export class CompositePass {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: Program;
  /** The full-screen triangle needs no attributes, but WebGL2 still wants a vertex array bound. */
  private readonly emptyVao: WebGLVertexArrayObject;
  private readonly blossom: WebGLTexture;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = createProgram(gl, COMPOSITE_VERTEX, COMPOSITE_FRAGMENT);
    this.emptyVao = gl.createVertexArray();
    this.blossom = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.blossom);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      BLOSSOM_SIZE,
      BLOSSOM_SIZE,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      blossomPixels(),
    );
  }

  /** Draws the frame into the canvas, which is the same size as the density buffer. */
  draw(frame: CompositeFrame, density: DensityTarget): void {
    const gl = this.gl;
    const u = (name: string) => this.program.uniform(name);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, density.width, density.height);
    gl.useProgram(this.program.handle);
    gl.uniform4f(u('u_hubRect'), ...frame.hubRect);
    gl.uniform4fv(u('u_cut'), frame.cuts);
    gl.uniform1i(u('u_cutCount'), Math.min(frame.cutCount, MAX_BARS));
    gl.uniform2f(u('u_shift'), ...frame.shift);
    gl.uniform1f(u('u_time'), frame.time);
    gl.uniform1f(u('u_fade'), frame.fade);
    gl.uniform1f(u('u_grow'), frame.grow);
    gl.uniform1f(u('u_ping'), frame.sincePing);
    gl.uniform1f(u('u_focal'), frame.focal);
    gl.uniform2f(u('u_cursor'), frame.cursor.x, frame.cursor.y);
    gl.uniform1f(u('u_cursorOn'), frame.cursor.on);
    gl.uniform1i(u('u_steps'), frame.steps);
    gl.uniform3f(u('u_page'), frame.pageCol % 8, frame.pageRow % 8, density.height);
    gl.uniform3f(u('u_paper'), ...PAPER_RGB);
    gl.uniform3f(u('u_ink'), ...INK_RGB);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, density.texture);
    gl.uniform1i(u('u_density'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.blossom);
    gl.uniform1i(u('u_blossom'), 1);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    this.gl.deleteVertexArray(this.emptyVao);
    this.gl.deleteTexture(this.blossom);
    this.gl.deleteProgram(this.program.handle);
  }
}
