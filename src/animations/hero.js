import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { createPlanet } from "../lib/planet.js";
import { q } from "./shared.js";

let introPlayed = false;
let planet = null;

/**
 * Intro timeline (after the loader) + scrubbed parallax as the hero scrolls away.
 */
export default function hero({ reduceMotion, isMobile, intro, media }) {
  if (!media.hasVideo) {
    planet ??= createPlanet(q(".tx-planet"));
    reduceMotion ? planet.still() : planet.start();
  }
  if (reduceMotion) { introPlayed = true; return; }

  const heroEl = q(".hero");
  const stroke = SplitText.create(".ghost-stroke", { type: "chars", charsClass: "gc", aria: "none" }).chars;
  const fill = SplitText.create(".ghost-fill", { type: "chars", charsClass: "gc", aria: "none" }).chars;
  // Split the <h1> itself so its accessible name stays on the heading.
  const nameChars = SplitText.create(".name", { type: "chars" }).chars;

  if (!introPlayed) {
    introPlayed = true;
    const role = q(".role-text");
    const caret = q(".caret");
    const steps = role.textContent.length;

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    tl.from(stroke, { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.03, ease: "power3.out" }, 0)
      .fromTo(".ghost-fill", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 0.5)
      .fromTo(".hero .eyebrow", { y: 10, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath", ease: "power3.out", duration: 0.5 }, 0.1)
      .fromTo(".hello", { y: 12, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath", ease: "power3.out", duration: 0.5 }, 0.2)
      // Name: chars swing up from 90° on X. Transform only, so the text paints immediately (LCP-safe).
      .from(nameChars, {
        rotationX: -90,
        yPercent: 20,
        transformOrigin: "50% 100%",
        duration: 0.6,
        stagger: 0.025,
        ease: "power3.out",
      }, 0.3)
      // Title types on: clip-path steps across the text while the caret rides the edge.
      .fromTo(role, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: steps * 0.025, ease: `steps(${steps})` }, 0.8)
      .fromTo(caret, { opacity: 1, x: () => -role.offsetWidth }, { x: 0, duration: steps * 0.025, ease: `steps(${steps})` }, 0.8)
      .to(caret, { opacity: 0, duration: 0.01, repeat: 3, yoyo: true, repeatDelay: 0.28 })
      .set(caret, { opacity: 0 })
      // HUD brackets draw in, one scan pass (planet frame only; hidden with a video).
      // Video frame: with a video it fades up out of the background; the planet frame wipes in.
      .add(media.hasVideo
        ? gsap.fromTo(".tx-frame", { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" })
        : gsap.fromTo(".tx-frame", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut" }), 0.35)
      .from(".tx-corner", { scale: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.95)
      .from(".tx-hud", { opacity: 0, duration: 0.4, stagger: 0.08 }, 1)
      .fromTo(".tx-scan", { yPercent: -110 }, { yPercent: 480, duration: 1.1, ease: "power1.inOut" }, 1.05)
      .fromTo(".tx-bar", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath", ease: "power3.out", duration: 0.4 }, 1.1)
      .fromTo(".pitch", { y: 14, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" }, 0.9) // wipe, not fade: text is never semi-transparent
      .fromTo(".cta .btn", { y: 14, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath", ease: "power3.out", duration: 0.5, stagger: 0.07 }, 1)
      .fromTo(".strip > div", { y: 14, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath", ease: "power3.out", duration: 0.5, stagger: 0.05 }, 1.1)
      .from(".nav", { opacity: 0, duration: 0.5 }, 0.8);

    intro.then(() => tl.play());
  }

  // Scroll away (scrubbed)
  const scrub = { trigger: heroEl, start: "top top", end: "bottom top", scrub: true };
  const h = () => heroEl.offsetHeight;
  // Ghost drifts up and away faster than the content, so it never slides onto it.
  gsap.to(".ghost", { y: () => -h() * 0.25, opacity: 0.3, ease: "none", scrollTrigger: { ...scrub, invalidateOnRefresh: true } });
  // Letters spread apart with transforms, not letter-spacing.
  const spread = (chars) => gsap.to(chars, {
    xPercent: (i) => (i - (chars.length - 1) / 2) * (isMobile ? 8 : 12),
    ease: "none",
    scrollTrigger: scrub,
  });
  spread(stroke);
  spread(fill);
  // On desktop the frame sits beside the copy and can drift; on mobile it is in the flow above the strip.
  if (!isMobile) gsap.to(".tx", { y: () => h() * 0.06, ease: "none", scrollTrigger: { ...scrub, invalidateOnRefresh: true } });
  gsap.to([".hero-copy", ".tx", ".strip"], {
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: heroEl, start: "55% top", end: "bottom top", scrub: true },
  });

}
