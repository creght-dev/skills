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

## Numeric diff — the acceptance test screenshots can't provide

Screenshots catch structure; only numbers catch "不饱满" (subtly-off type
and spacing). Re-run recon's probes against the preview and diff:

- **Type ramp**: the computed-style probe (3c) at 1440 AND 1920 — every
  fontSize / letterSpacing / fontWeight must equal the source's values
  (fluid `calc` formulas make both widths pass simultaneously; matching only
  one width means the formula is wrong).
- **Structural landmarks**: the container-coordinate probe (3d) at 1440 and
  1728 — column lines, right-edge alignments, block widths within ~5px.
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
- Marquee speed: sample an item's x twice → px/s must match the audit (±10%).
- Letter animations: screenshot at ~300ms and ~600ms after reload — the
  reveal wave must progress like the source's.
- Deck/fan or other layered hovers: settled-state screenshot vs source.
- Carousel: click next mid-transition capture (push effect visible?); drag
  250px and confirm snap; check ends don't wrap weirdly.
- Blend/invert text: screenshot the overlap region with the effect active —
  inverted colors in the glyphs, not hidden or plain-white text.
- Forms: fill and submit on the preview; expect the success state, then
  confirm `creght form logs --site_id=… --key=…` shows the entry.

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
