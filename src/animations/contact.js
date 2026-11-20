import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { q, qa } from "./shared.js";
import { sfx } from "../sound.js";
import { reduced } from "../motion.js";

/**
 * Closing: headline lines rise from behind masks, the starfield fires one warp
 * burst, and the email underlines draw left to right.
 */
export default function contact({ reduceMotion, stars }) {
  const section = q(".contact");
  if (reduceMotion) return;

  SplitText.create(q(".contact-title", section), {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, {
      yPercent: 105,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 70%" },
    }),
  });

  gsap.from([q(".contact .eyebrow"), q(".contact-note"), ...qa(".mail-label", section), q(".mail-copy"), q(".links")], {
    y: 24,
    opacity: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: { trigger: section, start: "top 60%" },
  });

  gsap.fromTo(qa(".mail-line", section), { scaleX: 0 }, {
    scaleX: 1,
    duration: 1.3,
    stagger: 0.15,
    ease: "expo.inOut",
    scrollTrigger: { trigger: q(".mail", section), start: "top 88%" },
  });

  ScrollTrigger.create({ trigger: section, start: "top 65%", once: true, onEnter: () => { stars.burst(); sfx.warp(); } });
}

/** Contact dialog opening: the panel wipes open from the centre line (clip-path + a small rise). */
export function revealDialog(panel) {
  if (reduced()) return;
  gsap.fromTo(panel,
    { clipPath: "inset(50% 0% 50% 0%)", y: 16, opacity: 0.4 },
    { clipPath: "inset(0% 0% 0% 0%)", y: 0, opacity: 1, duration: 0.55, ease: "expo.out", clearProps: "clipPath,transform,opacity" });
}
