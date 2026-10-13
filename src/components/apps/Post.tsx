import clsx from 'clsx';
import { format } from 'date-fns';
import type { PostEntry } from '@/lib/posts';
import './post.css';

/** A post in the reader window: title, date, then the MDX body at a comfortable measure. */
export function Post({ post }: { post: PostEntry }) {
  const { slug, meta, Component } = post;
  const headingId = `post-${slug}`;
  return (
    <article className="post" aria-labelledby={headingId}>
      <header>
        <time className={clsx('post-date', 'pix')} dateTime={meta.date}>
          {format(new Date(`${meta.date}T12:00:00Z`), 'MMMM d, yyyy')}
        </time>
        <h2 className={clsx('post-title', 'pix')} id={headingId}>
          {meta.title}
        </h2>
        <p className="post-summary">{meta.summary}</p>
      </header>
      <Component />
    </article>
  );
}
