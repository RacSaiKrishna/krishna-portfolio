import { gsap } from "gsap";

let done = false;

/**
 * 00 → 100 counter, then blast doors split and the hero starts.
 * Runs once per session. Resolves when the hero timeline may begin.
 */
export default function loader({ reduceMotion, lenis }) {
  const root = document.documentElement;
  if (done || reduceMotion || !root.classList.contains("is-booting")) {
    done = true;
    root.classList.remove("is-booting");
    return Promise.resolve();
  }
  done = true;

  return new Promise((resolve) => {
    lenis?.stop();
    const num = document.querySelector(".loader-num");
    const counter = { v: 0 };
    const finish = () => {
      root.classList.remove("is-booting");
      try { sessionStorage.setItem("kr-boot", "1"); } catch (e) { /* private mode */ }
      lenis?.start();
    };

    gsap.timeline({ onComplete: finish, onInterrupt: () => { finish(); resolve(); } })
      .from(".loader-label", { opacity: 0, y: 8, duration: 0.4 }, 0)
      .to(counter, {
        v: 100,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => { num.textContent = String(Math.round(counter.v)).padStart(2, "0"); },
      }, 0)
      .to(".loader-core", { scale: 1.7, opacity: 0, duration: 0.4, ease: "power2.in" })
      .add(resolve, "-=0.15")
      .to(".loader-door--l", { xPercent: -101, duration: 0.65, ease: "expo.inOut" }, "-=0.2")
      .to(".loader-door--r", { xPercent: 101, duration: 0.65, ease: "expo.inOut" }, "<");
  });
}
