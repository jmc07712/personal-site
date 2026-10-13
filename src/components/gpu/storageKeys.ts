/**
 * Browser storage keys the scene uses. They live in their own module, free of React, so the
 * server-rendered boot curtain script can share them with the client-side scene provider.
 */
export const PAUSED_KEY = 'scene-paused';
export const BOOTED_KEY = 'booted';
