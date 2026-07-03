# Phase 4 — Verify loop: push, compare, fix, repeat

Nothing counts as done until it is observed working on the Creght preview
URL. Run this loop per feature during the build and once more over the whole
site at the end.

## The loop

1. `creght push --site_id=<p>/<s> --dir=<dir>`
2. Open `https://<site_id>.preview.creght.cn/` in the browser. First load
   after a push can take a few seconds — wait 4–6s before screenshotting.
3. Capture the replica at the same widths and scroll offsets as the source
   reference set (1440 / 1920 / 390; disable smooth scroll first).
4. Put replica and source captures side by side. Anything that differs goes
   on the fix list with a re-measurement of the source (never fix from
   memory).
5. Fix → push → re-verify only the changed features + one neighbor (regression
   check).

## Interaction re-verification (on the replica)

Re-run the Phase 2 probes against the preview:

- Hover each audited element; screenshot on-state; compare with the source's
  on-state capture.
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

## Console + resources

Check the browser console on every page: no errors, no 404s (favicon is the
classic one — upload it and wire `metadata.icons`). A blank page with a
React error usually means an SSR/hydration issue (dates, random values) or a
duplicate-React import-map problem (`?external=react` missing).

## Finish

- Walk the completion checklist in `SKILL.md` item by item.
- Report to the user: preview URL, editor URL, page list, the motion spec
  table (what was measured → what was built), asset/copy substitutions made,
  and the publish command (`creght publish --site_id=<p>/<s>`) — publish only
  on request.
- Keep the local directory; further edits are `edit → push → verify` cycles.
