# Krishna Rachakonda — Portfolio

Live at **https://krishna.atharvionics.ca**

Vite + vanilla JS, GSAP (ScrollTrigger, SplitText), Lenis, and Web Audio sound design.

```sh
npm install
npm run dev      # local server
npm run build    # production build to dist/
npm run preview  # check the build
```

## Deploy

Hosted on Firebase Hosting (site `krishna-atharvionics`, project `atharvionics-ltd`), served at
krishna.atharvionics.ca. Deploys are manual, from a machine signed in to that Firebase account:

```sh
npm run build && firebase deploy --only hosting
```

Pushing to GitHub only stores the code; it does not publish the site.

Media: drop `hero.mp4` / `hero.vtt` / `portrait.jpg` into `src/media/` to replace the placeholders (see `src/media/README.md` and `docs/hero-video.md`).
