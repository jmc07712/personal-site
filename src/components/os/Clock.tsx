'use client';

import { useSyncExternalStore } from 'react';

const format = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/** Re-renders at the top of every minute. */
function subscribe(onTick: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(
      () => {
        onTick();
        schedule();
      },
      60_000 - (Date.now() % 60_000) + 20,
    );
  };
  schedule();
  return () => clearTimeout(timer);
}

/** New York time. The server renders a placeholder so the markup never mismatches. */
export function Clock({ className }: { className?: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => format.format(new Date()),
    () => '--:--',
  );
  return (
    <span className={className}>
      <span aria-hidden="true">New York </span>
      <time aria-label={`Local time in New York, ${time}`}>{time}</time>
    </span>
  );
}
