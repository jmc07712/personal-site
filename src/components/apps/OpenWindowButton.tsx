'use client';

import type { ReactNode } from 'react';
import { useWindowManager } from '@/components/os/WindowManager';

interface OpenWindowButtonProps {
  window: string;
  className?: string;
  variant?: 'solid';
  children: ReactNode;
}

/** A button that opens a desktop window. Lets server-rendered content trigger the client OS. */
export function OpenWindowButton({ window, className, variant, children }: OpenWindowButtonProps) {
  const { open } = useWindowManager();
  return (
    <button
      type="button"
      className={className}
      data-variant={variant}
      data-opens={window}
      onClick={(e) => open(window, e.currentTarget)}
    >
      {children}
    </button>
  );
}
