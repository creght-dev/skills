# Phase 3 — Build On Creght

Read the base `creght` skill first. This file covers replication-specific
build rules and gotchas.

## Project Shape

Create or pull a Creght project, then structure the port as:

```text
/pages/Index.tsx, /pages/Works.tsx
/pages/<collection>/[slug].tsx
/components/Nav.tsx, Hero.tsx, Footer.tsx
/components/shared.tsx
/lib/art.ts
/cms/*.schema.json, /cms/seed/*.json
index.css
talizen.config.ts
```

Collection content belongs in CMS, not code arrays.

## Study Artifacts Stay Out Of The Project

Everything in the pulled workspace is a site file: `creght push` uploads it, the
editor shows it, and anything under `public/` is publicly fetchable. Source
research must never land there — recon specs, source screenshots and
recordings, motion audits, structural census output, crawl dumps,
differentiation notes, downloaded source assets, and any file naming the source
host or brand.

Keep the study beside the workspace, not inside it:

```text
work/
  study/     recon shots, SPEC.md, census output, audit notes — never pushed
  site/      the pulled Creght workspace — site files only
```

When artifacts must live inside the workspace, write a workspace-root
`.creghtignore` **before the first push**:

```gitignore
/study/
/recon/
/census-shots/
SPEC.md
*.audit.md
```

Then run `creght diff` and read the create list: site files only.
`.creghtignore` semantics (negation, anchoring, what is already skipped) are in
the base skill's `references/cli.md`. Ignoring a path does not delete a copy
already pushed — delete that remotely first, then ignore it.

Keep source identity out of the files that do ship:

- No source URL, brand, or template name in code, comments, `talizen.config.ts`,
  `AGENTS.md`, CMS entries, `public/`, or asset filenames. Grep for the host and
  brand before the first push, not only at G9.
- Placeholder copy uses the invented brand, never the source's.
- Provenance comments name the asset's own license/source (the stock provider),
  not the replicated site.
- The design-study attribution goes in the report to the user.

## Dependencies And Assets

- For `framer-motion`, use import map URL with `?external=react`.
- Fonts go through Google Fonts links in `customCode.head`, using exact weights
  from recon.
- Never ship source images, videos, fonts, code, or long copy.
- For photographic slots, use license-free stock matching subject, mood, and
  palette. For abstract graphics, generate deterministic SVG/data URI art.
- Build an image slot map before searching. Verify important thumbnails
  visually; HTTP 200 does not mean the image matches.
- Hotlinks are acceptable during build/verify. Before publish, download final
  assets, `creght upload`, and replace URLs with Creght CDN URLs.
- Runtime-generated Func assets use `ctx.assets.upload(...)` and store returned
  metadata, never base64 payloads.

## Width, Grid, And Type

Define content width once in `index.css` and use it consistently:

```css
@utility inner-max {
  margin-inline: auto;
  width: 100%;
  max-width: 1400px;
}
```

Sections own full-bleed background and side padding; inner content sits in
`inner-max`. Marquees may remain full-bleed.

For visible grid-line designs, avoid CSS `gap` when columns must snap to lines.
Use no-gap grids and in-cell padding. Measure recurring off-grid anchors rather
than forcing all blocks to grid lines.

Turn recon's measured type ramp into named CSS utilities. For desktop fluid
sizes, use the measured `calc(Bpx + Avw)` formulas. Do not eyeball one-width
`vw` values. Verify computed styles at 1440 and 1920.

Condensed display fonts often need line-height around 0.9-0.95 despite looking
tighter; use computed source values and screenshot multi-line headings early.

## Responsive Mapping

Define measured breakpoint cuts in `@theme` and use named prefixes. Do not put
desktop layouts on `md:` unless recon proves tablet is desktop-like. Check one
width below every wide cut after adding `wide:` variants.

Use responsive variants of the same components for mobile: hamburger nav, hero
wrap/order changes, section column changes, hover-only replacements, and footer
reordering.

## Motion Primitives

Build reusable primitives in `components/shared.tsx` from the motion audit:

- `FadeIn` for viewport entrances.
- `SlideInLetters` with `whitespace-nowrap` word spans and real spaces between
  words.
- `RevealHeading` for scroll-driven letter reveal.
- `Scramble` for decode effects.
- `useClock` initialized SSR-safe in `useEffect`.
- Marquee via duplicated children and CSS keyframes.

Avoid hydration hazards: no `new Date()` or random values during render; avoid
`toLocaleString()` for server/client-sensitive numbers.

For Lenis, import the same major version and options the audit found. Add
recommended host CSS. Put `data-lenis-prevent` on overlay scroll containers and
keep close controls sticky/fixed.

Framer gotchas:

- Variant propagation breaks through wrappers with their own `animate` object.
- Ancestor stacking contexts isolate `mix-blend-mode`.
- Carousel drag needs real pixel constraints and measured slide width.
- Images under drag surfaces need `draggable={false}` and tracks need
  `select-none`.

## CMS Collections

List + detail content must become CMS collections. Repeating entries without
detail pages also use CMS when a site owner would edit them. One-off section
copy may stay in code.

Workflow:

1. Derive schema from recon of at least two detail entries.
2. Create the collection before writing list/detail pages.
3. Seed representative entries under `cms/seed`.
4. Pull/refresh generated `/types/cms.d.ts`.
5. Read via `talizen/cms` in `getServerSideProps`.
6. Use `notFound: true` for unknown slugs.

Store long-form rich text as one HTML string rendered in a styled prose
container, not a custom block array. Use `sort` for curated order. Treat CMS
body fields as optional in code.

## Functional Controls

- Multilingual source means real platform i18n, messages, locale-aware links,
  and a switcher that changes locale on desktop and mobile.
- Hover nav on touch: first tap opens, second/child tap navigates, mask closes.
  Guard `mouseenter` with touch state.
- While a nav panel is open, suppress route-active highlight if the source does.
- Do not nest fixed mobile overlays under ancestors that gain `filter`,
  `backdrop-filter`, or `transform`; they become the containing block.
- Test mobile menus at short heights with submenus expanded.
- Build `/pages/404.tsx` and `/pages/500.tsx` when the source has error pages.

## Platform Features

- Forms: create schema first, submit with `submitForm`, and verify logs.
- Dynamic routes: `/pages/<dir>/[slug].tsx`, `context.params.slug`,
  CMS `getContent`, `notFound`/redirect, and `generateMetadata` as needed.
- Favicon: upload and wire `metadata.icons.icon`.
- JSX whitespace around hidden `<br>` often needs explicit `{" "}`.
