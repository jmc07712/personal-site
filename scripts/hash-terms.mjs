// Regenerates tests/unit/denylist.ts from a local, untracked term list (.denylist.local).
// Only SHA-256 hashes are committed, so the terms themselves never appear in the repo.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const terms = readFileSync('.denylist.local', 'utf8')
  .split('\n')
  .map((line) => line.trim().toLowerCase())
  .filter(Boolean);
const hashes = [...new Set(terms)]
  .map((term) => createHash('sha256').update(term).digest('hex'))
  .sort();

writeFileSync(
  'tests/unit/denylist.ts',
  `// SHA-256 of terms that must never appear in published content.\n` +
    `// Regenerate with \`node scripts/hash-terms.mjs\` from a local .denylist.local file.\n` +
    `export const DENYLIST = new Set<string>(${JSON.stringify(hashes, null, 2)});\n`,
);
console.log(`${hashes.length} hashes written to tests/unit/denylist.ts`);
