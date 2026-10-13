import { describe, expect, it } from 'vitest';
import { BOOTING_CLASS, bootCurtainScript } from '@/components/os/bootCurtain';

/** Runs the inline script against a fake browser and reports whether it hid the hero. */
function run(env: {
  width?: number;
  reducedMotion?: boolean;
  saveData?: boolean;
  booted?: boolean;
  paused?: boolean;
}) {
  const classes = new Set<string>();
  const queries: Record<string, boolean> = {
    '(min-width: 769px)': (env.width ?? 1440) >= 769,
    '(prefers-reduced-motion: reduce)': Boolean(env.reducedMotion),
  };
  const fake = {
    document: {
      documentElement: {
        classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) },
      },
    },
    matchMedia: (q: string) => ({ matches: Boolean(queries[q]) }),
    navigator: { connection: { saveData: Boolean(env.saveData) } },
    sessionStorage: { getItem: () => (env.booted ? '1' : null) },
    localStorage: { getItem: () => (env.paused ? '1' : null) },
    setTimeout: () => 0,
  };
  new Function(...Object.keys(fake), bootCurtainScript())(...Object.values(fake));
  return classes.has(BOOTING_CLASS);
}

describe('bootCurtainScript', () => {
  it('hides the hero for a first desktop visit', () => expect(run({})).toBe(true));
  it('never hides content on phones', () => expect(run({ width: 390 })).toBe(false));
  it('respects reduced motion', () => expect(run({ reducedMotion: true })).toBe(false));
  it('respects Save-Data', () => expect(run({ saveData: true })).toBe(false));
  it('plays once a session', () => expect(run({ booted: true })).toBe(false));
  it('stays out of the way when the scene is paused', () =>
    expect(run({ paused: true })).toBe(false));
});
