'use client';

import { useScene } from './SceneProvider';
import { recordsPerPoint } from './sizing';

const SCALE = 'The Insights API serves 1.2 billion records a month';

/**
 * One line that says what the points are, computed from the live count so Pocket mode's smaller
 * simulation reads true too. Without WebGL2 there are no points, so it only states the scale.
 */
export function SceneCaption({ className }: { className?: string }) {
  const { pointCount, supported } = useScene();
  const points = pointCount.toLocaleString('en-US');
  const each = recordsPerPoint(pointCount);
  const text = supported
    ? `${points} points on your GPU. ${SCALE}, so each point stands for about ${each}.`
    : `${SCALE}.`;
  return <span className={className}>{text}</span>;
}
