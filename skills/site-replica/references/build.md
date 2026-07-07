# Phase 3 — Build: original implementation on Creght

> **Toolbox** — recipes and field notes, not mandates. The binding Contract
> and Gates live in `../SKILL.md`; consult what the task's tier needs, skip
> what it doesn't, and note the skip when a gate depends on it.


Read the base `creght` skill (and its `site-code.md` / `cli.md` / `cms.md`
references) before this phase. This file covers only what replication adds
on top, plus gotchas that cost real debugging time.

## Project setup

```bash
creght project create --name="<Site> Replica"     # prints project_id
creght project list                                # find <project_id>/<site_id>
creght pull --site_id=<p>/<s> --dir=./<dir>        # skeleton + AGENTS.md
```

(CLI operational gotchas — stale-CLI pull errors, push working-directory
rules — live in the base creght skill's `references/cli.md`.)

Structure the port as:

```
/page/Index.tsx, /page/Works.tsx, ...      # one file per route
/page/<collection>/[slug].tsx              # detail templates
/component/Nav.tsx, Hero.tsx, Footer.tsx…  # one component per section
/component/shared.tsx                      # animation primitives + icons
/lib/art.ts                                # placeholder artwork generators
/cms/*.schema.json, /cms/seed/*.json       # collection schemas + seed entries
index.css                                  # @theme tokens + @utility classes
talizen.config.ts                          # importMap, metadata, fonts
```

Collection content (blog posts, works…) lives in the platform CMS, not in
these files — see "CMS-backed collections" below before writing any list or
detail page.

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

## Placeholder imagery — stock photos first, generated SVG second

Never ship the source's images. But know which substitute to reach for:

**Photographic subjects (people, lifestyle, editorial covers, workspaces)**
— seeded SVGs read as obviously fake here ("blob people" team cards are the
classic complaint). Use license-free stock instead. Proven recipe:

- Build an **image slot map** first: walk the recon captures and list every
  image slot with a one-line description of subject + mood + palette
  ("hero: woman lit by red/blue gel light", "work card: charcoal fabric
  smart speaker"). One search query per slot.
- **Never guess Unsplash photo IDs from memory** — the URL usually returns
  200 but the content is wrong (verified failure mode). Don't bother with
  the search API either: the `napi` endpoint requires auth now, and plain
  `curl` of search pages returns nothing (client-rendered).
- What works: drive the recon browser to
  `https://unsplash.com/s/photos/<hyphenated-query>`, wait ~2s, then pull
  candidates from the rendered DOM — the id from
  `figure img[src*="images.unsplash.com/photo-"]` plus the `alt` text.
  Choose by alt text (it describes content accurately). Batch all slots in
  one browser-code loop, 3–5 candidates each.
- **Unsplash bot wall (Anubis/BotStopper)**: the default automation UA gets
  an instant "Oh noes! Access Denied" page (zero results, no error). Set a
  normal Chrome UA on the context, load one search page, and wait out the
  "Making sure you're not a bot!" proof-of-work interstitial (~20–25s,
  poll `page.title()` until it clears) — the clearance cookie then covers
  every search in the same browser context, so run all slot queries through
  that one context.
- Alt text lies sometimes. For the *hero* and other identity-critical slots,
  download 200px thumbs of the top candidates, hstack them into one strip
  (ffmpeg) and pick visually — one Read call per batch instead of per image.
- URL shape:
  `https://images.unsplash.com/<id>?w=<px>&q=80&auto=format&fit=crop`.
  imgix params work — `&sat=-100` makes any photo grayscale (cheap match
  for B&W sections). Prefer CSS mood-matching (duotone/dark overlays,
  brightness/saturate filters) over hunting for the perfect photo.
- Faces/avatars: `randomuser.me/api/portraits/{men,women}/<n>.jpg`, or
  reuse Unsplash portraits at small widths.
- Verify before building: batch-check every final URL returns 200
  (`curl -o /dev/null -w "%{http_code}"`), then visually inspect thumbnails
  of the *critical* slots (hero especially) — a 200 does not mean the
  content matches.
- Hotlinking `images.unsplash.com` is fine through the build/verify loop.
  Before **publish**, download the finals and `creght upload` them, then
  swap to the returned CDN URLs — hotlinks rot and may be slow or blocked
  for the site's audience; fall back to another candidate or a seeded SVG
  when a download fails.
- License: Unsplash/Pexels/randomuser are fine for a design study. Images
  from the source site itself are never OK.

**Abstract/brand graphics, device mockups, gradients, textures** — generate
deterministic SVG data URIs in `/lib/art.ts`:

- A seeded PRNG (e.g. mulberry32) + 4–6 blurred ellipses from a per-image
  palette over a base color ≈ abstract editorial artwork. Match each source
  image's *mood* by choosing palettes from the recon screenshots.
- Special generators as needed: starfields (dots), radial "bloom" petals,
  tiling `feTurbulence` noise for grain overlays (as a CSS
  `@utility bg-noise`).
- Seed everything — SSR and client must render identical markup.

## Grid alignment — no-gap grids (cost a full rework)

When recon found blocks snapping to visible grid lines, **never build the
columns with CSS `gap`**: `grid-cols-4 gap-8` shifts every column start off
the lines (footer nav landed at 1086 instead of the 1062 line) and the whole
page loses the source's order. Instead:

- Bare `grid grid-cols-4` (no gap) over the padded content box — cell edges
  then sit exactly on the quarter lines at every width.
- Inter-cell spacing comes from *in-cell padding* measured in recon (e.g.
  `pl-[30px]` insets inside a services column), not from gap.
- Non-line anchors from recon become percent offsets of the content box
  (`md:ml-[34.28%]`, `md:mr-[8.85%]`), which keeps them proportional at
  1200–1920 the way the source behaves.
- Staggered column layouts (right column shifted one row down, "01 alone on
  the first row") are an explicit `md:mt-[<row-pitch>px]` on the second
  column, with per-cell `border-t` for the row separators.

## text-indent is inherited (cost a broken hero quote)

CSS `text-indent` inherits into every block container descendant — including
the `inline-block` word spans of a split-text animation. Each word's glyphs
shift right inside their own shrink-to-fit box and overlap the next word
(long words worst). For a first-line indent on split text, render an inline
spacer instead: `<span class="inline-block w-[40.5%]" aria-hidden />` before
the first word (put a hanging quote mark after the spacer if the design has
one). Never put `indent-[…]` on the paragraph.

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
- Prices/numbers — never format with `toLocaleString()` in render: server
  and client locales can differ → React #418 hydration error. Use a manual
  formatter (`String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")`).
- Marquee — duplicated children + `@keyframes` `translateX(-50%)`;
  set duration per instance via a `[animation-duration:NNs]` utility class
  (Creght style rules discourage inline `style` for static values).

## Measured type ramp — one utility class per text role

Turn recon 3c's measurements into CSS classes in `index.css`, and use them
instead of per-element `text-[NNpx]` guesses:

```css
/* base = phone (fixed), md = tablet (fixed), xl = desktop (fluid calc
   through the 1440 & 1920 samples) */
.t-display-xl { font-size: 54px; line-height: 0.9; letter-spacing: -0.06em; font-weight: 600; }
@media (min-width: 810px)  { .t-display-xl { font-size: 100px; } }
@media (min-width: 1280px) { .t-display-xl { font-size: calc(28px + 5.8333vw); } }
```

- Never encode desktop sizes as plain `vw` values eyeballed at one width —
  they will be exact at that width and wrong everywhere else. Use the
  measured `calc(Bpx + Avw)`.
- Fluid chrome gets the same treatment: page padding
  (`padding-inline: calc(4.1667vw + 20px)` desktop), sidebar width
  (`calc(25.2vw + 26px)`), hero-title caps that unlock at the wide cut.
- Verification is numeric: the same computed-style probe run on the replica
  must return the source's values at 1440 AND 1920 (see verify.md).

## Breakpoint variants on this platform (each cost a bug)

- Arbitrary variants like `min-[1280px]:` may silently not compile — use
  named breakpoints only. Define the source's measured cuts in `@theme`:
  `--breakpoint-md: 810px; --breakpoint-wide: 1600px;` then use `md:` /
  `xl:` (1280) / `wide:` prefixes.
- Sections whose layout *family* changes at the wide cut (recon 3a) get
  `wide:` variants — grid splits (`wide:grid-cols-[38%_1fr]`), heading
  alignment flips, extra cards + side rails. Touch only the `wide:` layer so
  the verified smaller breakpoints stay intact, then regression-check one
  width below the cut.
- **`hidden` loses to a base `block` on the same element** (CSS order, not
  class order). To hide an always-rendered extra element below the wide cut
  use `max-wide:hidden`, not `hidden wide:block`.

## Smooth scroll (Lenis)

If the motion audit found Lenis, add `lenis` to the import map (same major
version as the source), import it normally, and init in the layout
component's `useEffect` with the dumped options
(`new Lenis({ lerp: 0.1, autoRaf: true, autoToggle: true, /* …dumped */ })`,
`destroy()` on cleanup). Also add Lenis's recommended host CSS
(`html.lenis { height: auto }` etc.) and keep
`html { scroll-behavior: auto }`. `autoToggle` handles overflow:hidden
menus; framer-motion `useScroll` keeps working since the window still
scrolls.

## Display-font line-height (cost a real bug)

Condensed display faces (Anton, Oswald, Bebas…) have content boxes of
~1.4–1.5em — an eyeballed "tight" line-height like 0.8 makes multi-line
headings physically overlap. Read the source's **computed** line-height and
use that (usually 0.9–0.95 even when it looks tighter). Screenshot every
multi-line display heading as soon as it's built; don't wait for the final
verify pass.

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

## CMS-backed collections — never hardcode content arrays

The platform has a CMS; use it. Any content the source renders as a list
page + detail template (blog posts, works/projects, case studies, team
profiles…) is modeled as a CMS collection with seeded entries — **never** as
an `export const posts: Post[] = [...]` constant in `/lib` or a page file.
A hardcoded array is the #1 reason a delivered replica can't be handed to a
real owner: every content edit needs a code push, and the platform's content
editor shows nothing. This is a verified failure mode of autonomous runs —
the array gets written "as a scaffold" and never migrated.

Decision rule:

- List page + detail route (`/blog` + `/blog/[slug]`) → CMS collection,
  always.
- Repeating entries *without* detail pages (testimonials, FAQ items,
  job openings) → CMS collection when a site owner would plausibly add or
  edit them; code constants are fine for purely structural fragments (nav
  links, footer columns, feature bullets).
- One-off page copy (hero headline, section intros) stays in code.

Workflow — collection first, pages second:

1. **Derive the schema from recon.** The detail-template recon (≥2 entries
   opened) tells you what varies per entry — those fields are the schema.
   Conventions are shared with forms (root `type: "object"`, fields under
   `properties`, see the base skill's `forms.md`):
   - plain text `{ "type": "string" }`, number `{ "type": "number" }`
   - image `{ "type": "string", "format": "uri",
     "contentMediaType": "image/*", "accept": "image/*" }`
   - long-form body `{ "type": "string", "contentMediaType": "text/html" }`
   - tag list `{ "type": "array", "items": { "type": "string" } }`
   - Give every field a `"title"`, list always-present fields in
     `required`, and add `x-propertyOrder` so the platform editor shows
     fields in template order.
2. **Create the collection before writing its pages**:
   ```bash
   creght cms collection create --site_id=<p>/<s> --key=posts \
     --name="Blog Posts" --schema=./cms/posts.schema.json
   ```
3. **Seed the representative entries** (the 3–5 from scope discipline), one
   JSON file per entry, business fields under `body`, slug as a flag:
   ```bash
   creght content create --site_id=<p>/<s> --collection=posts \
     --data=./cms/seed/post-1.json --slug=why-ux-matters
   ```
   (A top-level `slug` in the file makes the CLI treat it as a full content
   object instead of a body — see the base skill's `cli.md`.) Keep the
   schema and seed JSON in the project under `./cms/` for reproducibility.
4. **Refresh generated types** (`creght pull` or dev-sync) so
   `/types/cms.d.ts` includes the collection, then
   `import type { Posts } from "./types/cms"` — never hand-write the item
   interface.
5. **Read via `talizen/cms` in `getServerSideProps`** (base skill `cms.md`):
   `listContents<Posts>("posts", { orderBy: … })` on the list page;
   `getContent` — or `getContentWithPrevNext` when the source's detail page
   has prev/next navigation — on the detail page, `notFound: true` for
   unknown slugs. Treat `body` fields as optional (optional chaining).

Long-form article bodies: store ONE richtext HTML string
(`"<h2>…</h2><p>…</p>…"`) rendered through `dangerouslySetInnerHTML` into a
styled prose container — NOT a custom array of typed block objects
(`[{t:"h2",text:…},…]`). The platform's editor edits HTML richtext; a
bespoke block format is uneditable there, which defeats the point of the
CMS.

Ordering and dates: if the source curates order (featured works first),
seed with `creght content create … --sort=<n>` and query
`orderBy: "sort"`; otherwise `created_at desc` is the default. Displayed dates ("Nov 18, 2024") are a
schema field formatted at render time with a manual formatter (locale-safe —
see the hydration note above).

Images referenced inside entries follow the same asset rules as everywhere
else: Unsplash hotlinks are fine during build/verify; before publish, upload
finals via `creght upload` and update the entries to CDN URLs with
`creght content update`.

## Platform features

- **Forms**: create before coding —
  `creght form create --site_id=… --key=contact-form --name=… --schema=schema.json`,
  then `submitForm<Payload>("contact-form", payload)` from the submit
  handler with explicit success/error UI. Verify later via
  `creght form logs --key=contact-form`.
- **Dynamic routes**: `/page/<dir>/[slug].tsx` +
  `getServerSideProps(context)` reading `context.params.slug` and fetching
  the entry from the CMS (`getContent` — see the collections section above,
  never a local constants array); return `{ notFound: true }` or
  `{ redirect: { destination: '/<list>', permanent: false } }` for unknown
  slugs; `generateMetadata({ params })` for per-entry titles.
- **Favicon**: `creght upload --file=favicon.svg --json` → put `file_url`
  into `metadata.icons.icon` (otherwise every page 404s /favicon.ico).
- JSX whitespace: text separated by `<br className="max-md:hidden" />` loses
  its space when the `br` hides — add an explicit `{" "}`.

## Breakpoint mapping (from recon's breakpoint cuts — cost a real bug)

Map the source's measured cut widths to Tailwind prefixes **before** writing
section markup, and use the same prefix everywhere:

- Mobile-first base styles = the stacked layout.
- The multi-column "desktop" layout goes on the prefix closest to the
  source's desktop cut — usually `lg:` (1024). Do **not** default to `md:`
  (768): sources are almost always still stacked at 768, and desktop
  three-column bands (pricing tiers, stat rows) placed on `md:` overflow at
  tablet widths.
- Fixed-width header chrome (blurb text, avatar clusters, extra buttons)
  usually appears only at the widest cut — put it on `xl:`.
- Grid *lines* / side paddings may follow a different (earlier) cut than the
  column layouts — the recon tablet screenshots are the authority.

A wrong mapping is cheap to fix early (one `sed` per prefix) and expensive
late — it invalidates every width's verification.

## Mobile variants (from the recon mobile audit)

Implement as responsive variants of the same components, not separate trees:
hamburger nav (animated dropdown panel + icon morph), wrapped hero title
(`max-md:whitespace-normal` + vw-based size), per-section column/visibility
changes, always-visible replacements for desktop cursor-follow effects, stacked footer
with reordered rows (`max-md:flex-col-reverse` where the audit says so).
