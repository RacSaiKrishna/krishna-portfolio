# Talking hero video

The hero video has no frame: its edges fade into the dark page. While it is on screen the voiceover plays. Browsers need one click, tap or key press before any sound, so when they are holding sound back the start-up screen ends on an Enter button and that press starts the voice; scrolling past it turns the voice off, and coming back turns it on again. The nav Sound switch and the **Mute** button silence it. Captions show below the video. A plain dark background in the recording blends best.

## Recording
- Length: 20–30 seconds.
- Framing: chest up, centred, eyes to the lens. Portrait 4:5 (e.g. 1080×1350). Vertical 9:16 also works; the frame crops to 4:5.
- Background: plain and dark. The site renders the video in black and white.
- Light: one soft key light from the side gives the best monochrome contrast.
- Audio: a lapel or phone mic close to you; a quiet room.

## Script: elevator pitch (from your resume and atharvionics.ca, edit freely)
> Hi, I'm Krishna Rachakonda, founder of Atharvionics.
> I build AI agents and automations that take the repetitive work off a team's plate.
> For about ten years, I've done that inside insurance and finance. Automating seventeen regulatory documents saved over two hundred and seventy-two thousand dollars a year.
> Now, through Atharvionics, I help businesses in Waterloo Region catch missed calls and leads, get quotes and invoices out on time, and connect the software they already use.
> So tell me: which part of your week would you hand to a machine?

About 30 seconds. The placeholder video speaks this same script in a synthetic voice (macOS `say -v Aman`).

(No employer is named, which matches the site's privacy rule.)

## Export
Keep the file under ~6 MB so it loads fast on mobile:

```sh
ffmpeg -i raw.mov -vf "crop=ih*4/5:ih,scale=1080:1350" -c:v libx264 -crf 27 -preset slow \
  -c:a aac -b:a 96k -movflags +faststart src/media/hero.mp4
ffmpeg -i src/media/hero.mp4 -frames:v 1 -q:v 3 src/media/hero-poster.jpg
```

## Captions (`src/media/hero.vtt`)
Match the timings to your recording:

```
WEBVTT

00:00:00.000 --> 00:00:02.000
Hi, I'm Krishna.

00:00:02.000 --> 00:00:07.000
I build AI agents and automations that take the repetitive work off a team's plate.
```
