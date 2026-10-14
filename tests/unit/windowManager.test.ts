import { describe, expect, it } from 'vitest';
import { anyMoved, createWM, topOpen, wmReducer } from '@/lib/windowManager';

describe('windowManager', () => {
  const initial = createWM(['about', 'experience', 'contact'], ['about']);

  it('starts with the initial windows open and the last one focused', () => {
    expect(initial.wins.about?.open).toBe(true);
    expect(initial.wins.experience?.open).toBe(false);
    expect(initial.focused).toBe('about');
  });

  it('raises an opened window above the others and focuses it', () => {
    const s = wmReducer(initial, { type: 'open', id: 'experience' });
    expect(s.wins.experience!.z).toBeGreaterThan(s.wins.about!.z);
    expect(s.focused).toBe('experience');
  });

  it('counts every open, even of a window that is already open, so it can be revealed', () => {
    const before = initial.wins.experience?.opens ?? 0;
    let s = wmReducer(initial, { type: 'open', id: 'experience' });
    s = wmReducer(s, { type: 'open', id: 'experience' });
    expect(s.wins.experience?.opens).toBe(before + 2);
  });

  it('does not count focus as an open', () => {
    const s = wmReducer(wmReducer(initial, { type: 'open', id: 'experience' }), {
      type: 'focus',
      id: 'about',
    });
    expect(s.wins.about?.opens).toBe(initial.wins.about?.opens);
  });

  it('adds windows it has not seen before, such as case files', () => {
    const s = wmReducer(initial, { type: 'open', id: 'case:pitching-agent' });
    expect(s.wins['case:pitching-agent']?.open).toBe(true);
    expect(s.focused).toBe('case:pitching-agent');
  });

  it('focuses the next topmost open window after a close', () => {
    let s = wmReducer(initial, { type: 'open', id: 'experience' });
    s = wmReducer(s, { type: 'open', id: 'contact' });
    s = wmReducer(s, { type: 'close', id: 'contact' });
    expect(s.focused).toBe('experience');
    expect(topOpen(s)).toBe('experience');
  });

  it('leaves nothing focused when the last window closes', () => {
    const s = wmReducer(initial, { type: 'close', id: 'about' });
    expect(s.focused).toBeNull();
    expect(topOpen(s)).toBeNull();
  });

  it('ignores focus on a closed window', () => {
    expect(wmReducer(initial, { type: 'focus', id: 'experience' })).toBe(initial);
  });

  it('ignores focus on the window that is already on top', () => {
    expect(wmReducer(initial, { type: 'focus', id: 'about' })).toBe(initial);
  });

  it('ignores closing a window that is not open', () => {
    expect(wmReducer(initial, { type: 'close', id: 'contact' })).toBe(initial);
  });

  it('remembers where a window was dragged, across close and reopen', () => {
    let s = wmReducer(initial, { type: 'move', id: 'about', x: 10, y: 20 });
    s = wmReducer(s, { type: 'close', id: 'about' });
    s = wmReducer(s, { type: 'open', id: 'about' });
    expect(s.wins.about?.pos).toEqual({ x: 10, y: 20 });
  });

  it('closes every window at once and leaves nothing focused', () => {
    const s = wmReducer(wmReducer(initial, { type: 'open', id: 'contact' }), { type: 'closeAll' });
    expect(topOpen(s)).toBeNull();
    expect(s.focused).toBeNull();
    expect(wmReducer(s, { type: 'closeAll' })).toBe(s);
  });

  it('puts every dragged window back in its slot on clean up', () => {
    const moved = wmReducer(initial, { type: 'move', id: 'about', x: 10, y: 20 });
    expect(anyMoved(moved)).toBe(true);
    const s = wmReducer(moved, { type: 'cleanUp' });
    expect(s.wins.about?.pos).toBeUndefined();
    expect(anyMoved(s)).toBe(false);
    expect(wmReducer(s, { type: 'cleanUp' })).toBe(s);
  });
});
