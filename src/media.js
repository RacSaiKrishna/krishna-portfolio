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
import { sfx } from "./sound.js";

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

  const label = () => {
    const on = !video.muted && !video.paused;
    sfx.duck(on); // keep effects quiet while the intro is talking
    sound.textContent = on ? "Mute" : "Play with sound";
    sound.setAttribute("aria-pressed", String(on));
  };
  sound.addEventListener("click", () => {
    if (!video.muted && !video.paused) {
      video.muted = true; video.loop = true;
      if (reduced()) video.pause();
    } else {
      video.muted = false; video.loop = false; video.currentTime = 0;
      video.play().catch(() => {});
    }
    label();
  });
  // After a full listen with sound, fall back to the silent loop.
  video.addEventListener("ended", () => {
    video.muted = true; video.loop = true; label();
    if (!reduced()) video.play().catch(() => {});
  });
  video.addEventListener("play", label);
  video.addEventListener("pause", label);

  // Load the video after the page is interactive so it never competes with first paint.
  const begin = () => {
    video.preload = "auto";
    video.load();
    if (!reduced()) video.play().catch(() => {});
  };
  if (document.readyState === "complete") setTimeout(begin, 300);
  else window.addEventListener("load", () => setTimeout(begin, 300), { once: true });

  return { hasVideo, hasPortrait: Boolean(portrait) };
}
