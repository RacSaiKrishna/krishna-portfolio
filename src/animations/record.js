import { gsap } from "gsap";
import { q, qa, fillNumber } from "./shared.js";
import { sfx } from "../sound.js";

const pad = (n) => String(n).padStart(2, "0");

/**
 * Achievements that scroll sideways.
 * Desktop: section pins and vertical scroll drives the track horizontally, snapping
 * to each card. The centred card is full strength; neighbours dim and shrink.
 * Mobile / reduced motion / no JS: native swipe with scroll-snap.
 */
export default function record({ isDesktop, isMobile, reduceMotion }) {
  const section = q(".record");
  const viewport = q(".record-viewport", section);
  const track = q(".record-track", section);
  const cards = qa(".feat", section);
  const current = q(".record-current", section);
  q(".record-total", section).textContent = pad(cards.length);

  let active = -1;
  const fill = q(".record-rail-fill", section);
  const hint = q(".record-hint", section);
  const hintText = q(".record-hint-text", section);
  const setProgress = (p) => {
    gsap.set(fill, { scaleX: 0.04 + p * 0.96 });
    gsap.to(hint, { opacity: p > 0.12 && p < 0.98 ? 0.6 : 1, duration: 0.3, overwrite: "auto" });
  };
  setProgress(0);
  // A gentle nudge on the arrow so the sideways direction reads at a glance.
  if (!reduceMotion) gsap.to(q(".record-hint-arrow", section), { x: 8, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });

  const setCurrent = (i) => {
    if (i === active) return;
    if (active !== -1) sfx.blip(); // a card locks into the centre
    active = i;
    current.textContent = pad(i + 1);
  };

  if (isDesktop) {
    section.classList.add("is-pinned");
    viewport.removeAttribute("tabindex");
    hintText.textContent = "Keep scrolling ↓ — the record moves sideways";

    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const centres = () => cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    // The "focus" glides from the first card's centre (start) to the last card's centre (end),
    // so A-01 is the lit card when the record begins and each card gets its turn in order.
    let snapPoints = [];
    let progress = 0;
    const focusAt = (p) => { const c = centres(); return c[0] + (c[c.length - 1] - c[0]) * p; };
    const computeSnaps = () => {
      const c = centres();
      const span = (c[c.length - 1] - c[0]) || 1;
      snapPoints = c.map((x) => gsap.utils.clamp(0, 1, (x - c[0]) / span));
    };

    // Dim a card's contents, not the card itself, so its solid background stays opaque.
    const opacity = cards.map((c) => {
      const setters = [...c.children].map((el) => gsap.quickSetter(el, "opacity"));
      return (v) => setters.forEach((set) => set(v));
    });
    const scale = cards.map((c) => gsap.quickSetter(c, "scale"));
    const update = () => {
      const focus = focusAt(progress);
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - focus);
        const t = Math.min(1, d / (c.offsetWidth + 16));
        opacity[i](1 - 0.45 * t);
        scale[i](1 - 0.04 * t);
        if (d < bestD) { bestD = d; best = i; }
      });
      setCurrent(best);
    };

    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance() * 0.9,
        pin: true,
        scrub: 0.35,
        invalidateOnRefresh: true,
        onRefresh: () => { computeSnaps(); update(); },
        onUpdate: (self) => { progress = self.progress; update(); setProgress(self.progress); },
        snap: {
          snapTo: (v) => gsap.utils.snap(snapPoints, v),
          duration: { min: 0.15, max: 0.4 },
          delay: 0.05,
          ease: "power2.inOut",
        },
      },
    });
    update();
    fillNumber(section);

    return () => {
      hintText.textContent = "Scroll sideways";
      section.classList.remove("is-pinned");
      viewport.setAttribute("tabindex", "0");
      gsap.set(cards, { clearProps: "scale" });
      cards.forEach((c) => gsap.set([...c.children], { clearProps: "opacity" }));
    };
  }

  // Native horizontal scroll: keep the counter and rail in step.
  hintText.textContent = "Swipe sideways";
  const onScroll = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    const mid = viewport.scrollLeft + viewport.clientWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    setCurrent(best);
  };
  viewport.addEventListener("scroll", onScroll, { passive: true });

  if (isMobile) {
    gsap.from(cards.slice(0, 3), {
      x: 60,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: viewport, start: "top 85%" },
    });
    fillNumber(section);
  }

  return () => viewport.removeEventListener("scroll", onScroll);
}
