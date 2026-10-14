/**
 * The interface scale step, `--ui` in scale.css: 1 at laptop size, up to 2.5 on a 4K monitor.
 * CSS owns the steps; code that sizes things in px reads the current one from the root.
 */
export function uiScale(): number {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui'));
  return value > 0 ? value : 1;
}
