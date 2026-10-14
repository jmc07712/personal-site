import { bitmapPaths, BITMAPS } from '@/components/os/bitmaps';
import type { Diagram, NodeKind } from '@/content/types';
import { layoutSchematic, SCHEMATIC_GRID, type RoutedEdge } from '@/lib/schematic';
import styles from './Schematic.module.css';

const PAD = 8;
/** Label sizes in the diagram's own units, so they scale with the drawing rather than the rem. */
const NODE_FONT = 20;
const EDGE_FONT = 13;
const GROUP_FONT = 12;

/** Pixel arrowheads, drawn as a few 2px squares so they stay 1-bit. */
const ARROWS: Record<RoutedEdge['arrow'], string> = {
  right: 'M-6 -4h2v2h2v2h2v2h-2v2h-2v2h-2z',
  left: 'M6 -4h-2v2h-2v2h-2v2h2v2h2v2h2z',
  down: 'M-4 -6v2h2v2h2v2h2v-2h2v-2h2v-2z',
  up: 'M-4 6v-2h2v-2h2v-2h2v2h2v2h2v2z',
};

const KIND_LABELS: Record<NodeKind, string> = {
  actor: 'person',
  agent: 'agent',
  model: 'model',
  service: 'service',
  store: 'data store',
  doc: 'document',
};

/** Badge paths are the same for every node of a kind, so build them once. */
const BADGES = Object.fromEntries(
  (Object.keys(KIND_LABELS) as NodeKind[]).map((kind) => [
    kind,
    bitmapPaths(BITMAPS[kind === 'agent' ? 'hub' : kind]),
  ]),
) as Record<NodeKind, { ink: string; paper: string }>;

/** Staggers the packets so the edges don't pulse in step. */
const packetStart = (index: number) => `${((index * 0.37) % 2.4).toFixed(2)}s`;

function BadgePaths({ kind }: { kind: NodeKind }) {
  const { ink, paper } = BADGES[kind];
  return (
    <>
      {paper && <path d={paper} className={styles.badgePaper} />}
      <path d={ink} className={styles.badgeInk} />
    </>
  );
}

/** A case file's architecture, drawn in the site's two inks. */
export function Schematic({ diagram, title }: { diagram: Diagram; title: string }) {
  const layout = layoutSchematic(diagram, SCHEMATIC_GRID);
  const labels = new Map(diagram.nodes.map((n) => [n.id, n.label]));
  const description = diagram.edges
    .map((e) => `${labels.get(e.from)} to ${labels.get(e.to)}${e.label ? ` (${e.label})` : ''}`)
    .join(', ');
  const kinds = [...new Set(layout.nodes.flatMap((n) => (n.kind ? [n.kind] : [])))];
  const { x, y, w, h } = layout.bounds;
  const width = w + PAD * 2;
  const height = h + PAD * 2;

  return (
    // A wide diagram scrolls sideways on small screens, so it can take keyboard focus.
    <figure className={styles.figure} tabIndex={0}>
      <svg
        className={styles.svg}
        width={width}
        height={height}
        // Drawn in px at laptop size and scaled whole with the interface.
        style={{ width: `calc(${width}px * var(--ui))`, height: `calc(${height}px * var(--ui))` }}
        viewBox={`${x - PAD} ${y - PAD} ${width} ${height}`}
        role="img"
        aria-label={`Diagram of ${title}, showing ${description}.`}
        shapeRendering="crispEdges"
      >
        {layout.groups.map((group) => (
          <g key={group.label}>
            <rect
              x={group.x}
              y={group.y}
              width={group.w}
              height={group.h}
              className={styles.group}
            />
            <text
              x={group.x + 8}
              y={group.y + 13}
              className={styles.groupLabel}
              fontSize={GROUP_FONT}
            >
              {group.label}
            </text>
          </g>
        ))}
        {layout.edges.map((edge, i) => (
          <g key={edge.d}>
            <path d={edge.d} className={styles.edge} />
            <path
              d={ARROWS[edge.arrow]}
              transform={`translate(${edge.tip.x} ${edge.tip.y})`}
              className={styles.arrow}
            />
            {/* A packet travelling the edge in its direction of flow. */}
            {/* Hidden until its first run starts, so it never waits at the origin. */}
            <rect x={-2} y={-2} width={4} height={4} className={styles.packet} visibility="hidden">
              <set attributeName="visibility" to="visible" begin={packetStart(i)} />
              <animateMotion
                dur="2.4s"
                begin={packetStart(i)}
                repeatCount="indefinite"
                path={edge.d}
              />
            </rect>
            {edge.label && (
              <text
                x={edge.labelX}
                y={edge.labelY}
                className={styles.edgeLabel}
                fontSize={EDGE_FONT}
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
            {/* The badge sits on the box's top edge, like a tab, so it never crowds the label. */}
            {node.kind && (
              <g transform={`translate(${node.x + 8} ${node.y - 6})`}>
                <rect x={-2} y={-1} width={16} height={14} className={styles.badgePaper} />
                <BadgePaths kind={node.kind} />
              </g>
            )}
            <text
              x={node.x + node.w / 2}
              y={node.y + node.h / 2 + 2}
              className={styles.nodeLabel}
              fontSize={NODE_FONT}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      {kinds.length > 0 && (
        <figcaption className={styles.legend}>
          {kinds.map((kind) => (
            <span key={kind}>
              <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                <BadgePaths kind={kind} />
              </svg>
              {KIND_LABELS[kind]}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
