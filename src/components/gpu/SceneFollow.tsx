'use client';

import { useEffect } from 'react';
import { useMediaQuery } from './browser';
import { followTarget, heroArea } from './modes';
import type { Rect } from './rect';
import { useScene } from './SceneProvider';
import { DESKTOP_QUERY } from './sizing';

/** Marks an element the points may follow (a window's slot); its value is a stable id. */
const ATTRIBUTE = 'data-scene-follow';
/** Visibility in 5% steps: fine enough to tell which window covers the most of the screen. */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * The box the halo hugs. A dragged window moves by transform inside its slot, so this measures
 * the slot's first child (the window) rather than the slot. Null while the window is closed.
 */
function windowBox(slot: Element): Rect | null {
  const box = (slot.firstElementChild ?? slot).getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return null;
  return { x: box.left, y: box.top, w: box.width, h: box.height };
}

/**
 * Lets the points follow the visitor down the desktop. Every element marked `data-scene-follow`
 * is watched; whichever covers the most of the viewport, and more than the hero does, is
 * followed, and every frame its window's box goes to the scene, which gathers the points in a
 * halo round it. Desktop only, and only while the scene animates: still frames never chase.
 */
export function SceneFollow() {
  const { animated, supported, setFollow } = useScene();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const enabled = desktop && supported && animated;

  useEffect(() => {
    if (!enabled) return;
    const slots = new Map<string, Element>();
    // Px² of each slot on screen, by id, kept current by the observer.
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting, intersectionRect: r } of entries) {
          const id = target.getAttribute(ATTRIBUTE) ?? '';
          if (isIntersecting) visible.set(id, r.width * r.height);
          else visible.delete(id);
        }
      },
      { threshold: THRESHOLDS },
    );
    for (const slot of document.querySelectorAll(`[${ATTRIBUTE}]`)) {
      slots.set(slot.getAttribute(ATTRIBUTE) ?? '', slot);
      observer.observe(slot);
    }

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const id = followTarget(visible, heroArea(window.scrollY, viewport));
      const slot = id === null ? undefined : slots.get(id);
      setFollow(slot ? windowBox(slot) : null);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      setFollow(null);
    };
  }, [enabled, setFollow]);

  return null;
}
