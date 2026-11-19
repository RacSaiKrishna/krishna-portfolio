import "./styles/base.css";
import "./styles/sections.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import { setupMedia } from "./media.js";
import { reduced } from "./motion.js";
import { initSound, setSound, soundEnabled, soundRunning, soundJustUnlocked, onSoundState, sfx } from "./sound.js";
import { setupContactForm } from "./contact-form.js";
import global, { navSpy } from "./animations/global.js";
import loader from "./animations/loader.js";
import hero from "./animations/hero.js";
import identity from "./animations/identity.js";
import record from "./animations/record.js";
import work from "./animations/work.js";
import skills from "./animations/skills.js";
import path from "./animations/path.js";
import contact from "./animations/contact.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const media = setupMedia();
setupContactForm();
initSound();
setupSoundSwitch();

// Below-the-fold section modules, in page order so pins are measured top to bottom.
const sections = [identity, record, work, path, skills, contact];

// Give the main thread back between sections so setup never becomes one long task.
const yieldToMain = () =>
  new Promise((resolve) => (globalThis.scheduler?.yield ? scheduler.yield().then(resolve) : setTimeout(resolve, 0)));

/*
 * One gsap.matchMedia() setup, three contexts: desktop, mobile, reduced motion.
 * Motion is always on by owner decision (src/motion.js), so the reduced-motion context
 * only runs if MOTION_ALWAYS_ON is switched off there.
 */
const mm = gsap.matchMedia();
mm.add(
  {
    wide: "(min-width: 900px)",
    narrow: "(max-width: 899.98px)",
  },
  (context) => {
    const { wide, narrow } = context.conditions;
    const reduceMotion = reduced();
    const isDesktop = wide && !reduceMotion;
    const isMobile = narrow && !reduceMotion;
    const g = global({ isDesktop, isMobile, reduceMotion });
    const env = { isDesktop, isMobile, reduceMotion, media, stars: g.stars, lenis: g.lenis };
    env.intro = loader(env);
    env.intro.then(() => media.armVoice?.()); // voiceover may start once the intro is done

    const cleanups = [g.cleanup];
    let live = true;
    const run = (init) => {
      const off = init(env);
      if (typeof off === "function") cleanups.push(off);
    };

    run(hero); // above the fold: set up immediately
    (async () => {
      for (const init of sections) {
        await yieldToMain();
        if (!live) return;
        context.add(() => run(init)); // keeps deferred tweens/triggers inside this matchMedia context
      }
      await yieldToMain();
      if (!live) return;
      context.add(navSpy);
      ScrollTrigger.refresh();
    })();

    return () => {
      live = false;
      cleanups.forEach((fn) => fn());
    };
  }
);

// Webfonts change line lengths; re-measure once they are in.
if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

/**
 * Nav on/off switch (role="switch"): mutes or unmutes the sound effects for this visit.
 * While sound is on but the browser is still holding audio back (iOS Safari until the first
 * tap), the switch reads "Tap"; pressing it then starts the engine instead of muting.
 */
function setupSoundSwitch() {
  const btn = document.querySelector(".nav-sound");
  const state = btn.querySelector(".nav-sound-state");
  const sync = () => {
    const on = soundEnabled();
    const waiting = on && !soundRunning();
    btn.setAttribute("aria-checked", String(on));
    btn.classList.toggle("is-waiting", waiting);
    btn.setAttribute("aria-label", waiting ? "Sound: tap to start" : "Sound");
    state.textContent = waiting ? "Tap" : on ? "On" : "Off";
  };
  btn.hidden = false;
  sync();
  onSoundState(sync);
  btn.addEventListener("click", () => {
    // This press is what unlocked audio: keep sound on (the start-up roar is playing).
    if (soundEnabled() && (!soundRunning() || soundJustUnlocked())) {
      setSound(true);
      sync();
      return;
    }
    const on = !soundEnabled();
    setSound(on);
    sync();
    if (on) setTimeout(() => sfx.select(), 30);
  });
}
