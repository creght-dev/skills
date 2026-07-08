# Toolbox — Differentiated mode (commercial de-identification)

**Trigger**: the user mentions commercial use, design-copyright /
infringement risk, "洗稿" / 去辨识度 / "make it usable as our own
template", or asks whether a finished replica can be shipped commercially.

Position it honestly first, once: a faithful replica of a paid template is
fine as a study but risky as a product — the exact design, used
commercially, is cleanest obtained by **buying the original template
license**. Differentiated mode is for the other path: *keep the bones,
replace the identity*. A recolor is not differentiation; the output must
pass the recognition test below.

Run it as a **separate new project** derived from the replica (never mutate
the study copy — clean provenance, and the study keeps its attribution).

**Inputs to look for in the study's workspace** (a well-run replica leaves
these; use them instead of re-probing the source from scratch):

- `SPEC.md` — the measured source spec. Everything in it that is *expressive*
  (palette, type pairing, ornament, chrome behaviors, watermark motifs) is
  raw material for the signature inventory; everything *structural* (routes,
  section order, breakpoints) is the bones you keep.
- `recon/` screenshots — the recognition-test baseline. Thumbnail-compare
  against THESE (the original source), not against the study replica.
- `site/cms/*.schema.json` + `seed/` — re-create collections in the NEW
  project and re-seed; never point two projects at one collection.
- The study's invented brand is disposable: it was made for attribution-safe
  study, not for shipping. Invent a fresh one for the template.

Then:

1. **Signature inventory first.** List what makes the source recognizable
   as *itself* — not the generic layout (a sidebar + section stack is
   genre, weakly protected) but the expressive combination: brand-mark
   conventions (slash-prefixed labels, wordmark tricks), decorative motifs
   (barcodes, notched corners, ruler ticks), distinctive chrome (vertical
   logo strip, avatar booking bar), background texture style, palette,
   type pairing. This list is the work order.
2. **Replace the identity layer as a whole set, not piecemeal**: a
   different hue family, a different free type pairing with different
   character (e.g. grotesque ↔ geometric), a new ornament language
   (plus-marks/dot-grids instead of barcodes/notches), a different
   corner/radius language (sharp ↔ rounded), new label conventions,
   regenerated background art from a different generator. One changed
   variable is a re-skin; the full set is a new identity.
3. **Restructure a few sections beyond re-skinning**: full-bleed bands →
   inset rounded cards, stacked tiers → side-by-side columns, a different
   hero mechanism. Layout bones may stay; their dressing must not.
4. **Recognition test (the acceptance gate)**: someone who knows the source
   template should NOT identify the new site as that template from a
   side-by-side thumbnail pass. If any single section still reads as the
   source, its signature elements weren't actually replaced.
5. **Brand & attribution hygiene**: invented brand name (never ® / ™ on
   marks you don't own), no source contact details or brand strings
   anywhere (grep for them), and remove the design-study attribution only
   after the design has genuinely diverged.
6. **Content truthfulness beats design risk in practice**: placeholder
   ratings, client counts, testimonials and prices are fabrications —
   shipping them is false-advertising exposure (under e.g. 中国《广告法》/
   《反不正当竞争法》, often the bigger real-world risk than layout
   similarity). Mark every fabricated figure as placeholder-to-replace and
   say so explicitly in the handoff report.
7. **Asset hygiene for production**: download and re-host all stock imagery
   on the platform CDN (no hotlinks); small avatars become generated
   placeholders (initials SVG), never real-person photos implying they are
   staff or clients; keep license provenance in code comments. Hotlinks
   hide in TWO places — the code's image map AND inside CMS entry bodies
   (covers, inline article images); update both.
8. **Multilingual studies**: the identity layer spans every locale. Rewritten
   copy must land in ALL `/messages/*.json` catalogs and in each CMS entry's
   `_i18n[locale]` translations — rewriting only the default language ships
   a half-swapped identity in the other locale. Grep the old brand and old
   slogans per locale before calling it done.

The Contract in `../SKILL.md` still applies in full — differentiated mode
adds the identity layer on top of it, it does not replace it.
