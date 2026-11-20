# Krishna Rachakonda — Portfolio

Personal portfolio site for Krishna Rachakonda, AI & Automation Engineer. Dark sci-fi look, heavy on scroll-driven GSAP animation, light on clutter.

## Read these first
1. `PORTFOLIO-BRIEF.md` — design direction, section list, full animation spec. This is the source of truth.
2. `content/` — resume, LinkedIn export and venture notes. All copy on the site comes from here. Never invent facts, numbers, clients or testimonials.
3. `reference/prototype.html` — a static first pass of the look (palette, type, layout, starfield, wireframe planet). Reuse its tokens and structure; replace its simple motion with the GSAP spec.

## Stack
- Vite + vanilla JS (ES modules), plain CSS with custom properties. No React, no Tailwind, no UI kit.
- `gsap` with `ScrollTrigger` and `SplitText`, plus `lenis` for smooth scroll. Install from npm; check the current GSAP docs for plugin registration before writing animation code.
- Fonts: Unbounded (display), Manrope (body), JetBrains Mono (labels). Self-host them in `public/fonts`.

## Rules
- Privacy: do not publish current or past employer names. Describe employer work by sector only ("an insurance company"). If `content/` names an employer, anonymise it and list what you anonymised in your summary.
- Anything missing from `content/` gets a visible `TODO:` in the page and a line in your summary, never a made-up value.
- Animate only `transform`, `opacity` and `clip-path`. No layout-thrashing properties.
- Every animation lives in `src/animations/<section>.js` and is registered through one `gsap.matchMedia()` setup with three contexts: desktop, mobile, reduced-motion.
- With JavaScript off, every section must be fully readable. Start states are set by GSAP, never in CSS.
- Owner decision (2026-11-18): motion is always on, even with OS reduced motion. Keep the reduced-motion context in code; `MOTION_ALWAYS_ON` in `src/motion.js` re-enables it.
- Sound: sci-fi UI sounds are synthesised in `src/sound.js` (Web Audio, no files), are ON at every visit and start on page load where the browser allows autoplay; otherwise, on desktop, the start-up screen ends on an Enter button (`src/animations/loader.js`), whose press unlocks sound and starts the hero voiceover. Owner decision (2026-11-20): phones and tablets never see Enter; the site opens directly and sound plus the voiceover start on the first swipe or tap. Browsers do not count a native scroll as permission, so `src/lib/first-swipe.js` moves the page itself for the first swipe only, which makes lifting the finger count; later swipes are native. The voiceover plays while the hero video is on screen and stops when scrolled past (`src/media.js`), stay quiet and rate-limited, and the nav speaker icon mutes them. Scroll speed drives a synthesised engine (`src/lib/motor.js`).
- Mobile first. Test at 390px, 768px, 1440px.
- Restraint: one signature effect per section, two accent colours, no scattered decorative arrows or floating icons.

## Commands
- `npm run dev` — local server
- `npm run build` — production build to `dist/`
- `npm run preview` — check the build

## Done means
- Lighthouse (mobile): Performance 90+, Accessibility 95+.
- No console errors, no horizontal scroll at any width.
- Keyboard focus visible everywhere; headings in order; images have alt text.
