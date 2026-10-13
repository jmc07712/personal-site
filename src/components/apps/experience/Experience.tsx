'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { GpuRegion } from '@/components/gpu/GpuRegion';
import { useScene } from '@/components/gpu/SceneProvider';
import { useOnScreen } from '@/components/gpu/sceneHooks';
import { PixelIcon } from '@/components/os/PixelIcon';
import { useWindowManager } from '@/components/os/WindowManager';
import type { TraceView } from '@/lib/trace';
import { POCKET_QUERY, useMedia } from '@/lib/useMedia';
import { Inspector } from './Inspector';
import { caseFileForSpan } from './lookup';
import { TraceAccordion } from './TraceAccordion';
import { TraceWaterfall } from './TraceWaterfall';
import styles from './Experience.module.css';

interface ExperienceProps {
  trace: TraceView;
}

const DEFAULT_SELECTION = 'pitching-agent';

/** The Experience window: a trace waterfall on desktop, an accordion in Pocket mode. */
export function Experience({ trace }: ExperienceProps) {
  const [selected, setSelected] = useState(DEFAULT_SELECTION);
  const { open, state } = useWindowManager();
  const { setTraceVisible, supported } = useScene();
  const pocket = useMedia(POCKET_QUERY);
  const traceRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(traceRef, !pocket);

  // The particles pour into the role bars while the trace is open and on screen. The scene
  // decides when (the boot and the other windows get their turn); this only reports it.
  const traceVisible = Boolean(state.wins.experience?.open) && onScreen && !pocket;
  useEffect(() => {
    if (!traceVisible) return;
    setTraceVisible(true);
    return () => setTraceVisible(false);
  }, [traceVisible, setTraceVisible]);

  const openCase = (slug: string, opener: HTMLElement) => open(`case:${slug}`, opener);
  const activate = (id: string, row: HTMLElement) => {
    const caseFile = caseFileForSpan(id);
    if (caseFile) openCase(caseFile.slug, row);
  };
  const spanCount = trace.rows.length;

  return (
    <>
      <div className={styles.desktopView} ref={traceRef}>
        <div className={clsx(styles.toolbar, 'pix')}>
          <span className={styles.traceName}>career.trace</span>
          <span>{spanCount} spans, Sep 2018 to now</span>
          <span className={styles.legend} aria-hidden="true">
            <span>
              <i className={styles.swatchRole} />
              role
            </span>
            <span>
              <i className={styles.swatchSystem} />
              project
            </span>
            <span>
              <PixelIcon name="diamond" scale={1} />
              event
            </span>
          </span>
        </div>
        <div className={styles.grid}>
          <TraceWaterfall
            trace={trace}
            selected={selected}
            onSelect={setSelected}
            onActivate={activate}
            renderRoleBar={(id) => supported && <GpuRegion id={id} className={styles.gpuBar} />}
          />
          <Inspector row={trace.rows.find((r) => r.id === selected)} onOpenCase={openCase} />
        </div>
      </div>
      <div className={styles.pocketView}>
        <TraceAccordion trace={trace} onOpenCase={openCase} />
      </div>
    </>
  );
}

export function ExperienceStatus() {
  return (
    <>
      <span>Click a row for details</span>
      <span>Arrow keys to move, Enter to open</span>
    </>
  );
}
