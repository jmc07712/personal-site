'use client';

import clsx from 'clsx';
import { identity } from '@/content/resume';
import { Clock } from './Clock';
import styles from './MenuBar.module.css';
import { PixelIcon } from './PixelIcon';
import { ScenePauseButton } from './SceneChrome';
import { useWindowManager } from './WindowManager';

const MENU = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'writing', label: 'Writing' },
  { id: 'counterdex', label: 'Products' },
  { id: 'contact', label: 'Contact' },
] as const;

/** The top bar: open any window, read the source, pause the scene, check the time. */
export function MenuBar() {
  const { state, open } = useWindowManager();
  return (
    <header className={clsx(styles.menubar, 'pix')}>
      <div className={styles.left}>
        <PixelIcon name="hub" scale={2} className={styles.glyph} />
        <span className={styles.name}>{identity.name}</span>
        <span className={styles.sep} aria-hidden="true" />
        <nav className={styles.nav} aria-label="Windows">
          {MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.item}
              aria-current={state.focused === item.id ? 'true' : undefined}
              data-opens={item.id}
              onClick={(e) => open(item.id, e.currentTarget)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className={styles.right}>
        <a className={clsx(styles.item, styles.source)} href={identity.source}>
          Source
        </a>
        <ScenePauseButton className={clsx(styles.item, styles.pause)} />
        <Clock className={styles.clock} />
      </div>
    </header>
  );
}
