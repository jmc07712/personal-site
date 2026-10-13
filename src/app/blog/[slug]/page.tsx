import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesktopPage } from '@/components/os/DesktopPage';
import { getPost, postStaticParams } from '@/lib/posts';

export function generateStaticParams() {
  return postStaticParams();
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.meta.title,
      description: post.meta.summary,
      publishedTime: post.meta.date,
      url: `/blog/${post.slug}`,
    },
  };
}

/** The desktop with one post open in the reader. */
export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  if (!getPost(slug)) notFound();
  return <DesktopPage open={[`post:${slug}`]} />;
}
