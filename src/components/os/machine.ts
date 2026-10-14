/**
 * Plain-language facts about the visitor's machine, for About This Computer and the boot log.
 * Pure, so they can be tested without a browser.
 */

/**
 * A readable GPU name from what WebGL reports. Chrome and Edge wrap it in ANGLE's details, as in
 * "ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)": keep "Apple M3 Pro".
 */
export function gpuLabel(reported: string): string {
  const angle = /^ANGLE \((.*)\)$/.exec(reported.trim());
  const parts = angle?.[1]?.split(', ') ?? [reported];
  return (parts[1] ?? parts[0] ?? reported)
    .replace(/^ANGLE \w+ Renderer: /, '')
    .replace(/ \(0x[\da-f]+\)/gi, '')
    .replace(/ (Direct3D|vs_|ps_).*$/, '')
    .trim();
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Uptime as a clock reads it: "42 s", "3 min 05 s", "1 h 04 min". */
export function uptimeLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${pad(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${pad(Math.floor(s / 60) % 60)} min`;
}
