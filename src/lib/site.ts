/**
 * The canonical origin for metadata, the sitemap and the RSS feed. Preview deployments keep
 * pointing search engines here, so only the custom domain is ever indexed.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jaredmchester.com';
