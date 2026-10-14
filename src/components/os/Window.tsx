'use client';

import clsx from 'clsx';
import { animate, motion, useDragControls, useMotionValue } from 'motion/react';
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { CAN_DRAG_QUERY, POCKET_QUERY, REDUCED_MOTION_QUERY, useMedia } from '@/lib/useMedia';
import type { BitmapName } from './bitmaps';
import { PixelIcon } from './PixelIcon';
import styles from './Window.module.css';
import { useWindowManager } from './WindowManager';

interface WindowProps {
  id: string;
  title: string;
  /**
   * `inflow` windows sit in the page and leave a "Reopen" placeholder when closed.
   * `overlay` windows (case files) float above the page. `reader` overlays fill it (posts).
   */
  variant?: 'inflow' | 'overlay' | 'reader';
  icon: BitmapName;
  /** Id of a heading inside the body that names the window; defaults to the title bar. */
  labelledBy?: string;
  status?: ReactNode;
  /** Edge-to-edge body for content that draws its own rules, like the trace. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Window({
  id,
  title,
  variant = 'inflow',
  icon,
  labelledBy,
  status,
  flush = false,
  className,
  children,
}: WindowProps) {
  const { state, open, close, focus, move, openerOf } = useWindowManager();
  const win = state.wins[id];
  const isOpen = Boolean(win?.open);
  const isActive = state.focused === id;
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const ghostRef = useRef<HTMLButtonElement>(null);
  const canDrag = useMedia(CAN_DRAG_QUERY);
  const pocket = useMedia(POCKET_QUERY);
  const reducedMotion = useMedia(REDUCED_MOTION_QUERY);
  // When the body carries its own heading, the title bar is just a label, not a second heading.
  const TitleTag = labelledBy ? 'span' : 'h2';
  const dragControls = useDragControls();
  const x = useMotionValue(win?.pos?.x ?? 0);
  const y = useMotionValue(win?.pos?.y ?? 0);

  // Clean up forgets where the window was dragged: slide it back to its slot.
  const dragged = win?.pos !== undefined;
  useEffect(() => {
    if (dragged || (x.get() === 0 && y.get() === 0)) return;
    const transition = reducedMotion
      ? { duration: 0 }
      : { duration: 0.3, ease: 'easeOut' as const };
    const slides = [animate(x, 0, transition), animate(y, 0, transition)];
    return () => slides.forEach((slide) => slide.stop());
  }, [dragged, x, y, reducedMotion]);

  // Each open request after the first render (even for a window that's already open) brings the
  // window into view and moves focus into it.
  const opens = win?.opens ?? 0;
  const seenOpens = useRef(opens);
  useEffect(() => {
    if (opens === seenOpens.current) return;
    seenOpens.current = opens;
    const el = sectionRef.current;
    el?.focus({ preventScroll: true });
    if (variant === 'inflow') {
      el?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }, [opens, variant, reducedMotion]);

  // On phones an open case file or post is a full-screen sheet, so the page behind it stays put.
  useEffect(() => {
    if (!isOpen || variant === 'inflow' || !pocket) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = '';
    };
  }, [isOpen, variant, pocket]);

  const closeAndRestoreFocus = () => {
    const opener = openerOf(id);
    close(id);
    // On a phone a window in the page folds to its title bar where the reader is, so focus
    // stays on that bar rather than scrolling back up to whatever opened the window.
    const stayPut = pocket && variant === 'inflow';
    // Wait a frame so the placeholder or opener is visible before it takes focus.
    requestAnimationFrame(() => {
      if (opener?.isConnected && !stayPut) opener.focus({ preventScroll: variant !== 'inflow' });
      else ghostRef.current?.focus();
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeAndRestoreFocus();
    }
  };

  return (
    <>
      <motion.section
        ref={sectionRef}
        id={`win-${id}`}
        className={clsx(
          styles.window,
          styles[variant],
          isActive && styles.active,
          canDrag && styles.draggable,
          className,
        )}
        hidden={!isOpen}
        aria-labelledby={labelledBy ?? titleId}
        tabIndex={-1}
        style={{ x, y, zIndex: (win?.z ?? 0) + 10 }}
        drag={canDrag && !pocket}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={() => move(id, x.get(), y.get())}
        onPointerDownCapture={() => focus(id)}
        onKeyDown={onKeyDown}
      >
        <div className={styles.frame}>
          <div className={clsx(styles.bar, 'pix')} onPointerDown={(e) => dragControls.start(e)}>
            {pocket && variant !== 'inflow' && (
              <button type="button" className={styles.back} onClick={closeAndRestoreFocus}>
                Back
              </button>
            )}
            <TitleTag className={styles.title} id={titleId}>
              {title}
            </TitleTag>
            <span className={styles.grip} aria-hidden="true" />
            <button
              type="button"
              className={styles.close}
              aria-label={`Close ${title}`}
              onClick={closeAndRestoreFocus}
            >
              <PixelIcon name="close" scale={1} />
            </button>
          </div>
          <div
            className={clsx(styles.body, flush && styles.flush)}
            // Overlay bodies scroll on their own, so keyboard users must be able to focus them.
            tabIndex={variant === 'inflow' ? undefined : 0}
          >
            {children}
          </div>
          {status && <div className={clsx(styles.status, 'pix')}>{status}</div>}
        </div>
      </motion.section>
      {variant === 'inflow' && !isOpen && (
        <button
          ref={ghostRef}
          type="button"
          className={clsx(styles.ghost, 'pix')}
          onClick={(e) => open(id, e.currentTarget)}
        >
          <PixelIcon name={icon} scale={2} />
          <span className={styles.ghostTitle}>
            {title}
            <span className={styles.closedNote}> is closed</span>
          </span>
          <span className={styles.reopen}>Reopen</span>
        </button>
      )}
    </>
  );
}
