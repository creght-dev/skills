---
name: creght
description: >
  Use when working with Creght sites or the Creght CLI, including pulling site
  code locally, pushing local changes, resolving sync conflicts, writing
  Creght-compatible React pages/components code, CMS, form, Auth, and Func
  backend integration, routing, styling, metadata, previewing, publishing,
  site templates (recommending one, starting a site from one), site version
  snapshots and rollback, domain binding, DNS/SSL, website analytics,
  environment variables, editor operations, or debugging local-to-platform
  workflows.
---

# Creght

Creght sites are React websites rendered by the Creght platform. General agents
usually use the Creght CLI to pull site files, edit locally, then diff, push, or
preview through Creght. Do not assume Creght-system-only tools are available;
use them if exposed, otherwise inspect files and use the CLI.

## Core Model

- The CLI handles login, project/site discovery, pull, push, diff, conflict
  resolution, preview, publish, platform data, asset operations, and site
  templates.
- To start a new site from a platform template — the user asks which template
  fits, or names one — use `creght tpl`: `list`/`get` to recommend candidates
  with their preview URLs, then `tpl use` to create the project, only after the
  user confirms the template. Read `references/cli.md` "Site Templates" first.
- Public rendered origins may expose `/.well-known/creght.json`; use it to
  discover `project_id` and `site_id` from a page URL.
- `pull` mirrors remote paths locally, records `.creght/state.json`, and keeps
  base snapshots under `.creght/base/` for safe diff/push. Overwritten local
  content is backed up under `.creght/backup/`.
- `pull` three-way merges remote/local edits; overlapping edits leave conflict
  markers and exit non-zero. Use `resolve --list`, `resolve <path>
  --ours|--theirs`, or manual edits before pushing.
- `diff` reports creates, updates, deletes, skipped files, and conflicts.
- `push` uploads local changes relative to the last base. It does not delete
  remote files/functions unless `--delete` is passed, refuses conflict markers,
  and reports remote/local conflicts.
- Every file in the workspace is a site file; `push` uploads whatever it walks.
  A workspace-root `.creghtignore` (gitignore syntax) excludes paths from
  `pull`, `diff`, and `push`, and ignored remote files stay untouched even under
  `--delete`/`--force`.
- `push` puts the change on the **preview domain immediately** — no build queue
  or propagation delay, so reloading the preview URL shows the new version. The
  **production domain** changes only on `publish` or `version publish`, which are
  separate, user-requested steps.
- A site version is an immutable snapshot of site source, the platform
  equivalent of a git commit. `version create` records one, `version list` shows
  them and which is live, `version publish <version_no>` makes one live —
  rolling production forward or back without touching the editable files. Snapshots
  cover source only: CMS content and `/platform/**` definitions are live, so
  publishing an older version does not roll those back.
- Rolling back is two separate things, and picking the wrong one is the usual
  mistake. `version publish <no>` moves **production** and leaves the editable
  files at the newest state; `version rollback <no>` moves the **editable files**
  (landing on preview immediately) and leaves production alone. Undoing a bad edit
  usually means both. To take back a single file instead of the whole site, read it
  out of the version and push it: `creght version cat <no> <path> > <path>` then
  `creght push`. `version cat` and `version diff` are also the only way to see a
  past file's content at all — `version list` gives numbers and notes, nothing more.
  See `references/cli.md`.
- The CLI does not render sites locally; rendering, CMS, forms, Auth, Func,
  realtime preview, and publication are backend/web-app responsibilities.
- If the user provides no actionable requirement, ask what to build or change.

## Default Workflow

For existing CMS content edits, first confirm the field exists and is already
rendered. If so, skip this source workflow and use `creght content
list/get/update`. Edit source only when the field or rendering binding is
missing, such as an image `alt` binding.

1. Locate the site directory. If given a rendered URL, fetch origin +
   `/.well-known/creght.json`, then pull if needed.
2. Read local `AGENTS.md` if present.
3. Read `talizen.config.ts` when config, imports, metadata, custom code, or
   site-level CSS may be involved.
4. Inspect relevant page/component/backend files, `/types`, and root configs.
5. Apply focused edits that preserve local conventions.
6. Before upload, run `creght diff` inside a pulled workspace when remote/editor
   changes are possible. Pull to merge conflicts; resolve markers before push.
7. Validate on the real preview URL: `creght push`, then reload it. Lint and
   typecheck are compile checks only, so confirm the real route renders. The
   preview serves the push instantly, so a stale or wrong page is a bug, not lag
   — re-open it with `?dev`.
8. On typecheck, build, lint/validate, runtime, or browser errors, immediately
   read `references/error-handling.md` before fixing.

## Hard Platform Rules

- Never run `creght publish` or `creght version publish` unless the user
  explicitly asks to go live — both change what the public sees. Push and verify
  on preview instead; finishing a task is not a request to publish. Hand back
  the preview URL and state that production is unchanged. `creght version
  create` is safe: it only snapshots source and never moves production.
