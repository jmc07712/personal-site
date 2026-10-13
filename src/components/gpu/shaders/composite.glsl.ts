import { MAX_BARS } from '../bars';
import { HUB_GLSL } from './hub.glsl';

/** The 8x8 Bayer threshold in closed form; bayer.ts holds the same function, tested on the CPU. */
const BAYER_GLSL = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`;

/** A full-screen triangle from gl_VertexID alone: no vertex buffer needed. */
export const COMPOSITE_VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * Pass 3: the composite. One fragment per cell raymarches the hub, multiplies in the ink the
 * points splatted there, and reduces the result to exactly two inks with a single Bayer pass.
 * Doing all three in one pass is what keeps the scene one image: points and hub share one
 * dither, so particles can melt into the hub's shading without a seam.
 */
export const COMPOSITE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
#define MAX_BARS ${MAX_BARS}
uniform vec4 u_hubRect;          // the hub's stage in GL cells: x0, y0, w, h
uniform vec4 u_cut[MAX_BARS];    // GL cells x0, y0, x1, y1 where the hub gives way to paper
uniform int u_cutCount;
uniform float u_fade;
uniform vec3 u_page;             // page column and row (mod 8) of the top-left cell, rows in grid
uniform vec3 u_paper, u_ink;
uniform sampler2D u_density;
out vec4 fragColor;
${HUB_GLSL}
${BAYER_GLSL}
bool inCut(vec2 fc) {
  for (int i = 0; i < MAX_BARS; i++) {
    if (i >= u_cutCount) break;
    vec4 c = u_cut[i];
    if (fc.x >= c.x && fc.x < c.z && fc.y >= c.y && fc.y < c.w) return true;
  }
  return false;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float lum = 1.0;
  vec2 local = fc - u_hubRect.xy;
  bool inStage = local.x >= 0.0 && local.y >= 0.0 && local.x < u_hubRect.z && local.y < u_hubRect.w;
  // While the hub fades in, it resolves through the dither rather than as a cross-fade.
  if (u_fade > 0.001 && inStage && !inCut(fc)) lum = mix(1.0, hub(local, u_hubRect.zw), u_fade);
  float density = texelFetch(u_density, ivec2(fc), 0).r;
  lum *= clamp(1.0 - density, 0.0, 1.0);   // points are ink laid on top
  // Bayer indices count page cells (rows from the top), so the pattern is glued to the document.
  vec2 page = vec2(u_page.x + floor(fc.x), u_page.y + (u_page.z - 1.0 - floor(fc.y)));
  float paper = step(bayer8(page) + 0.0005, lum);
  fragColor = vec4(mix(u_ink, u_paper, paper), 1.0);
}`;
