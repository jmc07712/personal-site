import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Don't have `next dev` write an AGENTS.md into the repo.
  agentRules: false,
};

export default nextConfig;
