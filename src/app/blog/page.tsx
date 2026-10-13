import type { Metadata } from 'next';
import { DesktopPage } from '@/components/os/DesktopPage';

export const metadata: Metadata = {
  title: 'Writing',
  alternates: { canonical: '/blog', types: { 'application/rss+xml': '/feed.xml' } },
};

/** The desktop with the Writing window brought to the front. */
export default function BlogPage() {
  return <DesktopPage open={['writing']} />;
}
