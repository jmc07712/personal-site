/**
 * The canonical origin for metadata, the sitemap and the RSS feed. Set NEXT_PUBLIC_SITE_URL
 * in Vercel once a custom domain is attached; until then it is the Vercel production URL.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://personal-site.vercel.app';
