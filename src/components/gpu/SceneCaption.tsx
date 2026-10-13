'use client';

import { useScene } from './SceneProvider';

const SCENE = 'The wallpaper is drawn live on your GPU: one agent, six tools';

/** One plain line about the wallpaper, with the live particle count (smaller in Pocket mode). */
export function SceneCaption({ className }: { className?: string }) {
  const { pointCount, supported } = useScene();
  const text = supported
    ? `${SCENE}, ${pointCount.toLocaleString('en-US')} particles.`
    : 'The wallpaper is an agent and its tools, drawn in two colors.';
  return <span className={className}>{text}</span>;
}
