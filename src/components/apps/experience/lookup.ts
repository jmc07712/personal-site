import { caseFiles } from '@/content/caseFiles';
import { spans } from '@/content/resume';
import type { CaseFile, Span } from '@/content/types';

const spansById = new Map(spans.map((s) => [s.id, s]));
const caseFilesBySpan = new Map(caseFiles.map((c) => [c.spanId, c]));

export function spanById(id: string): Span | undefined {
  return spansById.get(id);
}

export function caseFileForSpan(id: string): CaseFile | undefined {
  return caseFilesBySpan.get(id);
}

/** The first metric, phrased for a bar label: "5,000 sellers served". */
export function barLabel(span: Span | undefined): string | null {
  const metric = span?.metrics[0];
  return metric ? `${metric.value} ${metric.label}` : null;
}
