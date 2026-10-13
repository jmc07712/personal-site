import type { MetadataRoute } from 'next';
import { caseFiles } from '@/content/caseFiles';
import { listPosts } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

/**
 * Every page a search engine should find. Only posts carry a lastModified date: reading the
 * clock for the others would stop Cache Components from prerendering this file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/blog`, priority: 0.7 },
    ...listPosts().map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.meta.date,
      priority: 0.6,
    })),
    ...caseFiles.map((file) => ({ url: `${SITE_URL}/work/${file.slug}`, priority: 0.8 })),
  ];
}
