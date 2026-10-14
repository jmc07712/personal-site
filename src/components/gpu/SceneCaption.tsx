'use client';

import { useScene } from './SceneProvider';

/** One plain line about the wallpaper, with the live particle count (smaller in Pocket mode). */
export function SceneCaption({ className }: { className?: string }) {
  const { pointCount, supported } = useScene();
  const text = supported
    ? `The wallpaper is rendered live on your GPU, with ${pointCount.toLocaleString('en-US')} particles moving between an agent and its six tools.`
    : 'The wallpaper shows an agent and its six tools, drawn in two colors.';
  return <span className={className}>{text}</span>;
}
