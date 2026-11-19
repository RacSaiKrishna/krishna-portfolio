/**
 * Optional media. Drop files into src/media/ and they are picked up at build time:
 *   hero.mp4 (and/or hero.webm)  talking intro video
 *   hero.vtt                     captions for it
 *   hero-poster.jpg|png|webp     first frame shown before it plays
 *   portrait.jpg|png|webp        photo for the ID card
 * Each also has a "<name>.placeholder.<ext>" stand-in. A real file always wins over its
 * placeholder; while a placeholder is in use the page keeps a small visible TODO.
 * Missing files leave the full TODO notes in place and request nothing (no 404s).
 */
// Options must be inline literals: Vite reads them at build time.
const real = {
  video: import.meta.glob("./media/hero.{mp4,webm}", { eager: true, query: "?url", import: "default" }),
  vtt: import.meta.glob("./media/hero.vtt", { eager: true, query: "?url", import: "default" }),
  poster: import.meta.glob("./media/hero-poster.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
  portrait: import.meta.glob("./media/portrait.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
};
const stand = {
  video: import.meta.glob("./media/hero.placeholder.{mp4,webm}", { eager: true, query: "?url", import: "default" }),
  vtt: import.meta.glob("./media/hero.placeholder.vtt", { eager: true, query: "?url", import: "default" }),
  poster: import.meta.glob("./media/hero-poster.placeholder.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
  portrait: import.meta.glob("./media/portrait.placeholder.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
};
const has = (obj) => Object.keys(obj).length > 0;
const first = (obj) => Object.values(obj)[0];
const byExt = (obj, ext) => Object.entries(obj).find(([k]) => k.endsWith(ext))?.[1];

import { reduced } from "./motion.js";
import { sfx, soundEnabled, onSoundState } from "./sound.js";

export function setupMedia() {
  // The video, its captions and poster travel together: real set if a real video exists.
  const videoIsReal = has(real.video);
  const vset = videoIsReal ? real : stand;
  const mp4 = byExt(vset.video, ".mp4");
  const webm = byExt(vset.video, ".webm");
  const vtt = first(vset.vtt);
  const poster = first(vset.poster);
  const portraitIsReal = has(real.portrait);
  const portrait = first(portraitIsReal ? real.portrait : stand.portrait);

  if (portrait) {
    const photo = document.querySelector(".id-photo");
    const img = new Image();
    img.src = portrait;
    img.alt = portraitIsReal ? "Portrait of Krishna Rachakonda" : "Placeholder silhouette until a portrait is added";
    img.decoding = "async";
    img.loading = "lazy";
    photo.prepend(img);
    photo.querySelector(".id-monogram")?.classList.add("is-hidden");
    const todo = photo.querySelector(".id-todo");
    if (portraitIsReal) todo?.classList.add("is-hidden");
    else if (todo) todo.innerHTML = "TODO: placeholder photo. Add <code>portrait.jpg</code> to <code>src/media/</code>.";
  }

  const hasVideo = Boolean(mp4 || webm);
  if (!hasVideo) return { hasVideo, hasPortrait: Boolean(portrait) };

  const video = document.querySelector(".tx-video");
  const sound = document.querySelector(".tx-sound");
  const txTodo = document.querySelector(".tx-todo");
  // Owner decision (2026-11-19): no visible TODO over the placeholder video either. It is the
  // owner's photo with the synthetic placeholder voice until a real hero.mp4 is added
  // (see docs/hero-video.md).
  txTodo?.classList.add("is-hidden");
  document.querySelector(".tx-planet")?.classList.add("is-hidden");
  document.querySelector(".tx-frame")?.classList.add("has-video");

  if (poster) video.poster = poster;
  for (const [src, type] of [[webm, "video/webm"], [mp4, "video/mp4"]]) {
    if (!src) continue;
    const s = document.createElement("source");
    s.src = src; s.type = type;
    video.append(s);
  }
  if (vtt) {
    const t = document.createElement("track");
    t.kind = "captions"; t.srclang = "en"; t.label = "English"; t.src = vtt; t.default = true;
    video.append(t);
  }
  video.hidden = false;
  sound.hidden = false;

  /*
   * Voiceover follows the scroll (owner request, 2026-11-19): while the video is on screen it
   * talks, and scrolling past it mutes and pauses it. It also follows the nav Sound switch.
   * Browsers only allow sound after the visitor's first tap, click or key press; until then the
   * video loops silently and the first such press starts the voiceover from the beginning.
   * After one full listen it loops silently until the visitor scrolls away and comes back.
   */
  let loaded = false;
  let armed = false;     // the intro is over; the voiceover may start
  let inView = false;
  let heard = false;     // played to the end during this visit to the hero
  let userMuted = false; // pressed Mute; respected until the hero is scrolled away
  let pending = false;   // wants to talk but the browser has not allowed sound yet

  const load = () => {
    if (loaded) return;
    loaded = true;
    video.preload = "auto";
    video.load();
  };
  const label = () => {
    const on = !video.muted && !video.paused;
    sfx.duck(on); // keep effects quiet while the intro is talking
    sound.textContent = on ? "Mute" : "Play with sound";
    sound.setAttribute("aria-pressed", String(on));
    // Waiting for the browser to allow sound: make the button easy to spot.
    sound.classList.toggle("is-waiting", pending && inView && !on);
  };
  const silentLoop = () => {
    video.muted = true; video.loop = true;
    if (!reduced()) video.play().catch(() => {});
    label();
  };
  const talk = (fromStart) => {
    load();
    pending = false;
    if (fromStart) video.currentTime = 0;
    video.muted = false; video.loop = false;
    const p = video.play();
    label();
    p?.catch(() => { pending = true; silentLoop(); label(); }); // no sound allowed yet: wait for a press
  };
  const update = () => {
    if (!armed || !inView) return;
    const want = soundEnabled() && !userMuted && !heard;
    if (want && (video.muted || video.paused)) talk(false);
    else if (!want && !video.muted) silentLoop();
  };

  // Captions are drawn below the video, outside its feathered edge, so they stay readable.
  const cc = document.querySelector(".tx-cc");
  video.textTracks.addEventListener?.("addtrack", (e) => {
    const track = e.track;
    track.mode = "hidden";
    track.addEventListener("cuechange", () => {
      cc.textContent = [...(track.activeCues || [])].map((c) => c.text).join(" ");
    });
  });

  sound.addEventListener("click", () => {
    if (!video.muted && !video.paused) { userMuted = true; silentLoop(); }
    else { userMuted = false; heard = false; talk(true); }
  });
  // After a full listen with sound, fall back to the silent loop.
  video.addEventListener("ended", () => { heard = true; silentLoop(); });
  video.addEventListener("play", label);
  video.addEventListener("pause", label);
  onSoundState(update); // nav Sound switch on/off, and audio becoming available

  // The first press anywhere (other than the sound controls themselves) starts the voiceover.
  const onPress = (e) => {
    if (!pending || !inView || !armed || !soundEnabled() || userMuted) return;
    if (e.target.closest?.(".tx-sound, .nav-sound")) return;
    talk(true);
  };
  for (const type of ["pointerup", "touchend", "keydown", "click"]) {
    window.addEventListener(type, onPress, { capture: true, passive: true });
  }

  new IntersectionObserver(([entry]) => {
    const now = entry.isIntersecting && entry.intersectionRatio >= 0.4;
    if (now === inView) return;
    inView = now;
    if (inView) {
      if (heard) { heard = false; video.currentTime = 0; }
      if (armed) update();
      else silentLoop();
    } else {
      // Scrolled out: voiceover off.
      userMuted = false; pending = false;
      video.muted = true; video.pause();
      cc.textContent = "";
      label();
    }
  }, { threshold: [0, 0.4, 0.7] }).observe(document.querySelector(".tx-frame"));

  // Load the video after the page is interactive so it never competes with first paint.
  const begin = () => { load(); if (!reduced() && inView) video.play().catch(() => {}); };
  if (document.readyState === "complete") setTimeout(begin, 300);
  else window.addEventListener("load", () => setTimeout(begin, 300), { once: true });

  // The loader's Enter button: this press is the permission browsers need, so the voiceover
  // starts right now, inside the click (iOS Safari only allows sound from within the press itself).
  document.addEventListener("kr:enter", () => {
    armed = true;
    if (inView && soundEnabled() && !userMuted) talk(true);
  });

  const armVoice = () => {
    if (armed) return;
    armed = true;
    update();
  };

  return { hasVideo, hasPortrait: Boolean(portrait), armVoice };
}
