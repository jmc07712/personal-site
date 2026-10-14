'use client';

import clsx from 'clsx';
import { identity, products } from '@/content/resume';
import { isBitmapName, type BitmapName } from './bitmaps';
import styles from './HomeScreen.module.css';
import { PixelIcon } from './PixelIcon';
import { useWindowManager } from './WindowManager';

interface App {
  /** The window it opens. */
  id: string;
  label: string;
  icon: BitmapName;
}

const APPS: App[] = [
  { id: 'about', label: 'About', icon: 'about' },
  { id: 'experience', label: 'Experience', icon: 'experience' },
  { id: 'writing', label: 'Writing', icon: 'writing' },
  ...products.map((product): App => ({
    id: product.id,
    label: product.name,
    icon: isBitmapName(product.id) ? product.id : 'caseFile',
  })),
  { id: 'contact', label: 'Contact', icon: 'contact' },
];

/**
 * Pocket mode's first screen, laid out like a phone's home screen. The agent fills the upper part
 * (the wallpaper draws it there), then my name and title, then an icon for every window. The icons
 * are links to the windows, so they work before JavaScript loads; after that, a tap opens the
 * window if it was closed, scrolls to it and focuses it.
 */
export function HomeScreen() {
  const { open } = useWindowManager();
  return (
    <section id="home" className={styles.home} aria-label="Home screen">
      <div className={clsx(styles.plate, 'pix')}>
        <p className={styles.name}>{identity.name}</p>
        <p className={styles.title}>
          {identity.title}, {identity.employer}
        </p>
      </div>
      <ul className={clsx(styles.apps, 'pix')}>
        {APPS.map((app) => (
          <li key={app.id}>
            <a
              href={`#win-${app.id}`}
              className={styles.app}
              onClick={(e) => {
                e.preventDefault();
                open(app.id, e.currentTarget);
              }}
            >
              <PixelIcon name={app.icon} scale={3} />
              <span className={styles.label}>{app.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
