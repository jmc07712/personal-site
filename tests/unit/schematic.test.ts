import { describe, expect, it } from 'vitest';
import { caseFiles } from '@/content/caseFiles';
import { layoutSchematic, SCHEMATIC_GRID } from '@/lib/schematic';

const grid = { cellWidth: 100, cellHeight: 40, gapX: 40, gapY: 20 };

describe('layoutSchematic', () => {
  const layout = layoutSchematic(
    {
      cols: 3,
      rows: 2,
      nodes: [
        { id: 'a', label: 'A', col: 0, row: 0 },
        { id: 'b', label: 'B', col: 2, row: 1, w: 1 },
        { id: 'c', label: 'C', col: 2, row: 0 },
      ],
      edges: [
        { from: 'a', to: 'b', label: 'calls' },
        { from: 'c', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    },
    grid,
  );

  it('sizes the drawing to the grid', () => {
    expect(layout.width).toBe(3 * 100 + 2 * 40);
    expect(layout.height).toBe(2 * 40 + 1 * 20);
  });

  it('places nodes on their cells', () =>
    expect(layout.nodes.find((n) => n.id === 'b')).toMatchObject({ x: 280, y: 60, w: 100, h: 40 }));

  it('routes a forward edge from the right side to the left side with one elbow', () => {
    const edge = layout.edges[0]!;
    expect(edge.d).toBe('M100 20H190V80H280');
    expect(edge.arrow).toBe('right');
    expect(edge.tip).toEqual({ x: 280, y: 80 });
    expect(edge.label).toBe('calls');
  });

  it('routes a same-column edge vertically, downwards or upwards', () => {
    expect(layout.edges[1]).toMatchObject({
      d: 'M330 40V60',
      arrow: 'down',
      tip: { x: 330, y: 60 },
    });
    expect(layout.edges[2]).toMatchObject({ d: 'M330 60V40', arrow: 'up', tip: { x: 330, y: 40 } });
  });

  it('rejects edges to unknown nodes', () =>
    expect(() =>
      layoutSchematic(
        {
          cols: 1,
          rows: 1,
          nodes: [{ id: 'a', label: 'A', col: 0, row: 0 }],
          edges: [{ from: 'a', to: 'z' }],
        },
        grid,
      ),
    ).toThrow(/z/));
});

describe('case-file diagrams', () => {
  type Rect = { x: number; y: number; w: number; h: number };
  // Does an axis-aligned segment pass through the inside of a box?
  const crosses = (a: { x: number; y: number }, b: { x: number; y: number }, r: Rect) => {
    const [x1, x2] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
    const [y1, y2] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
    return x1 < r.x + r.w && x2 > r.x && y1 < r.y + r.h && y2 > r.y;
  };

  for (const file of caseFiles) {
    it(`${file.slug}: no edge passes through a box it doesn't connect`, () => {
      const layout = layoutSchematic(file.diagram, SCHEMATIC_GRID);
      const hits: string[] = [];
      file.diagram.edges.forEach((edge, i) => {
        const points = layout.edges[i]!.points;
        for (const node of layout.nodes) {
          if (node.id === edge.from || node.id === edge.to) continue;
          for (let p = 1; p < points.length; p++) {
            if (crosses(points[p - 1]!, points[p]!, node))
              hits.push(`${edge.from}→${edge.to} crosses ${node.id}`);
          }
        }
      });
      expect(hits).toEqual([]);
    });
  }
});
