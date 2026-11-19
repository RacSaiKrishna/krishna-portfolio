# First prompt for Claude Code

Paste this into Claude Code in VS Code after filling in the `content/` files.

---

Read `CLAUDE.md`, `PORTFOLIO-BRIEF.md`, everything in `content/`, and `reference/prototype.html`.

Then, before writing code:
1. Give me a short plan: file structure, the copy you will use for each section (pulled from `content/`), and any facts you could not find.
2. List anything you anonymised under the privacy rule.
3. Wait for my OK.

After I approve, build in this order and stop for me to review after each step:
1. Scaffold Vite, fonts, tokens, and static HTML/CSS for all sections with real copy. No animation yet.
2. Lenis + starfield + loader + hero timeline.
3. Selected work (pinned horizontal scroll on desktop, stacked on mobile).
4. Skills orbit and flight path.
5. Contact, reduced-motion pass, mobile pass, Lighthouse check.

Run `npm run build` at the end of each step and fix any errors before stopping.
