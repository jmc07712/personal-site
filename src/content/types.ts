/** A calendar month as `YYYY-MM`. */
export type YM = string;

export interface Metric {
  value: string;
  label: string;
}

/**
 * One span in the career trace. Roles and systems are bars; events (a degree)
 * are a single month. Spans nest through `parent`, like spans in a distributed trace.
 */
export type SpanKind = 'root' | 'role' | 'system' | 'event';

export interface Span {
  id: string;
  name: string;
  kind: SpanKind;
  parent?: string;
  from?: YM;
  to?: YM | 'now';
  at?: YM;
  /** Dates are approximate (shown as "approx." in the legend). */
  approx?: boolean;
  org?: string;
  title?: string;
  location?: string;
  summary: string;
  metrics: Metric[];
  stack?: string[];
}

export interface Product {
  id: string;
  name: string;
  url: string;
  source?: string;
  summary: string;
  highlights: string[];
  stack: string[];
}

/** What a box in a diagram is; each kind gets its own 1-bit badge. */
export type NodeKind = 'actor' | 'agent' | 'model' | 'service' | 'store' | 'doc';

/** A node in a case-file schematic, placed on a coarse grid. */
export interface DiagramNode {
  id: string;
  label: string;
  col: number;
  row: number;
  /** Width in grid columns (default 1). */
  w?: number;
  kind?: NodeKind;
}

/** A dashed boundary drawn around related nodes, such as the tools behind one gateway. */
export interface DiagramGroup {
  label: string;
  nodes: string[];
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface Diagram {
  cols: number;
  rows: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups?: DiagramGroup[];
}

export interface Decision {
  title: string;
  body: string;
}

/** The long-form story behind one span, opened from the Experience trace. */
export interface CaseFile {
  slug: string;
  spanId: string;
  title: string;
  role: string;
  when: string;
  summary: string;
  problem: string[];
  built: string[];
  diagram: Diagram;
  decisions: Decision[];
  impact: Metric[];
  stack: string[];
}
