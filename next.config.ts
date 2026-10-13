import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Don't have `next dev` write an AGENTS.md into the repo.
  agentRules: false,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

/**
 * A one-ink Shiki theme for a 1-bit site: every token is `currentColor`, so code inherits
 * whichever ink its block is set in, and syntax is carried by slant and weight alone.
 */
const oneBitTheme = {
  name: 'one-bit',
  type: 'light',
  colors: { 'editor.foreground': 'currentColor' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { fontStyle: 'italic' } },
    {
      scope: ['keyword.control', 'storage.type', 'storage.modifier'],
      settings: { fontStyle: 'bold' },
    },
  ],
};

const withMDX = createMDX({
  // Match `pageExtensions`: by default only `.mdx` goes through the MDX loader.
  extension: /\.mdx?$/,
  options: {
    // Turbopack passes loader options to Rust, so plugins are named by string with
    // JSON-serializable options. The background is left to CSS (a dither).
    rehypePlugins: [['rehype-pretty-code', { theme: oneBitTheme, keepBackground: false }]],
  },
});

export default withMDX(nextConfig);
