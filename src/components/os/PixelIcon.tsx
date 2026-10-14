import { BITMAPS, bitmapPaths, type BitmapName } from './bitmaps';

interface PixelIconProps {
  name: BitmapName;
  /** Screen pixels per bitmap pixel at laptop size. */
  scale?: number;
  className?: string;
}

/**
 * A 1-bit icon drawn with crisp edges at an integer scale. Decorative, so hidden from AT. On big
 * screens the scale grows with the interface (--ui), rounded down so it stays a whole number.
 */
export function PixelIcon({ name, scale = 2, className }: PixelIconProps) {
  const rows = BITMAPS[name];
  const width = rows[0]?.length ?? 0;
  const { ink, paper } = bitmapPaths(rows);
  const pixel = `round(down, ${scale} * var(--ui), 1)`;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${rows.length}`}
      width={width * scale}
      height={rows.length * scale}
      style={{ width: `calc(${width}px * ${pixel})`, height: `calc(${rows.length}px * ${pixel})` }}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {paper && <path d={paper} fill="var(--paper)" />}
      <path d={ink} fill="currentColor" />
    </svg>
  );
}
