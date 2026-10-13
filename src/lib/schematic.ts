import type { Diagram, NodeKind } from '@/content/types';

export interface SchematicGrid {
  cellWidth: number;
  cellHeight: number;
  gapX: number;
  gapY: number;
}

/** Sized so a five-column diagram fits a case-file window at 1:1, keeping the pixel font crisp. */
export const SCHEMATIC_GRID: SchematicGrid = { cellWidth: 136, cellHeight: 44, gapX: 40, gapY: 24 };

interface Point {
  x: number;
  y: number;
}

export interface PlacedNode {
  id: string;
  label: string;
  kind?: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoutedEdge {
  /** The corners of the route; every segment is horizontal or vertical. */
  points: Point[];
  /** The same route as an SVG path, crisp at 1px because it never runs diagonally. */
  d: string;
  arrow: 'right' | 'left' | 'down' | 'up';
  /** Where the path ends, which is where the arrowhead is drawn. */
  tip: Point;
  label?: string;
  labelX: number;
  labelY: number;
  labelAnchor: 'start' | 'end';
}

export interface PlacedGroup {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SchematicLayout {
  width: number;
  height: number;
  nodes: PlacedNode[];
  edges: RoutedEdge[];
  groups: PlacedGroup[];
  /** Everything drawn, groups included, for the SVG viewBox. */
  bounds: { x: number; y: number; w: number; h: number };
}

/** Space between a group's boundary and its members, plus room above them for its label. */
const GROUP_PAD = 12;
const GROUP_LABEL = 16;

function toPath(points: Point[]): string {
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = points[i - 1];
      return prev && prev.y === p.y ? `H${p.x}` : `V${p.y}`;
    })
    .join('');
}

/**
 * Turns a case file's grid diagram into pixel positions. Edges between columns leave the
 * source's side and enter the target's side with one elbow halfway across the gap; edges in
 * the same column run straight up or down.
 */
export function layoutSchematic(diagram: Diagram, grid: SchematicGrid): SchematicLayout {
  const { cellWidth, cellHeight, gapX, gapY } = grid;
  const nodes = diagram.nodes.map((n) => {
    const span = n.w ?? 1;
    return {
      id: n.id,
      label: n.label,
      kind: n.kind,
      x: n.col * (cellWidth + gapX),
      y: n.row * (cellHeight + gapY),
      w: span * cellWidth + (span - 1) * gapX,
      h: cellHeight,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const find = (id: string) => {
    const node = byId.get(id);
    if (!node) throw new Error(`Diagram edge points at unknown node "${id}"`);
    return node;
  };

  const edges = diagram.edges.map((edge): RoutedEdge => {
    const a = find(edge.from);
    const b = find(edge.to);
    const sameColumn = a.x === b.x;
    if (sameColumn) {
      const down = b.y > a.y;
      const x = a.x + a.w / 2;
      const y1 = down ? a.y + a.h : a.y;
      const y2 = down ? b.y : b.y + b.h;
      const points = [
        { x, y: y1 },
        { x, y: y2 },
      ];
      return {
        points,
        d: toPath(points),
        arrow: down ? 'down' : 'up',
        tip: { x, y: y2 },
        label: edge.label,
        labelX: x + 6,
        labelY: (y1 + y2) / 2,
        labelAnchor: 'start',
      };
    }
    const right = b.x > a.x;
    const x1 = right ? a.x + a.w : a.x;
    const x2 = right ? b.x : b.x + b.w;
    const y1 = a.y + a.h / 2;
    const y2 = b.y + b.h / 2;
    const elbow = (x1 + x2) / 2;
    const points =
      y1 === y2
        ? [
            { x: x1, y: y1 },
            { x: x2, y: y2 },
          ]
        : [
            { x: x1, y: y1 },
            { x: elbow, y: y1 },
            { x: elbow, y: y2 },
            { x: x2, y: y2 },
          ];
    return {
      points,
      d: toPath(points),
      arrow: right ? 'right' : 'left',
      tip: { x: x2, y: y2 },
      label: edge.label,
      // Just above the segment entering the target, ending short of the arrowhead.
      labelX: right ? x2 - 10 : x2 + 10,
      labelY: y2 - 6,
      labelAnchor: right ? 'end' : 'start',
    };
  });

  const groups = (diagram.groups ?? []).map((group): PlacedGroup => {
    const members = group.nodes.map(find);
    const x0 = Math.min(...members.map((n) => n.x));
    const y0 = Math.min(...members.map((n) => n.y));
    const x1 = Math.max(...members.map((n) => n.x + n.w));
    const y1 = Math.max(...members.map((n) => n.y + n.h));
    return {
      label: group.label,
      x: x0 - GROUP_PAD,
      y: y0 - GROUP_PAD - GROUP_LABEL,
      w: x1 - x0 + GROUP_PAD * 2,
      h: y1 - y0 + GROUP_PAD * 2 + GROUP_LABEL,
    };
  });

  const width = diagram.cols * cellWidth + (diagram.cols - 1) * gapX;
  const height = diagram.rows * cellHeight + (diagram.rows - 1) * gapY;
  const boxes = [{ x: 0, y: 0, w: width, h: height }, ...groups];
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { width, height, nodes, edges, groups, bounds: { x, y, w: right - x, h: bottom - y } };
}