- Preserve existing `/pages` or `/page` route root and `/components` or
  `/component` UI root. Prefer plural roots only for new projects.
- Do not add `react-router-dom`, `next/link`, `next/router`,
  `next/navigation`, `getStaticProps`, or `getStaticPaths`.
- Use native anchors for navigation. On multilingual sites, use Talizen's
  locale-aware `<Link>`; never use router libraries.
- Use `getServerSideProps(context)` for route params and public first-render
  data. Do not read auth, import browser SDKs, or call Func in SSR.
- Do not create `*.canvas.ts(x)` files unless explicitly asked. When asked to
  stage or preview drafts on the editor canvas, read `references/canvas.md`.
- For visual configuration, including multiple variants, use typed React
  component props with defaults; the editor supports visual control of props.
- Prefer Tailwind v4 utilities. Use `/index.css` only for tokens, keyframes,
  complex selectors, or custom utilities. No inline `style` or page `<style>`.
- Use relative imports for local files; aliases such as `@/lib/utils` are
  unsupported.
- Only platform built-in importMap packages may appear in a page's module graph.
  A dependency added to `talizen.config.ts` resolves in the browser but not in
  SSR, silently dropping the page to client-only rendering; lint misses it.
  See `references/site-code.md` "SSR Availability".
- Do not commit/import local binaries. Use absolute URLs, Creght CDN URLs from
  `creght upload`, or tiny `data:` URIs.
- Never push local-only working files — specs, notes, screenshots, scratch
  scripts, research or reference material about other sites. Keep them outside
  the workspace or list them in `.creghtignore` before the first push; the
  workspace's contents are the site's contents.
- Never edit `/types/cms.d.ts` or `/types/form.d.ts`; they are platform-generated.
  Change the CMS/Form schema through platform or CLI operations, then refresh
  the generated files.
- Static files, including a self-contained standalone HTML file, go under
  `public/` (served at the domain root); a project-root `index.html` is NOT
  served. For one-file artifacts (deck/poster/preview) read `references/site-code.md`.
- Use structured `metadata`, not custom `seo` fields or duplicate raw SEO tags.
- Use Func for backend workflows and persistent writes. Do not fake persistence
  in React state, expose project IDs, or create `/func/*` pages.
- Keep secrets out of source. Func reads `process.env.NAME`; the user manually
  manages env vars in Backend / Env at `panel/backend/env`. The CLI cannot
  create, list, update, or delete env vars.
- Use browser `talizen/auth` `useAuth()` for auth UI. Do not implement account
  identity, passwords, sessions, OAuth callbacks, login, or registration with
  Func or JSON tables.
- When exact SDK signatures matter, read installed `talizen` type definitions.
- CMS rich-text body fields (e.g. an article `body`) are HTML, not Markdown;
  Markdown renders as literal text. See `references/cms.md`.

## References

Paths below are relative to this skill's `references/`. Read one only when you
reach its topic; do not read the others.

- `cli.md` — CLI install/use, discovery, pull/diff/push/resolve, conflicts,
  `.creghtignore`, site templates, platform data, backend commands, preview vs.
  publish, site versions and rollback, asset upload.
- `site-code.md` — routes, pages/components, SSR data loading, imports,
  importMap, `talizen.config.ts`, redirects, package types, `public/` static
  files.
- `cms.md` — CMS content operations, schema types, and fetch patterns.
- `css.md` — Tailwind v4 and `/index.css`.
- `i18n.md` — multilingual routing, locale APIs, `_i18n`, messages.
- `forms.md` — form schema and `talizen/form`.
- `auth.md` — auth UI, current user, logout, OAuth, protected flows.
- `func.md` — Func invariants: code and keys, JSON tables, secrets, managed
  integrations, asset uploads, auth in Func, CLI management, `invoke(...)`,
  `/func/<key>`. It does not enumerate the `ctx` surface or which capabilities are
  managed — that changes each release. The API reference is live at
  `https://www.creght.cn/api.md`; read the matching doc before writing Func code
  instead of relying on remembered signatures, defaults, or limits.
- `seo.md` — `metadata`, viewport, OG, keywords, favicon, legacy migration.
- `carousel.md` — carousel/slideshow setup.
- `sitemap.md` — root-level sitemap.
- `platform-endpoints.md` — `/robots.txt`, `/sitemap.xml`, `/llms.txt` and their
  `/robots.ts`, `/llms.ts` customization files. Read before writing any of those
  three filenames anywhere, including under `/public`.
- `analytics.md` — visit analytics and custom event tracking.
- `canvas.md` — `*.canvas.tsx` artboards, frame layout, staging a draft next to
  the page.
- `console-operations.md` — editor navigation. Question-only: answer directly,
  without editing or running CLI.
- `error-handling.md` — any validation or runtime failure, and pages that render
  wrong, empty, or not-found while the data exists (re-open with `?dev` for full
  diagnostics first).
