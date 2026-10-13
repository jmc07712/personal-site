import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesktopPage } from '@/components/os/DesktopPage';
import { caseFileBySlug, caseFiles } from '@/content/caseFiles';
import { alternates } from '@/lib/site';

export function generateStaticParams() {
  return caseFiles.map((file) => ({ slug: file.slug }));
}

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>): Promise<Metadata> {
  const file = caseFileBySlug((await params).slug);
  if (!file) return {};
  return {
    title: file.title,
    description: file.summary,
    alternates: alternates(`/work/${file.slug}`),
    openGraph: { title: file.title, description: file.summary, url: `/work/${file.slug}` },
  };
}

/** The desktop with one case file open, so a shared link lands on the story it points to. */
export default async function CaseFilePage({ params }: PageProps<'/work/[slug]'>) {
  const { slug } = await params;
  if (!caseFileBySlug(slug)) notFound();
  return <DesktopPage open={[`case:${slug}`]} />;
}
