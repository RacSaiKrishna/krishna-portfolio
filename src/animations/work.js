import { gsap } from "gsap";
import { q, qa, fillNumber } from "./shared.js";

/**
 * Atharvionics tree: the root node rises in, then the branches are drawn
 * downward from it (clip-path scrubbed to scroll), each leaf lifting in as
 * the reveal reaches it.
 */
export default function work({ reduceMotion, isMobile }) {
  const section = q(".work");
  if (reduceMotion) return;

  const root = q(".tree-root", section);
  const branches = q(".branches", section);

  gsap.from(root, {
    y: isMobile ? 16 : 24,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: root, start: "top 85%" },
  });

  gsap.fromTo(
    branches,
    { clipPath: "inset(0% 0% 100% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: { trigger: branches, start: "top 80%", end: isMobile ? "bottom 85%" : "bottom 75%", scrub: 0.6 },
    }
  );

  for (const leaf of qa(".leaf", section)) {
    gsap.from(leaf.children, {
      y: isMobile ? 10 : 14,
      opacity: 0,
      duration: 0.6,
      stagger: 0.06,
      ease: "power3.out",
      scrollTrigger: { trigger: leaf, start: "top 85%" },
    });
  }

  fillNumber(section);
}
