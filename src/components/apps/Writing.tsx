import clsx from 'clsx';
import { format } from 'date-fns';
import type { PostEntry } from '@/lib/posts';
import { OpenWindowButton } from './OpenWindowButton';
import styles from './Writing.module.css';

/** The blog index: newest first, each post opens in a reader window with its own URL. */
export function Writing({ posts }: { posts: PostEntry[] }) {
  if (posts.length === 0) {
    return <p className={styles.empty}>No posts yet.</p>;
  }
  return (
    <ol className={styles.list}>
      {posts.map(({ slug, meta }) => (
        <li key={slug} className={styles.item}>
          <time className={clsx(styles.date, 'pix')} dateTime={meta.date}>
            {format(new Date(`${meta.date}T12:00:00Z`), 'MMM d, yyyy')}
          </time>
          <div>
            <h3 className={clsx(styles.title, 'pix')}>
              <OpenWindowButton window={`post:${slug}`} className={styles.open}>
                {meta.title}
              </OpenWindowButton>
            </h3>
            <p className={styles.summary}>{meta.summary}</p>
            <a className={clsx(styles.permalink, 'pix')} href={`/blog/${slug}`}>
              /blog/{slug}
            </a>
          </div>
        </li>
      ))}
    </ol>
  );
}
