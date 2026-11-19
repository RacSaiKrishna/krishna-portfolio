# Media drop folder

Drop files here with these exact names. The site picks them up on the next `npm run dev` / `npm run build`.
Until a file exists, the page shows a visible TODO in its place and requests nothing.

| File | Where it appears | Notes |
|------|------------------|-------|
| `hero.mp4` (optional `hero.webm`) | Hero "transmission" frame | Talking intro, 4:5 crop, see `docs/hero-video.md` |
| `hero.vtt` | Captions on the hero video | Shown on the muted loop too |
| `hero-poster.jpg` | First frame before the video plays | 1080×1350 |
| `portrait.jpg` | ID card photo | Square crop, plain background, at least 800px |

Colour is fine: the site renders both in black and white.

## Placeholders
`hero.placeholder.mp4`, `hero.placeholder.vtt`, `hero-poster.placeholder.jpg` and `portrait.placeholder.jpg` are stand-ins
(silhouette + synthetic voice). A real file with the plain name always wins over its placeholder, and while a placeholder
is in use the page shows a small TODO. Delete the placeholder files once your real ones are in.
