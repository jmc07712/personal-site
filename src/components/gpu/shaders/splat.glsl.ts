/**
 * Pass 2: the splat. Every point is drawn as a single 1-cell GL point, additively blended into a
 * half-float buffer at the scene's bitmap resolution. A cell's value is the total ink of the
 * points inside it, which the composite pass reads as darkness. Points without ink are moved
 * outside clip space so the rasteriser drops them for free.
 */
export const SPLAT_VERTEX = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_pos;
layout(location = 1) in vec4 a_vel;
uniform vec3 u_stage;   // page px of the canvas's top-left cell, and CSS px per cell
uniform vec2 u_grid;    // cells
out float v_ink;

void main() {
  vec2 cell = (a_pos.xy - u_stage.xy) / u_stage.z;
  v_ink = a_vel.w;
  gl_Position = a_vel.w > 0.0004
    ? vec4(cell.x / u_grid.x * 2.0 - 1.0, 1.0 - cell.y / u_grid.y * 2.0, 0.0, 1.0)
    : vec4(2.0, 2.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;

export const SPLAT_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in float v_ink;
out vec4 o;
void main() { o = vec4(v_ink, 0.0, 0.0, 1.0); }`;
