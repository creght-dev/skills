# Phase 1 — Recon: Measure The Source Site

Everything happens in a real browser. Output: route list, section list, layout
numbers, design tokens, breakpoint behavior, and screenshots for later diffing.

## Browser

Use available browser automation first. Otherwise set up Playwright MCP or a
local Playwright script loop. Before recon, navigate to the source, resize to
1440x900, screenshot once, and run one `evaluate` snippet. If that fails, fix
tooling; do not guess from fetched HTML.

Hygiene:

- Kill stale Playwright MCP locks if needed.
- Disable smooth scroll before scripted scrolling:
  `document.documentElement.style.scrollBehavior = "auto"`.
- Lazy content requires viewport-by-viewport screenshots, not only full-page
  captures.
- Measure with `getBoundingClientRect`; screenshots include scrollbar and
  rendering artifacts.

## Route Inventory

Do this first. Breadth-first crawl same-origin `a[href]` from `/`, visiting new
routes until a pass adds none. Also check footer nav, logo, CTAs, and
`/sitemap.xml`.

Probe a nonexistent URL and include the 404 design. Collection list pages imply
detail templates: open at least two entries and record fields that vary. The
inventory table is the delivery contract:

| route | type | recon | built | verified |
| --- | --- | --- | --- | --- |
| `/` | page | | | |
| `/works` | list | | | |
| `/works/<slug>` | detail template | | | |

## Section Inventory

For each page, dump section structure sorted by document offset using landmarks,
`data-framer-name`, readable class names, or semantic tags. Build one checklist
row per section. Capture by checklist, not fixed scroll increments.

## Tokens

Run a homepage probe for fonts, colors, loaded font faces, background colors,
and repeated text roles. Record display/body font families and weights, accent
colors, background tints, dark-section colors, divider opacity, and the hero +
section-heading text metrics.

For headings, capture per-line detail: spans/colors, forced breaks, computed
line-height, letter-spacing, weight, and annotation placement.

If text visually fills a container but computed font-size is too small, detect
SVG stretched text (`textLength`, `lengthAdjust`, blend modes) and rebuild with
an equivalent mechanism, not inflated font size.

## Breakpoints

Read breakpoint values from stylesheets first; do not sweep blindly. Deduplicate
media query cuts, then pick one representative width per interval, commonly
390, 1024, 1440, and 1728.

For Framer, inspect `ssr-variant hidden-*` classes to build a section x
breakpoint matrix. If CSSOM is blocked, fetch CSS text and regex media queries;
only then fall back to resize sweeps.

## Layout Measurement

Measure at 1440 and 1920, plus mobile/tablet intervals. Record:

- content max width, side padding, header height
- section vertical padding, grid columns/gaps, image aspect ratios
- box-model rhythm: gaps, row/column gaps, adjacent block spacing
- left/right anchors relative to the content container
- visible grid lines and recurring non-line anchors
- card radii per family, not one global radius
- fixed-pixel mosaics and composite card bounds
- overlay/menu open-state typography and geometry

Desktop sizes are often fluid. If a font, padding, width, or chrome dimension
differs between 1440 and 1920, fit a `calc(Bpx + Avw)` formula through both
samples. Tablet and phone are often fixed.

For pinned/scroll-driven sections, detect sticky/fixed elements and wrappers
whose height greatly exceeds visible content. Record sticky top, parent height,
pin travel, and what changes across the scroll.

## Chrome States

Measure header and nav per state:

- top vs scrolled header height/background/text color
- every nav parent hover panel
- language/search/user controls open state
- menu overlay layout and transitions

If the source is multilingual, language switching is functionality, not a prop.

## Template Heroes

Run type and box probes on every template hero, not only home: list pages,
details, about, services. Record title size, hero height, and content left edge.

## Mobile And Tablet

At about 390x844, reload and walk every section. Record hamburger behavior,
menu panel/fullscreen overlay, hero order/wrap/size, heading sizes, list/grid
columns, hidden/revealed elements, and footer order.

At about 768x1024, walk once to catch tablet layout family and hidden desktop
chrome. Pricing/stat/timeline multi-column sections often break here.

## Deliverable

Write a spec note with route inventory, section inventory, token table,
breakpoint cuts, per-section layout numbers at representative widths, and the
reference screenshot set. Then move to motion audit.
