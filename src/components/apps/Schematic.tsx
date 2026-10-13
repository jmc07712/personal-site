import type { Diagram } from '@/content/types';
import { layoutSchematic, SCHEMATIC_GRID, type RoutedEdge } from '@/lib/schematic';
import styles from './Schematic.module.css';

const PAD = 8;

/** Pixel arrowheads, drawn as a few 2px squares so they stay 1-bit. */
const ARROWS: Record<RoutedEdge['arrow'], string> = {
  right: 'M-6 -4h2v2h2v2h2v2h-2v2h-2v2h-2z',
  left: 'M6 -4h-2v2h-2v2h-2v2h2v2h2v2h2z',
  down: 'M-4 -6v2h2v2h2v2h2v-2h2v-2h2v-2z',
  up: 'M-4 6v-2h2v-2h2v-2h2v2h2v2h2v2z',
};

/** A case file's architecture, drawn in the site's two inks. */
export function Schematic({ diagram, title }: { diagram: Diagram; title: string }) {
  const layout = layoutSchematic(diagram, SCHEMATIC_GRID);
  const labels = new Map(diagram.nodes.map((n) => [n.id, n.label]));
  const description = diagram.edges
    .map((e) => `${labels.get(e.from)} to ${labels.get(e.to)}${e.label ? ` (${e.label})` : ''}`)
    .join('; ');

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.svg}
        width={layout.width + PAD * 2}
        height={layout.height + PAD * 2}
        viewBox={`${-PAD} ${-PAD} ${layout.width + PAD * 2} ${layout.height + PAD * 2}`}
        role="img"
        aria-label={`${title} architecture: ${description}.`}
        shapeRendering="crispEdges"
      >
        {layout.edges.map((edge) => (
          <g key={edge.d}>
            <path d={edge.d} className={styles.edge} />
            <path
              d={ARROWS[edge.arrow]}
              transform={`translate(${edge.tip.x} ${edge.tip.y})`}
              className={styles.arrow}
            />
            {edge.label && (
              <text
                x={edge.labelX}
                y={edge.labelY}
                className={styles.edgeLabel}
                textAnchor={edge.labelAnchor}
              >
                {edge.label}
              </text>
            )}
          </g>
        ))}
        {layout.nodes.map((node) => (
          <g key={node.id}>
            <rect x={node.x} y={node.y} width={node.w} height={node.h} className={styles.node} />
            <text
              x={node.x + node.w / 2}
              y={node.y + node.h / 2}
              className={styles.nodeLabel}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
