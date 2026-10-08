# JAB

A concept landing page for a fictional boxing club in Kyiv, built for adults
who have never trained. Static site, no build step, no framework.

**JAB is not a real club.** The gym, the coaches, the prices, the schedule and
the phone number are invented, the footage is illustrative, and both forms are
in demo mode. The page says so in two places.

## The idea

A jab is the first punch a beginner is taught and the most technical one in the
sport: a straight line out, the same line back, nothing wasted. So the visual
language is speed and precision, never force, and the structure of the page is
a fight. Each section is a round with its own number and clock, and the fixed
dial in the corner is both the round indicator and the scroll progress: the arc
fills through each section, flips blue between them, and completes at the
footer.

The audience is the reason for every decision here. Someone with a desk job and
no background is not afraid of the price, they are afraid of looking stupid.
So the copy answers that directly, the main interactive plays a real first class
minute by minute including the part where your breathing falls apart, and
nothing on the page implies you should already be fit.

## Running it

Any static server. No install, no build.

```bash
python -m http.server 8000
# then open http://localhost:8000
```

It also opens straight from the filesystem: the script is a classic script
rather than an ES module, so `file://` works.

## What is where

```
index.html            one page, all sections
css/styles.css        design system and every section
js/jab.js             one classic script, sectioned 1 to 16
assets/stills/        14 poster frames, one per loop, ~250 KB total
assets/video/         14 graded loops, mp4 + webm, ~17 MB total
```

## Design system

Five values, and no sixth:

| Token | Value | Job |
|---|---|---|
| `--canvas` | `#e3dcce` | bleached ring canvas, the ground for every plate |
| `--graphite` | `#1c1d1f` | text, and the near-dark frame of the hero |
| `--chalk` | `#f5f1e8` | type on graphite |
| `--red` | `#ce2b22` | work |
| `--blue` | `#2447c8` | rest |

Red marks effort and blue marks rest. Neither is ever decorative: the dial, the
page tint, the timer phase chip and the wipe all read from one `--phase` hook.

Type is Archivo Narrow for display and every number, Archivo for body. Numbers
are tabular everywhere, because time is the primary content type on this page.
Corner radius is zero, globally. Scorecards are not rounded.

Footage is graded to one near-monochrome look, warm for work and cool for
rest, so twelve separate clips read as one roll of film instead of a stock
grid, and never fight the five-value palette. Every still on the page is the
first frame of its own loop, so a poster never cuts to different content.

Contrast was checked against the plate each string actually sits on, not against
an average: graphite on canvas 13.0:1, chalk on graphite 14.3:1, chalk on red
4.7:1, blue on canvas 5.5:1. Red on canvas is 3.9:1, so **red is used for
display sizes and marks only and never for small copy**. Text never sits
directly on footage: every string is on a solid plate.

## One effect per section

Nothing is stacked. Each section gets a single signature move.

| Round | Section | The move |
|---|---|---|
| 01 | Hero | Footage inside the letterforms, plus a 1.2s count-in |
| 02 | Why the jab comes first | Film pinned while the round text scrolls over it |
| 03 | The club in numbers | Tabular figures counting up with a stepped tick |
| 04 | Your first class | The round timer |
| 05 | The coaches | Hovering a strip opens it and plays that coach's loop |
| 06 | The room | Horizontal reel driven by vertical scroll |
| 07 | The beginner schedule | Rows morph with the View Transitions API |
| 08 | Prices | A 60ms staggered reveal, and nothing else |
| - | Footer | The bell sounds once if audio is on, the arc completes |

Throughout: a focus-ring cursor that tightens over interactive elements, 5px of
magnetic pull on button labels, Lenis at `lerp: 0.08`, a slow ticker of class
times on one edge, and a 140ms jab wipe at every section boundary. Headline
reveals are by line mask, never by letter.

## The first-class timer

Six rounds, three minutes of work and one of rest, in the order a real first
class runs: warm-up, stance and guard, the jab, pads with a coach, bag rounds,
stretching. Each round carries one honest line about what it feels like, plays
its own loop, and shifts the page temperature red while working and blue while
resting.

The clock counts against `Date.now()` rather than accumulating intervals, so it
cannot drift and a backgrounded tab catches up instead of falling behind. Skip
jumps rounds so nobody waits out three real minutes. The bell is synthesised in
the Web Audio API, is off until you turn it on, and the mute control is always
visible. Round changes are announced in an `aria-live` region, and the whole
class is also available as plain text under the timer.

## Performance

| Budget | How it is met |
|---|---|
| Transform and opacity only | Every tween animates `x`, `y`, `scaleX` or `opacity`. The one exception is the dial arc's `stroke-dashoffset`, which paints but does not lay out. |
| Video under 3 MB on first load | Only the active loop is ever attached and played; everything else stays `preload="none"` and paused. First load is the hero loop alone, 0.7 MB. Largest single file is 1.5 MB. |
| JS under 200 KB gzip | GSAP, ScrollTrigger, Lenis and SplitType from CDN, plus about 10 KB of page script. Roughly 55 KB gzip in total. |
| CLS under 0.05 | Fixed nav height, `aspect-ratio` on every media box, `min-h: 100dvh` rather than `100vh`, and reveal targets that change opacity rather than layout. |
| No scroll listeners | ScrollTrigger and pointer events only. No `addEventListener('scroll')` anywhere. |
| No ScrollTrigger leaks | Everything is built inside `gsap.matchMedia()` contexts. Crossing a breakpoint reverts the context, which kills its triggers, tweens and split text, then re-runs the setup. |

## Below 768px

No background video, no custom cursor, no magnetic pull, no horizontal reel.
The reel becomes a vertical stack, the coach strips become stacked cards with
their role lines always visible, and the ticker moves to the bottom edge. The
timer and the wipes stay, so the mobile page is still the same page.

## Accessibility

`prefers-reduced-motion` disables the count-in, the wipes, the cursor, the
smooth scroll, the ticker and every loop. The plates stay, the content reads top
to bottom, the reel becomes a stack, and the timer jumps between states without
animating.

Beyond that: full keyboard navigation with a visible focus ring that the custom
cursor never replaces, a skip link, coach strips reachable by Tab so the
hover-revealed role lines are not keyboard-only losses, the schedule filters as
`aria-pressed` buttons rather than a fake tablist, labels above every input with
errors below, a status region on the form, and no audio without a user action.

## Known gaps

- **The coaches are stock performers under invented names.** The licence
  permits it and the page discloses it twice, in the band under the hero and
  in the footer. If you swap in photographs of real people, get their consent
  first: see `ATTRIBUTION.md`.
- **Lighthouse has not been run here.** There is no browser in this
  environment, so the performance and accessibility targets are met by
  construction and budget rather than by a measured score.
