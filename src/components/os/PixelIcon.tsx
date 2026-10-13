import { BITMAPS, bitmapPaths, type BitmapName } from './bitmaps';

interface PixelIconProps {
  name: BitmapName;
  /** Screen pixels per bitmap pixel. */
  scale?: number;
  className?: string;
}

/** A 1-bit icon drawn with crisp edges at an integer scale. Decorative, so hidden from AT. */
export function PixelIcon({ name, scale = 2, className }: PixelIconProps) {
  const rows = BITMAPS[name];
  const width = rows[0]?.length ?? 0;
  const { ink, paper } = bitmapPaths(rows);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${rows.length}`}
      width={width * scale}
      height={rows.length * scale}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {paper && <path d={paper} fill="var(--paper)" />}
      <path d={ink} fill="currentColor" />
    </svg>
  );
}
