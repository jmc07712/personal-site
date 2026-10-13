/** Rasterises the boot name in the site's pixel font, so the particles can sample its pixels. */
import { fitName, inkedPixels, type InkedPixels } from './text';

/** How long the boot waits for the pixel font before spelling the name anyway. */
const FONT_TIMEOUT_MS = 1600;

/** Resolves when the font is ready, or after the timeout: the boot never stalls on the network. */
export function loadFont(family: string): Promise<void> {
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS));
  const load = document.fonts.load(`100px ${family}`).then(
    () => undefined,
    () => undefined,
  );
  return Promise.race([load, timeout]);
}

/** The name drawn in `family`, sized for the viewport, as the pixels its glyphs cover. */
export function rasterizeName(
  name: string,
  family: string,
  viewportWidth: number,
  stageHeight: number,
): InkedPixels | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.font = `100px ${family}`;
  const layout = fitName(name, viewportWidth, stageHeight, (line) => ctx.measureText(line).width);
  const widest = Math.max(...layout.lines.map((line) => ctx.measureText(line).width));
  canvas.width = Math.ceil((widest * layout.size) / 100) + 8;
  canvas.height = Math.ceil(layout.lineHeight * layout.lines.length + layout.size * 0.3);
  // Resizing a canvas resets its state, so set the font after.
  ctx.font = `${layout.size}px ${family}`;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  layout.lines.forEach((line, i) =>
    ctx.fillText(line, canvas.width / 2, layout.size * 0.78 + i * layout.lineHeight),
  );
  return inkedPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width);
}
