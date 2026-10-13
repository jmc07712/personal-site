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
            Page not found
          </h1>
          <p>The link may be out of date.</p>
          <Link className="btn pix" href="/">
            Go to the home page
          </Link>
        </div>
      </section>
    </main>
  );
}
