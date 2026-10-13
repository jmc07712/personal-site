import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { caseFiles } from '@/content/caseFiles';
import * as resume from '@/content/resume';
import { DENYLIST } from './denylist';

/** Every string in the published content, wherever it is nested. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object')
    Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

const strings = collectStrings([resume, caseFiles]);
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Lowercase words plus every 2- and 3-word phrase, with hyphenated words also joined. */
function grams(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  return [
    ...words,
    ...words.map((w) => w.replace(/-/g, '')),
    ...words.slice(1).map((w, i) => `${words[i]} ${w}`),
    ...words.slice(2).map((w, i) => `${words[i]} ${words[i + 1]} ${w}`),
  ];
}

describe('confidentiality', () => {
  it('publishes no denylisted internal names', () => {
    const hits = strings.flatMap((s) =>
      grams(s)
        .filter((g) => DENYLIST.has(sha256(g)))
        .map((g) => `"${g}" in "${s.slice(0, 60)}…"`),
    );
    expect(hits).toEqual([]);
  });

  it('publishes no phone number', () => {
    for (const s of strings) {
      // Any formatted number, plus the owner's own number (hashed in the denylist) unformatted.
      expect(s).not.toMatch(/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/);
      const digits = s.replace(/\D/g, '');
      for (let i = 0; i + 10 <= digits.length; i++) {
        expect(DENYLIST.has(sha256(digits.slice(i, i + 10)))).toBe(false);
      }
    }
  });
});

describe('copy', () => {
  // Words and constructions that make writing read as generated filler.
  const SLOP = [
    /\bleverag/i,
    /\butiliz/i,
    /\bspearhead/i,
    /\bdelv/i,
    /\bempower/i,
    /\bunlock/i,
    /\bharness/i,
    /\belevat/i,
    /\bseamless/i,
    /\brobust/i,
    /\bcutting[- ]edge/i,
    /\bstate[- ]of[- ]the[- ]art/i,
    /\binnovative/i,
    /\bpassionate/i,
    /\bworld[- ]class/i,
    /\bgame[- ]chang/i,
    /\btransformative/i,
    /\bsynerg/i,
    /\btapestry/i,
    /\blandscape\b/i,
    /\bjourney\b/i,
    /\bin today['’]?s\b/i,
    /\bnot just\b.*\bbut\b/i,
    /\bit['’]?s not\b.*\bit['’]?s\b/i,
    /—/,
  ];

  it('avoids filler words and constructions', () => {
    const hits = strings.flatMap((s) =>
      SLOP.filter((re) => re.test(s)).map((re) => `${re} in "${s.slice(0, 60)}…"`),
    );
    expect(hits).toEqual([]);
  });
});

describe('structure', () => {
  it('has unique case-file slugs', () => {
    const slugs = caseFiles.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has a case file for every system span', () => {
    const systems = resume.spans.filter((s) => s.kind === 'system').map((s) => s.id);
    const covered = new Set(caseFiles.map((c) => c.spanId));
    expect(systems.filter((id) => !covered.has(id))).toEqual([]);
  });

  it('only links case files to real spans', () => {
    const ids = new Set(resume.spans.map((s) => s.id));
    expect(caseFiles.filter((c) => !ids.has(c.spanId)).map((c) => c.slug)).toEqual([]);
  });

  it('keeps diagram node labels short enough to fit their box', () => {
    const long = caseFiles.flatMap((c) =>
      c.diagram.nodes.filter((n) => n.label.length > 14).map((n) => `${c.slug}: ${n.label}`),
    );
    expect(long).toEqual([]);
  });

  it('draws diagram edges between existing nodes inside the grid', () => {
    for (const c of caseFiles) {
      const ids = new Set(c.diagram.nodes.map((n) => n.id));
      for (const e of c.diagram.edges) {
        expect(ids.has(e.from), `${c.slug}: ${e.from}`).toBe(true);
        expect(ids.has(e.to), `${c.slug}: ${e.to}`).toBe(true);
      }
      for (const n of c.diagram.nodes) {
        expect(n.col + (n.w ?? 1) <= c.diagram.cols, `${c.slug}: ${n.id} col`).toBe(true);
        expect(n.row < c.diagram.rows, `${c.slug}: ${n.id} row`).toBe(true);
      }
    }
  });
});
