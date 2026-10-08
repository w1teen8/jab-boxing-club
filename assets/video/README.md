# Background loops

Fourteen silent loops, each as `.mp4` (H.264) and `.webm` (VP9). Eight are the
full-bleed shots behind the page; six are the portrait loops that play inside a
coach strip on hover.

Every loop is graded with the same curve as the photographs in
`assets/stills/`, so the footage and the poster frames read as one roll of film
rather than two sources. Licensing is in `../../ATTRIBUTION.md`.

## How the page uses them

Only the active loop is ever attached and played. Everything else stays
`preload="none"` and paused, so the first load pays for one file and not
fourteen. The manifest the script checks is `VIDEO.have` in `js/jab.js`: a name
that is not listed stays on its still instead of firing a request that would
404.

To see the page the way mobile and `prefers-reduced-motion` users see it, with
the stills standing in for every shot, load it with `?video=0`.

## Full-bleed loops, 1280x720

| File | Shot | Used by |
|---|---|---|
| `wraps` | Hands taping a wrap | Hero, inside the hero letterforms, booking band |
| `jab` | A straight punch thrown toward camera | Round 02 |
| `night` | The gym empty, bags still, reflective floor | Round 03, Round 06 |
| `warmup` | Rope work in a dark gym | Timer round 1 |
| `stance` | Guard held, hands up | Round 07, timer round 2 |
| `pads` | A coach calling shots on focus mitts | Round 05, timer round 4 |
| `bag` | The bag room | Round 08, timer round 5 |
| `stretch` | A quiet hall at the end of a session | Timer round 6 |

## Coach loops, 404x720

`coach-1` to `coach-6`, one per strip in Round 05. Each is a portrait window
cropped from one of the loops above, framed on gloves, hands or the room rather
than on a face, for the reason set out in `../../ATTRIBUTION.md`.

Each coach's poster in `assets/stills/` is that loop's own first frame, so the
still and the video are the same image and the hover has nothing to jump.

## Budget

Per the performance budget: 720p, 8 to 11 seconds, silent, under 2 MB each, and
under 3 MB of video on first load. Current worst case is `night.webm` at 1.5 MB,
and the first load is the hero loop alone at 0.7 MB.

Check after any re-encode:

```bash
ls -l assets/video | awk 'NR>1 { printf "%-16s %6.2f MB\n", $9, $5/1048576 }' | sort -k2 -n
```

## Re-encoding

```bash
# MP4 (H.264). -movflags +faststart puts the index first so playback can begin
# before the whole file lands. -an drops audio: every loop is silent by design.
ffmpeg -nostdin -ss 2 -t 10 -i source.mov \
  -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=25,\
eq=saturation=0.20:contrast=1.10:brightness=-0.015:gamma=0.97,\
colorbalance=rs=0.035:gs=0.005:bs=-0.035" \
  -c:v libx264 -profile:v high -crf 30 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an wraps.mp4

# WebM (VP9). Raise -crf to shrink; do not pass -maxrate alongside -b:v 0,
# libvpx rejects the combination.
ffmpeg -nostdin -ss 2 -t 10 -i source.mov -vf "<same chain>" \
  -c:v libvpx-vp9 -crf 46 -b:v 0 -row-mt 1 -deadline good -cpu-used 1 -an wraps.webm
```

Use the cool grade for rest shots, which is what `night` and `stretch` carry:

```
eq=saturation=0.18:contrast=1.10:brightness=-0.02:gamma=0.97,
colorbalance=rs=-0.03:gs=0.00:bs=0.055
```

`-nostdin` matters when encoding in a shell loop. Without it ffmpeg swallows the
loop's input and the loop stops after one iteration.

## Loop points

Cut on a frame where the subject sits roughly where it does on frame one. The
page crossfades between different shots at 400ms but never between the end and
the start of the same file, so a jump at the loop point will show.

## Posters

Already wired: each `<video>` is layered over its still, which stays visible
until the video can actually play and returns whenever it is paused. Nothing
extra to export for the full-bleed loops. The coach posters are generated from
their own loops, as above.
