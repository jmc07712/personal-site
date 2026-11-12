import type { MDXModule } from 'mdx/types';
import * as howThisSiteWorks from './how-this-site-works.mdx';
import * as forwardDeployedEngineering from './forward-deployed-engineering.mdx';
import * as evalsAsAProductLoop from './evals-as-a-product-loop.mdx';

/**
 * Every post, keyed by slug (its file name). To add one, import its module and list it here.
 *
 * Posts are imported as whole modules because `@types/mdx` only types the default export.
 * `lib/posts.ts` validates each `metadata` export and exposes typed, draft-aware accessors;
 * read posts through those, never from this map.
 */
export const postModules: Readonly<Record<string, MDXModule>> = {
  'how-this-site-works': howThisSiteWorks,
  'forward-deployed-engineering': forwardDeployedEngineering,
  'evals-as-a-product-loop': evalsAsAProductLoop,
};
