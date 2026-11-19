/**
 * Owner decision (2026-11-18): motion is ALWAYS ON, even when the operating system asks
 * for reduced motion. The reduced-motion context still exists in every animation module;
 * set MOTION_ALWAYS_ON to false to honour the OS setting again.
 */
export const MOTION_ALWAYS_ON = true;

export function reduced() {
  if (MOTION_ALWAYS_ON) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
