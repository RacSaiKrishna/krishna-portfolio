import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { q, fillNumber } from "./shared.js";
import { sfx } from "../sound.js";

/**
 * Flipping ID card. One source of truth: the card shows either its front or its back,
 * and every flip animates to exactly 0° or 180°, so it can never stop edge-on.
 *  - Scroll: once the card passes the middle of the screen it turns to the back;
 *    scrolling back up turns it to the front again.
 *  - Flip button or a click/tap on the card: toggles front/back at any time.
 *  - Desktop: the card also tilts gently toward the pointer.
 * No JS: both faces sit side by side, nothing moves.
 */
export default function identity({ isDesktop, reduceMotion }) {
  const section = q(".identity");
  if (reduceMotion) return;

  const stage = q(".id-stage", section);
  const tilt = q(".id-tilt", section);
  const card = q(".id-card", section);
  const btn = q(".id-flip", section);

  stage.classList.add("is-3d");
  btn.hidden = false;

  // Entrance: card lifts out of the dark, tipped back.
  gsap.from(tilt, {
    y: 60,
    rotationX: 18,
    opacity: 0,
    ease: "power2.out",
    scrollTrigger: { trigger: stage, start: "top 95%", end: "top 45%", scrub: 0.6 },
  });

  let showingBack = false;
  const show = (back, withSound = true) => {
    if (back === showingBack) return;
    showingBack = back;
    btn.setAttribute("aria-pressed", String(back));
    btn.textContent = back ? "Show front" : "Show back";
    if (withSound) sfx.whoosh();
    gsap.to(card, {
      rotationY: back ? 180 : 0,
      duration: 0.8,
      ease: "power3.inOut",
      keyframes: { rotationX: [0, -4, 0] },
      overwrite: true,
    });
  };
  btn.textContent = "Show back";

  // Scroll: flip to the back past the middle of the screen, to the front when scrolling back.
  ScrollTrigger.create({
    trigger: stage,
    start: "center 55%",
    onEnter: () => show(true),
    onLeaveBack: () => show(false),
  });

  const onFlip = () => show(!showingBack);
  btn.addEventListener("click", onFlip);
  card.addEventListener("click", onFlip);
  card.style.cursor = "pointer";

  // Pointer tilt, desktop only (max ~5°), on a separate wrapper so it never fights the flip.
  let onMove, onLeave;
  if (isDesktop) {
    const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3" });
    const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3" });
    onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 10); rx(-py * 10);
    };
    onLeave = () => { rx(0); ry(0); };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
  }

  fillNumber(section);

  return () => {
    stage.classList.remove("is-3d");
    btn.hidden = true;
    btn.textContent = "Flip card";
    btn.setAttribute("aria-pressed", "false");
    btn.removeEventListener("click", onFlip);
    card.removeEventListener("click", onFlip);
    card.style.cursor = "";
    if (onMove) {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    }
  };
}
