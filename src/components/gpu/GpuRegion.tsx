'use client';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { cappedDpr } from './framing';
import styles from './GpuRegion.module.css';
import { useScene } from './SceneProvider';

/**
 * A window onto the scene from inside a window: a 2D canvas the provider fills, every frame,
 * with the patch of the scene beneath it. The Experience window uses one per role bar, so the
 * particle bars sit inside the window and layer like the rest of its content.
 */
export function GpuRegion({ id, className }: { id: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { registerRegion } = useScene();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Match the backing store to the box in device pixels, so copied cells stay sharp.
    const fit = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = cappedDpr(window.devicePixelRatio);
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    registerRegion(id, canvas);
    return () => {
      observer.disconnect();
      registerRegion(id, null);
    };
  }, [id, registerRegion]);

  return <canvas ref={canvasRef} className={clsx(styles.region, className)} aria-hidden="true" />;
}
