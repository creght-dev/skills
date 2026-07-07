# Phase 4 — Verify loop: push, compare, fix, repeat

Nothing counts as done until it is observed working on the Creght preview
URL. Run this loop per feature during the build and once more over the whole
site at the end.

## The loop

1. `creght push --site_id=<p>/<s> --dir=<dir>`
2. Open `https://<site_id>.preview.creght.cn/` in the browser. First load
   after a push can take a few seconds — wait 4–6s before screenshotting.
3. Capture the replica at the same widths as the source reference set
   (1440 / **1728** / 1920 / 768 / 390; disable smooth scroll first — with
   Lenis active use `window.scrollTo`, wheel events are smoothed) by walking
   the per-page **section checklist** from recon — every section gets its
   own capture. Sampling by scroll offset ships bugs in the sections you
   skipped (overlapping heading lines, misaligned bands).
4. Put replica and source captures side by side. Anything that differs goes
   on the fix list with a re-measurement of the source (never fix from
   memory).
5. Fix → push → re-verify only the changed features + one neighbor (regression
   check).

## Structural census — mechanical coverage that FEEDS the visual pass

Two complementary failure modes, neither channel may replace the other:

- *Eyes without numbers* miss what screenshots can't resolve — a menu built
  at 66px instead of 30px, a bento with 23 images where the source had 37,
  sections 10–17% short, columns 24px off the grid lines. All verified
  misses of judgment-curated probe lists (builder and verifier share the
  same blind spots).
- *Numbers without eyes* miss what invariants can't express — overlapping
  glyphs from an inherited `text-indent` (passes every count/height/size
  check), a hero photo with the wrong mood, wrong easing, broken z-order.

So the census script is **evidence and coverage for the agent's visual
judgment — never the acceptance test itself**. Run it against the **live
source as oracle** (never your own spec — a wrong spec validates a wrong
build):

```bash
node <skill>/scripts/structural-census.mjs <sourceURL> <previewURL> 1440 ./census-shots
```

It mechanically diffs rewrite-invariant properties per similarity-aligned
section — height (±4%), img/link/button counts, font-size multisets,
left-edge anchor sets — and, with the last arg, emits **paired per-section
screenshots** (`secN-src.png` / `secN-rep.png`). Then:

1. Every flagged row is a fix-list item (counts are load-bearing: an image
   diff catches a wrongly-split composite card; a size-multiset diff
   catches a mis-sized menu).
2. **Read every screenshot pair** — flagged or not — and judge visually:
   composition, color, imagery mood, overlaps, motion states. The pairs
   exist so the visual walk has mechanical coverage instead of sampled
   coverage; the judgment in them is yours, not the script's.
3. Re-run after fixes; repeat at 390; run once with the menu overlay open
   on both sites (interactive states are where curated lists go blind).
4. If segmentation declares failure (exit 3: sidebar / horizontal / canvas
   genres), fall back to manual section mapping — do not trust a table the
   segmenter couldn't build.

"Invariants clean" plus "every pair visually judged equivalent" together
are the acceptance — neither alone.

## Numeric diff — the acceptance test screenshots can't provide

Screenshots catch structure; only numbers catch "不饱满" (subtly-off type
and spacing). Re-run recon's probes against the preview and diff:

- **Type ramp**: the computed-style probe (3c) at 1440 AND 1920 — every
  fontSize / letterSpacing / fontWeight must equal the source's values
  (fluid `calc` formulas make both widths pass simultaneously; matching only
  one width means the formula is wrong).
- **Structural landmarks**: the container-coordinate probe (3d) at 1440 and
  1728 — column lines, right-edge alignments, block widths within ~5px.
- **Block-edge alignment**: for grid-line designs, diff every section's key
  block left-edges against the source's measured anchors (line positions +
  the non-line anchors). Target is **0px**, not ~5px — a `gap`-based grid
  fails this while passing everything else, and that single failure reads
  as "没有秩序感" to the user. Also diff card gutters (60/20px-class values)
  and the border-radius of each card family (they differ per section).
- **Box-model spacing**: grid/flex gaps, section paddings and adjacent-block
  vertical rhythm within ~2px of the source's computed values (these are
  directly readable properties — no reason to accept approximation).
- **Scroll feel**: if the source runs Lenis, wheel-decay samples on the
  replica should match the source's curve frame-by-frame (same lerp).
