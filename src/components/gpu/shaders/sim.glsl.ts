import { MAX_BARS } from '../bars';
import { TOOL_COUNT } from '../hub';
import { NOISE_GLSL } from './noise.glsl';

/**
 * Pass 1: the particle simulation, as a vertex shader run once per point with transform feedback.
 * Each point reads its state from one pair of buffers and writes the next frame into the other,
 * so the whole simulation stays on the GPU; the CPU only sends a few dozen uniforms per frame.
 *
 * Every point is pulled by a spring-damper toward a target that blends three formations (the
 * name, its slot on a hub tether, its slot in a role bar), with curl-noise currents carrying the
 * loose ones. All positions are page px.
 */
export const SIM_VERTEX = /* glsl */ `#version 300 es
precision highp float;
#define MAX_BARS ${MAX_BARS}
#define TOOLS ${TOOL_COUNT}
#define PI 3.14159265

layout(location = 0) in vec4 a_pos;   // xy page px; w = when the boot stream releases it (s)
layout(location = 1) in vec4 a_vel;   // xy px/s; w = ink laid down last frame (read by the splat)
layout(location = 2) in vec4 a_tgt;   // xy = name target (page px); z = bar index + u; w = bar v
layout(location = 3) in vec4 a_meta;  // x = lane (6+ inbound); y = phase; z = lateral; w = random

uniform float u_time, u_dt, u_intro, u_implode, u_bars, u_snap, u_current;
uniform vec3 u_core;                  // core centre and radius, page px
uniform vec4 u_tool[TOOLS];           // tool centre, radius px, surge
uniform vec4 u_span[TOOLS];           // s leaving the core, s hidden by the tool, tool in front
uniform float u_phase[TOOLS], u_phasePrev[TOOLS], u_phaseOrigin[TOOLS];
uniform vec4 u_bar[MAX_BARS];         // role bars, page px
uniform vec2 u_barVel;                // px/s while the Experience window is dragged
uniform vec2 u_nameSpan, u_barSpan;   // x0, width: formations fill and empty left to right
uniform vec4 u_pointer;               // page px, strength, radius
uniform vec2 u_pointerVel;
uniform vec4 u_ripple;                // page px, age s, strength
uniform vec4 u_ink;                   // ink per point: name, hub, bar, flight

out vec4 o_pos;
out vec4 o_vel;
${NOISE_GLSL}
float ease(float k) { return k * k * (3.0 - 2.0 * k); }

void main() {
  vec2 p = a_pos.xy, v = a_vel.xy;

  // Which formation: the name (boot), the hub, or a role bar. Both transitions sweep left to right.
  float nameAt = 1.0 - clamp((a_tgt.x - u_nameSpan.x) / u_nameSpan.y, 0.0, 1.0);
  float kName = 1.0 - smoothstep(nameAt * 0.5, nameAt * 0.5 + 0.5, u_implode);
  vec4 bar = u_bar[clamp(int(a_tgt.z), 0, MAX_BARS - 1)];
  vec2 barTarget = bar.xy + vec2(fract(a_tgt.z), a_tgt.w) * bar.zw;
  float barAt = clamp((barTarget.x - u_barSpan.x) / u_barSpan.y, 0.0, 1.0);
  float kBar = smoothstep(barAt * 0.55, barAt * 0.55 + 0.45, u_bars);
  float eName = ease(kName), eBar = ease(kBar);
  float wBar = eBar, wName = (1.0 - eBar) * eName, wHub = (1.0 - eBar) * (1.0 - eName);

  // The hub: data in flight along a tether, in two lanes (the call out, the result back).
  float inbound = step(5.5, a_meta.x);
  int j = int(a_meta.x - 6.0 * inbound + 0.5);
  float cycle = a_meta.y + u_phase[j];
  float s = fract(cycle);
  float born = step(1.0, floor(cycle) - floor(a_meta.y + u_phaseOrigin[j]));
  float wrapped = step(0.5, floor(cycle) - floor(a_meta.y + u_phasePrev[j]));
  if (inbound > 0.5) s = 1.0 - s;
  vec4 tool = u_tool[j], span = u_span[j];
  vec2 core = u_core.xy, dir = tool.xy - core;
  float len = max(length(dir), 1.0);
  vec2 normal = vec2(-dir.y, dir.x) / len;
  float bulge = sin(PI * s), surge = tool.w;
  // The lanes bow apart into a lens around the tether, so traffic reads even when foreshortened;
  // a surge widens and quickens it.
  float lens = (inbound > 0.5 ? -1.0 : 1.0) * (2.0 + 0.2 * len * bulge);
  float off = lens + a_meta.z * (1.6 + 4.5 * bulge + 4.0 * surge);
  float wave = sin(s * 11.0 - u_time * (1.3 + 2.0 * surge) + a_meta.w * 6.2832);
  off += bulge * (2.5 + 3.0 * surge) * wave;
  vec2 hubTarget = mix(core, mix(core, tool.xy, s) + normal * off, born);

  vec2 target = mix(mix(hubTarget, a_tgt.xy, eName), barTarget, eBar);
  float inTransit = max(sin(PI * kName), sin(PI * kBar));

  // A spring-damper toward the target; curl currents carry the loose points.
  float intro = smoothstep(0.0, 1.0, (u_intro - a_pos.w) / 0.7);
  float stream = (1.0 - intro) * step(-5.0, a_pos.w);
  float loose = max(inTransit * 0.9, 1.0 - intro);
  vec2 d = target - p;
  float far = smoothstep(30.0, 420.0, length(d));
  float flowAmount = max(loose, far * 0.6);
  vec2 flow = vec2(0.0);
  if (flowAmount > 0.02) {
    // Points pouring to or from the bars each read their own slice of the field, so they spread.
    vec3 q = vec3(p * 0.0031, u_time * 0.11 + sin(PI * kBar) * a_meta.w * 2.5);
    flow = (curl(q) + 0.45 * curl(q * 2.6 + 11.0)) * mix(230.0, 160.0, stream) * flowAmount;
  }
  flow.x += u_current * stream;
  float stiffness = mix(90.0, 9.0, loose);
  float damping = 1.5 * sqrt(stiffness);
  vec2 desired = (d * (stiffness / damping) + u_barVel * wBar) * intro;
  float speed = length(desired);
  if (speed > 1400.0) desired *= 1400.0 / speed;
  vec2 acc = (desired + flow - v) * damping;

  // The cursor: a bounded push plus a curl stir; the spring brings points home.
  vec2 md = p - u_pointer.xy;
  float mdist = length(md);
  float reach = clamp(1.0 - mdist / u_pointer.w, 0.0, 1.0);
  float push = reach * u_pointer.z * mix(1.0, 0.45, wBar) * intro;   // bars resist a little
  if (push > 0.0) {
    acc += md / max(mdist, 1.0) * push * push * 15000.0;
    acc += u_pointerVel * push * 3.0;
    acc += curl(vec3(p * 0.012, u_time * 0.9)) * push * 4200.0;
  }
  // A tap or click: one ring travels out and fades.
  if (u_ripple.w > 0.0) {
    vec2 rd = p - u_ripple.xy;
    float rl = length(rd), front = u_ripple.z * 240.0;
    float ring = exp(-pow((rl - front) / 24.0, 2.0)) * exp(-u_ripple.z * 2.0);
    acc += rd / max(rl, 1.0) * ring * 4200.0 * u_ripple.w;
  }

  v += acc * u_dt;
  float vs = length(v);
  if (vs > 2800.0) v *= 2800.0 / vs;
  p += v * u_dt;
  // A point that finishes a trip along its tether starts the next at the core, not by flying back.
  if (wrapped > 0.5 && wHub > 0.999) { p = hubTarget; v = vec2(0.0); }
  if (u_snap > 0.5) { p = target; v = vec2(0.0); }

  // Ink: an even tone when settled, a visible grain in flight. Tether points hide inside the core
  // and behind tools, unless the tool is in front of the core.
  float coreDist = length(p - core) / max(u_core.z, 1.0);
  float visible = born * smoothstep(span.x, span.x + 0.05, s)
    * smoothstep(span.y, span.y + 0.04, 1.0 - s);
  visible *= mix(smoothstep(0.9, 1.02, coreDist), 1.0, span.z);
  float ink = wName * u_ink.x + wHub * u_ink.y * visible * (1.0 + 1.3 * surge) + wBar * u_ink.z;
  float hide = mix(1.0, smoothstep(0.82, 1.0, coreDist), wHub);
  float flying = length(v);
  ink = max(ink, u_ink.w * smoothstep(110.0, 700.0, flying) * hide);
  if (wHub > 0.5 && a_meta.w > 0.996) ink = max(ink, 0.5 * visible);
  // One point in a hundred is a visible grain whenever it flies.
  if (a_meta.w > 0.99) ink = max(ink, 0.6 * smoothstep(110.0, 500.0, flying) * hide);
  o_pos = vec4(p, 0.0, a_pos.w);
  o_vel = vec4(v, 0.0, ink);
}`;

/** Transform feedback runs with rasterisation off, but a program still needs a fragment stage. */
export const SIM_FRAGMENT = /* glsl */ `#version 300 es
precision mediump float;
out vec4 o;
void main() { o = vec4(0.0); }`;

/** The outputs transform feedback captures, in buffer order. */
export const SIM_VARYINGS = ['o_pos', 'o_vel'] as const;
