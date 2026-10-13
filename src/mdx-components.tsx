import { clsx } from 'clsx';
import type { MDXComponents } from 'mdx/types';

/** Absolute http(s) URLs leave the site; everything else (paths, anchors, mailto) stays. */
function isExternal(href: string | undefined): boolean {
  return href !== undefined && /^https?:\/\//i.test(href);
}

/**
 * Markdown elements in posts, as plain semantic HTML with `post-*` class hooks for styling.
 * Props are passed through untouched because rehype-pretty-code puts `data-*` attributes and
 * inline token styles on `pre` and `code`.
 */
const components = {
  h2: ({ className, ...props }) => <h2 className={clsx('post-h2', className)} {...props} />,
  h3: ({ className, ...props }) => <h3 className={clsx('post-h3', className)} {...props} />,
  p: ({ className, ...props }) => <p className={clsx('post-p', className)} {...props} />,
  a: ({ className, href, ...props }) => (
    <a
      className={clsx('post-a', className)}
      href={href}
      // noreferrer (which implies noopener) keeps readers' paths through the site private.
      rel={isExternal(href) ? 'noreferrer' : undefined}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => <ul className={clsx('post-ul', className)} {...props} />,
  ol: ({ className, ...props }) => <ol className={clsx('post-ol', className)} {...props} />,
  li: ({ className, ...props }) => <li className={clsx('post-li', className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote className={clsx('post-blockquote', className)} {...props} />
  ),
  code: ({ className, ...props }) => <code className={clsx('post-code', className)} {...props} />,
  pre: ({ className, ...props }) => <pre className={clsx('post-pre', className)} {...props} />,
  hr: ({ className, ...props }) => <hr className={clsx('post-hr', className)} {...props} />,
} satisfies MDXComponents;

/** Required by `@next/mdx` in the App Router; applies to every MDX file. */
export function useMDXComponents(): MDXComponents {
  return components;
}
