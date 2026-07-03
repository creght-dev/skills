# Phase 3 — Build: original implementation on Creght

Read the base `creght` skill (and its `site-code.md` / `cli.md` references)
before this phase. This file covers only what replication adds on top, plus
gotchas that cost real debugging time.

## Project setup

```bash
creght project create --name="<Site> Replica"     # prints project_id
creght project list                                # find <project_id>/<site_id>
creght pull --site_id=<p>/<s> --dir=./<dir>        # skeleton + AGENTS.md
```

Structure the port as:

```
/page/Index.tsx, /page/Works.tsx, ...      # one file per route
/page/<collection>/[slug].tsx              # detail templates
/component/Nav.tsx, Hero.tsx, Footer.tsx…  # one component per section
/component/shared.tsx                      # animation primitives + icons
/lib/art.ts                                # placeholder artwork generators
index.css                                  # @theme tokens + @utility classes
talizen.config.ts                          # importMap, metadata, fonts
```

## Third-party motion + fonts

- framer-motion via the import map:
  `"framer-motion": "https://esm.sh/framer-motion@12?external=react"` —
  `?external=react` is mandatory (duplicate-React crashes otherwise).
- Fonts via Google Fonts `<link>` tags in `customCode.head` (npm font
  packages don't exist on the platform). Preconnect + one css2 URL with the
  exact weights from recon.

## Width system (from recon's max-width finding)

Define once in `index.css` and use everywhere:

```css
@utility inner-max {
  margin-inline: auto;
  width: 100%;
  max-width: 1400px;   /* ← the measured cap */
}
```

Pattern: section keeps the page side padding and any full-bleed background
(`<section class="px-5 bg-…">`), content sits in `<div class="inner-max">`.
This reproduces the common behavior "20px margins below the cap, centered
above it". Marquees stay full-bleed (no inner-max).

## Placeholder artwork (`/lib/art.ts`)

Never ship the source's images. Generate deterministic SVG data URIs:

- A seeded PRNG (e.g. mulberry32) + 4–6 blurred ellipses from a per-image
  palette over a base color ≈ abstract editorial artwork. Match each source
  image's *mood* by choosing palettes from the recon screenshots.
- Special generators as needed: starfields (dots), radial "bloom" petals,
  portrait silhouettes (dark base + rim-light ellipse + head/shoulders
  shapes), tiling `feTurbulence` noise for grain overlays (as a CSS
  `@utility bg-noise`).
- Seed everything — SSR and client must render identical markup.

## Animation primitives (component/shared.tsx)

Build these once, reuse per section. Parameters come from the motion audit.

- `FadeIn` — whileInView entrance (opacity + y), `viewport={{ once: true }}`.
- `SlideInLetters` — load-driven per-letter x:100→0 + fade, stagger ~40ms.
  **Wrapping gotchas**: put each word in a `whitespace-nowrap` span, put a
  plain `" "` *between* word spans (space inside a nowrap span, or a
  `&nbsp;`, kills mobile wrapping); letters are `inline-block` (transforms
  don't apply to inline).
- `RevealHeading` — scroll-driven letter reveal:
  `useScroll({target, offset})` → `useSpring` (the lag is visible in the
  source) → per-letter `useTransform` over staggered ranges; map progress to
  x 90→0 and opacity with a squared falloff.
- `Scramble` — rAF loop resolving random glyphs left→right.
- `useClock` — **SSR-safe**: initialize to `""`, fill in `useEffect`
  (`new Date()` during render = hydration mismatch).
- Marquee — duplicated children + `@keyframes` `translateX(-50%)`;
  set duration per instance via a `[animation-duration:NNs]` utility class
  (Creght style rules discourage inline `style` for static values).

## framer-motion gotchas (each one cost a bug)

- **Variant propagation breaks** through a motion component that has its own
  `animate` object. For parent-hover-driven children (`whileHover="fan"` on a
  band, variants on cards), intermediate wrappers must be plain divs or
  variant-label-driven; put entrance animation into a `hidden` variant
  (`initial="hidden" animate="rest" whileHover="fan"`), not a separate
  `animate={{...}}`.
- **`mix-blend-mode` is isolated by any ancestor stacking context** (z-index
  on positioned element, opacity animation, transform). White
  `mix-blend-difference` text renders invisible/white instead of black when a
  wrapper has `relative z-10` or an animating opacity. Give the blended
  element itself the positioning/z, keep its ancestors stacking-context-free,
  and animate opacity on the element (self-opacity doesn't isolate its own
  blend).
- **Carousel drag**: `dragConstraints={{left:0,right:0}}` fights an animated
  track position. Use the full range
  (`left: -(n-1)*width, right: 0`), measure slide width with a
  ResizeObserver, animate `x: -index*width` in px (not %, which is relative
  to the *track* width), and clamp — don't wrap — on drag-end.
- Elements under a drag surface need `draggable={false}` on images and
  `select-none` on the track.

## Platform features

- **Forms**: create before coding —
  `creght form create --site_id=… --key=contact-form --name=… --schema=schema.json`,
  then `submitForm<Payload>("contact-form", payload)` from the submit
  handler with explicit success/error UI. Verify later via
  `creght form logs --key=contact-form`.
- **Dynamic routes**: `/page/<dir>/[slug].tsx` +
  `getServerSideProps(context)` reading `context.params.slug`; return
  `{ redirect: { destination: '/<list>', permanent: false } }` for unknown
  slugs; `generateMetadata({ params })` for per-entry titles.
- **Favicon**: `creght upload --file=favicon.svg --json` → put `file_url`
  into `metadata.icons.icon` (otherwise every page 404s /favicon.ico).
- JSX whitespace: text separated by `<br className="max-md:hidden" />` loses
  its space when the `br` hides — add an explicit `{" "}`.

## Mobile variants (from the recon mobile audit)

Implement as responsive variants of the same components, not separate trees:
hamburger nav (animated dropdown panel + icon morph), wrapped hero title
(`max-md:whitespace-normal` + vw-based size), per-section column/visibility
changes, always-visible replacements for desktop cursor-follow effects, stacked footer
with reordered rows (`max-md:flex-col-reverse` where the audit says so).
