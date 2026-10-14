'use client';

import { useEffect } from 'react';
import { followTarget, heroArea } from './modes';
import type { Rect } from './rect';
import { useScene } from './SceneProvider';
import { READING_BAND, READING_BAND_MARGIN } from './sizing';

/** Marks an element the points may follow (a window's slot); its value is a stable id. */
const ATTRIBUTE = 'data-scene-follow';
/** Visibility in 5% steps: fine enough to tell which window covers the most of the screen. */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/** Px² of the reading band the first screen (the hub's stage) still covers. */
function heroInBand(scrollY: number, viewport: { width: number; height: number }): number {
  const top = READING_BAND.top * viewport.height;
  const bottom = READING_BAND.bottom * viewport.height;
  return Math.max(0, Math.min(bottom, viewport.height - scrollY) - top) * viewport.width;
}

/**
 * The box the halo hugs. A dragged window moves by transform inside its slot, so this measures
 * the slot's first child (the window) rather than the slot. Null while the window is closed.
 */
function windowBox(slot: Element): Rect | null {
  const box = (slot.firstElementChild ?? slot).getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return null;
  return { x: box.left, y: box.top, w: box.width, h: box.height };
}

interface SceneFollowProps {
  /** On a phone, follow the window across the reading band. */
  pocket: boolean;
  /** The phone wallpaper is asleep, so the halo holds still round the window it last followed. */
  asleep: boolean;
}

/**
 * Lets the points follow the visitor down the page, on desktop and phone alike. Every element
 * marked `data-scene-follow` is watched; whichever covers the most of the viewport (on a phone, of
 * the reading band), and more than the hero does, is followed, and every frame its window's box
 * goes to the scene, which gathers the points in a halo round it. It runs only while the scene
 * animates, since still frames never chase.
 */
export function SceneFollow({ pocket, asleep }: SceneFollowProps) {
  const { animated, supported, setFollow } = useScene();
  const enabled = supported && animated;

  // Let go of the window once the scene stops moving for good (paused, or reduced motion).
  useEffect(() => {
    if (!enabled) return;
    return () => setFollow(null);
  }, [enabled, setFollow]);

  useEffect(() => {
    if (!enabled || asleep) return;
    const slots = new Map<string, Element>();
    // Px² of each slot on screen (on a phone, in the reading band), by id, kept current by the
    // observer.
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting, intersectionRect: r } of entries) {
          const id = target.getAttribute(ATTRIBUTE) ?? '';
          if (isIntersecting) visible.set(id, r.width * r.height);
          else visible.delete(id);
        }
      },
      {
        threshold: THRESHOLDS,
        rootMargin: pocket ? READING_BAND_MARGIN : '0px',
      },
    );
    for (const slot of document.querySelectorAll(`[${ATTRIBUTE}]`)) {
      slots.set(slot.getAttribute(ATTRIBUTE) ?? '', slot);
      observer.observe(slot);
    }

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const hero = (pocket ? heroInBand : heroArea)(window.scrollY, viewport);
      const id = followTarget(visible, hero);
      const slot = id === null ? undefined : slots.get(id);
      setFollow(slot ? windowBox(slot) : null);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [enabled, pocket, asleep, setFollow]);

  return null;
}
