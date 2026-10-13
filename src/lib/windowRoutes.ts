/**
 * Case files and blog posts are windows that also own a URL. These two functions are the
 * only place that knows the mapping, so the window manager and the routes can't drift apart.
 */
const ROUTES = [
  { prefix: 'case:', base: '/work' },
  { prefix: 'post:', base: '/blog' },
] as const;

export function pathForWindow(id: string): string | null {
  const route = ROUTES.find((r) => id.startsWith(r.prefix));
  return route ? `${route.base}/${id.slice(route.prefix.length)}` : null;
}

export function windowForPath(pathname: string): string | null {
  const [base, slug, ...rest] = pathname.replace(/\/+$/, '').split('/').slice(1);
  if (!slug || rest.length > 0) return null;
  const route = ROUTES.find((r) => r.base === `/${base}`);
  return route ? `${route.prefix}${slug}` : null;
}
