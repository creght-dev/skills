# Phase 1 — Recon: measure the source site

Everything here happens in a real browser. Output of this phase: a written
spec — page list, layout numbers, design tokens, breakpoint behavior — plus
reference screenshots for later diffing.

## Browser tooling — get a browser before anything else

Check whether the environment already exposes browser-automation tools
(commonly a Playwright MCP server: tool names like `browser_navigate`,
`browser_snapshot`, `browser_take_screenshot`, `browser_evaluate`,
`browser_run_code`). If yes, use those.

If not, set one up:

- Claude Code: `claude mcp add playwright -- npx @playwright/mcp@latest`
  (then restart the session so the tools load).
- Codex / other MCP clients: register `npx @playwright/mcp@latest` as an MCP
  server in the client's MCP config.
- No MCP support at all: fall back to a local Playwright script loop —
  `npm i playwright && npx playwright install chromium`, then write small
  Node scripts per probe (navigate → act → screenshot → print JSON) and run
  them with the shell tool. Slower, but every probe in this skill works the
  same way.

Capability sanity check before starting recon: navigate to the source URL,
resize to 1440×900, take one screenshot, and run one `evaluate` snippet. If
any of these fail, fix tooling first — do not fall back to guessing from
fetched HTML.

## Browser hygiene (read first, saves 20 minutes)

- **Stale browser locks**: if the Playwright MCP errors with "Browser is
  already in use", kill the cached instance
  (`pkill -f "ms-playwright-mcp/mcp-chrome"`), wait 2s, retry.
- **Disable smooth scroll before any scripted scrolling**:
  `document.documentElement.style.scrollBehavior = 'auto'`. Sites with
  `scroll-behavior: smooth` make `window.scrollTo` asynchronous and your
  screenshots land mid-flight (fixed headers can even vanish from captures).
- **Lazy content**: full-page screenshots miss lazy-loaded images and
  below-fold sections. After the full-page capture, also step through the
  page viewport by viewport (~850px steps, 600–800ms settle per step) and
  screenshot each stop. Blank bands in a full-page capture usually mean lazy
  content, not empty space — verify with a viewport shot at that offset.
- Screenshot **viewport width ≠ window width**: a visible scrollbar steals
  ~15px. Measure layout via `getBoundingClientRect` in the page, never by
  reading pixel positions off screenshots alone.

## 1. Page discovery — produce the route inventory FIRST

Do this before measuring anything else. The inventory is the delivery
contract (see SKILL.md); an incomplete crawl here silently shrinks the whole
task to "just the homepage".

- Breadth-first crawl: start from `/`, collect
  `document.querySelectorAll('a[href]')`, keep same-origin paths, visit every
  new route, repeat until no new routes appear. Nav links alone are NOT
  enough — detail routes (e.g. `/works/<slug>`) usually appear only on card
  grids, "View Work" buttons, or footer links.
- Also check: footer nav (often has routes the header lacks), logo link,
  CTA buttons, and `/sitemap.xml` if it exists.
- Collection pages (work/blog lists) imply detail templates — open at least
  two different entries to learn what varies between them (that difference
  is your template's data model).
- Write the inventory as a table and register one task per route:

  | route | type | recon | built | verified |
  | --- | --- | --- | --- | --- |
  | `/` | page | | | |
  | `/works` | list page | | | |
  | `/works/<slug>` ×4 | detail template | | | |
  | … | | | | |

- Only mark the crawl done when a full pass adds zero new routes.

## 1b. Section inventory — per page, before measuring

Dump each page's section-level structure (annotation attributes like
`data-framer-name`, readable class names, or landmarks) sorted by document
offset, and turn it into a **section checklist**. Capture the page by
walking that checklist — never by fixed scroll steps, which silently skip
sections that fall between two stops (a pricing block between testimonials
and FAQ is the classic casualty). A name in the dump you never captured
("Pricing", "Desktop - Monthly") = recon incomplete. The checklist carries
through the whole run: one build task and one verification capture per
section.

## 2. Design tokens

Run once on the homepage:

```js
() => {
  const fonts = new Set(), colors = new Set();
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (el.innerText?.trim())
      fonts.add(`${cs.fontFamily.split(',')[0]}|${cs.fontWeight}|${cs.fontSize}`);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(cs.backgroundColor);
  });
  return {
    fonts: [...fonts].slice(0, 40),
    bg: [...colors].slice(0, 30),
    faces: [...document.fonts].map(f => `${f.family} ${f.weight}`)
      .filter((v, i, a) => a.indexOf(v) === i),
  };
}
```

Record: display font + weights, body font + weights, accent color(s),
background tints, dark-section colors, divider opacities. Key type styles to
capture precisely (font-size, letter-spacing, line-height, weight): the hero
title and each section heading.