- After adding `wide:` variants, regression-run the same probes one width
  *below* the cut (1440) to prove smaller breakpoints didn't move.

## Interaction re-verification (on the replica)

Re-run the Phase 2 probes against the preview:

- Hover each audited element; screenshot on-state; compare with the source's
  on-state capture. Include the nav/menu overlay links (open the menu
  first), every collapsed list row (expansions), and a cursor sweep across
  each card type (cursor-follow CTA pills). Beware duplicate hrefs when
  targeting: `a[href="/works"]` may match a page link instead of the menu
  link — scope the selector to the overlay.
- **Tailwind v4 gotcha when probing hovers numerically**: v4's
  `scale-*` / `rotate-*` utilities set the independent `scale` / `rotate`
  CSS properties — computed `transform` stays `none`. Read
  `getComputedStyle(el).scale` and `.rotate` too, or a working hover reads
  as "missing" and you'll chase a non-bug.
- **Open-state typography**: with the menu open, diff the nav links'
  fontSize/x/y against the source's open-menu measurements (same for
  accordions/modals) — closed-state probes never catch an oversized menu.
- Marquee speed: sample an item's x twice → px/s must match the audit (±10%).
- Letter animations: screenshot at ~300ms and ~600ms after reload — the
  reveal wave must progress like the source's.
- Cold-load choreography: record the replica's first load (`recordVideo`
  context, ~8–10s), extract frames with the system ffmpeg, and compare the
  sequence phase-for-phase against the source's cold-load frames from the
  motion audit (same elements entering, same order, comparable timing).
- Deck/fan or other layered hovers: settled-state screenshot vs source.
- Carousel: click next mid-transition capture (push effect visible?); drag
  250px and confirm snap; check ends don't wrap weirdly.
- Blend/invert text: screenshot the overlap region with the effect active —
  inverted colors in the glyphs, not hidden or plain-white text.
- Forms: fill and submit on the preview; expect the success state, then
  confirm `creght form logs --site_id=… --key=…` shows the entry.
- CMS: `creght content list --site_id=… --collection=<key>` returns the
  seeded entries; spot-check that a title rendered on the preview's list
  page matches a CMS entry (proves the page reads the CMS, not a leftover
  constant); grep the repo for hardcoded content arrays
  (`export const posts`-style) duplicating any collection — finding one
  fails verification.

## Mobile walkthrough (390×844)

- Hamburger opens/closes, links navigate, icon morphs.
- Walk the entire page; screenshot each section; compare with the source's
  mobile captures (header, hero wrap, grids, footer stacking/order).
- Horizontal overflow scan (marquees excluded by design):

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

Overflowing letter-spans during an entrance animation are fine; static
overflow is a bug.

## Tablet walkthrough + multi-width overflow sweep

Repeat the overflow scan at every width family, not just 390 — resize
through **768 / 820 / 912 / 1024** and check
`document.documentElement.scrollWidth <= innerWidth` at each stop (the
verified failure mode: desktop three-column pricing placed on `md:`
overflowed only at 768–834). Then walk the page once at 768 and compare
section-by-section against the source's tablet captures: same layout family
per section (stacked vs columns), desktop-only chrome still hidden, and the
stacked→columns flip happening at the same cut as the source (recon's
"breakpoint cuts" note is the reference).

## Console + resources

Check the browser console on every page: no errors, no 404s (favicon is the
classic one — upload it and wire `metadata.icons`). A blank page with a
React error usually means an SSR/hydration issue (dates, random values) or a
duplicate-React import-map problem (`?external=react` missing).

## Coverage gate — run before calling anything "done"

1. Open the route inventory from recon. Every row must be built AND
   verified. Detail-template rows count per representative entry.
2. Crawl the **replica** preview the same way you crawled the source
   (collect same-origin `a[href]` from every page, recurse). Diff against
   the inventory:
   - Replica link → no matching page (404 / falls back to home): missing
     page, go build it.
   - Inventory route → no replica link reaching it: navigation is
     incomplete, wire it up.
3. Only when the diff is empty does the run proceed to the checklist.

## Finish

- Walk the completion checklist in `SKILL.md` item by item.
- Report to the user: preview URL, editor URL, page list, the motion spec
  table (what was measured → what was built), asset/copy substitutions made,
  and the publish command (`creght publish --site_id=<p>/<s>`) — publish only
  on request.
- Keep the local directory; further edits are `edit → push → verify` cycles.
