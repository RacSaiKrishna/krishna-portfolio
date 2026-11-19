import { gsap } from "gsap";
import { q, qa, fillNumber } from "./shared.js";
import { sfx } from "../sound.js";

/**
 * Experience (flight path): the spine draws top to bottom with scroll; each stop's dot pops in
 * and its tile slides in from the right. The upcoming milestone keeps a slow pulse.
 */
export default function path({ reduceMotion }) {
  const section = q(".path");
  if (reduceMotion) return;

  gsap.fromTo(q(".path-line", section), { scaleY: 0 }, {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: q(".path-track", section), start: "top 70%", end: "bottom 70%", scrub: true },
  });

  for (const stop of qa(".stop", section)) {
    gsap.timeline({ scrollTrigger: { trigger: stop, start: "top 80%", toggleActions: "play none none reverse" } })
      .from(q(".stop-dot", stop), { scale: 0, duration: 0.4, ease: "back.out(2)" })
      .from(q(".stop-tile", stop), { x: 24, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.05)
      .call(() => sfx.blip(), null, 0);
  }

  // Education / certifications / toolkit columns rise in together.
  gsap.from(qa(".cred", section), {
    y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out",
    scrollTrigger: { trigger: q(".creds", section), start: "top 85%" },
  });

  gsap.fromTo(q(".stop-ring", section), { scale: 1, opacity: 0.8 }, { scale: 2.8, opacity: 0, duration: 1.8, repeat: -1, ease: "power2.out" });

  fillNumber(section);
}
