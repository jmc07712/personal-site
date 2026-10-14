import { describe, expect, it } from 'vitest';
import {
  PARTICLES_DESKTOP,
  PARTICLES_POCKET,
  particlesFor,
  READING_BAND_MARGIN,
  recordsPerPoint,
  sceneOptionsFor,
} from '@/components/gpu/sizing';

describe('particlesFor', () => {
  it('gives Pocket mode its lighter tier at 768px and below', () => {
    expect(particlesFor(320)).toBe(PARTICLES_POCKET);
    expect(particlesFor(768)).toBe(PARTICLES_POCKET);
  });

  it('gives every wider viewport the full tier', () => {
    expect(particlesFor(769)).toBe(PARTICLES_DESKTOP);
    expect(particlesFor(2560)).toBe(PARTICLES_DESKTOP);
  });

  it('uses powers of two, so the counts read as GPU-sized', () => {
    expect(PARTICLES_DESKTOP).toBe(2 ** 18);
    expect(PARTICLES_POCKET).toBe(2 ** 15);
  });
});

describe('recordsPerPoint', () => {
  it('divides 1.2 billion records a month across the points, formatted for en-US', () => {
    expect(recordsPerPoint(262_144)).toBe('4,578');
    expect(recordsPerPoint(32_768)).toBe('36,621');
  });
});

describe('sceneOptionsFor', () => {
  it('runs the desktop at full count, uncapped, 3px pixels and the full raymarch', () => {
    expect(sceneOptionsFor(false, false)).toEqual({
      particles: PARTICLES_DESKTOP,
      fpsCap: null,
      pixel: 3,
      steps: 140,
      pocket: false,
      reducedMotion: false,
    });
  });

  it('keeps the pocket calm: fewer points, 30fps, chunkier pixels, fewer steps', () => {
    const pocket = sceneOptionsFor(true, true);
    expect(pocket.particles).toBe(PARTICLES_POCKET);
    expect(pocket.fpsCap).toBe(30);
    expect(pocket.pixel).toBeGreaterThanOrEqual(sceneOptionsFor(false, false).pixel);
    expect(pocket.steps).toBeLessThan(140);
    expect(pocket.pocket).toBe(true);
    expect(pocket.reducedMotion).toBe(true);
  });
});

describe('READING_BAND_MARGIN', () => {
  it('lets an observer see only the band 35 to 45% down the screen', () => {
    expect(READING_BAND_MARGIN).toBe('-35% 0px -55% 0px');
  });
});
