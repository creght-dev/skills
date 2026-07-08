# Toolbox — Phase 4: gate evidence recipes

The gates themselves live in `../SKILL.md`; this file is how to produce
their evidence cheaply, and the loop that turns red gates green. Nothing
here is a mandate — if a recipe misfits the site, get the same evidence
another way and note why.

## The loop

1. `creght push --site_id=<p>/<s> --dir=<dir>` (from the workspace root).
2. Open the preview URL; first load after a push takes a few seconds.
3. Produce gate evidence (below). Anything that differs goes on the fix
   list **with a re-measurement of the source** — never fix from memory.
4. Fix → push → re-verify the changed features plus one neighbor.

Disable smooth scroll before scripted scrolling; with Lenis active use
`window.scrollTo`, wheel events are smoothed.

## G2 + G3 — structural census and screenshot pairs

```bash
node <skill>/scripts/structural-census.mjs <sourceURL> <previewURL> 1440 ./census-shots
```

- Diffs rewrite-invariant properties per similarity-aligned section:
  height (±4%), img/link/button counts, font-size multisets, left-edge
  anchor sets. Repeat at 390; run once with the menu overlay open on both
  sites (interactive states are where curated checks go blind).
- Two complementary failure modes — both channels or neither: numbers
  catch what eyes can't resolve (a 66px menu vs 30px, 37 vs 23 images,
  sections 17% short); eyes catch what invariants can't express
  (overlapping glyphs, a wrong-mood hero, a bad line break). So **read
  every emitted pair**, flagged or not, and judge composition, color,
  imagery mood, overlaps, wrapping.
- Expect three flag classes: real bug (fix), semantic difference such as
  `<button>` vs styled div (waive with reason), tool noise (if it exceeds
  ~1/3 of flags, demote the tool for this site and patch it).
- Exit 3 = segmentation refused (sidebar / horizontal / canvas genre):
  map sections manually instead of trusting a table the segmenter
  couldn't build.

## Numeric spot probes — when a flag needs an exact value

- **Type ramp**: computed fontSize / letterSpacing / fontWeight at 1440
  AND 1920 — fluid `calc` formulas must match at both widths; matching one
  means the formula is wrong.
- **Block edges**: on grid-line designs the target is **0px** on the
  measured anchors, not ~5px — a `gap`-based grid fails exactly this while
  passing everything else. Check gutters and border-radius per card
  family; they differ per section.
- **Box-model spacing**: gaps, section paddings, adjacent-block rhythm
  within ~2px (directly readable — no reason to accept approximation).
- **Scroll feel**: wheel-decay samples on the replica match the source's
  curve (same Lenis lerp).
- After adding `wide:` variants, re-run the probes one width below the cut
  to prove smaller breakpoints didn't move.

## G5 — interaction re-verification

- Hover each audited element; compare on-state with the source's on-state
  capture. Include menu-overlay links (open it first), collapsed list
  rows, and a cursor sweep across each card type. Scope selectors to the
  overlay — `a[href="/works"]` happily matches a page link instead.
- Tailwind v4 gotcha when probing numerically: `scale-*` / `rotate-*` set
  the independent `scale` / `rotate` CSS properties — computed `transform`
  stays `none`; read those properties too or a working hover reads as
  missing.
- Open-state typography: with the menu open, diff nav fontSize/x/y against
  the source's open-menu measurements.
- Marquees: sample an item's x twice → px/s within ±10% of the audit.
- Letter animations: screenshots at ~300ms and ~600ms after reload — the
  reveal wave progresses like the source's.
- G4 evidence: record the replica's cold load (`recordVideo`, ~8–10s),
  extract frames with the system ffmpeg, compare phase-for-phase with the
  source's cold-load frames from the motion audit.
- Carousels: click next and capture mid-transition; drag 250px and confirm
  snap; check the ends. Blend/invert text: screenshot the overlap region —
  inverted glyphs, not white text.
- Nav panels: hover EVERY parent item and pair-compare each panel with the
  source's captures (layout differs per item); capture mid-close (~120ms
  after mouse-off) to prove the open/close transition animates; while a
  panel is open confirm only the hovered item is highlighted and the header
  background matches the source's open state.
- Unhover direction: for underlined links, screenshot ~150ms after moving
  off — the collapse direction (usually toward the right) must match.
- Parallax watermarks: read the decorative text's `transform` at two scroll
  offsets; a static value where the source moves is a fail.
- Functional controls end-to-end: click the language switcher and assert
  the URL/locale actually changes (desktop AND mobile drawer); submit the
  search; a nonexistent URL renders the replicated 404 with HTTP 404.
- Touch pass: on a `hasTouch` context at ~834px, first tap on a nav parent
  opens its panel without navigating; a child tap navigates; a mask tap
  closes. (Single taps on hover-chrome firing emulated mouseenter+click is
  the classic "panel flashes then jumps" bug.)
- Per-template hero probe: on every template (not just home), assert title
  fontSize, hero height, and content left edge against the source's
  measurements — inner-page heroes drift first when only home was measured.

## G6 — responsive walkthroughs

Mobile (390×844): hamburger opens/closes and navigates; walk every
section against the source's mobile captures (hero wrap, grid collapse,
footer stacking order). Overflow scan:

```js
() => {
  const bad = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > innerWidth + 8 || r.left < -8))
      bad.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
  });
  return { scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 10) };
}
```

Repeat the scan at every width family — 768 / 820 / 912 / 1024 — not just
390 (verified failure: desktop three-column pricing on `md:` overflowed
only at 768–834). At 768, check each section keeps the source's layout
family (stacked vs columns) and desktop-only chrome stays hidden.
Transient overflow from entrance animations is fine; static overflow is a
bug.

## G7 — console and resources

Browser console on every route: no errors, no 404s (favicon is the classic
one — upload it and wire `metadata.icons`). A blank page with a React
error usually means an SSR/hydration issue (dates, random values) or a
duplicate-React import-map problem (`?external=react` missing).

## G1 — coverage crawl diff

Crawl the replica preview exactly as recon crawled the source (same-origin
`a[href]` from every page, recursive). Diff against the inventory: a
replica link reaching no page = build it; an inventory route no link
reaches = wire it up. The diff must come back empty.

## G8 — platform

- Fill and submit each form on the preview; expect the success state, then
  confirm `creght form logs --key=…` shows the entry.
- `creght content list --collection=<key>` returns the seeded entries; a
  rendered list title matches a CMS entry (proves the page reads the CMS);
  grep the repo for `export const posts`-style arrays duplicating any
  collection.

## Finish

Report: preview URL, editor URL, page list, the gate table (evidence →
result → waivers with reasons), asset/copy substitutions, and the publish
command — publish only on request. Keep the local directory; further edits
are edit → push → verify cycles.
