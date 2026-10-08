# Background loops

This folder is empty on purpose. No footage is committed, so the page ships
with the graded photographs in `assets/stills/` standing in for every shot. That is
the same presentation mobile and `prefers-reduced-motion` users get, so the
layout is already designed around it and nothing breaks.

## Turning video on

1. Drop the files below into this folder.
2. In `js/jab.js`, set `VIDEO.enabled` to `true`.

To check a batch before committing the flag, load the page with `?video=1`
appended to the URL. That turns the video paths on for one visit.

## Files expected

Eight shots, each as `.webm` and `.mp4`. The names are the contract: they come
from the `data-still` attribute on each section and from the `still` key of each
round in `ROUNDS` (`js/jab.js`). Nothing else needs editing.

| File | Shot | Used by |
|---|---|---|
| `wraps` | Hands being taped, close enough to see the weave | Hero, booking band |
| `jab` | A jab at a slow shutter, long light trails | Round 02, inside the hero letterforms, timer round 3 |
| `night` | The room empty after the last class, one overhead light | Round 03, Round 06 |
| `warmup` | Rope work, feet and shoulders | Timer round 1 |
| `stance` | Floor marks, feet moving between them | Timer round 2 |
| `pads` | A coach calling shots on pads | Round 05, timer round 4 |
| `coach-1` to `coach-6` | Optional portrait loops behind each coach strip | Round 05 hover |
| `bag` | A heavy bag, mostly still, chain moving | Round 08, timer round 5 |
| `stretch` | The floor at the end, lit cool and low | Timer round 6 |

## Encoding

Per the performance budget: 720p, 8 to 12 seconds, silent, under 2 MB each, and
the first load must stay under 3 MB of video in total. Only the active loop ever
plays, so that ceiling holds as long as each file holds.

```bash
# MP4 (H.264). -movflags +faststart puts the index first so playback can begin
# before the whole file lands. -an drops audio: every loop is silent by design.
ffmpeg -i source.mov -t 10 -vf "scale=-2:720,fps=25" \
  -c:v libx264 -profile:v high -crf 30 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an wraps.mp4

# WebM (VP9), two-pass for a smaller file at the same quality.
ffmpeg -i source.mov -t 10 -vf "scale=-2:720,fps=25" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -pass 1 -an -f null /dev/null
ffmpeg -i source.mov -t 10 -vf "scale=-2:720,fps=25" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -pass 2 -an wraps.webm
```

Check the result before committing:

```bash
ls -l *.mp4 *.webm | awk '{ print $9, $5/1048576 " MB" }'
```

Raise `-crf` if a file lands over 2 MB. Grain is what costs the most, so a
slight denoise (`-vf "hqdn3d=2:1:2:3,scale=-2:720,fps=25"`) usually buys more
than dropping quality everywhere.

## Making the loops actually loop

Cut on a frame where the subject is in roughly the same position as frame one.
The page crossfades between shots at 400ms but never between the end and the
start of the same file, so a visible jump at the loop point will be visible.

## Posters

Poster frames are mandatory and are already wired: each `<video>` is layered
over its still plate, which stays visible until the video can actually play and
comes back whenever it is paused. Nothing extra to export.
