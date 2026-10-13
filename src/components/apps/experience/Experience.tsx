'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { PixelIcon } from '@/components/os/PixelIcon';
import { useWindowManager } from '@/components/os/WindowManager';
import type { TraceView } from '@/lib/trace';
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
  const { open } = useWindowManager();
  const openCase = (slug: string, opener: HTMLElement) => open(`case:${slug}`, opener);
  const activate = (id: string, row: HTMLElement) => {
    const caseFile = caseFileForSpan(id);
    if (caseFile) openCase(caseFile.slug, row);
  };
  const spanCount = trace.rows.length;

  return (
    <>
      <div className={styles.desktopView}>
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
              system I built
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
      <span>Select a span to see its numbers</span>
      <span>Arrow keys move, Enter opens the case file</span>
    </>
  );
}
