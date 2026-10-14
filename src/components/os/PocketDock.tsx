'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { READING_BAND_MARGIN } from '@/components/gpu/sizing';
import type { BitmapName } from './bitmaps';
import { PixelIcon } from './PixelIcon';
import styles from './PocketDock.module.css';

const SECTIONS: { id: string; label: string; icon: BitmapName }[] = [
  { id: 'about', label: 'About', icon: 'about' },
  { id: 'work', label: 'Work', icon: 'experience' },
  { id: 'writing', label: 'Writing', icon: 'writing' },
  { id: 'products', label: 'Projects', icon: 'counterdex' },
  { id: 'contact', label: 'Contact', icon: 'contact' },
];

/** The home screen above the sections. While it's current, the dock marks nothing. */
const HOME = 'home';

/**
 * Pocket mode's navigation, in the thumb zone. Plain anchor links, so it works before
 * JavaScript loads; an IntersectionObserver marks the section you're reading.
 */
export function PocketDock() {
  const [current, setCurrent] = useState(HOME);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setCurrent(visible.target.id);
      },
      // A section counts as current while it crosses the reading band, where the points gather.
      { rootMargin: READING_BAND_MARGIN },
    );
    for (const id of [HOME, ...SECTIONS.map((section) => section.id)]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={clsx(styles.dock, 'pix')} aria-label="Sections">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={styles.item}
          aria-current={current === section.id ? 'location' : undefined}
        >
          <PixelIcon name={section.icon} scale={2} />
          <span>{section.label}</span>
        </a>
      ))}
    </nav>
  );
}
