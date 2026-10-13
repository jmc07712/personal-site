import { format } from 'date-fns';
import { ImageResponse } from 'next/og';
import { getPost, postStaticParams } from '@/lib/posts';
import { CardWindow, fitSentences, Heading, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = 'A post by Jared Chester';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return postStaticParams();
}

/** A post's link preview: date, title and summary. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  const fonts = await ogFonts();
  return new ImageResponse(
    <CardWindow title={post ? `${post.slug}.txt` : 'writing'}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 26 }}>
          {post ? format(new Date(`${post.meta.date}T12:00:00Z`), 'MMMM d, yyyy') : ''}
        </div>
        <div style={{ display: 'flex', marginTop: 10 }}>
          <Heading size={92}>{post?.meta.title ?? 'Writing'}</Heading>
        </div>
        <div
          style={{ display: 'flex', fontSize: 32, lineHeight: 1.35, marginTop: 22, maxWidth: 980 }}
        >
          {post ? fitSentences(post.meta.summary, 180) : ''}
        </div>
        <div style={{ display: 'flex', fontSize: 26, marginTop: 'auto' }}>Jared Chester</div>
      </div>
    </CardWindow>,
    { ...size, fonts },
  );
}
