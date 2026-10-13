import { describe, expect, it } from 'vitest';
import { bayerThreshold, dither } from '@/components/gpu/bayer';

const BASE = [
  [0, 2],
  [3, 1],
];

/** The textbook recursion, M(2n) = [[4M + 0, 4M + 2], [4M + 3, 4M + 1]] by quadrant. */
function bayerMatrix(size: number): number[][] {
  if (size === 2) return BASE;
  const half = size / 2;
  const inner = bayerMatrix(half);
  return Array.from({ length: size }, (_, y) =>
    Array.from(
      { length: size },
      (_, x) => 4 * inner[y % half]![x % half]! + BASE[+(y >= half)]![+(x >= half)]!,
    ),
  );
}

describe('bayerMatrix', () => {
  it('starts from the 2x2 base', () => {
    expect(bayerMatrix(2)).toEqual([
      [0, 2],
      [3, 1],
    ]);
  });

  it('builds an 8x8 matrix that uses every threshold exactly once', () => {
    const values = bayerMatrix(8).flat();
    expect(values).toHaveLength(64);
    expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i));
  });

  it('spreads thresholds evenly: each 2x2 block of the 8x8 spans all four quarters', () => {
    const m = bayerMatrix(8);
    for (let y = 0; y < 8; y += 2) {
      for (let x = 0; x < 8; x += 2) {
        const block = [m[y]![x]!, m[y]![x + 1]!, m[y + 1]![x]!, m[y + 1]![x + 1]!];
        expect(block.map((v) => Math.floor(v / 16)).sort()).toEqual([0, 1, 2, 3]);
      }
    }
  });
});

describe('bayerThreshold', () => {
  it('matches the recursive matrix, so the shader closed form is the classic 8x8 Bayer', () => {
    const m = bayerMatrix(8);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) expect(bayerThreshold(x, y)).toBeCloseTo(m[y]![x]! / 64, 10);
    }
  });

  it('tiles every 8 cells, including negative rows, so it can be locked to the page', () => {
    for (const [x, y] of [
      [3, 5],
      [0, 7],
      [6, 1],
    ] as const) {
      expect(bayerThreshold(x + 8, y)).toBeCloseTo(bayerThreshold(x, y), 10);
      expect(bayerThreshold(x, y + 16)).toBeCloseTo(bayerThreshold(x, y), 10);
      expect(bayerThreshold(x, y - 8)).toBeCloseTo(bayerThreshold(x, y), 10);
    }
  });
});

describe('dither', () => {
  it('turns a tone into the matching share of paper cells', () => {
    for (const tone of [0, 0.25, 0.5, 0.75, 1]) {
      let paper = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) paper += dither(tone, x, y) ? 1 : 0;
      expect(paper).toBe(Math.round(tone * 64));
    }
  });
});
