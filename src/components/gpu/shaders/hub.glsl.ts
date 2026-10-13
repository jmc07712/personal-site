import { TOOL_COUNT } from '../hub';

/**
 * The agent hub as a signed distance field, raymarched per cell. The core, six tools and their
 * tethers are blended with a smooth minimum so tethers flow into the spheres like liquid; a thin
 * torus is the gateway ring. Lighting is a key light with soft shadows (penumbra estimated from
 * the closest miss along the shadow ray), five-tap ambient occlusion, a rim and a specular, all
 * reduced to one luminance for the dither. Mirrors the CPU geometry in hub.ts.
 */
export const HUB_GLSL = /* glsl */ `
#define TOOLS ${TOOL_COUNT}
#define MAX_STEPS 140

uniform vec2 u_shift;
uniform float u_time, u_grow, u_ping, u_focal, u_cursorOn;
uniform vec2 u_cursor;
uniform int u_steps;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
// Polynomial smooth minimum: blends two distances over a band of width k, like liquid joining.
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdTorus(vec3 p, vec2 t) { return length(vec2(length(p.xz) - t.x, p.y)) - t.y; }

const vec3 CORE = vec3(0.0, 0.05, 0.0);
const float FLOOR_Y = -1.42;
vec3 gTool[TOOLS];
float gToolR[TOOLS];
float gCoreR;
bool gRing = true;

// Pose the tools for this frame: orbit, dive, and lean toward the cursor.
void setup(float t, vec3 ro, vec3 right, vec3 up, vec3 forward) {
  float g = u_grow;
  vec3 ray = normalize(u_cursor.x * right + u_cursor.y * up + u_focal * forward);
  float along = dot(CORE - ro, forward) / dot(ray, forward);
  vec3 offset = ro + ray * along - CORE;
  float dist = max(length(offset), 1e-3);
  vec3 target = CORE + offset / dist * clamp(dist, 1.2, 2.3);
  for (int i = 0; i < TOOLS; i++) {
    float fi = float(i);
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
    float phase = fi * 2.0944 + t * 0.2 * dir;
    float cycle = fract(t * 0.07 + fi * 0.1667);
    float dive = smoothstep(0.0, 0.08, cycle) * (1.0 - smoothstep(0.1, 0.26, cycle));
    float radius = mix(1.6 + 0.14 * sin(fi * 2.3), 0.92, dive) * mix(0.3, 1.0, g);
    vec3 p = vec3(cos(phase) * radius, 0.0, sin(phase) * radius);
    p.yz *= rot(0.5 + 0.22 * fi);
    p.xy *= rot(fi * 1.0472 + 0.2);
    p.y *= 0.7;
    vec3 np = CORE + p;
    float lean = exp(-dot(np - target, np - target) * 0.42) * u_cursorOn * g;
    gTool[i] = np + (target - np) * 0.7 * lean;
    gToolR[i] = (0.14 + 0.035 * mod(fi * 7.0, 3.0)) * smoothstep(0.15, 0.7, g);
  }
  float ring = 0.09 * exp(-u_ping * 2.6) * sin(u_ping * 13.0);   // a click rings the core
  gCoreR = (0.72 + 0.025 * sin(t * 0.9)) * mix(0.25, 1.0, g) + ring;
}

float mapHub(vec3 p) {
  vec3 q = p - CORE;
  float bound = length(q) - 2.35;
  if (bound > 0.25) return bound;   // cheap bounding sphere: most rays never enter it
  float t = u_time;
  float wobble = 0.038 * sin(2.1 * q.x + t * 0.9) * sin(1.9 * q.y - t * 0.7)
    * sin(2.3 * q.z + t * 1.1);
  float d = length(q) - gCoreR + wobble;
  if (!gRing) return d;
  for (int i = 0; i < TOOLS; i++) {
    float sphere = length(p - gTool[i]) - gToolR[i];
    float tether = sdCapsule(p, CORE, gTool[i], 0.019 * u_grow);
    d = smin(d, smin(sphere, tether, 0.09), 0.17);
  }
  vec3 r = q;
  r.xy *= rot(0.42);
  r.yz *= rot(-0.62 + 0.06 * sin(t * 0.2));
  return min(d, sdTorus(r, vec2(1.3 * mix(0.4, 1.0, u_grow), 0.026)));
}
float mapScene(vec3 p) { return min(mapHub(p), p.y - FLOOR_Y); }

vec3 hubNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.0015;
  // The tetrahedron trick: four samples instead of six central differences.
  return normalize(k.xyy * mapHub(p + k.xyy * e) + k.yyx * mapHub(p + k.yyx * e)
    + k.yxy * mapHub(p + k.yxy * e) + k.xxx * mapHub(p + k.xxx * e));
}

float softShadow(vec3 ro, vec3 rd, float k) {
  float res = 1.0, t = 0.03;
  for (int i = 0; i < 40; i++) {
    float h = mapHub(ro + rd * t);
    res = min(res, k * h / t);
    t += clamp(h, 0.02, 0.3);
    if (res < 0.003 || t > 9.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

float occlusion(vec3 p, vec3 n) {
  float o = 0.0, weight = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.02 + 0.16 * float(i) / 4.0;
    o += (h - mapScene(p + n * h)) * weight;
    weight *= 0.85;
  }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}

// The hub's luminance (0 ink .. 1 paper) for cell fc of a stage res cells in size.
float hub(vec2 fc, vec2 res) {
  vec2 uv = (fc - 0.5 * res) / res.y - u_shift;
  float t = u_time;
  float swing = 0.22 * sin(t * 0.045) - 0.12;
  vec3 ro = vec3(9.0 * sin(swing), 1.75, 9.0 * cos(swing));
  vec3 forward = normalize(vec3(0.0, -0.12, 0.0) - ro);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 rd = normalize(uv.x * right + uv.y * up + u_focal * forward);
  setup(t, ro, right, up, forward);

  float dist = 0.5, edge = 1e9, lastHub = 1e9, lastFloor = 1e9;
  int hit = 0;   // 1 = hub, 2 = floor
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= u_steps) break;
    vec3 p = ro + rd * dist;
    float dHub = mapHub(p), dFloor = p.y - FLOOR_Y;
    lastHub = dHub;
    lastFloor = dFloor;
    edge = min(edge, dHub / dist);   // the closest the ray came to the hub, as an angle
    float d = min(dHub, dFloor);
    if (d < 0.0006 * dist) { hit = dHub < dFloor ? 1 : 2; break; }
    dist += d;
    if (dist > 40.0) break;
  }
  // Out of steps but nearly there: count it, so a reduced step budget doesn't punch holes.
  if (hit == 0 && dist < 40.0 && min(lastHub, lastFloor) < 0.02) hit = lastHub < lastFloor ? 1 : 2;

  vec3 light = normalize(vec3(-0.42, 1.0, 0.36));
  vec3 p = ro + rd * dist;
  float lum = 1.0;
  if (hit == 1) {
    vec3 n = hubNormal(p);
    float diffuse = max(dot(n, light), 0.0);
    gRing = false;   // the thin ring would only add speckle to shadows and occlusion
    float shadow = softShadow(p + n * 0.012, light, 9.0);
    float ao = occlusion(p, n);
    gRing = true;
    float spec = pow(max(dot(reflect(rd, n), light), 0.0), 30.0);
    float fresnel = 1.0 - max(dot(n, -rd), 0.0);
    float sky = 0.5 + 0.5 * n.y;
    vec3 back = normalize(vec3(0.75, 0.25, -0.6));
    float rim = pow(fresnel, 3.0) * clamp(dot(n, back) + 0.2, 0.0, 1.0);
    lum = 0.03 + 0.8 * diffuse * shadow + 0.12 * sky * ao + 0.3 * rim * ao + 0.9 * spec * shadow;
    lum *= mix(0.5, 1.0, ao);
    lum = smoothstep(0.02, 1.0, lum);
  } else if (hit == 2) {
    float shadow = softShadow(p + vec3(0.0, 0.002, 0.0), light, 14.0);
    float ao = occlusion(p, vec3(0.0, 1.0, 0.0));
    lum = mix(0.5, 1.0, shadow) * mix(0.25, 1.0, ao);
    // The floor fades to paper away from the hub: there is no horizon, only a cast shadow.
    lum = mix(lum, 1.0, smoothstep(0.8, 2.0, length(p.xz - CORE.xz - vec2(0.45, -0.3))));
  }
  // A one-cell ink outline wherever a ray grazed the hub's silhouette.
  float cellAngle = 1.0 / (res.y * u_focal);
  if (hit != 1 && edge < 1.15 * cellAngle) lum = 0.0;
  return pow(clamp(lum, 0.0, 1.0), 1.1);
}
`;
