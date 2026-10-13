import type { Metadata } from 'next';
import { DesktopPage } from '@/components/os/DesktopPage';
import { alternates } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Writing',
  alternates: alternates('/blog'),
};

/** The desktop with the Writing window brought to the front. */
export default function BlogPage() {
  return <DesktopPage open={['writing']} />;
}
