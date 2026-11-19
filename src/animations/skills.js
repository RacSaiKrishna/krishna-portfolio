import { gsap } from "gsap";
import { q, qa, fillNumber } from "./shared.js";
import { sfx } from "../sound.js";

/**
 * Orbit of five disciplines around one core.
 * Desktop: section pins ~90vh. Each step turns the orbit so the active node faces
 * the panel, draws a ray from the core to it, lights it, pulses the core and
 * crossfades the description.
 * Mobile: orbit turns slowly on its own; the list reveals in sequence.
 */
export default function skills({ isDesktop, isMobile, reduceMotion }) {
  const section = q(".skills");
  if (reduceMotion) return;

  const spin = q(".orbit-spin", section);
  const ring = q(".orbit-ring", section);
  const core = q(".orbit-core", section);
  const nodes = qa(".orbit-node", section);
  const angles = nodes.map((n) => parseFloat(n.style.getPropertyValue("--a")) || 0);
  const rays = nodes.map((n) => q(".orbit-ray", n));
  const labels = nodes.map((n) => q(".orbit-label", n));
  const lits = nodes.map((n) => q(".orbit-lit", n));
  const items = qa(".skill", section);

  // Labels stay upright: counter-rotate against their node angle and the spin.
  const upright = (spinDeg) => labels.forEach((l, i) => gsap.set(l, { rotation: -(angles[i] + spinDeg) }));
  gsap.set(labels, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

  if (isDesktop) {
    section.classList.add("is-stepper");
    const facing = (i) => 90 - angles[i]; // brings node i to 3 o'clock, toward the panel

    gsap.set(spin, { rotation: facing(0) });
    gsap.set(ring, { rotation: facing(0) });
    upright(facing(0));
    gsap.set(rays, { scaleY: 0 });
    gsap.set(rays[0], { scaleY: 1 });
    gsap.set(lits, { opacity: 0 });
    gsap.set(lits[0], { opacity: 1 });
    gsap.set(items, { opacity: 0, y: 20 });
    gsap.set(items[0], { opacity: 1, y: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=90%",
        pin: true,
        scrub: 0.35,
        snap: { snapTo: "labels", duration: { min: 0.15, max: 0.4 }, delay: 0.05, ease: "power1.inOut" },
      },
    });
    tl.addLabel("s0");
    const turn = { deg: facing(0) };
    for (let i = 1; i < nodes.length; i++) {
      const at = i - 1;
      tl.to(turn, {
        deg: facing(i),
        duration: 1,
        onUpdate: () => {
          gsap.set([spin, ring], { rotation: turn.deg });
          upright(turn.deg);
        },
      }, at)
        .to(rays[i - 1], { scaleY: 0, duration: 0.3, ease: "power2.in" }, at)
        .to(lits[i - 1], { opacity: 0, duration: 0.25 }, at)
        .to(items[i - 1], { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" }, at)
        .to(rays[i], { scaleY: 1, duration: 0.45, ease: "power2.out" }, at + 0.5)
        .to(lits[i], { opacity: 1, duration: 0.25 }, at + 0.6)
        .fromTo(items[i], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, at + 0.55)
        .fromTo(core, { scale: 1 }, { scale: 1.1, duration: 0.18, yoyo: true, repeat: 1, ease: "power1.inOut" }, at + 0.6)
        .call(() => sfx.ping(i), null, at + 0.6)
        .addLabel("s" + i, at + 1);
    }
    tl.to({}, { duration: 0.3 }); // short hold on the last step before the pin releases

    fillNumber(section);
    return () => section.classList.remove("is-stepper");
  }

  if (isMobile) {
    const turn = { deg: 0 };
    upright(0);
    gsap.to(turn, {
      deg: 360,
      duration: 70,
      repeat: -1,
      ease: "none",
      onUpdate: () => { gsap.set([spin, ring], { rotation: turn.deg }); upright(turn.deg); },
    });
    gsap.from(rays, { scaleY: 0, duration: 0.6, stagger: 0.12, ease: "power2.out", scrollTrigger: { trigger: ".orbit", start: "top 75%" } });
    gsap.from(items, { y: 28, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".skill-list", start: "top 85%" } });
    fillNumber(section);
  }
}
