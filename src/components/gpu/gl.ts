/** Small WebGL2 helpers: compiling programs and the scene's one offscreen buffer. */

export interface Program {
  readonly handle: WebGLProgram;
  /** A uniform's location, looked up once and cached. Null if the compiler optimised it away. */
  uniform(name: string): WebGLUniformLocation | null;
}

function compile(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create a shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log ?? 'no log'}`);
  }
  return shader;
}

/**
 * Compiles and links a program. `feedback` names the vertex outputs to capture with transform
 * feedback, each into its own buffer.
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
  feedback?: readonly string[],
): Program {
  const handle = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(handle, vs);
  gl.attachShader(handle, fs);
  if (feedback) gl.transformFeedbackVaryings(handle, feedback, gl.SEPARATE_ATTRIBS);
  gl.linkProgram(handle);
  // Linked programs keep their own copy; the shader objects are no longer needed.
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(handle);
    gl.deleteProgram(handle);
    throw new Error(`Program failed to link: ${log ?? 'no log'}`);
  }
  const locations = new Map<string, WebGLUniformLocation | null>();
  return {
    handle,
    uniform(name) {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(handle, name));
      return locations.get(name) ?? null;
    },
  };
}

/** The buffer the points splat into: one channel of summed ink per cell. */
export interface DensityTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

/**
 * A single-channel half-float render target. Points add tiny amounts of ink (often under 1/255),
 * so 8-bit storage would round most of them away; where half-float rendering isn't supported we
 * fall back to RGBA8 and accept coarser tones.
 */
export function createDensityTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
): DensityTarget {
  const framebuffer = gl.createFramebuffer();
  const halfFloat = gl.getExtension('EXT_color_buffer_float') !== null;
  for (const precise of halfFloat ? [true, false] : [false]) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (precise)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.HALF_FLOAT, null);
    else
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (complete) return { texture, framebuffer, width, height };
    gl.deleteTexture(texture);
  }
  gl.deleteFramebuffer(framebuffer);
  throw new Error('No renderable format for the density buffer');
}

export function deleteDensityTarget(gl: WebGL2RenderingContext, target: DensityTarget): void {
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.framebuffer);
}

/** Clears a target to zero ink. */
export function clearTarget(gl: WebGL2RenderingContext, target: DensityTarget): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
