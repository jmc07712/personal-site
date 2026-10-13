/**
 * Link-preview cards (Open Graph images) and the app icon, drawn with next/og at build time in
 * the site's two inks. The fonts come from Fontsource's .woff files because the image renderer
 * can't read .woff2.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { BITMAPS, bitmapPaths } from '@/components/os/bitmaps';

export const OG_SIZE = { width: 1200, height: 630 };
export const PAPER = '#C9CEBB';
export const INK = '#262E1B';
const CHROME = 'Jersey 10';
const BODY = 'Atkinson Hyperlegible Next';

const fontFile = (pkg: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));

/**
 * Font bytes as base64. Cached so the card routes prerender at build time instead of reading
 * files per request; strings survive the cache round trip intact, typed arrays don't.
 */
async function fontData(): Promise<[string, string, string]> {
  'use cache';
  const files = await Promise.all([
    fontFile('jersey-10', 'jersey-10-latin-400-normal.woff'),
    fontFile('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-400-normal.woff'),
    fontFile('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-500-normal.woff'),
  ]);
  const [chrome = '', body = '', bodyMedium = ''] = files.map((f) => f.toString('base64'));
  return [chrome, body, bodyMedium];
}

function toArrayBuffer(base64: string): ArrayBuffer {
  const bytes = Buffer.from(base64, 'base64');
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function ogFonts() {
  const [chrome, body, bodyMedium] = await fontData();
  return [
    { name: CHROME, data: toArrayBuffer(chrome), weight: 400 as const, style: 'normal' as const },
    { name: BODY, data: toArrayBuffer(body), weight: 400 as const, style: 'normal' as const },
    { name: BODY, data: toArrayBuffer(bodyMedium), weight: 500 as const, style: 'normal' as const },
  ];
}

/** The dithered agent hub, cropped from a capture of the live scene. */
export async function hubArt(): Promise<string> {
  'use cache';
  const data = await readFile(join(process.cwd(), 'assets/og-hub.png'), 'base64');
  return `data:image/png;base64,${data}`;
}

/** The menubar's hub glyph as crisp pixels, for icons. */
export function HubGlyph({ size }: { size: number }) {
  const { ink } = bitmapPaths(BITMAPS.hub);
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges">
      <path d={ink} fill={INK} />
    </svg>
  );
}

/** A 1-bit window: ink title bar with the file name, the site on the right, a hard shadow. */
export function CardWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '40px 52px 52px 40px',
        background: PAPER,
        color: INK,
        fontFamily: BODY,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          border: `3px solid ${INK}`,
          boxShadow: `12px 12px 0 ${INK}`,
          background: PAPER,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 52,
            padding: '0 20px',
            background: INK,
            color: PAPER,
            fontFamily: CHROME,
            fontSize: 30,
          }}
        >
          <span>{title}</span>
          <span style={{ marginLeft: 'auto' }}>jaredmchester.com</span>
        </div>
        <div style={{ display: 'flex', flex: 1, padding: '36px 44px' }}>{children}</div>
      </div>
    </div>
  );
}

export function Heading({ children, size }: { children: ReactNode; size: number }) {
  return (
    <div style={{ display: 'flex', fontFamily: CHROME, fontSize: size, lineHeight: 0.95 }}>
      {children}
    </div>
  );
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 260 }}>
      <span style={{ fontFamily: CHROME, fontSize: 56, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 20, lineHeight: 1.3, marginTop: 6 }}>{label}</span>
    </div>
  );
}

/** Trims to whole sentences that fit, so a summary never ends mid-word on a card. */
export function fitSentences(text: string, max: number): string {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  return out.trim() || `${text.slice(0, max - 1).trimEnd()}…`;
}
