'use client';

import { useScene } from './SceneProvider';

/** One plain line about the wallpaper, with the live particle count (smaller in Pocket mode). */
export function SceneCaption({ className }: { className?: string }) {
  const { pointCount, supported } = useScene();
  const text = supported
    ? `The wallpaper is rendered on your GPU, with an OpenAI knot, six orbiting tools, and ${pointCount.toLocaleString('en-US')} surrounding particles.`
    : 'The wallpaper shows an OpenAI knot surrounded by six tools, drawn in two colors.';
  return <span className={className}>{text}</span>;
}
