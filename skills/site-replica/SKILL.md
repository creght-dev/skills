---
name: site-replica
description: >
  Use when asked to replicate, clone, or rebuild an existing website onto the
  Creght platform ("复刻这个网站", "clone this site 1:1", "any site to
  Creght", "把这个网站搬到 Creght"). Runs an autonomous pipeline: probe the
  source site in a real browser, audit every animation and interaction,
  rebuild it as an original Creght React/Tailwind implementation with
  license-safe placeholder assets, then verify against the source in a loop
  until desktop and mobile reach visual and behavioral parity.
---

# Site Replica — Any Site To Creght

Rebuild a live website as an original Creght implementation that matches the
source's design, layout, motion, and interactions. Read the base `creght` skill
first for platform rules.

This file contains the contract and gates. Recipes live in `references/`; load
only the phase file needed for the current work.

## Contract

1. Original, license-safe implementation. Never copy source assets, videos,
   fonts, long copy, or code. Use slot-matched stock/generated assets and
   rewritten copy. Note the source as a design study. If commercial
   de-identification is requested, read `references/differentiated.md`.
2. Coverage is mandatory. Recon produces route and section inventories; every
   row must be built and verified.
3. Collection content uses platform CMS. List + detail content is never a
   hardcoded array.
4. The live source is the oracle. Re-measure the source before fixing mismatch.
5. Work autonomously through preview verification. Publish only when asked.

## Triage

Spend about ten minutes sizing the job, then choose depth:

- Pages/collections: single page vs multi-route/CMS site.
- Motion density: static, moderate, or choreography-heavy.
- Layout genre: vertical bands vs sidebar/horizontal/canvas/manual mapping.

Ask for a 30-60s screen recording but do not block. Self-record the cold load
regardless. State the tier in one line and skip audits only when the tier makes
them unnecessary.

## Pipeline

| Phase | Goal | Read |
| --- | --- | --- |
| 1 Recon | Route/section inventory and measured layout spec | `references/recon.md` |
| 2 Motion | Motion and interaction spec with numbers | `references/motion-audit.md` |
| 3 Build | Original Creght implementation | `references/build.md` + base skill |
| 4 Verify | Gates green on preview URL | `references/verify.md` |

Phases 3 and 4 alternate per feature. A user-reported mismatch means
verification failed: re-measure source, fix, push, re-verify.

## Gates

Each gate ends as fixed or waived with a written reason.

- G1 Coverage: crawl replica and match the route inventory, including 404.
- G2 Structure: section heights, element counts, font-size sets, and left-edge
  anchors match source.
- G3 Visual: read every source/replica screenshot pair and judge composition,
  color, imagery mood, overlap, and wrapping.
- G4 Cold load: recorded replica intro matches source phase-for-phase.
- G5 Motion/interaction: all audited hovers, menus, accordions, carousels,
  scroll effects, touch behavior, and language/search controls work.
- G6 Responsive: no static horizontal overflow; mobile menu works; each
  breakpoint family matches source layout.
- G7 Hygiene: no console errors or 404 assets; favicon included on every route.
- G8 Platform: forms log submissions; lists/details render from seeded CMS;
  grep finds no duplicated hardcoded collection arrays.
- G9 License: no source brand strings; assets/copy satisfy the contract.
- G10 Asset delivery: production assets are Creght-hosted/generated locally; no
  source hotlinks. Runtime Func assets use `ctx.assets.upload`.

## Tool Governance

- Gates bind outcomes, not specific tools. Use alternate evidence when a tool
  misfits and say why.
- If more than about one third of a tool's flags are noise, demote it for this
  site and patch it before trusting it again.
- Tool failure must be loud. If segmentation or probing refuses the site, fall
  back to manual evidence.
- Prefer improving scripts over adding prose when a lesson is repeatable.

## Toolbox

- `references/recon.md`: browser setup, crawl, sections, tokens, breakpoints,
  type, layout, chrome states, mobile/tablet audit.
- `references/motion-audit.md`: recording, hover diffing, marquees, cold load,
  Framer parameters, scroll effects, carousels, Lenis.
- `references/build.md`: project setup, width/type systems, stock imagery, CMS,
  motion primitives, platform gotchas, functional controls.
- `references/verify.md`: push-compare loop, structural census, crawl diff,
  overflow scan, interaction checks.
- `references/differentiated.md`: commercial de-identification mode.
- `scripts/structural-census.mjs`: structural differ and paired screenshots.
