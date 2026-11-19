/**
 * Sci-fi interface sounds, synthesised live with the Web Audio API (no audio files).
 *
 * Sound is ON by default. The audio engine is started as soon as the page loads, so browsers
 * that permit autoplay (Safari/Firefox with autoplay allowed, Chrome on sites with high media
 * engagement) play sound with no interaction at all. Elsewhere the browser keeps audio
 * suspended until the visitor's first interaction (key press, mouse press, or the end of a
 * touch/swipe; mouse-wheel scrolling alone does not count), and it resumes right then.
 * Until audio is running every call is a silent no-op.
 * The nav "Sound" switch mutes everything and is remembered in localStorage ("kr-sound").
 *
 *   select()  clicks on links and buttons       blip()   small UI blips (timeline stops, record cards)
 *   tick()    clicks anywhere else              ping(n)  orbit steps (pitch rises with n)
 *   scan()    a section number comes into view  whoosh() ID card flips
 *   warp()    the contact section's star burst  setVelocity(v)  scrolling = throttle: engine revs (src/lib/motor.js) + air
 *
 * UI sounds are sine/filtered-noise based and quiet on purpose; repeats are rate-limited so
 * fast scrolling never piles sounds on top of each other.
 */
import { createMotor } from "./lib/motor.js";

const KEY = "kr-sound";
const LEVEL = 0.42; // master volume when on

let ctx = null;
let master = null;
let fx = null;      // shared space echo
let noise = null;   // white-noise buffer
let air = null;     // { gain, filter } breeze that follows scroll speed
let motor = null;   // engine that revs with scroll speed
const lastPlayed = {}; // per-sound rate limit
let ducked = false;
let enabled = (() => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } })();

const ready = () => ctx && ctx.state === "running" && enabled;

function boot() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = enabled ? LEVEL : 0;
    master.connect(comp).connect(ctx.destination);

    // A short feedback delay gives blips a "space" tail.
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.16;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    delay.connect(lp).connect(fb).connect(delay);
    lp.connect(wet).connect(master);
    fx = delay;

    const len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    air = makeAir();
    motor = createMotor(ctx, master, noise);
    motor.setLevel(ducked ? 0.15 : 1);
  }
  if (ctx.state === "suspended") ctx.resume();
}

function out(node, send = 0.5) {
  node.connect(master);
  if (send) { const s = ctx.createGain(); s.gain.value = send; node.connect(s).connect(fx); }
}

function tone({ type = "sine", from, to = from, dur = 0.12, vol = 0.2, at = 0, send = 0.4 }) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); out(g, send);
  o.start(t); o.stop(t + dur + 0.05);
}

function hiss({ from = 400, to = 3000, dur = 0.4, vol = 0.18, q = 1.2, at = 0, send = 0.3 }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = q;
  bp.frequency.setValueAtTime(from, t);
  bp.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g); out(g, send);
  src.start(t); src.stop(t + dur + 0.05);
}

/** Looping filtered noise: a soft "air past the hull" sound, silent until scrolling. */
function makeAir() {
  const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 700; filter.Q.value = 0.6;
  const soften = ctx.createBiquadFilter(); soften.type = "lowpass"; soften.frequency.value = 1800;
  const gain = ctx.createGain(); gain.gain.value = 0;
  src.connect(filter).connect(soften).connect(gain).connect(master);
  src.start();
  return { gain, filter };
}

const play = (fn, gap = 0.07, name = fn) => (...args) => {
  if (!ready()) return;
  const t = ctx.currentTime;
  if (lastPlayed[name] && t - lastPlayed[name] < gap) return; // rate limit
  lastPlayed[name] = t;
  fn(...args);
};

