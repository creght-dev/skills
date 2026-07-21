# Phase 2 — Motion Audit

Audit every interactive element and animation before building. Output a table:
element, trigger, behavior, parameters, and verification item.

## Recording

If the user provides a screen recording, start there. Also self-record the
source cold load unconditionally: fresh Playwright `recordVideo` context,
navigate, wait 8-10s, close context, extract frames with system ffmpeg, and read
the frame sequence.

Compare timelines from content first paint, not frame 0. At verification, record
the replica the same way and compare phase-for-phase.

## Inventory

Probe candidates from recon: nav/menu links, logo, buttons, list rows, cards,
images, marquees, carousels, footer links, contact rows, hero elements, section
headings, overlays, accordions, and controls.

Do not miss:

- every link inside menu overlays
- collapsed service/capability rows
- cursor-following CTA pills on cards
- decorative watermarks/parallax text
- touch behavior for hover chrome

## Hover Audit

For each candidate, capture padded before/hover/after-off screenshots and a
subtree style diff for color, background, opacity, transform, decoration, and
radius. Trust screenshots over style diffs when effects live on parents or DOM
variants swap.

Record site-wide hover language, but confirm per element. Close leftover
overlays before probing. Capture unhover direction; underline collapse direction
is part of the spec.

On touch contexts, first tap should open hover panels without navigating, second
tap or child tap navigates, mask closes.

## Scroll And Motion Checks

- Smooth scroll: detect Lenis/Locomotive/ScrollSmoother, dump options, sample
  wheel decay, and copy the same major version/config when needed.
- Marquees: sample item x twice in viewport; speed = delta/time. Re-sample on
  hover for pause behavior.
- Framer entrances: parse `__framer__appearAnimationsContent` and map
  `data-framer-appear-id` to offsets, springs, delays, easing, and opacity.
- Runtime rAF animations: sample `opacity`, `transform`, and rects across the
  first 8-9s when `getAnimations()` is empty but elements move.
- Text entrances: detect per-character spans, offsets, opacity, stagger
  direction/delay, scramble effects, and live clocks.
- Layered decks: hover and recover per-layer rotation, x/y offset, z-order, and
  trigger region.
- Blend/invert: record elements using `mix-blend-mode`; this controls z-order.
- Carousels: click next, capture mid-transition, test drag threshold and ends.
- Parallax: compare absolute element positions at two scroll offsets.
- Pinned sections: sample inner transforms/opacity at five or more offsets
  across the pin; name patterns precisely.

Common pinned patterns: hero curtain/page-turn, wordmark shrinking into header
logo, vertical flip titles, horizontal tracks, and panel swaps.

## Output

Produce a motion spec with concrete px offsets, angles, speeds, delays, easing
or spring parameters, trigger regions, and touch behavior. Every row becomes a
Phase 4 verification item.
