import { ImageResponse } from 'next/og';
import { HubGlyph, PAPER } from '@/lib/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon: the hub glyph on paper. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: PAPER,
      }}
    >
      <HubGlyph size={120} />
    </div>,
    size,
  );
}
