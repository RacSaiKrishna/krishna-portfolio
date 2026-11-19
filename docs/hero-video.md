# Talking hero video

The hero frame plays a short muted loop of you talking, with captions. Visitors can press **Play with sound** to hear it from the start.

## Recording
- Length: 20–30 seconds.
- Framing: chest up, centred, eyes to the lens. Portrait 4:5 (e.g. 1080×1350). Vertical 9:16 also works; the frame crops to 4:5.
- Background: plain and dark. The site renders the video in black and white.
- Light: one soft key light from the side gives the best monochrome contrast.
- Audio: a lapel or phone mic close to you; a quiet room.

## Script (draft from your resume, edit freely)
> Hi, I'm Krishna.
> I build AI agents and automations that take the repetitive work off a team's plate.
> For about ten years I've worked inside insurance and finance: automating seventeen regulatory documents to save over two hundred and seventy thousand dollars a year, and building a conversational AI assistant on AWS Bedrock.
> Now, through Atharvionics, I bring that to growing businesses.
> Tell me which part of your week you'd hand to a machine.

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
