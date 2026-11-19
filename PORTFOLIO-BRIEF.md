# Portfolio brief

## Goal
One page that makes a small-business owner or hiring manager think "this person builds real AI systems" within ten seconds, then gives them a reason to email.

## Who it is for
1. Small and mid-sized business owners looking for AI automation help (primary).
2. Recruiters and collaborators checking Krishna's background (secondary).

## Positioning
- Name: Krishna Rachakonda
- Title: AI & Automation Engineer
- One line: "I build AI agents and automations that take the repetitive work off a team's plate."
- Studio / contact brand: Atharvionics — atharvionics.ca, support@atharvionics.ca
- Background to draw on (details in `content/`): 11 years in software development (Java, Spring Boot, Angular), now AI automation; AWS and Google certifications; founder of several products in build.

## Look
Three reference reels shaped this. What to take from each:
- Reel A (red/black "PORTFÓLIO" hero): giant ghost word behind a cut-out portrait, "Hello, I'm NAME." intro, strong CTA. Skip its scattered arrows — the owner finds them cluttered.
- Reel B (neon numbered sections): oversized outlined section numbers, a skills orbit diagram, huge closing line with the email.
- Reel C (blue sci-fi): starfield, 00→100 loader, glowing portrait frame, "Let's connect" ending.

Owner direction (Nov 2026): **clean, zero clutter, sci-fi**, on the prototype's deep-space palette (the owner tried pure black & white and chose to bring the colours back). Must-haves: a talking hero video, a flipping ID card, achievements that scroll sideways.

Tokens (in `src/styles/base.css`):
- `--void #05060d`, `--hull #0c1020`, `--panel #111731`, `--line #243056`
- `--ink #e9edfb`, `--dim #97a2c7`
- `--ion #5fe3ff` (primary glow), `--plasma #ff4d6d` (accent, used sparingly)
- `--paper #e9edfb` (front of the ID card, the one light surface)

Motion: always on (owner decision), kept light: short pins only for the sideways record and the skills orbit.
Sound: soft synthesised sci-fi UI sounds on click and scroll events; nav "Sound On/Off" switch (remembered).

## Sections
| # | Section | Content source |
|---|---------|----------------|
| 0 | Loader | — |
| 1 | Hero: ghost "PORTFOLIO", name, title, pitch, two CTAs, talking video in HUD "transmission" frame, 4-item fact strip | `content/resume.md`, `src/media/hero.mp4` |
| 2 | 01 Identity: flipping ID card (front: crew ID, back: service record) | resume, LinkedIn, `src/media/portrait.jpg` |
| 3 | 02 Mission record: achievements scrolling sideways | resume, LinkedIn |
| 4 | 03 Building now: ventures index | `content/ventures.md`, resume |
| 5 | 04 Skills: orbit with five disciplines | resume, LinkedIn |
| 6 | 05 Experience: full roles (summary, bullets, tools) on a timeline, then education, certifications, toolkit | resume, LinkedIn |
| 7 | 06 Contact: big closing line, email, links | brief |

Until `src/media/hero.mp4` exists, the HUD frame shows the wireframe planet and a visible TODO.

## Animation spec (GSAP)
Global
- Lenis smooth scroll driving `ScrollTrigger.update`; `gsap.ticker` runs Lenis.
- Canvas starfield behind everything; star speed tied to scroll velocity so fast scrolling streaks the stars ("warp"), easing back when scroll stops.
- Thin scroll progress bar, top of page.
- Desktop only: soft cursor glow that follows with `gsap.quickTo`; CTAs are magnetic within 80px.

0. Loader
- Counter 00→100 over ~1.6s (`power2.inOut`), monospace, ion glow.
- At 100: counter scales up and fades, two panels split vertically like blast doors, hero timeline starts. Total under 2.5s. Runs once per session (sessionStorage).

1. Hero (timeline after loader)
- Ghost "PORTFOLIO": letters rise from below with 0.04s stagger, outline first, then gradient fill fades in.
- "Hello, I'm" fades up; name uses SplitText chars, each rotating in from 90° on the X axis, 0.05s stagger.
- Title types on with a blinking caret, then the caret disappears.
- Portrait frame: `clip-path` wipe from bottom, HUD corner brackets draw in, one scan line passes.
- CTAs and fact strip stagger up last.
- On scroll (scrub): ghost word moves up at 0.25x and spreads its letter-spacing; portrait moves at 0.9x; hero content fades as section 2 arrives.

2. Selected work
- Section number "01": stroke only at first, fills with plasma as it crosses the viewport centre (scrub).
- Desktop: section pins and the cards scroll horizontally (`xPercent` scrub, snap to each card). Active card is full opacity and scale 1; neighbours 0.5 opacity, scale 0.92.
- Each card: pointer-follow spotlight and a 3D tilt of at most 6°.
- Mobile: no pin. Cards stack and each slides up 40px with a fade as it enters.

3. Skills
- Desktop: section pins for about 150vh of scroll. The orbit ring rotates with scroll (scrub). Each of the five steps lights one node, draws a line from the core to it, and swaps the description panel on the right (crossfade + 20px slide).
- Core pulses once per step.
- Mobile: orbit rotates slowly on its own; the list items reveal in sequence.

4. Flight path
- Vertical line draws top to bottom with scroll (`scaleY` scrub, origin top).
- Each stop: dot scales from 0 with `back.out`, text slides in from the right 30px. The upcoming milestone dot keeps a slow plasma pulse.

5. Contact
- Headline splits by lines; each line rises from behind a mask, 0.12s stagger.
- Entering the section fires one starfield warp burst.
- Email underline draws left to right; "Copy email" button confirms with a short text swap.

Reduced motion
- No loader, no pinning, no parallax, no warp. Static starfield. Everything visible immediately.

## Out of scope for v1
Blog, CMS, contact form back end, 3D models, sound.

## Deploy
Static build. Ask the owner whether he wants Vercel, Netlify or GitHub Pages before setting anything up.
