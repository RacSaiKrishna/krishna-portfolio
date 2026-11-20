# Talking hero video

The hero video has no frame: its edges fade into the dark page. While it is on screen the voiceover plays. Browsers need one click, tap or key press before any sound, so when they are holding sound back the start-up screen ends on an Enter button and that press starts the voice; scrolling past it turns the voice off, and coming back turns it on again. The nav speaker icon and the **Mute** button silence it. Captions show below the video. A plain dark background in the recording blends best.

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

About 40 seconds. The current hero video speaks this exact script in the owner's own voice, cloned on this Mac from a voice memo with the open-source F5-TTS model (`f5-tts-mlx`); nothing was uploaded. To change the wording: cut a clean 10-second piece of the memo as the reference, generate each sentence with `python -m f5_tts_mlx.generate --ref-audio ref.wav --ref-text "<what the piece says>" --text "<new sentence>"`, join them with half-second pauses, and re-time `src/media/hero.placeholder.vtt` (two lines at most per caption, so the hero stays steady).

(No employer is named, which matches the site's privacy rule.)

## Export
The site plays the picture and the voice separately: a silent video (muted video may autoplay everywhere) and the voice as its own file, played through the site's audio engine in sync from the first frame. Safari refuses to restart a paused video's own sound without a fresh click, so a voice inside the video went silent after scrolling away; through the audio engine it plays whenever the engine can be heard. Keep the video under ~6 MB so it loads fast on mobile:

```sh
ffmpeg -i raw.mov -vf "crop=ih*4/5:ih,scale=1080:1350" -an -c:v libx264 -crf 27 -preset slow \
  -movflags +faststart src/media/hero.mp4
ffmpeg -i raw.mov -vn -ac 1 -c:a aac -b:a 96k src/media/hero-voice.m4a
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
