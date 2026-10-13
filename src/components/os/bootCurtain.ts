import { BOOTED_KEY, PAUSED_KEY } from '@/components/gpu/storageKeys';
import { POCKET_MAX_WIDTH } from '@/components/gpu/sizing';

/** While this class is on <html>, the hero's windows wait for the boot to finish. */
export const BOOTING_CLASS = 'booting';

/** If anything goes wrong, the hero never stays hidden longer than this. */
const CURTAIN_TIMEOUT_MS = 8000;

/**
 * An inline script that runs before first paint and hides the hero only when the boot is going
 * to play: on desktop, with motion allowed, not already seen this session, not paused. It uses
 * the same keys as the scene provider so the two can't disagree. Phones never hide content.
 */
export function bootCurtainScript(): string {
  return `(function () {
  try {
    if (!matchMedia('(min-width: ${POCKET_MAX_WIDTH + 1}px)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (navigator.connection && navigator.connection.saveData) return;
    if (sessionStorage.getItem(${JSON.stringify(BOOTED_KEY)}) === '1') return;
    if (localStorage.getItem(${JSON.stringify(PAUSED_KEY)}) === '1') return;
    var root = document.documentElement;
    root.classList.add(${JSON.stringify(BOOTING_CLASS)});
    setTimeout(function () { root.classList.remove(${JSON.stringify(BOOTING_CLASS)}); }, ${CURTAIN_TIMEOUT_MS});
  } catch (e) {}
})();`;
}
