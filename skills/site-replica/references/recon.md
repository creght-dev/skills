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

## 3b. Pinned / scroll-driven section detection

Do this per section — pins are where naive replicas diverge hardest:

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

## 5. Deliverable of this phase

A spec note containing: page list with routes; token table; per-section
layout numbers at 1440/1920/390; the reference screenshot set. Only then move
to the motion audit.
