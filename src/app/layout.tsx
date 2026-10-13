import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Jersey_10 } from 'next/font/google';
import { identity } from '@/content/resume';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const chrome = Jersey_10({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-chrome',
});

const body = Atkinson_Hyperlegible_Next({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${identity.name}, ${identity.title.toLowerCase()}`,
    template: `%s | ${identity.name}`,
  },
  description: identity.positioning,
  authors: [{ name: identity.name, url: SITE_URL }],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: identity.name, url: '/' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#c9cebb',
  viewportFit: 'cover',
};

/** Structured data so search engines can connect the site to the person and their profiles. */
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: identity.name,
  jobTitle: identity.title,
  worksFor: { '@type': 'Organization', name: 'Amazon' },
  url: SITE_URL,
  sameAs: [identity.github, identity.linkedin],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${chrome.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#about">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          // Escape "<" so no string in the payload can close the script tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
