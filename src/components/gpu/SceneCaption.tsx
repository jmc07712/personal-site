'use client';

import { useScene } from './SceneProvider';

/** One plain line about the wallpaper, with the live particle count (smaller in Pocket mode). */
export function SceneCaption({ className }: { className?: string }) {
  const { pointCount, supported } = useScene();
  const text = supported
    ? `The wallpaper is an agent and six tools, drawn live on your GPU with ${pointCount.toLocaleString('en-US')} particles.`
    : 'The wallpaper is an agent and six tools, drawn in two colors.';
  return <span className={className}>{text}</span>;
}
