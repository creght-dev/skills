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
assets or code.

This skill assumes the base `creght` skill is available. Read it before the
build phase; it owns the platform rules (routing, import map, metadata,
forms, CLI). This skill adds the replication pipeline on top.

## Operating Contract (autonomous mode)

- Work end-to-end without pausing for confirmation. The task is done only when
  the completion checklist at the bottom passes.
- Never trust your first guess about how the source behaves. Every visual and
  interactive detail must be **measured in a browser**, not inferred from a
  single screenshot. Guessed hover states and animation timings are the #1
  source of "看起来不像" complaints.
- Verify with screenshots after every push. Compare against source captures
  side by side. Fix, push, re-verify. Do not report success from code review
  alone.
- If a probe fails (stale browser lock, unstable element, lazy content),
  handle it with the recipes in the references and keep going.

## Hard Rules — license-safe replication

The design (layout, spacing, motion, interaction patterns) is replicated;
protected content is not:

1. **Never copy image/video/font assets** from the source. Generate
   placeholder artwork instead — seeded SVG data URIs with palettes matched to
   the source's mood (see `references/build.md`). Fonts: identify the family
   and load it from Google Fonts / Fontsource if it is a free face; otherwise
   pick the closest free alternative.
2. **Never copy body copy verbatim.** Short functional labels (nav items,
   button text, section names, stats, dates) may match. Sentences and
   paragraphs get rewritten: same length, same tone, same information shape,
   your own words.
3. **All code is written from scratch.** Never lift generated code
   (Framer/Webflow output, bundled JS) from the source.
4. Note the source URL in the project README/description as a design study.

## Pipeline

Run the phases in order. Each phase has a dedicated reference — read it when
you enter the phase, not before.

| Phase | Goal | Reference |
| --- | --- | --- |
| 1. Recon | Full-site capture: pages, layout metrics, breakpoints, design tokens | `references/recon.md` |
| 2. Motion audit | Measure every animation, hover, and interactive behavior | `references/motion-audit.md` |
| 3. Build | Creght project setup + original implementation | `references/build.md` |
| 4. Verify loop | Push → preview → compare → fix, until parity | `references/verify.md` |

Phases 1–2 produce a **spec** (notes with numbers: px, ms, easing, colors,
speeds). Write it down as you measure — screenshots rot, numbers don't.
Phases 3–4 alternate per feature: port a section, verify it, move on. When a
user reports a mismatch mid-run, treat it as a failed verification for that
feature: re-measure the source first, then fix.

## Scope discipline

- Default scope: every page reachable from the source's primary nav, plus
  detail pages of listed collections (project/blog items). Confirm scope only
  when the source has an unbounded surface (e.g. hundreds of CMS entries) —
  then replicate the template with 3–5 representative entries.
- Match the source's responsive behavior at three checkpoints minimum:
  ~1440 desktop, ~1920 wide desktop, ~390 mobile. Mobile is not "the desktop
  squeezed": headers become hamburger menus, grids reflow, some elements are
  mobile-only or desktop-only. Audit mobile separately (recon reference).

## Completion checklist

The task is complete when all of these hold on the Creght **preview URL**:

- [ ] Every in-scope page renders with no console errors and no missing
      resources (favicon included).
- [ ] Desktop 1440/1920 and mobile 390 screenshots structurally match the
      source's at the same widths (content max-width, alignment, ordering).
- [ ] Every animation found in the motion audit exists and matches: entrance
      effects, scroll-driven effects, marquees (direction + px/s), hovers
      (audited element by element), carousels/drag, blend/invert effects.
- [ ] Mobile nav opens/closes; no horizontal overflow anywhere (run the
      overflow scan from `references/verify.md`).
- [ ] Forms submit successfully through the platform and the submission
      appears in `creght form logs`.
- [ ] Placeholder-asset and rewritten-copy rules hold everywhere.
- [ ] Site pushed; preview URL reported to the user. Publish only when the
      user asks.

## Reference map

- `references/recon.md` — browser probing: capture strategy, design-token
  extraction, layout measurement across viewports, page discovery, mobile
  audit, lazy-content and screenshot pitfalls.
- `references/motion-audit.md` — systematic interaction audit: hover diffing,
  marquee speed, letter-level text animation sampling, blend-mode detection,
  carousels, and how to translate measurements into framer-motion parameters.
- `references/build.md` — Creght project layout, import map, fonts,
  placeholder-art module, container/width system, SSR safety, forms, dynamic
  routes, and implementation gotchas that cost real debugging time.
- `references/verify.md` — the push→compare loop, mobile walkthrough,
  overflow scan, interaction re-verification, and finishing steps.
