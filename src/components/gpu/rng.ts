/** A source of uniform random numbers in [0, 1). */
export type Rng = () => number;

/**
 * xorshift32: tiny, fast and seedable. Seeding makes every formation reproducible, so the
 * sampling code can be tested and two visits draw the same scene.
 */
export function xorshift32(seed = 0x9e3779b9): Rng {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

/** A standard normal sample (Box-Muller), for jitter that clusters near a line. */
export function gaussian(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** A uniformly random element of a non-empty list. */
export function pick<T>(items: ArrayLike<T>, rng: Rng): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new RangeError('pick() needs a non-empty list');
  return item;
}
