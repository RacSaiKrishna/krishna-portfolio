import { gsap } from "gsap";
import { sfx } from "../sound.js";

export const q = (sel, root = document) => root.querySelector(sel);
export const qa = (sel, root = document) => gsap.utils.toArray(sel, root);

/**
 * Section number: outline only, then the solid fill rises through it as the
 * number crosses the middle of the viewport (scrubbed, clip-path only).
 */
export function fillNumber(section) {
  const fill = q(".num-fill", section);
  if (!fill) return;
  gsap.fromTo(
    fill,
    { clipPath: "inset(100% 0% 0% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: { trigger: fill, start: "top 72%", end: "bottom 42%", scrub: true, onEnter: () => sfx.scan() },
    }
  );
}
