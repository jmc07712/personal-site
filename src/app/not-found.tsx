import clsx from 'clsx';
import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.window} aria-labelledby="not-found-title">
        <div className={clsx(styles.bar, 'pix')}>Error</div>
        <div className={styles.body}>
          <h1 className={clsx(styles.title, 'pix')} id="not-found-title">
            That file isn’t on this desktop
          </h1>
          <p>The link may be old, or the case file or post may have moved.</p>
          <Link className="btn pix" href="/">
            Go to the desktop
          </Link>
        </div>
      </section>
    </main>
  );
}