For hero/section headings capture **per-line detail**, not just the block:
computed color of each child span (multi-tone headings are common — gray
first lines, white last lines), forced `<br>` breaks vs natural wrap,
computed line-height (display faces usually sit at 0.9–0.95 even when they
*look* tighter), and where small "(LABEL)" annotations sit (often
superscript at the title's top-right, not inline beside it).

**Stretched-to-fill headlines (Framer SVG text).** If a headline visually
spans its full container but the computed font-size implies a much narrower
glyph run (e.g. 15 characters at 108px filling 1360px), the text is being
stretched — Framer renders these as SVG `<text textLength=…
lengthAdjust="spacingAndGlyphs">`, often wrapped in an ancestor with
`mix-blend-mode: difference` (white fill inverts to dark over light
backgrounds). Detect it by walking the heading's ancestors for `svg` /
blend modes, and confirm by comparing box width vs font-size × char count.
Rebuild with the same mechanism (a responsive `<svg><text textLength>`
component), not by inflating font-size — the glyph height must stay at the
measured size while the run stretches horizontally.

## 3. Layout measurement — do this at multiple widths

The single most common replication error is content width. Measure the same
elements at ~1440 **and** ~1920 (and note the difference):

```js
const r = el => { const b = el.getBoundingClientRect();
  return { left: b.left, right: b.right, width: b.width }; };
// measure: header inner content, hero content, a section's content box
```

- If content edges hug the viewport minus a fixed padding at 1440 but sit
  centered with large margins at 1920 → there is a **max content width**
  (compute it: right − left at 1920). Backgrounds usually stay full-bleed
  while content is capped. Record: max width, page side padding.
- Also record: header height, grid column counts and gaps, image aspect
  ratios (from rendered boxes), section vertical paddings.
- Framer sources annotate structure via `data-framer-name` attributes — dump
  the distinct names once; they reveal the section inventory and element
  roles ("Hero Image Container", "Ticker", "Dark Card"…). Webflow uses
  readable class names similarly.

## 3a. Breakpoint cuts — enumerate from CSS first, never sweep blindly

Do NOT discover breakpoints by resizing through arbitrary widths and
eyeballing — per-section × per-width visual inspection is slow and misses
cuts (the verified failure: a ~1600 "wide desktop" cut where pricing/FAQ
split into two columns, 2-up grids become 3-up with a vertical side rail,
centered headings left-align, and capped hero titles unlock — invisible if
you only checked 1440). Instead, **read the breakpoint set straight out of
the stylesheets in one call**:

```js
() => {
  const cuts = new Set();
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; } // CORS
    const walk = (rs) => { for (const r of rs) {
      if (r.media && r.media.mediaText.includes('width'))
        [...r.media.mediaText.matchAll(/(min|max)-width:\s*([\d.]+)px/g)]
          .forEach(m => cuts.add(Math.round(parseFloat(m[2]))));
      if (r.cssRules) try { walk(r.cssRules); } catch (e) {}
    } };
    walk(rules);
  }
  return [...cuts].sort((a, b) => a - b); // e.g. [809,810,1279,1280,1599,1600]
}
```

The deduped widths define the interval list (e.g. <810 / 810–1279 /
1280–1599 / ≥1600). From then on, capture and probe at **one representative
width per interval** (e.g. 390 / 1024 / 1440 / 1728) — every later step
(type ramp 3c, landmarks 3d, section captures, verification) runs once per
interval, nothing more, nothing missed.

**Framer bonus — per-section variant matrix without any resizing.** Framer
renders every breakpoint variant of a section in the DOM and toggles them
with `ssr-variant hidden-<hash>` classes; the stylesheet maps each
`hidden-*` class to a media range. In one pass, list each section's
distinct `hidden-*` classes → you get a section × breakpoint matrix: which
sections have a dedicated layout for which interval (a section with a
wide-range variant needs a `wide:` build task) and which are fluid-only (no
variants). Webflow similarly exposes `w-hidden-<range>` classes.

Notes on the intervals themselves:

- Framer templates commonly run phone <810, tablet 810–1279, desktop ≥1280,
  plus often a wide cut at 1600 — but always read the real values, don't
  assume.
- Tablet is usually the **mobile stacked layout, not a narrow desktop** —
  often with the desktop's vertical grid lines and side padding retained.
  Fixed-width chrome (header blurbs, avatar clusters) frequently stays
  hidden until the widest cut.
- These cuts drive the build's breakpoint mapping (see build.md): define
  them as named breakpoints in `@theme` and use one representative width
  per interval in the verify loop too.
- Fallback when CSSOM is unreadable (all sheets CORS-blocked): fetch the
  CSS files as text and regex the media queries; only if that also fails,
  fall back to a resize sweep — then include ≥1600 widths.

## 3c. Measured type ramp — extract, never eyeball

Font sizes read off screenshots are always wrong ("看起来不像/不饱满" is
usually this). Extract computed styles per element instead:

- Build a probe list of ~30–60 text snippets (one per distinct text role:
  hero intro, display headings, statements, row titles, body, buttons,
  labels…). For each, find the deepest element containing the snippet and
  record `fontSize / lineHeight / letterSpacing / fontWeight` from
  `getComputedStyle` at **every breakpoint family** (390, 810/1024 for
  tablet, 1440 AND 1920 for desktop).
- **Desktop sizes are often fluid, not fixed.** If the same element measures
  differently at 1440 and 1920, solve the linear function through both
  points: `a = (s1920 − s1440) / 4.8` px-per-vw, `b = s1440 − 14.4a` →
  `font-size: calc(Bpx + Avw)`. Two samples define it exactly. Tablet and
  phone are usually fixed px (verify with one mid-width sample: 810 vs 1260
  identical ⇒ fixed).
- Line-height and letter-spacing are usually **relative** (0.9 / −0.06em)
  and constant across widths — record them as ratios, not px.
- Page side padding, sidebar width, and capped hero-title widths follow the
  same pattern: measure at two desktop widths, fit `calc(Bpx + Avw)`, and
  note any hard caps or breakpoint unlocks (e.g. title max-width 710px that
  releases at the 1600 cut).
- Group elements sharing identical metrics into named roles — the build
  turns each role into one CSS utility class (see build.md "measured type
  ramp").

## 3d. Structural landmarks — relationships come from the DOM, not vision

Alignment relationships (what lines up with what) must be measured, not
judged from screenshots. Method:

- Pick the page's content container (padded box) as the coordinate system;
  record every landmark as `left/right relative to container-left` via
  `getBoundingClientRect`.
- Extract per section: column lines (e.g. a recurring 25% line that rows,
  quotes, arrows and CTAs all start on), right-edge alignment (buttons/text
  flush to container-right), block widths (a statement capped at 65.7%
  width starting at 21.8%), extra table columns that are easy to miss
  visually (a light-gray "Description" header), and which element each CTA
  aligns with.
- Repeat the probe at the wide cut (1728) — the same landmarks reveal
  layout-family changes (3b/3a).
- These numbers are the build spec. During verification, run the *same
  probe* on the replica and diff numerically (see verify.md).

## 3b. Pinned / scroll-driven section detection

Do this per section — pins are where naive replicas diverge hardest.
**Run the scan once per breakpoint interval (3a), not just at one width**:
pins can exist only in a specific interval's layout variant (verified: a
pricing left column that is sticky only in the ≥1600 two-column layout —
invisible to a 1440-only scan). Record the sticky element's `top` offset
and its parent's height (= pin travel) as part of the spec:

- **Height mismatch heuristic**: wrapper height ≫ its visible content height
  (e.g. an 1800px section whose inner "Sticky content" is 900px) means the
  section is pinned and scrubbed by scroll. Record the pin length and what
  changes across it (text fill? panel swap? horizontal track?).
- Probe for sticky/fixed elements:

```js
() => [...document.querySelectorAll('*')].filter(el => {
  const p = getComputedStyle(el).position;
  return (p === 'sticky' || p === 'fixed') && el.getBoundingClientRect().height > 200;
}).map(el => el.getAttribute('data-framer-name') || String(el.className).slice(0, 40))
```

- Annotation names containing "trigger", "Sticky", "Scroll content" are
  explicit scroll-animation markers. Every one becomes a motion-spec row
  answering "what does this trigger drive?" — an uninvestigated trigger is
  an unfinished audit. (A "Logo trigger" + "Hero scale trigger" pair, for
  example, usually means the hero wordmark morphs into the header logo and
  the next section slides over a pinned hero.)

## 4. Mobile audit (~390×844) — separate pass, not an afterthought

Reload the site at mobile size and walk the whole page again. Specifically
record:

- **Header**: almost always logo + hamburger. Open the menu and capture it —
  note whether it's a dropdown panel or a full-screen overlay, item order,
  and what the toggle icon morphs into.
- Hero: does the title wrap? What size (measure computed font-size)? Element
  order often changes (title → image → meta).
- Section headings: measure mobile font-size and whether wrapping is allowed
  (`white-space` computed value).
- Each list/grid: how many columns survive? Some items hide entirely on
  mobile (e.g. 3-up image rows becoming 2-up); some desktop hover-only
  elements become always-visible inline elements.
- Footer: stacking order commonly differs from desktop DOM order (socials
  above copyright, nav links one-per-line).

## 4b. Tablet audit (~768×1024) — quick pass, catches real bugs

Walk the page once at 768 and screenshot the section list. You are checking
two things: which layout family each section uses at this width (stacked
like mobile, or columns like desktop — see "breakpoint cuts"), and which
desktop-only elements are still hidden. Multi-column bands (pricing tiers,
stat rows, timelines) are the sections that break here; note whether the
source stacks them.

## 5. Deliverable of this phase

A spec note containing: page list with routes; token table; breakpoint cut
widths; per-section layout numbers at 1440/1920/768/390; the reference
screenshot set. Only then move to the motion audit.
