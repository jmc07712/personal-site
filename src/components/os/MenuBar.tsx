'use client';

import * as Menubar from '@radix-ui/react-menubar';
import clsx from 'clsx';
import { useRef, useState, type ReactNode } from 'react';
import { useScene } from '@/components/gpu/SceneProvider';
import { identity, products } from '@/content/resume';
import { POCKET_QUERY, useMedia } from '@/lib/useMedia';
import { anyMoved, topOpen } from '@/lib/windowManager';
import { Clock } from './Clock';
import styles from './MenuBar.module.css';
import { PixelIcon } from './PixelIcon';
import { restart } from './SceneChrome';
import { shutDown } from './ShutDown';
import { useWindowManager } from './WindowManager';

/** Every desktop window, in the order of the desktop icons. */
const WINDOWS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'writing', label: 'Writing' },
  ...products.map((product) => ({ id: product.id, label: product.name })),
  { id: 'contact', label: 'Contact' },
];

const HELP_POST = 'post:how-this-site-works';

interface MenuProps {
  value: string;
  title: ReactNode;
  /** The accessible name, when the title is an icon. */
  label?: string;
  className?: string;
  onCloseAutoFocus: (event: Event) => void;
  children: ReactNode;
}

/** A menu title in the bar and the menu that drops from it. */
function Menu({ value, title, label, className, onCloseAutoFocus, children }: MenuProps) {
  return (
    <Menubar.Menu value={value}>
      <Menubar.Trigger
        className={clsx(styles.trigger, className)}
        aria-label={label}
        data-menu={value}
      >
        {title}
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          className={clsx(styles.content, 'pix')}
          align="start"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {children}
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  );
}

function Item(props: Menubar.MenubarItemProps) {
  return <Menubar.Item {...props} className={styles.item} />;
}

function Separator() {
  return <Menubar.Separator className={styles.separator} />;
}

/**
 * The top bar, as real menus: the hub, Go, View, Special and Help, then the time. Radix Menubar
 * supplies the keyboard support and ARIA roles. On phones only the hub menu stays, and it takes
 * on the Go items.
 */
export function MenuBar() {
  const { state, open, closeAll, cleanUp } = useWindowManager();
  const { paused, togglePaused, supported } = useScene();
  const pocket = useMedia(POCKET_QUERY);
  const [menu, setMenu] = useState('');
  // An item that moves focus on (into a window, or to the off screen) keeps the menu from
  // returning it to the menu title.
  const focusMoved = useRef(false);

  const openWindow = (id: string) => {
    focusMoved.current = true;
    // The menu title stands in as the opener, so closing the window returns focus to it.
    open(id, document.querySelector<HTMLElement>(`[data-menu="${menu}"]`));
  };
  const keepFocus = (event: Event) => {
    if (!focusMoved.current) return;
    focusMoved.current = false;
    event.preventDefault();
  };

  const go = WINDOWS.map((win) => (
    <Item key={win.id} onSelect={() => openWindow(win.id)}>
      {win.label}
    </Item>
  ));
  const power = (
    <>
      <Item onSelect={restart}>Restart</Item>
      <Item
        onSelect={() => {
          focusMoved.current = true;
          shutDown();
        }}
      >
        Shut Down
      </Item>
    </>
  );

  return (
    <header className={clsx(styles.menubar, 'pix')}>
      <Menubar.Root className={styles.menus} value={menu} onValueChange={setMenu} loop>
        <Menu
          value="hub"
          title={<PixelIcon name="hub" scale={2} />}
          label="Hub"
          onCloseAutoFocus={keepFocus}
        >
          <Item onSelect={() => openWindow('computer')}>About This Computer</Item>
          <Separator />
          {power}
          {pocket && <Separator />}
          {pocket && go}
        </Menu>
        {!pocket && (
          <>
            <Menu value="go" title="Go" className={styles.wide} onCloseAutoFocus={keepFocus}>
              {go}
            </Menu>
            <Menu value="view" title="View" className={styles.wide} onCloseAutoFocus={keepFocus}>
              {supported && (
                <>
                  <Item onSelect={togglePaused}>{paused ? 'Play scene' : 'Pause scene'}</Item>
                  <Separator />
                </>
              )}
              <Item onSelect={closeAll} disabled={topOpen(state) === null}>
                Close all windows
              </Item>
              <Item onSelect={cleanUp} disabled={!anyMoved(state)}>
                Clean up
              </Item>
            </Menu>
            <Menu
              value="special"
              title="Special"
              className={styles.wide}
              onCloseAutoFocus={keepFocus}
            >
              {power}
            </Menu>
            <Menu value="help" title="Help" className={styles.wide} onCloseAutoFocus={keepFocus}>
              <Item onSelect={() => openWindow(HELP_POST)}>How this site works</Item>
              <Item asChild>
                <a href={identity.source}>View source</a>
              </Item>
            </Menu>
          </>
        )}
      </Menubar.Root>
      <div className={styles.right}>
        <span className={styles.name}>{identity.name}</span>
        <Clock className={styles.clock} />
      </div>
    </header>
  );
}
