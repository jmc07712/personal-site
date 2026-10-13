import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesktopPage } from '@/components/os/DesktopPage';
import { identity } from '@/content/resume';
import { getPost, postStaticParams } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

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
  const post = getPost(slug);
  if (!post) notFound();
  const article = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta.title,
    description: post.meta.summary,
    datePublished: post.meta.date,
    url: `${SITE_URL}/blog/${slug}`,
    author: { '@type': 'Person', name: identity.name, url: SITE_URL },
  };
  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so no string in the payload can close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, '\\u003c') }}
      />
      <DesktopPage open={[`post:${slug}`]} />
    </>
  );
}
