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

# Site Replica — any site → Creght

Rebuild a live website as a Creght site with matching layout, typography,
motion design, and interactions. The deliverable is an **original
implementation** that reproduces the *design*, not a copy of the source's
assets or code. The base `creght` skill owns the platform rules (routing,
import map, CMS, forms, CLI) — read it before building.

This file holds what never bends: the **Contract**, the **Gates**, and how
tools are governed. Everything else — how to measure, probe, build, verify —
lives in the toolbox (`references/`) as recipes consulted when the task
needs them. Recipes advise; only this file commands.

## Contract — the only unconditional rules

1. **Original, license-safe implementation.** Never copy source assets
   (images/video/fonts), never copy sentences or paragraphs (short
   functional labels may match), never lift generated code. Substitute with
   slot-matched free stock and rewritten copy (recipes in build.md); note
   the source URL as a design study in the README. If the user wants
   commercial de-identification ("去辨识度"), switch to
   `references/differentiated.md`.
2. **Coverage is the contract.** Recon produces a route inventory plus a
   per-page section inventory; every row must end up built and verified. A
   linked page or a section never captured is undelivered work.
3. **Collection content lives in the platform CMS** — anything rendered as
   list + detail becomes a collection with seeded entries, never a
   hardcoded array (workflow in build.md).
4. **The live source is the oracle.** Acceptance re-measures the running
   source — never your own spec, notes, or memory; a wrong spec happily
   validates a wrong build.
5. **Autonomous, verified on the preview URL.** Work end-to-end without
   pausing for confirmation; nothing is done from code review alone.
   Publish only when the user asks.

## Triage — size the job first (ten minutes, then commit to a tier)

A driveable browser is the hard prerequisite (setup in recon.md); static
fetches see nothing that matters — if none is available, stop and say so.
Then size the site and pick the depth the tier justifies:

- **Pages & collections**: one-page brochure vs 15-route site with CMS.
- **Motion density**: watch the cold-load recording (G4's capture doubles
  as this) and one slow scroll — static layout, or choreography-heavy?
- **Layout genre**: vertical bands (the tooling fits) vs sidebar /
  horizontal-scroll / canvas (census will refuse; plan manual mapping).

State the tier in one line ("15 routes, heavy motion, band layout — full
battery") and skip audits the tier doesn't justify. Ask the user for a
30–60s screen recording at kickoff (never block on it); self-record the
source's cold load regardless.

## Pipeline

| Phase | Goal | Toolbox |
| --- | --- | --- |
| 1 Recon | Route + section inventory; measured spec (tokens, breakpoints, type, alignment) | `references/recon.md` |
| 2 Motion | Motion spec with numbers; cold-load storyboard | `references/motion-audit.md` |
| 3 Build | Original Creght implementation from the spec | `references/build.md` + base skill |
| 4 Verify | All gates green on the preview URL | `references/verify.md` |

Phases 3–4 alternate per feature. A user-reported mismatch is a failed
verification: re-measure the source first, then fix.

## Gates — outcome checks; each ends "fixed" or "waived with a written reason"

The parenthesis names the default, cheapest evidence path. If that tool
misfits this site, produce the same evidence another way and say why.

- **G1 Coverage**: crawling the replica reaches every inventory route and
  finds no broken links (crawl-diff recipe, verify.md). The 404 page is part
  of the inventory — probe a nonexistent URL on the source during recon.
- **G2 Structure parity**: per-section heights, element counts, font-size
  sets and left-edge anchors match the source
  (`scripts/structural-census.mjs`).
- **G3 Visual parity**: every per-section source/replica screenshot pair
  has been READ and judged equivalent — composition, color, imagery mood,
  overlaps, wrapping (census `shotsDir` output). The pairs are evidence;
  the judgment is yours, and it is the acceptance.
- **G4 Cold load**: the replica's self-recorded first load matches the
  source's phase-for-phase (recording recipe, motion-audit.md).
- **G5 Motion & interaction**: every motion-spec row observed working on
  the preview — hovers (nav panels, cards, links), menu overlay, accordions,
  carousels, scroll effects, scroll feel (recipes in motion-audit.md /
  verify.md). A control that looks functional must function (language
  switcher switches); hover-driven chrome must also work under touch.
- **G6 Responsive**: no horizontal overflow at any width family; mobile
  menu works; each section's layout family matches the source per
  breakpoint (walkthrough recipes, verify.md).
- **G7 Hygiene**: zero console errors and zero 404s, favicon included, on
  every route.
- **G8 Platform**: form submissions appear in `creght form logs`; lists
  and details render from seeded CMS entries; grep finds no hardcoded
  collection arrays.
- **G9 License**: grep finds no source brand strings; assets and copy
  satisfy Contract rule 1.

## Tool governance

- Gates bind **outcomes**, not tools. A tool is the default way to produce
  evidence — never the requirement itself.
- Tools earn trust in tiers: experimental → default → gate-evidence. If
  more than ~1/3 of a tool's flags in one run are noise, demote it for
  this site and patch it before trusting it again.
- Tools are part of the workspace: when one is clumsy or noisy, **patch
  the tool, don't endure it**. Friction is requirements input for the
  tool, not something to suffer through.
- Tool failure must be loud: a tool that can't handle the site says so
  (census exits 3 when segmentation fails) and you fall back to manual
  evidence — never trust output the tool itself doubts.

## Growth discipline — how this skill absorbs new lessons

A new lesson lands in the toolbox as a recipe, by default. It may be
promoted here only if it is a true invariant or mechanically enforceable at
low cost — and adding an unconditional rule means merging or retiring one.
This file stays under ~150 lines. Prefer teaching a script over teaching
prose: script fixes are permanent and cost no attention.

## Toolbox map

- `references/recon.md` — browser setup; route/section crawl; token,
  breakpoint, type-ramp, alignment and box-model measurement; mobile and
  tablet passes; lazy-content pitfalls.
- `references/motion-audit.md` — cold-load recording API; rAF sampler;
  Framer appear-JSON; hover diffing; marquees; carousels; Lenis; text,
  blend and pin effects.
- `references/build.md` — project setup; grid-alignment build rules; stock
  imagery sourcing; animation primitives; CMS and form workflows;
  framework gotchas.
- `references/verify.md` — gate evidence recipes: the push→compare loop,
  census usage, crawl diff, overflow scan, interaction re-verification.
- `references/differentiated.md` — commercial de-identification mode.
- `scripts/structural-census.mjs` — structure differ + paired screenshots.
