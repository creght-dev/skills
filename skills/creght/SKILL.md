---
name: creght
description: >
  Use when working with Creght sites or the Creght CLI, including pulling site
  code locally, pushing local changes, running watch-mode sync, writing
  Creght-compatible React page/component code, CMS and form integration,
  routing, styling, metadata, previewing, publishing, or debugging
  local-to-platform workflows.
---

# Creght

Creght sites are React-based websites rendered by the Creght platform. Local
agents usually work by using the Creght CLI to pull site files, editing those
files locally, then pushing, syncing, or previewing through Creght.

This skill is for general-purpose agents. Do not assume Creght-system-only
tools are available. If the current environment exposes Creght tools such as
linting, schema creation, module type fetching, versioning, or patch helpers,
use them when appropriate; otherwise inspect local files and use the CLI.

## Core Model

- The CLI handles login, project creation and discovery, pull, push, sync,
  preview, and publish workflows, plus platform data and asset operations.
- Rendered Creght site URLs can expose site discovery metadata at
  `/.well-known/creght.json`. Use this when the user provides a public page URL
  instead of an editor URL, local directory, or explicit project/site IDs.
- `pull` downloads remote site files into a local directory.
- `push` uploads the current local directory snapshot to Creght and exits.
- `sync` is watch mode: it pushes the current local snapshot, then keeps
  listening for local file changes and pushes them in realtime.
- The CLI does not render sites locally.
- Rendering, CMS, assets, realtime preview, and publication are handled by the
  Creght backend and web app.
- Site code must follow Creght platform rules; do not treat a Creght site as a
  generic Vite, Next.js, or browser SPA project.
- If the user's message does not contain an actionable requirement, such as only
  attaching an image without instructions, do not create or modify a website.
  Ask the user what they want to build or change.
- The Creght platform does not yet support authenticated backend data
  operations, such as user login and registration. This capability is still
  under development. If users need similar functionality, implement only the
  frontend portion and clearly remind them that authenticated backend behavior is
  not available yet.

## Default Workflow

1. Locate the site directory. If the user provided a rendered page URL, first
   fetch that URL's origin plus `/.well-known/creght.json` to discover the
   `project_id` and `site_id`, then use the CLI pull workflow if the site is
   not local yet.
2. Read local project guidance such as `AGENTS.md` if present.
3. Read `talizen.config.ts` when imports, metadata, custom code, or site-level
   styling may be involved.
4. Inspect the relevant `/page`, `/component`, `/types`, and root config files
   before editing.
5. Apply focused changes that match existing project conventions.
6. Validate with available local checks or Creght platform checks. If no local
   renderer exists, use `creght push`, `creght sync`, or `creght preview` as
   the verification path. Use `creght push` for a one-time upload and
   `creght sync` when you want watch mode.

## Hard Platform Rules

- Pages live in `/page` as `.tsx` React components.
- Keep reusable UI in `/component` or another shared components directory.
- Do not introduce `react-router-dom`, `next/link`, `next/router`,
  `next/navigation`, `getStaticProps`, or `getStaticPaths`.
- Use native anchors such as `<a href="/about">...</a>` for navigation.
- Prefer `getServerSideProps(context)` for route params and first-render data.
- Read route params from `context.params` when SSR params are available.
- Do not proactively create `*.canvas.ts` or `*.canvas.tsx` files. They are
  platform editor preview entries. Edit existing canvas files only when the user
  explicitly asks.
- Use Tailwind v4 utility classes for component styling. Avoid inline `style`
  props and ad-hoc `<style>` tags in page components.
- Use relative paths for local project imports. The Creght platform does not
  support alias imports such as `@/lib/utils`; write them as relative imports
  like `../lib/utils` or `./lib/utils` from the importing file.
- Use structured `metadata` for SEO instead of custom `seo` fields or raw
  `<title>` / `<meta name="description">` tags.
- Do not implement authenticated backend data operations such as user login or
  registration yet; the Creght platform does not support them. If users need
  similar functionality, implement only the frontend portion and clearly remind
  them that authenticated backend behavior is not available yet.

## Reference Map

- `references/cli.md`: CLI install/use, endpoint defaults, platform data
  commands, rendered URL site discovery, and asset upload commands.
- `references/site-code.md`: routing, page/component structure, import maps,
  and config rules.
- `references/cms.md`: CMS data fetching and generated schema usage.
- `references/forms.md`: form submissions and payload typing.
- `references/seo.md`: site and page metadata.
- `references/i18n.md`: multilingual sites — locale routing, reading the
  locale, `_i18n` content storage, and `/messages` UI text.
- `references/css.md`: Tailwind v4 and `index.css` conventions.
- `references/sitemap.md`: root-level sitemap generation.
- `references/carousel.md`: carousel/slideshow default approach.

For most site-authoring tasks, read `references/site-code.md` first, then load
the specific topic reference only if the task touches that area.
