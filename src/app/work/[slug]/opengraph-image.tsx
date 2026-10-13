import { ImageResponse } from 'next/og';
import { caseFileBySlug, caseFiles } from '@/content/caseFiles';
import { CardWindow, fitSentences, Heading, Metric, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = 'A case file from Jared Chester’s portfolio';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return caseFiles.map((file) => ({ slug: file.slug }));
}

/** A case file's link preview: its title, what it is, and its two headline numbers. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const file = caseFileBySlug((await params).slug);
  const fonts = await ogFonts();
  return new ImageResponse(
    <CardWindow title={file ? `${file.slug}.case` : 'case file'}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 26 }}>
          {file ? `${file.role}, ${file.when}` : ''}
        </div>
        <div style={{ display: 'flex', marginTop: 10 }}>
          <Heading size={84}>{file?.title ?? 'Case file'}</Heading>
        </div>
        <div
          style={{ display: 'flex', fontSize: 30, lineHeight: 1.35, marginTop: 18, maxWidth: 980 }}
        >
          {file ? fitSentences(file.summary, 170) : ''}
        </div>
        <div style={{ display: 'flex', gap: 48, marginTop: 'auto' }}>
          {file?.impact.slice(0, 3).map((metric) => (
            <Metric key={metric.label} value={metric.value} label={metric.label} />
          ))}
        </div>
      </div>
    </CardWindow>,
    { ...size, fonts },
  );
}
