'use client';

import { useEffect } from 'react';
import { useScene } from '@/components/gpu/SceneProvider';
import { BOOTING_CLASS } from './bootCurtain';

/** Lifts the boot curtain once the boot has played, was skipped, or can't run at all. */
export function BootCurtainLifter() {
  const { ready, mode, supported } = useScene();
  useEffect(() => {
    if (!supported || (ready && mode !== 'boot')) {
      document.documentElement.classList.remove(BOOTING_CLASS);
    }
  }, [ready, mode, supported]);
  return null;
}

/** The menubar's pause control for the wallpaper scene. */
export function ScenePauseButton({ className }: { className?: string }) {
  const { paused, togglePaused, supported } = useScene();
  if (!supported) return null;
  return (
    <button type="button" className={className} aria-pressed={paused} onClick={togglePaused}>
      {paused ? 'Play scene' : 'Pause scene'}
    </button>
  );
}
