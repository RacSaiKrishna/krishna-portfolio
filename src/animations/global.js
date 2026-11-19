import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createStarfield } from "../lib/starfield.js";
import { q, qa } from "./shared.js";
import { sfx } from "../sound.js";

let stars = null; // one canvas renderer for the whole session

/**
 * Smooth scroll, starfield warp, progress bar, cursor glow and magnetic CTAs.
 */
export default function global({ isDesktop, reduceMotion }) {
  stars ??= createStarfield(q(".stars"));
  const offs = [];
  let lenis = null;

  // Scroll progress bar (all modes: it reports position, it does not decorate)
  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: reduceMotion ? true : 0.3 } });

  if (reduceMotion) {
    stars.still();
    return { stars, lenis, cleanup: () => {} };
  }

  // Lenis drives ScrollTrigger; GSAP's ticker drives Lenis.
  lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.16 }); // light glide, not floaty
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  offs.push(() => {
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  });

  // Star speed follows scroll velocity; it eases back by itself when scrolling stops.
  stars.start();
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const v = self.getVelocity();
      stars.setVelocity(v);
      sfx.setVelocity(v); // engine hum follows scroll speed
    },
  });
  offs.push(() => stars.stop());

  if (isDesktop) offs.push(cursorAndMagnets());

  return { stars, lenis, cleanup: () => offs.forEach((fn) => fn()) };
}

function cursorAndMagnets() {
  const glow = q(".cursor");
  gsap.set(glow, { opacity: 0 });
  const gx = gsap.quickTo(glow, "x", { duration: 0.7, ease: "power3" });
  const gy = gsap.quickTo(glow, "y", { duration: 0.7, ease: "power3" });
  let shown = false;

  const magnets = qa(".magnetic").map((el) => ({
    el,
    x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }),
    y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" }),
  }));

  const onMove = (e) => {
    gx(e.clientX); gy(e.clientY);
    if (!shown) { shown = true; gsap.to(glow, { opacity: 1, duration: 0.6 }); }
    for (const m of magnets) {
      const r = m.el.getBoundingClientRect();
      const ox = gsap.getProperty(m.el, "x"), oy = gsap.getProperty(m.el, "y");
      const cx = r.left - ox + r.width / 2, cy = r.top - oy + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const reach = 80 + Math.max(r.width, r.height) / 2;
      if (Math.hypot(dx, dy) < reach) { m.x(dx * 0.3); m.y(dy * 0.3); }
      else { m.x(0); m.y(0); }
    }
  };
  const onLeave = () => gsap.to(glow, { opacity: 0, duration: 0.4, onComplete: () => (shown = false) });

  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  return () => {
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
  };
}

/** Highlights the nav link of the section in view. Created last so pin spacing is known. */
export function navSpy() {
  for (const link of qa('.nav a[href^="#"]:not(.nav-mark)')) {
    const target = q(link.getAttribute("href"));
    if (!target) continue;
    ScrollTrigger.create({
      trigger: target,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => link.classList.toggle("is-active", self.isActive),
    });
  }
}