export const sfx = {
  // Soft two-note chime (sine only, gentle attack).
  select: play(() => {
    tone({ type: "sine", from: 1046.5, dur: 0.16, vol: 0.07, send: 0.45 });
    tone({ type: "sine", from: 1568, dur: 0.22, vol: 0.05, at: 0.06, send: 0.55 });
  }, 0.08, "select"),
  tick: play(() => tone({ type: "sine", from: 1800, to: 1500, dur: 0.05, vol: 0.025, send: 0.2 }), 0.08, "tick"),
  blip: play(() => tone({ type: "sine", from: 880, to: 990, dur: 0.09, vol: 0.035, send: 0.4 }), 0.15, "blip"),
  ping: play((n = 0) => {
    const base = 523.25 * Math.pow(2, [0, 2, 4, 7, 9][n % 5] / 12);
    tone({ type: "sine", from: base, dur: 0.7, vol: 0.06, send: 0.7 });
  }, 0.2, "ping"),
  scan: play(() => {
    tone({ type: "sine", from: 330, to: 990, dur: 0.45, vol: 0.03, send: 0.6 });
    hiss({ from: 1200, to: 3800, dur: 0.45, vol: 0.02, q: 2 });
  }, 0.5, "scan"),
  whoosh: play(() => hiss({ from: 400, to: 1800, dur: 0.6, vol: 0.08, q: 0.8, send: 0.2 }), 0.4, "whoosh"),
  warp: play(() => {
    tone({ type: "sine", from: 110, to: 660, dur: 1.4, vol: 0.05, send: 0.7 });
    hiss({ from: 300, to: 3000, dur: 1.3, vol: 0.05, q: 0.7 });
  }, 2, "warp"),
  /**
   * Scroll speed in px/s is the throttle: the engine revs, shifts gears on long fast
   * scrolls and fades out after you stop; the airy whoosh rides on top.
   */
  setVelocity(v) {
    if (!ready() || !air || !motor) return;
    motor.drive(v);
    const k = Math.max(0, Math.min(1, (Math.abs(v) - 300) / 3200));
    const t = ctx.currentTime;
    const hush = ducked ? 0.15 : 1;
    const ramp = (param, to, rise, rest, fall) => {
      param.cancelScheduledValues(t);
      param.setTargetAtTime(to, t, rise);
      param.setTargetAtTime(rest, t + 0.25, fall); // settle once scroll events stop arriving
    };
    ramp(air.gain.gain, 0.0153 * k * hush, 0.12, 0, 0.4);
    ramp(air.filter.frequency, 600 + k * 600, 0.15, 600, 0.45);
  },
  /** Quieter effects while the intro video is talking. */
  duck(on) {
    ducked = on;
    motor?.setLevel(on ? 0.15 : 1);
    if (ctx && master) master.gain.setTargetAtTime(enabled ? (on ? LEVEL * 0.35 : LEVEL) : 0, ctx.currentTime, 0.1);
  },
};

/**
 * Create the audio engine straight away. Where autoplay is allowed it simply runs; where it
 * is not, it waits suspended and the first interaction resumes it. Browsers that can tell us
 * the policy up front (navigator.getAutoplayPolicy) skip the attempt when it would be refused.
 */
function tryAutostart() {
  try {
    const policy = navigator.getAutoplayPolicy?.("audiocontext");
    if (policy === "disallowed") return;
  } catch (e) { /* older browsers: just try */ }
  boot();
}

export function soundEnabled() { return enabled; }

export function setSound(on) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* private mode */ }
  boot();
  if (master) master.gain.setTargetAtTime(on ? (ducked ? LEVEL * 0.35 : LEVEL) : 0, ctx.currentTime, 0.05);
}

/** Starts audio as early as the browser allows and voices every click. */
export function initSound() {
  // Build the audio engine only after the page has loaded and the browser is idle,
  // so it never competes with first paint.
  if (enabled) {
    const later = () => (window.requestIdleCallback ? requestIdleCallback(tryAutostart, { timeout: 2500 }) : setTimeout(tryAutostart, 1200));
    document.readyState === "complete" ? later() : window.addEventListener("load", later, { once: true });
  }

  // Every interaction browsers accept as permission to play audio.
  const unlock = () => { if (enabled) boot(); };
  for (const type of ["pointerdown", "pointerup", "mousedown", "touchend", "keydown"]) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
  document.addEventListener("click", (e) => {
    boot();
    // Let a just-resumed context start before voicing the click.
    const voice = () => (e.target.closest("a, button, [role='button'], summary") ? sfx.select() : sfx.tick());
    ctx && ctx.state !== "running" ? ctx.resume().then(voice) : voice();
  }, { capture: true });
}
