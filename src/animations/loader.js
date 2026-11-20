import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sfx, probeAudio, soundEnabled, setSound } from "../sound.js";

let done = false;

/**
 * Start-up screen. Resolves when the hero timeline may begin.
 *  - First visit in a session: 00 → 100 counter (the engine spools up with it).
 *  - Then, if the browser is holding sound back (it does until the visitor's first click, tap or
 *    key press), an Enter button appears. That press is the permission browsers require, so the
 *    voiceover and sounds start the moment the doors open. "Enter without sound" mutes instead.
 *  - Where sound is already allowed, or the visitor has muted, the doors simply open.
 *  - On phones and tablets the doors always open; sound starts on the first tap instead.
 * With JS off the loader never shows.
 */
export default function loader({ reduceMotion, lenis }) {
  const root = document.documentElement;
  clearTimeout(window.__krFailsafe); // the bundle is here: the head script's failsafe is not needed
  if (done || !root.classList.contains("is-booting")) {
    done = true;
    root.classList.remove("is-booting", "is-return", "is-gated");
    return Promise.resolve();
  }
  done = true;
  const firstVisit = !root.classList.contains("is-return");

  return new Promise((resolve) => {
    lenis?.stop();
    const el = document.querySelector(".loader");
    const label = el.querySelector(".loader-label");
    const enterBtn = el.querySelector(".loader-enter");
    const muteBtn = el.querySelector(".loader-mute");

    const finish = () => {
      root.classList.remove("is-booting", "is-return", "is-gated");
      try { sessionStorage.setItem("kr-boot", "1"); } catch (e) { /* private mode */ }
      lenis?.start();
      // The loader hid the scrollbar while the page was measured; re-measure pins and widths now.
      ScrollTrigger.refresh();
    };
    const open = () =>
      gsap.timeline({ onComplete: finish, onInterrupt: () => { finish(); resolve(); } })
        .to(".loader-core", { scale: 1.7, opacity: 0, duration: 0.4, ease: "power2.in" })
        .add(resolve, "-=0.15")
        .to(".loader-door--l", { xPercent: -101, duration: 0.65, ease: "expo.inOut" }, "-=0.2")
        .to(".loader-door--r", { xPercent: 101, duration: 0.65, ease: "expo.inOut" }, "<");

    const gate = () => {
      root.classList.add("is-gated");
      el.removeAttribute("aria-hidden");
      label.textContent = "Link established";
      enterBtn.hidden = false;
      muteBtn.hidden = false;
      gsap.fromTo([enterBtn, muteBtn], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power3.out" });
      enterBtn.focus({ preventScroll: true });

      let entered = false;
      const enter = (withSound) => {
        if (entered) return;
        entered = true;
        if (!withSound) setSound(false);
        // Still inside the press: the hero voiceover starts now (see src/media.js).
        document.dispatchEvent(new CustomEvent("kr:enter"));
        el.setAttribute("aria-hidden", "true");
        root.classList.remove("is-gated");
        open();
      };
      // The whole screen is the button; the small link enters muted. Any key works too
      // (Tab still moves between the two buttons; Enter/Space on a button is its own click).
      el.addEventListener("click", (e) => enter(!e.target.closest(".loader-mute")));
      const onKey = (e) => {
        if (entered) { window.removeEventListener("keydown", onKey, true); return; }
        if (["Tab", "Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
        if (e.target.closest?.(".loader-enter, .loader-mute") && (e.key === "Enter" || e.key === " ")) return;
        e.preventDefault();
        enter(true);
      };
      window.addEventListener("keydown", onKey, true);
    };

    // Phones and tablets (owner decision, 2026-11-20): never show Enter, open straight into the
    // site. Their browsers still hold sound until the first touch, so the effects and the hero
    // voiceover start on the first tap anywhere (src/sound.js, src/media.js).
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const next = () =>
      touch ? open() : probeAudio().then((allowed) => (allowed || !soundEnabled() ? open() : gate()));

    if (firstVisit && !reduceMotion) {
      const num = el.querySelector(".loader-num");
      const counter = { v: 0 };
      gsap.timeline()
        .from(".loader-label", { opacity: 0, y: 8, duration: 0.4 }, 0)
        .to(counter, {
          v: 100,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            num.textContent = String(Math.round(counter.v)).padStart(2, "0");
            sfx.spool(counter.v / 100); // engine revs climb with the count (only where sound is allowed)
          },
          onComplete: () => { sfx.spoolDone(); next(); }, // 100: the roar, then Enter or the doors
        }, 0);
    } else {
      next();
    }
  });
}
