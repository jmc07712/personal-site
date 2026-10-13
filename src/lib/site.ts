import type { Metadata } from 'next';

/**
 * The canonical origin for metadata, the sitemap and the RSS feed. Preview deployments keep
 * pointing search engines here, so only the custom domain is ever indexed.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jaredmchester.com';

export const FEED_PATH = '/feed.xml';

/**
 * A page's canonical URL plus the RSS feed, so feed readers find it from any page. Next.js
 * replaces a parent's `alternates` rather than merging it, so every page sets both.
 */
export function alternates(path: string): Metadata['alternates'] {
  return { canonical: path, types: { 'application/rss+xml': FEED_PATH } };
}
