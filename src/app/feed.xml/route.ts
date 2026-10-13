import { listPosts, rssFeed } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

/**
 * RSS 2.0 for the blog. Under Cache Components a GET handler is prerendered at build time as
 * long as it reads no request data, uncached IO or the clock, so this takes no `request` and
 * the feed's dates come from the posts.
 */
export function GET(): Response {
  return new Response(rssFeed(listPosts(), SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
