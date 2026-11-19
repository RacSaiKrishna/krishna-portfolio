/**
 * Ion-blue wireframe planet with an orbiting satellite and the KR monogram.
 * Shown in the hero frame until a talking video is supplied.
 */
export function createPlanet(canvas) {
  const ctx = canvas.getContext("2d");
  let GW = 0, GH = 0, raf = 0, running = false, visible = true;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    GW = r.width; GH = r.height;
    canvas.width = Math.round(GW * dpr);
    canvas.height = Math.round(GH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, GW, GH);
    const cx = GW / 2, cy = GH * 0.48, R = Math.min(GW, GH) * 0.33, rot = time / 6000, tilt = 0.42;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.lineWidth = 1;

    for (let m = 0; m < 12; m++) {
      const ph = rot + (m * Math.PI) / 12;
      ctx.beginPath();
      for (let k = 0; k <= 48; k++) {
        const th = -Math.PI / 2 + (k * Math.PI) / 48;
        const x3 = Math.cos(th) * Math.sin(ph), y3 = Math.sin(th), z3 = Math.cos(th) * Math.cos(ph);
        const X = cx + x3 * R, Y = cy + (y3 * ct - z3 * st) * R;
        k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.strokeStyle = "rgba(95,227,255,.28)";
      ctx.stroke();
    }
    for (let p = 1; p < 8; p++) {
      const lat = -Math.PI / 2 + (p * Math.PI) / 8;
      ctx.beginPath();
      for (let j = 0; j <= 64; j++) {
        const lo = (j * Math.PI * 2) / 64;
        const a3 = Math.cos(lat) * Math.sin(lo), b3 = Math.sin(lat), c3 = Math.cos(lat) * Math.cos(lo);
        const X = cx + a3 * R, Y = cy + (b3 * ct - c3 * st) * R;
        j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.strokeStyle = "rgba(95,227,255,.16)";
      ctx.stroke();
    }

    const oa = time / 2000;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.34, R * 0.34, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,77,109,.38)";
    ctx.stroke();
    const front = Math.sin(oa) > 0;
    const sx = cx + Math.cos(oa) * R * 1.34, sy = cy + Math.sin(oa) * R * 0.34;
    // Halo drawn as a soft disc (cheaper than canvas shadowBlur every frame).
    ctx.beginPath();
    ctx.arc(sx, sy, front ? 10 : 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,77,109,.2)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, front ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4d6d";
    ctx.fill();

    ctx.font = `800 ${Math.round(R * 0.5)}px Unbounded, "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(233,237,251,.94)";
    ctx.fillText("KR", cx, cy);
  }

  function loop(t) { draw(t); raf = requestAnimationFrame(loop); }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!running) return;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  });
  io.observe(canvas);

  function onResize() { size(); if (!running) draw(0); }
  size();
  window.addEventListener("resize", onResize);
  if (document.fonts) document.fonts.ready.then(() => { if (!running) draw(0); });

  return {
    start() { if (running) return; running = true; if (visible) raf = requestAnimationFrame(loop); },
    still() { running = false; cancelAnimationFrame(raf); draw(0); },
    destroy() { running = false; cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); },
  };
}
