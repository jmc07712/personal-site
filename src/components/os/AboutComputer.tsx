import nextPackage from 'next/package.json';
import styles from './AboutComputer.module.css';
import { ComputerFacts } from './ComputerFacts';
import { PixelIcon } from './PixelIcon';
import { Window } from './Window';

/** About This Computer, from the hub menu: a small window about the machine running the site. */
export function AboutComputer() {
  return (
    <Window
      id="computer"
      title="About This Computer"
      icon="hub"
      variant="overlay"
      labelledBy="computer-name"
      className={styles.window}
    >
      <header className={styles.header}>
        <PixelIcon name="hub" scale={3} />
        <div>
          <h2 id="computer-name" className="pix">
            jaredmchester.com
          </h2>
          <p>Version 2, drawn in two inks.</p>
        </div>
      </header>
      <ComputerFacts nextVersion={nextPackage.version} />
    </Window>
  );
}
