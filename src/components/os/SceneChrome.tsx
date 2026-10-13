'use client';

import { useEffect } from 'react';
import { useScene } from '@/components/gpu/SceneProvider';
import { BOOTED_KEY, PAUSED_KEY } from '@/components/gpu/storageKeys';
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

/**
 * Replays the boot: forget that it played this session (and any pause), then reload at the top,
 * so the inline curtain script and the scene start fresh exactly as on a first visit.
 */
export function restart() {
  try {
    window.sessionStorage.removeItem(BOOTED_KEY);
    window.localStorage.removeItem(PAUSED_KEY);
  } catch {
    // Storage is blocked; the reload still restarts the scene, just without the boot.
  }
  window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.location.reload();
}
