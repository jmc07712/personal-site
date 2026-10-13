import { ImageResponse } from 'next/og';
import { identity } from '@/content/resume';
import { CardWindow, Heading, hubArt, Metric, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = `${identity.name}, ${identity.title.toLowerCase()} at ${identity.employer}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

/** The link preview for the home page: name, role, three numbers, and the dithered agent. */
export default async function Image() {
  const [fonts, hub] = await Promise.all([ogFonts(), hubArt()]);
  return new ImageResponse(
    <CardWindow title="about.txt">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Heading size={112}>{identity.name}</Heading>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 500, marginTop: 18 }}>
          Senior software engineer at {identity.employer}
        </div>
        <div style={{ display: 'flex', fontSize: 28, marginTop: 6 }}>
          AI agents and large-scale data systems
        </div>
        <div style={{ display: 'flex', gap: 36, marginTop: 'auto' }}>
          <Metric value="5,000" label="sellers use the Pitching Agent" />
          <Metric value="1.2B" label="records a month via the Insights API" />
        </div>
      </div>
      <img src={hub} width={440} height={380} alt="" style={{ alignSelf: 'center' }} />
    </CardWindow>,
    { ...size, fonts },
  );
}
