/**
 * How much ink each point lays down. Points add their ink into one buffer and a cell's tone is
 * the sum, so to paint an area at a given tone, each of the n points covering it carries
 * tone × cells ÷ n. This keeps every formation the same darkness whatever the particle count or
 * pixel size.
 */

export interface InkBudget {
  /** Per point while spelling the name. */
  name: number;
  /** Per point in flight along a tether. */
  hub: number;
  /** Per point filling a role bar (solid: tone above 1). */
  bar: number;
  /** Per point in the halo round a followed window. */
  halo: number;
  /** The floor for a fast-moving point, so a stream reads as visible grain. */
  flight: number;
}

export interface InkInputs {
  count: number;
  /** CSS px² per cell. */
  cellArea: number;
  /** CSS px² the name's glyphs cover. */
  nameArea: number;
  /** On-screen tether length, CSS px. */
  tetherLength: number;
  /** CSS px² the role bars cover. */
  barArea: number;
  /** CSS px² the halo round a followed window covers at its edge tone (see haloArea). */
  haloArea: number;
  pocket: boolean;
}

/** Width of the band of traffic around a tether, CSS px. */
const TETHER_WIDTH = 10;

export function inkPerPoint(p: InkInputs): InkBudget {
  const cells = (area: number) => area / p.cellArea;
  // About half the points are on screen along the tethers at any moment; the rest wait in the core.
  const tetherPoints = 0.5 * p.count;
  return {
    name: Math.min(0.5, (0.95 * cells(p.nameArea)) / p.count),
    hub: Math.min(0.08, cells(p.tetherLength * TETHER_WIDTH) / tetherPoints),
    bar: p.barArea > 0 ? Math.min(1, (2.2 * cells(p.barArea)) / p.count) : 0.004,
    // Nearly solid at the frame; the dither takes it out to paper as the points thin.
    halo: Math.min(0.5, (0.85 * cells(p.haloArea)) / p.count),
    flight: p.pocket ? 0.12 : Math.min(0.5, 0.075 * Math.sqrt(262_144 / p.count)),
  };
}
