import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPost,
  listPosts,
  parsePostMeta,
  postStaticParams,
  rssFeed,
  sortPublished,
  type PostMeta,
} from '@/lib/posts';

// The real registry imports compiled MDX, which Vitest doesn't transform. Stand in a single
// draft, which is the site's actual state until the first post ships.
vi.mock('@/content/posts', () => ({
  postModules: {
    'hello-world': {
      default: () => null,
      metadata: {
        title: 'Hello, world',
        date: '2026-10-12',
        summary: 'A test post.',
        tags: ['meta'],
        draft: true,
      },
    },
  },
}));

const SITE = 'https://example.test';

function post(slug: string, date: string, meta: Partial<PostMeta> = {}) {
  return {
    slug,
    meta: { title: `Post ${slug}`, date, summary: `About ${slug}.`, tags: [], ...meta },
  };
}

/** `<` or `&` outside CDATA that doesn't open a tag or an entity, i.e. would break the XML. */
function bareMarkup(xml: string): string[] {
  const outsideCdata = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  return outsideCdata.match(/<(?![A-Za-z/?!])|&(?!(?:[a-z]+|#\d+);)/g) ?? [];
}

// A developer's shell may export INCLUDE_DRAFTS; every test starts from production behaviour.
beforeEach(() => vi.stubEnv('INCLUDE_DRAFTS', ''));

describe('sortPublished', () => {
  const entries = [
    post('b', '2026-03-01'),
    post('a', '2026-01-05'),
    post('draft', '2026-06-01', { draft: true }),
    post('c', '2026-03-01'),
  ];

  it('lists posts newest first, breaking date ties by slug', () =>
    expect(sortPublished(entries, false).map((p) => p.slug)).toEqual(['b', 'c', 'a']));

  it('includes drafts only when asked', () =>
    expect(sortPublished(entries, true).map((p) => p.slug)).toEqual(['draft', 'b', 'c', 'a']));
});

describe('listPosts and getPost', () => {
  it('hide drafts by default', () => {
    expect(listPosts()).toEqual([]);
    expect(getPost('hello-world')).toBeUndefined();
  });

  it('show drafts with includeDrafts', () =>
    expect(listPosts({ includeDrafts: true }).map((p) => p.slug)).toEqual(['hello-world']));

  it('show drafts with INCLUDE_DRAFTS=1', () => {
    vi.stubEnv('INCLUDE_DRAFTS', '1');
    expect(listPosts().map((p) => p.slug)).toEqual(['hello-world']);
    expect(getPost('hello-world')?.meta.title).toBe('Hello, world');
  });
});

describe('postStaticParams', () => {
  it('returns a placeholder when nothing is published', () =>
    expect(postStaticParams()).toEqual([{ slug: '__none__' }]));

  it('returns one param per published post', () => {
    vi.stubEnv('INCLUDE_DRAFTS', '1');
    expect(postStaticParams()).toEqual([{ slug: 'hello-world' }]);
  });
});

describe('parsePostMeta', () => {
  const valid = { title: 'T', date: '2026-10-12', summary: 'S', tags: ['meta'] };

  it('accepts well-formed metadata', () => expect(parsePostMeta('ok', valid)).toEqual(valid));

  it.each([
    ['a missing export', undefined],
    ['a missing title', { ...valid, title: undefined }],
    ['a malformed date', { ...valid, date: '2026-1-5' }],
    ['an impossible date', { ...valid, date: '2026-02-30' }],
    ['non-string tags', { ...valid, tags: [1] }],
    ['a non-boolean draft flag', { ...valid, draft: 'yes' }],
  ])('rejects %s, naming the post', (_, raw) =>
    expect(() => parsePostMeta('bad', raw)).toThrow(/"bad"/),
  );
});

describe('rssFeed', () => {
  const xml = rssFeed(
    [post('older', '2026-01-05'), post('hello', '2026-10-12', { title: 'Q&A: when a < b' })],
    SITE,
  );

  it('describes the blog as RSS 2.0', () => {
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>Jared Chester, writing</title>');
    expect(xml).toContain(`<link>${SITE}/blog</link>`);
  });

  it('links each item to its post and uses the summary as its description', () => {
    expect(xml).toContain(`<link>${SITE}/blog/hello</link>`);
    expect(xml).toContain(`<link>${SITE}/blog/older</link>`);
    expect(xml).toContain('<![CDATA[About hello.]]>');
    expect(xml).toContain('<author>Jared Chester</author>');
  });

  it('dates items at UTC midnight', () =>
    expect(xml).toContain('<pubDate>Mon, 12 Oct 2026 00:00:00 GMT</pubDate>'));

  it('takes lastBuildDate from the newest post, not the clock, so the route can prerender', () =>
    expect(xml).toContain('<lastBuildDate>Mon, 12 Oct 2026 00:00:00 GMT</lastBuildDate>'));

  it('escapes & and < in titles', () => {
    expect(xml).toContain('<title><![CDATA[Q&A: when a < b]]></title>');
    expect(bareMarkup(xml)).toEqual([]);
  });
});
