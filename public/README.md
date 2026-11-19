Static files served as-is (fonts, favicon).

Photos and video go in `src/media/` instead, so the build only references files that exist:
- `src/media/portrait.jpg` (or .png/.webp) — ID card photo, square crop, at least 800px.
- `src/media/hero.mp4` — talking intro video. See `docs/hero-video.md`.
