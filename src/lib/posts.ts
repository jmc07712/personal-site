import { isValid } from 'date-fns';
import { Feed } from 'feed';
import type { ComponentType } from 'react';
import { postModules } from '@/content/posts';
import { identity } from '@/content/resume';

/** The `metadata` export every post in `src/content/posts/*.mdx` must provide. */
export interface PostMeta {
  title: string;
  /** Publication day as `YYYY-MM-DD`. */
  date: string;
  summary: string;
  tags: string[];
  /** Drafts stay out of production builds, the index, the sitemap and the feed. */
  draft?: boolean;
}

export interface PostEntry {
  slug: string;
  meta: PostMeta;
  Component: ComponentType;
}

/**
 * Stands in for the only `/blog/[slug]` param when nothing is published, because Cache
 * Components fails the build on an empty `generateStaticParams`. It names no post, so
 * `getPost` returns undefined for it and the page answers with `notFound()`.
 */
const NO_POSTS_PARAM = { slug: '__none__' };

/**
 * A post's day as UTC midnight, so feed dates don't shift with the build machine's timezone.
 * Returns undefined for malformed or impossible days (e.g. Feb 30, which `Date` rolls into March).
 */
function toUtcDay(date: string): Date | undefined {
  const parsed = new Date(`${date}T00:00:00Z`);
  const exact =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && isValid(parsed) && parsed.toISOString().startsWith(date);
  return exact ? parsed : undefined;
}

function parsePostDate(date: string): Date {
  const parsed = toUtcDay(date);
  if (parsed === undefined) throw new Error(`Expected a YYYY-MM-DD date, got "${date}"`);
  return parsed;
}

/**
 * Checks an MDX module's `metadata` export. MDX exports are untyped, so this is where a typo in
 * a post's front matter fails the build instead of rendering `undefined`.
 */
export function parsePostMeta(slug: string, raw: unknown): PostMeta {
  const fail = (problem: string): never => {
    throw new Error(`Post "${slug}": ${problem}`);
  };
  if (typeof raw !== 'object' || raw === null) return fail('missing `export const metadata`');

  const { title, date, summary, tags, draft } = raw as Record<string, unknown>;
  if (typeof title !== 'string') return fail('metadata.title must be a string');
  if (typeof summary !== 'string') return fail('metadata.summary must be a string');
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
    return fail('metadata.tags must be an array of strings');
  }
  if (draft !== undefined && typeof draft !== 'boolean') {
    return fail('metadata.draft must be a boolean');
  }
  if (typeof date !== 'string' || toUtcDay(date) === undefined) {
    return fail(`metadata.date must be a real YYYY-MM-DD day, got ${JSON.stringify(date)}`);
  }
  return { title, date, summary, tags, draft };
}

/**
 * Newest first, with drafts dropped unless asked for. `YYYY-MM-DD` strings sort chronologically;
 * ties break on slug so the order never depends on registry order.
 */
export function sortPublished<T extends { slug: string; meta: PostMeta }>(
  entries: readonly T[],
  includeDrafts: boolean,
): T[] {
  return entries
    .filter((entry) => includeDrafts || !entry.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.slug.localeCompare(b.slug));
}

/** The registry, checked once when this module loads. */
const allPosts: readonly PostEntry[] = Object.entries(postModules).map(([slug, mdx]) => ({
  slug,
  meta: parsePostMeta(slug, mdx.metadata),
  Component: mdx.default,
}));

/**
 * Posts for the index, newest first. Drafts are hidden unless `includeDrafts` is set or the
 * build runs with `INCLUDE_DRAFTS=1` (for previewing locally).
 */
export function listPosts(opts: { includeDrafts?: boolean } = {}): PostEntry[] {
  const includeDrafts = opts.includeDrafts === true || process.env.INCLUDE_DRAFTS === '1';
  return sortPublished(allPosts, includeDrafts);
}

/** A post by slug, under the same draft rules as the index, so a draft's URL 404s in production. */
export function getPost(slug: string): PostEntry | undefined {
  return listPosts().find((post) => post.slug === slug);
}

/** Params for `/blog/[slug]`: one per published post, or the placeholder when there are none. */
export function postStaticParams(): { slug: string }[] {
  const params = listPosts().map(({ slug }) => ({ slug }));
  return params.length > 0 ? params : [NO_POSTS_PARAM];
}

/**
 * The RSS 2.0 document served at `/feed.xml`. `lastBuildDate` comes from the newest post rather
 * than the clock (the `feed` default): reading the time would stop Cache Components from
 * prerendering the route.
 */
export function rssFeed(
  posts: readonly { slug: string; meta: PostMeta }[],
  siteUrl: string,
): string {
  const blogUrl = `${siteUrl}/blog`;
  const newest = posts.reduce<string | undefined>(
    (latest, { meta }) => (latest === undefined || meta.date > latest ? meta.date : latest),
    undefined,
  );
  const feed = new Feed({
    title: `${identity.name}, writing`,
    description: identity.positioning,
    link: blogUrl,
    language: 'en',
    feedLinks: { rss: `${siteUrl}/feed.xml` },
    // With nothing published the epoch keeps the document deterministic.
    updated: newest === undefined ? new Date(0) : parsePostDate(newest),
    generator: false,
  });

  for (const { slug, meta } of posts) {
    const url = `${blogUrl}/${slug}`;
    feed.addItem({
      title: meta.title,
      id: url,
      link: url,
      date: parsePostDate(meta.date),
      description: meta.summary,
      // `feed` only renders a channel author for podcasts, so the byline goes on each item.
      author: [{ name: identity.name }],
    });
  }
  return feed.rss2();
}
