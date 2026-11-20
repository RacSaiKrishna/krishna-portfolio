/**
 * Sound on the first scroll, on phones (owner request, 2026-11-20).
 *
 * Phone browsers only allow sound after a press, and they do not count a scroll as one: when a
 * swipe turns into native scrolling the browser fires pointercancel, and lifting the finger
 * grants nothing. So for the first vertical swipe only, this script moves the page itself (the
 * swipe's touchmove is cancelled). The browser then sees a plain touch, and lifting the finger
 * is a real press: src/sound.js and src/media.js unlock audio and the voiceover on that touchend.
 * A short glide follows the release, like native momentum. As soon as audio is running, the
 * listeners are removed and every later swipe is ordinary native scrolling.
 */
import { soundEnabled, soundRunning } from "../sound.js";

export function firstSwipeUnlocksSound() {
  if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

  let x0 = 0, y0 = 0, from = 0, mode = null, samples = [], glide = 0;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const to = (y) => window.scrollTo(0, Math.max(0, Math.min(maxY(), y)));

  const stopGlide = () => { cancelAnimationFrame(glide); glide = 0; };
  const startGlide = (v) => { // v in px per ms, positive = down the page
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(32, now - last); last = now;
      to(window.scrollY + v * dt);
      v *= Math.pow(0.95, dt / 16);
      glide = Math.abs(v) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    glide = requestAnimationFrame(step);
  };

  const opts = { capture: true, passive: true };
  const moveOpts = { capture: true, passive: false }; // must be able to cancel native scrolling
  const done = () => soundRunning() || !soundEnabled();
  const remove = () => {
    document.removeEventListener("touchstart", onStart, opts);
    document.removeEventListener("touchmove", onMove, moveOpts);
    document.removeEventListener("touchend", onEnd, opts);
    document.removeEventListener("touchcancel", onEnd, opts);
  };

  function onStart(e) {
    if (done()) return remove();
    stopGlide();
    mode = null;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    x0 = t.clientX; y0 = t.clientY; from = window.scrollY;
    samples = [[t.clientY, e.timeStamp]];
  }
  function onMove(e) {
    if (mode === "native" || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (!mode) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; // still a tap
      mode = Math.abs(dy) >= Math.abs(dx) ? "ours" : "native"; // sideways swipes stay native
      if (mode === "native") return;
    }
    if (e.cancelable) e.preventDefault();
    to(from - dy);
    samples.push([t.clientY, e.timeStamp]);
    if (samples.length > 5) samples.shift();
  }
  function onEnd(e) {
    if (mode !== "ours") return;
    mode = null;
    const [a, b] = [samples[0], samples[samples.length - 1]];
    const dt = b[1] - a[1];
    if (e.type === "touchend" && dt > 0) startGlide((a[0] - b[0]) / dt);
    setTimeout(() => { if (done()) remove(); }, 300); // audio unlocked by this lift: back to native
  }

  document.addEventListener("touchstart", onStart, opts);
  document.addEventListener("touchmove", onMove, moveOpts);
  document.addEventListener("touchend", onEnd, opts);
  document.addEventListener("touchcancel", onEnd, opts);
}
