import { describe, expect, it } from 'vitest';
import { BITMAPS, bitmapPaths, isBitmapName } from '@/components/os/bitmaps';

describe('bitmapPaths', () => {
  it('merges horizontal runs into single rectangles', () => {
    expect(bitmapPaths(['##.o'])).toEqual({ ink: 'M0 0h2v1h-2z', paper: 'M3 0h1v1h-1z' });
  });

  it('leaves transparent cells out of both paths', () => {
    expect(bitmapPaths(['...'])).toEqual({ ink: '', paper: '' });
  });
});

describe('BITMAPS', () => {
  it('keeps every icon rectangular', () => {
    for (const [name, rows] of Object.entries(BITMAPS)) {
      const width = rows[0]?.length;
      expect(
        rows.every((r) => r.length === width),
        name,
      ).toBe(true);
    }
  });

  it('uses only ink, paper and transparent cells', () => {
    for (const [name, rows] of Object.entries(BITMAPS)) {
      expect(rows.join('').replace(/[#o.]/g, ''), name).toBe('');
    }
  });
});

describe('isBitmapName', () => {
  it('accepts icons that exist', () => expect(isBitmapName('counterdex')).toBe(true));
  it('rejects unknown names and inherited keys', () => {
    expect(isBitmapName('nope')).toBe(false);
    expect(isBitmapName('toString')).toBe(false);
  });
});
