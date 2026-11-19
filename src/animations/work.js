import { gsap } from "gsap";
import { q, qa, fillNumber } from "./shared.js";

/**
 * Ventures index: each row is uncovered by a clip-path wipe as it enters,
 * its contents rising a beat behind. Hover wipe lives in CSS (clip-path).
 */
export default function work({ reduceMotion, isMobile }) {
  const section = q(".work");
  if (reduceMotion) return;

  for (const row of qa(".venture", section)) {
    gsap.timeline({ scrollTrigger: { trigger: row, start: "top 88%" } })
      .fromTo(row, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power3.out", clearProps: "clipPath" })
      .from(row.children, { y: isMobile ? 14 : 20, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" }, 0.08);
  }
  fillNumber(section);
}
