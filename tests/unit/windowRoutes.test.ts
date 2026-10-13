import { describe, expect, it } from 'vitest';
import { pathForWindow, windowForPath } from '@/lib/windowRoutes';

describe('pathForWindow', () => {
  it('routes case files under /work', () =>
    expect(pathForWindow('case:pitching-agent')).toBe('/work/pitching-agent'));
  it('routes posts under /blog', () =>
    expect(pathForWindow('post:how-this-site-works')).toBe('/blog/how-this-site-works'));
  it('gives desktop windows no route of their own', () => {
    expect(pathForWindow('about')).toBeNull();
    expect(pathForWindow('writing')).toBeNull();
  });
});

describe('windowForPath', () => {
  it('maps /work/<slug> to its case file', () =>
    expect(windowForPath('/work/insights-api')).toBe('case:insights-api'));
  it('maps /blog/<slug> to its post', () =>
    expect(windowForPath('/blog/hello-world')).toBe('post:hello-world'));
  it('ignores a trailing slash', () =>
    expect(windowForPath('/work/insights-api/')).toBe('case:insights-api'));
  it('maps the desktop and the blog index to no routed window', () => {
    expect(windowForPath('/')).toBeNull();
    expect(windowForPath('/blog')).toBeNull();
  });
  it('rejects deeper or unknown paths', () => {
    expect(windowForPath('/work/a/b')).toBeNull();
    expect(windowForPath('/other/x')).toBeNull();
  });
  it('round-trips with pathForWindow', () =>
    expect(windowForPath(pathForWindow('case:identity-cache') ?? '')).toBe('case:identity-cache'));
});
