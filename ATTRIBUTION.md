# Photography

Every image in `assets/stills/` comes from [Unsplash](https://unsplash.com) and
is used under the [Unsplash License](https://unsplash.com/license), which allows
free commercial and non-commercial use without permission. Attribution is not
required by that licence; it is recorded here anyway.

Nothing here is a photograph of JAB, because JAB is not a real club. The shots
are illustrative, which is what the concept note on the page says.

## Processing

All files were cropped and graded to one look so the page reads as a single
piece of footage rather than a stock grid, then encoded as WebP:

```
saturation 0.18-0.22, contrast ~1.10, warm balance for work shots
and a cool balance for the rest shots (night, stretch, coach-3, coach-6)
```

The exact commands are in the script history; the grade is the only change made
to the source images beyond cropping.

## Plates

Full-bleed, 1600x900.

| File | Unsplash photo ID |
|---|---|
| `wraps.webp` | `photo-1520529301226-42abc4cd766b` |
| `jab.webp` | `photo-1575747503976-5e6e96a13504` |
| `pads.webp` | `photo-1517438322307-e67111335449` |
| `night.webp` | `photo-1636391134068-083dd5e3209b` |
| `warmup.webp` | `photo-1773289336845-2310e63e8e02` |
| `stance.webp` | `photo-1726867844097-dee6752f6cfc` |
| `bag.webp` | `photo-1716306886418-f84f6d4c2f3a` |
| `stretch.webp` | `photo-1716307046875-4c4ba2f43cab` |
| `room.webp` | `photo-1575747515871-2e323827539e` |
| `speedbag.webp` | `photo-1731572005637-ce0bd30a02b2` |

Each is reachable at `https://images.unsplash.com/<id>`.

## Coach strips

`assets/stills/coach-1.webp` to `coach-6.webp` are **not** Unsplash stills.
Each is the first frame of that coach's own loop in `assets/video/`, exported
through the same crop, so the poster and the video are the same image and the
hover has nothing to jump. Their sources are listed under Video below.

# Video

All fourteen loops in `assets/video/` come from [Mixkit](https://mixkit.co)
under the [Mixkit Free Stock Video License](https://mixkit.co/license/#videoFree),
which allows free use in commercial and non-commercial projects without
attribution or permission. Recorded here anyway.

Each was trimmed, cropped to 1280x720, silenced, and graded with the same curve
as the photographs so footage and stills read as one roll of film.

| File | Mixkit clip |
|---|---|
| `wraps` | `4596` |
| `jab` | `40969` |
| `pads` | `40261` |
| `night` | `23929` |
| `warmup` | `23056` |
| `stance` | `40967` |
| `bag` | `48373` |
| `stretch` | `23193` |

`coach-1` to `coach-6` are portrait windows cropped from `stance`, `wraps`,
`jab`, `warmup`, `pads` and `bag` respectively. The crop x offset of each was
chosen so the window lands on gloves, hands or the room and not on a face, for
the same reason the coach stills are details: the coach names are invented, and
an identifiable person under an invented name and job title misrepresents that
person whatever the licence permits.
