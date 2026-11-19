/**
 * Full-screen starfield, two layers:
 *
 * 1. Backdrop: faint, still stars across the whole screen that only twinkle. They never
 *    move with scroll, so nothing streaks behind the text.
 * 2. Warp: brighter stars that live only in the side margins, outside the content column,
 *    and fade out before they reach it. Scroll speed (eased, capped) moves them and
 *    stretches them into short streaks: up when scrolling down, down when scrolling up.
 *
 * On narrow screens there is no margin, so only the still backdrop shows.
 */
const COLOURS = ["233,237,251", "233,237,251", "233,237,251", "233,237,251", "95,227,255", "95,227,255", "255,77,109"];
const CONTENT_MAX = 1240; // keep in sync with --max in base.css
const FADE = 70;          // px over which warp stars fade out toward the content column

export function createStarfield(canvas) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, colL = 0, colR = 0;
  let backdrop = [], warp = [];
  let raf = 0, running = false, last = 0;
  let target = 0;  // latest scroll velocity (px/s, signed)
  let vel = 0;     // eased velocity actually used
  let boost = 0;   // one-off bursts (px/s)

  const pick = () => COLOURS[(Math.random() * COLOURS.length) | 0];
  const gutter = () => (W >= 1200 ? 48 : W >= 768 ? 32 : 16);

  function spawnWarp(s, y) {
    // Choose a side, then a position inside that margin.
    const leftW = Math.max(0, colL - 8), rightW = Math.max(0, W - colR - 8);
    const left = Math.random() * (leftW + rightW) < leftW;
    s.x = left ? Math.random() * leftW : colR + 8 + Math.random() * rightW;
    s.y = y ?? Math.random() * H;
    s.z = 0.25 + Math.random() * 0.75; // depth: nearer stars move faster and glow brighter
    s.c = pick();
    return s;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const g = gutter();
    colL = Math.max(0, (W - CONTENT_MAX) / 2) + g - 12;
    colR = W - colL;

    const nb = Math.round(Math.min(220, Math.max(80, (W * H) / 9000)));
    backdrop = Array.from({ length: nb }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.4 + Math.random() * 0.9, a: 0.12 + Math.random() * 0.3, tw: Math.random() * 6.28, c: pick(),
    }));

    const marginArea = Math.max(0, colL - FADE) * 2 * H;
    const nw = Math.round(Math.min(110, marginArea / 3400));
    warp = Array.from({ length: nw }, () => spawnWarp({}));
  }

  function fadeFor(x) {
    const d = x < W / 2 ? colL - x : x - colR; // distance from the content column
    return Math.max(0, Math.min(1, d / FADE));
  }

  function draw(dt, time, still) {
    ctx.clearRect(0, 0, W, H);

    // Layer 1: still backdrop, gentle twinkle only.
    for (const s of backdrop) {
      const a = still ? s.a : s.a * (0.65 + 0.35 * Math.sin(time / 1400 + s.tw));
      ctx.fillStyle = `rgba(${s.c},${a})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    if (!warp.length) return;

    // Layer 2: warp stars in the margins.
    const v = still ? 0 : vel + boost;               // px/s, signed
    const drift = still ? 0 : 0.006 * dt;            // slow idle drift upward
    for (const s of warp) {
      const dy = -(v * dt / 1000) * s.z * 0.55 - drift * s.z;
      s.y += dy;
      if (s.y < -40) spawnWarp(s, H + 20);
      else if (s.y > H + 40) spawnWarp(s, -20);
      const f = fadeFor(s.x);
      if (f <= 0) continue;
      const a = (0.25 + s.z * 0.6) * f;
      const size = 0.6 + s.z * 1.3;
      const len = Math.min(50, Math.abs(dy) * 3.5);
      if (len > 2) {
        ctx.strokeStyle = `rgba(${s.c},${a})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y - Math.sign(dy) * len);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${s.c},${a})`;
        ctx.fillRect(s.x, s.y, size, size);
      }
    }
  }

  function loop(t) {
    const dt = Math.min(48, last ? t - last : 16);
    last = t;
    target *= 0.9;                   // scroll stopped -> target falls to zero
    vel += (target - vel) * 0.08;    // ease, so streaks never jump with a flick of the wheel
    boost *= 0.94;
    if (Math.abs(vel) < 1) vel = 0;
    if (boost < 1) boost = 0;
    draw(dt, t, false);
    raf = requestAnimationFrame(loop);
  }

  function onVisibility() {
    if (document.hidden) { cancelAnimationFrame(raf); last = 0; }
    else if (running) raf = requestAnimationFrame(loop);
  }

  function onResize() { resize(); if (!running) draw(0, 0, true); }

  resize();
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); },
    stop() { running = false; cancelAnimationFrame(raf); },
    still() { this.stop(); draw(0, 0, true); },
    /** Scroll velocity in px/s (signed). Capped so fast flicks stay calm. */
    setVelocity(v) { target = Math.max(-2400, Math.min(2400, v)); },
    /** A short push of speed, e.g. when the contact section arrives. */
    burst(amount = 900) { boost = Math.max(boost, amount); },
    destroy() {
      this.stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
