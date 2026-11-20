/**
 * Optional media. Drop files into src/media/ and they are picked up at build time:
 *   hero.mp4 (and/or hero.webm)  talking intro video
 *   hero-voice.m4a (or .mp3)     its voiceover, played through Web Audio in sync with the video
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
  voice: import.meta.glob("./media/hero-voice.{m4a,mp3}", { eager: true, query: "?url", import: "default" }),
  poster: import.meta.glob("./media/hero-poster.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
  portrait: import.meta.glob("./media/portrait.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
};
const stand = {
  video: import.meta.glob("./media/hero.placeholder.{mp4,webm}", { eager: true, query: "?url", import: "default" }),
  vtt: import.meta.glob("./media/hero.placeholder.vtt", { eager: true, query: "?url", import: "default" }),
  voice: import.meta.glob("./media/hero-voice.placeholder.{m4a,mp3}", { eager: true, query: "?url", import: "default" }),
  poster: import.meta.glob("./media/hero-poster.placeholder.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
  portrait: import.meta.glob("./media/portrait.placeholder.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }),
};
const has = (obj) => Object.keys(obj).length > 0;
const first = (obj) => Object.values(obj)[0];
const byExt = (obj, ext) => Object.entries(obj).find(([k]) => k.endsWith(ext))?.[1];

import { reduced } from "./motion.js";
import { sfx, soundEnabled, soundRunning, onSoundState, voiceOutput } from "./sound.js";

export function setupMedia() {
  // The video, its captions and poster travel together: real set if a real video exists.
  const videoIsReal = has(real.video);
  const vset = videoIsReal ? real : stand;
  const mp4 = byExt(vset.video, ".mp4");
  const webm = byExt(vset.video, ".webm");
  const vtt = first(vset.vtt);
  const voiceUrl = first(vset.voice);
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
  // owner's photo with the owner's cloned voice reading the pitch, until a real hero.mp4 is
  // added (see docs/hero-video.md).
  txTodo?.classList.add("is-hidden");
  document.querySelector(".tx-planet")?.classList.add("is-hidden");
  document.querySelector(".tx-frame")?.classList.add("has-video");

  if (poster) {
    video.poster = poster;
    // Safari can drop a paused video's frame after it scrolls away; the photo stays behind it.
    video.style.background = `#05060d url("${poster}") center / cover no-repeat`;
  }
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
   * The video itself is always muted: muted video may autoplay everywhere, so the picture never
   * waits for permission. The voice is a separate file played through the site's audio engine
   * (src/sound.js), started at the same moment as the video from its first frame. Browsers
   * police a video's own sound separately and Safari would refuse to restart it after scrolling
   * away; the engine has no such rule, so whenever the engine can be heard, so can the voice.
   *
   * Behaviour (owner requests, 2026-11-19/20): while the video is on screen it talks; scrolling
   * past stops it; coming back starts it again from the beginning. After one full listen it loops
   * silently until the visitor scrolls away and back. The nav speaker icon and the Mute button
   * silence it. Where audio is not allowed yet (phones until the first swipe or tap, desktop
   * until Enter), it starts the moment audio starts.
   */
  let loaded = false;
  let armed = false;     // the intro is over; the voiceover may start
  let inView = false;
  let heard = false;     // played to the end during this visit to the hero
  let userMuted = false; // pressed Mute; respected until the hero is scrolled away
  let buffer = null;     // decoded voice
  let fetching = null;
  let voice = null;      // { src, t0 } while talking
  let syncTimer = 0;
  const cc = document.querySelector(".tx-cc");

  const load = () => {
    if (loaded) return;
    loaded = true;
    video.preload = "auto";
    video.load();
  };
  const talking = () => Boolean(voice);
  const label = () => {
    const on = talking();
    sfx.duck(on); // keep effects quiet while the intro is talking
    sound.textContent = on ? "Mute" : "Play with sound";
    sound.setAttribute("aria-pressed", String(on));
    // Wants to talk but the browser has not allowed sound yet: make the button easy to spot.
    sound.classList.toggle("is-waiting", inView && armed && !on && !userMuted && !heard && soundEnabled() && !soundRunning());
  };
  const playMuted = () => {
    video.muted = true; video.loop = true;
    if (!reduced()) video.play().catch(() => {});
  };

  // Fetch and decode the voice once (about 0.5 MB), after the page has loaded.
  const getVoice = () => {
    if (buffer || fetching || !voiceUrl) return fetching;
    const io = voiceOutput();
    if (!io) return null;
    fetching = fetch(voiceUrl)
      .then((r) => r.arrayBuffer())
      .then((data) => new Promise((ok, fail) => io.ctx.decodeAudioData(data, ok, fail))) // callback form: older Safari
      .then((b) => { buffer = b; update(); })
      .catch(() => { fetching = null; });
    return fetching;
  };

  // Captions follow the voice's own clock while it talks, the video's while it loops silently.
  const cues = () => [...(video.textTracks[0]?.cues || [])];
  const caption = (t) => {
    const cue = cues().find((c) => t >= c.startTime && t < c.endTime);
    cc.textContent = cue ? cue.text : "";
  };

  const stopVoice = () => {
    if (!voice) return;
    voice.src.onended = null;
    try { voice.src.stop(); } catch (e) { /* already stopped */ }
    voice = null;
    clearInterval(syncTimer);
    label();
  };
  const talk = () => {
    const io = voiceOutput();
    if (!io || !buffer || !soundRunning()) { label(); return; }
    stopVoice();
    load();
    video.muted = true; video.loop = true;
    video.currentTime = 0;
    if (!reduced()) video.play().catch(() => {});
    const src = io.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(io.out);
    src.start();
    voice = { src, t0: io.ctx.currentTime };
    src.onended = () => { voice = null; clearInterval(syncTimer); heard = true; cc.textContent = ""; label(); };
    // Keep picture and captions on the voice's clock (the tab may pause, the video may buffer).
    syncTimer = setInterval(() => {
      if (!voice) return;
      const t = io.ctx.currentTime - voice.t0;
      caption(t);
      if (Math.abs(video.currentTime - t) > 0.35 && t < (video.duration || Infinity)) video.currentTime = t;
    }, 120);
    label();
  };
  function update() {
    if (!inView) return;
    const want = armed && soundEnabled() && !userMuted && !heard;
    if (want && !talking()) { if (buffer) talk(); else getVoice(); }
    else if (!want && talking()) stopVoice();
    if (!talking()) playMuted();
    label();
  }

  video.textTracks.addEventListener?.("addtrack", (e) => {
    const track = e.track;
    track.mode = "hidden";
    track.addEventListener("cuechange", () => {
      if (talking()) return; // the voice clock drives captions while it talks
      cc.textContent = [...(track.activeCues || [])].map((c) => c.text).join(" ");
    });
  });

  sound.addEventListener("click", () => {
    if (talking()) { userMuted = true; stopVoice(); playMuted(); }
    else { userMuted = false; heard = false; update(); } // this click also starts audio (src/sound.js)
  });
  onSoundState(update); // speaker icon on/off, and audio starting (first swipe, tap, Enter or autoplay)

  new IntersectionObserver(([entry]) => {
    const now = entry.isIntersecting && entry.intersectionRatio >= 0.4;
    if (now === inView) return;
    inView = now;
    if (inView) {
      heard = false; // coming back: from the beginning again
      update();
    } else {
      // Scrolled out: voice off, picture paused.
      userMuted = false;
      stopVoice();
      video.pause();
      cc.textContent = "";
      label();
    }
  }, { threshold: [0, 0.4, 0.7] }).observe(document.querySelector(".tx-frame"));

  // Load the video and voice after the page is interactive so they never compete with first paint.
  const begin = () => { load(); getVoice(); if (!reduced() && inView) video.play().catch(() => {}); };
  if (document.readyState === "complete") setTimeout(begin, 300);
  else window.addEventListener("load", () => setTimeout(begin, 300), { once: true });

  // The loader's Enter button: the press has just started audio (src/sound.js).
  document.addEventListener("kr:enter", () => { armed = true; update(); });

  const armVoice = () => {
    if (armed) return;
    armed = true;
    update();
  };

  return { hasVideo, hasPortrait: Boolean(portrait), armVoice };
}
