# Phase 2 — Motion audit: measure, don't guess

Sites like this live or die on motion details. Audit **every** interactive
element and animation before writing any code. The output is a table:
element → trigger → measured behavior → parameters.

## Ground truth: the user's screen recording

If the user provided a recording (the skill asks for one at kickoff), start
here — it answers in minutes what probing answers in hours:

```bash
ffmpeg -i rec.mov -vf "fps=3,scale=1280:-1" frames/f%03d.png
```

Read the frames spread first (every ~6th), then zoom into transitions.
Look specifically for: sections that pin while the next slides over them
(page-turn), index numbers/titles that flip instead of cut, rows that
expand on hover, cursor-following CTA pills, and anything the static
recon missed (whole sections included). Probing afterwards only fills in
exact numbers.

## Inventory first

List candidates from recon: nav links, logo, buttons, list rows (works,
blog), cards, images, marquees, carousels and their controls, footer links,
contact rows, hero elements, section headings. Every one gets probed. Two
candidate classes that are always missed:

- **Every link inside the nav/menu overlay** — open the menu and hover each
  item (underline slides, color shifts, active markers).
- **Every collapsed list row** — a row showing only a number + title
  (services, capabilities) is a prime suspect for hover expansion revealing
  an image, description, and tag pills. Cards frequently carry a
  cursor-following CTA pill ("VIEW PROJECT") — sweep the mouse across each
  card type and watch for it.

## Hover audit — the padded before/after diff

For each candidate, capture a *padded* region screenshot before and after
hovering, plus a computed-style diff of the element **subtree**:

```js
// per element: scroll into view, park mouse in a corner, wait 600ms
//  → screenshot clip(box + 30-60px padding)  [off state]
//  → mouse.move(center), wait ~850ms (transitions!)
//  → screenshot same clip                    [on state]
// style snapshot (before/after) over [node, ...node.querySelectorAll('*')]:
//   color | backgroundColor | opacity | transform | textDecorationLine | borderRadius
```

Rules of interpretation:

- An empty subtree diff does **not** mean "no effect" — the effect often
  lives on a *parent* (row background) that isn't in the snapshot. That's why
  the padded screenshots exist; trust them over the diff.
- Some frameworks (Framer) swap DOM variants on hover — the style snapshot
  may throw on the second read. Fall back to the screenshots.
- Watch for a site-wide "hover language": one accent color used for all row
  and button hovers, one underline style for all links. Confirm it per
  element anyway; sites mix patterns (e.g. rows go accent, footer rows go
  inverse, links underline).
- Elements inside moving containers (marquee cards) are "unstable" —
  `scrollIntoViewIfNeeded` times out on them. Scroll to their *section*
  instead and probe with raw coordinates.
- **An open menu blocks the pointer**: menu/overlay states often mount a
  full-viewport transparent layer (Framer: `#template-overlay`) that
  intercepts clicks — a normal `locator.click()` on anything behind it
  retries until timeout. Close the menu with `Escape` (or dispatch a JS
  `.click()` on the overlay itself) before probing on; if a click ever
  times out with "element intercepts pointer events", suspect a leftover
  overlay, not a broken selector.

## Smooth-scroll library (Lenis & co.) — detect and copy the config

Check whether the source hijacks native scrolling; the inertia is a big part
of "手感" parity:

- Signatures: `document.documentElement.className` contains `lenis` /
  `lenis-smooth` / `lenis-autoToggle`; `window.lenis` / `window.lenisVersion`
  globals; similar checks for Locomotive (`has-scroll-smooth`) or GSAP
  ScrollSmoother (`#smooth-wrapper`).
- Dump the exact options: `window.lenis.options` → lerp / duration /
  wheelMultiplier / syncTouch / autoToggle etc. Replicate with the same
  values, same major version.
- Behavioral confirmation: `mouse.wheel(0, 600)` then sample `scrollY` every
  ~80ms — an exponential decay curve (e.g. 115, 542, 801, 958, 1053…)
  means lerp smoothing; compare the replica's curve frame-by-frame in
  verification.
- Build-side gotchas live in build.md ("smooth scroll").

## Marquees / tickers

Sample an item's `getBoundingClientRect().x` twice, 1.5–2s apart:
speed = Δx / Δt (px/s), sign = direction. Then hover the strip and re-sample:
does it pause? Beware wrap-around jumps (a huge positive Δ means the loop
reset between samples — resample with a shorter interval), and measure with
the ticker **in the viewport** — off-screen marquees commonly pause
(viewport-triggered), reading as a bogus 0 px/s. Typical build:
duplicated content + CSS `translateX(-50%)` keyframes; duration =
half-track-length / measured speed.

## Text entrance animations

Check headings for per-character animation: split-letter animations show up
in the DOM as one span per character.

```js
// reload, then within the first ~500ms:
[...h1.querySelectorAll('span')].map(s => ({
  ch: s.textContent, t: getComputedStyle(s).transform, o: getComputedStyle(s).opacity }))
```

Record per letter: starting offset (e.g. translateX(100px) → 0), whether
opacity tracks the same progress, stagger direction and approximate per-letter
delay (sample twice to estimate). For scroll-driven headings do the same at a
frozen mid-scroll position — a persistent partial reveal means the driver is
scroll progress, not time. Note the offset profile across letters (linear vs
exponential falloff → implies easing and/or spring smoothing on the scroll
value).

Also check for scramble/decode effects (text briefly renders as random
glyphs on load — screenshot at ~300ms after reload) and live clocks
(re-screenshot the header a minute apart).

## Layered/deck interactions

For "stack of images" heroes: hover the element and sample the transform of
each layer after settling (~1.5–2s for springs). A matrix like
`matrix(0.956, 0.292, -0.292, 0.956, …)` is rotate(17°) — recover angles via
`atan2(b, a)`. Record per layer: rotation, x/y offset, z-order, and the
stagger between layers. Also test where the trigger region actually is (often
a full-width band, not the image), and whether the state reverts on leave.

## Blend / invert effects

If text visually inverts over images passing beneath it, the source is using
white text + `mix-blend-mode: difference` (reads black on white backgrounds).
Detect: computed `color` is white on a black-looking heading, or
`mixBlendMode` ≠ normal. Record which elements blend — this changes your
z-order strategy in the build (text stays on top; no z-juggling).

## Carousels

Click the controls and capture mid-transition (~150–250ms after click):
slide-push (both slides visible, moving) vs crossfade. Test drag: pointer
down, move 250px, up — does it snap to the next slide? Record snap
thresholds, wrap-around behavior at the ends, and control hover states.

## Scroll-driven checks

At two scroll positions 200–800px apart, compare `rect.top + scrollY` of hero
layers/images: values that drift mean parallax (factor = Δabs/Δscroll).
Zero drift = no parallax; don't invent one.

For every **pinned section** found in recon (3b), sample the transforms and
opacity of its inner elements at 5+ scroll offsets across the pin. Common
patterns to name precisely rather than approximate:

- Hero pinned while the next section slides over it (curtain / page-turn) —
  the hero itself is `fixed`/`sticky`, not scrolling away.
- A giant wordmark that shrinks into the header logo: measure start and end
  rects and treat it as a FLIP (scale + translate landing exactly on the
  logo slot), not a fade-out/fade-in.
- Index numbers / titles that change during a pin are usually vertical flip
  transitions (old slides up and out, new slides up and in) — never hard
  swaps.
- A pinned section whose content moves sideways is a horizontal track:
  measure track width minus viewport to get the translation range.

## Output

A motion spec table with concrete numbers (angles, px offsets, px/s, delays,
easing guesses). Every row here becomes a verification item in Phase 4.
