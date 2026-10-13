'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { BitmapName } from './bitmaps';
import styles from './DesktopIcons.module.css';
import { PixelIcon } from './PixelIcon';
import { useWindowManager } from './WindowManager';

const ICONS: { id: string; label: string; icon: BitmapName }[] = [
  { id: 'about', label: 'About', icon: 'about' },
  { id: 'experience', label: 'Experience', icon: 'experience' },
  { id: 'writing', label: 'Writing', icon: 'writing' },
  { id: 'counterdex', label: 'Counterdex', icon: 'counterdex' },
  { id: 'docly', label: 'Docly', icon: 'docly' },
  { id: 'dateescape', label: 'DateEscape', icon: 'dateescape' },
  { id: 'contact', label: 'Contact', icon: 'contact' },
];

/**
 * Desktop icons behave like a real desktop: a click selects, a double-click or Enter opens.
 * On touch screens a single tap opens, since there's no hover or double-click to discover.
 */
export function DesktopIcons() {
  const { open } = useWindowManager();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ul
      className={clsx(styles.icons, 'pix')}
      aria-label="Desktop. Double-click or press Enter to open"
    >
      {ICONS.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={clsx(styles.icon, selected === item.id && styles.selected)}
            data-opens={item.id}
            onClick={() => setSelected(item.id)}
            // A scroll cancels the pointer, so only a real tap reaches pointerup.
            onPointerUp={(e) => e.pointerType === 'touch' && open(item.id, e.currentTarget)}
            onDoubleClick={(e) => open(item.id, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                open(item.id, e.currentTarget);
              }
            }}
          >
            <PixelIcon name={item.icon} scale={2} />
            <span className={styles.label}>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
