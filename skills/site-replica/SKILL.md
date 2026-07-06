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

## Prerequisite: a driveable browser

The whole pipeline depends on probing pages in a real browser (navigate,
scroll, hover, drag, screenshot, run JS). Before phase 1, confirm you have
one and set it up if not — see "Browser tooling" in `references/recon.md`.
Static HTTP fetches are NOT a substitute: they miss rendered layout,
animations, hover states, and anything client-rendered. If no browser can be
made available, stop and tell the user replication cannot be verified.

## Operating Contract (autonomous mode)

- Work end-to-end without pausing for confirmation. The task is done only when
  the completion checklist at the bottom passes.
- Never trust your first guess about how the source behaves. Every visual and
  interactive detail must be **measured in a browser**, not inferred from a
  single screenshot. Guessed hover states and animation timings are the #1
  source of "看起来不像" complaints.
- **Numbers over eyes, always.** Enumerate the source's breakpoints from its
  stylesheets before anything else (recon 3a) and work one representative
  width per interval. Typography comes from `getComputedStyle` per interval
  — desktop is often fluid `calc(px + vw)`; sample two widths and solve it
  (recon 3c). Layout relationships (column lines, edge alignment, block
  widths, easy-to-miss table columns) come from `getBoundingClientRect` in
  container coordinates (recon 3d). Acceptance is a numeric diff of the same
  probes run on the replica (verify.md), not a visual impression.
- Detect scroll-feel libraries (Lenis etc.) and copy their exact config
  (motion-audit); a replica without the source's scroll inertia feels wrong
  even when every pixel matches.
- At kickoff, ask the user for a 30–60s screen recording of the source (slow
  scroll top→bottom, plus mouse passes over menus, cards, and list rows).
  Extract frames (`ffmpeg -vf "fps=3,scale=1280:-1"`) and read them as motion
  ground truth — it catches pins, page-turn overlaps, and hover reveals that
  probing misses. Don't block on it; keep probing while you wait.
- Verify with screenshots after every push. Compare against source captures
  side by side. Fix, push, re-verify. Do not report success from code review
  alone.
- If a probe fails (stale browser lock, unstable element, lazy content),
  handle it with the recipes in the references and keep going.

## Hard Rules — license-safe replication

The design (layout, spacing, motion, interaction patterns) is replicated;
protected content is not:

1. **Never copy image/video/font assets** from the source. Substitute
   photography with free-license stock (Unsplash/Pexels) matched slot-by-slot
   to each source image's subject and mood — this reads far better than
   generated art; see the search recipe in `references/build.md`. Generate
   seeded SVG art only for abstract graphics, logos, and textures. Fonts:
   identify the family and load it from Google Fonts / Fontsource if it is a
   free face; otherwise pick the closest free alternative.
2. **Never copy body copy verbatim.** Short functional labels (nav items,
   button text, section names, stats, dates) may match. Sentences and
   paragraphs get rewritten: same length, same tone, same information shape,
   your own words.
3. **All code is written from scratch.** Never lift generated code
   (Framer/Webflow output, bundled JS) from the source.
4. Note the source URL in the project README/description as a design study.

## Page coverage is the contract

The most common autonomous-run failure is replicating only the homepage.
Guard against it structurally:

- Recon **must** produce a complete **route inventory** before any building:
  every same-origin route reachable from any nav, footer, card, button, or
  in-content link, crawled recursively until no new routes appear. List
  pages AND the detail templates behind them (`/works/<slug>`, blog posts…).
- The inventory is the delivery contract. Maintain it as a coverage table
  (route → recon'd? → built? → verified?) and keep it in your task list —
  one task per route. "首页做完了" is not a milestone; "inventory 全绿" is.
- A card grid or "View Work" button that links somewhere is a page you owe.
  If a linked route 404s on the source, note it as out of scope explicitly.
- The completion checklist fails if any inventory row is unbuilt or
  unverified — including detail pages, even when the user never mentioned
  them by name.
- Coverage is **two-level: routes AND sections.** For each page, recon builds
  a section inventory (from landmarks / annotation attributes like
  `data-framer-name`) and every section gets its own capture, build task, and
  verification row. Walking a page by fixed scroll steps silently skips
  sections that fall between stops (a pricing block between testimonials and
  FAQ is the classic casualty) — walk the section list, not scroll offsets.

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
- Match the source's responsive behavior at **one representative width per
  media-query interval enumerated in recon 3a** (typically ~390 mobile,
  ~1024 tablet, ~1440 desktop, ~1728 wide desktop — but the enumerated cuts
  are the authority, not this list). Mobile is not
  "the desktop squeezed": headers become hamburger menus, grids reflow, some
  elements are mobile-only or desktop-only. Audit mobile separately (recon
  reference). Tablet is not "the desktop squeezed" either — sources commonly
  keep the mobile stacked layout (sometimes with the desktop grid lines) all
  the way up to ~1024/1200; probe where the source's layout actually flips
  before choosing your own breakpoints (recon reference, "breakpoint cuts").

## Completion checklist

The task is complete when all of these hold on the Creght **preview URL**:

- [ ] The route inventory from recon is fully green: every route (including
      collection detail pages) is built and verified. Re-crawl the *replica*
      and diff its link graph against the inventory — a link on the replica
      that leads to a missing page fails this item.
- [ ] Every in-scope page renders with no console errors and no missing
      resources (favicon included).
- [ ] Screenshots at one representative width per enumerated breakpoint
      interval (recon 3a; typically 390 / 1024 / 1440 / 1728) structurally
      match the source's at the same widths (content max-width, alignment,
      ordering, layout family per section — a wide-desktop interval left
      unimplemented fails this item).
- [ ] The numeric diff passes (verify.md): re-running the type-ramp and
      landmark probes on the replica returns the source's values at two
      desktop widths (fluid formulas) and within ~5px for column lines,
      edge alignments and block widths; if the source runs a smooth-scroll
      library, the replica's wheel-decay curve matches.
- [ ] Every animation found in the motion audit exists and matches: entrance
      effects, scroll-driven effects (pins, curtain overlaps, horizontal
      tracks), marquees (direction + px/s), hovers (audited element by
      element — including menu links and collapsed list rows), cursor-follow
      CTAs, carousels/drag, blend/invert effects.
- [ ] Every section of every page appears in a replica screenshot compared
      1:1 against a source capture — no sampling; a section never
      screenshotted counts as unverified (multi-line display headings
      especially: check line separation).
- [ ] Mobile nav opens/closes; no horizontal overflow anywhere (run the
      overflow scan from `references/verify.md`).
- [ ] Forms submit successfully through the platform and the submission
      appears in `creght form logs`.
- [ ] License-safe asset rules (slot-matched free stock / generated art, no
      source assets) and rewritten-copy rules hold everywhere.
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
  stock-image sourcing recipe + placeholder-art module, container/width
  system, SSR safety, forms, dynamic routes, and implementation gotchas that
  cost real debugging time.
- `references/verify.md` — the push→compare loop, mobile walkthrough,
  overflow scan, interaction re-verification, and finishing steps.
