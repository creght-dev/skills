---
name: creght
description: >
  Use when working with Creght sites or the Creght CLI, including pulling site
  code locally, pushing local changes, resolving sync conflicts, writing
  Creght-compatible React pages/components code, CMS, form, Auth, and Func
  backend integration, routing, styling, metadata, previewing, publishing,
  domain binding, DNS/SSL, website analytics, environment variables, editor
  operations, or debugging local-to-platform workflows.
---

# Creght

Creght sites are React websites rendered by the Creght platform. General agents
usually use the Creght CLI to pull site files, edit locally, then diff, push, or
preview through Creght. Do not assume Creght-system-only tools are available;
use them if exposed, otherwise inspect files and use the CLI.

## Core Model

- The CLI handles login, project/site discovery, pull, push, diff, conflict
  resolution, preview, publish, platform data, and asset operations.
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
- The CLI does not render sites locally; rendering, CMS, forms, Auth, Func,
  realtime preview, and publication are backend/web-app responsibilities.
- If the user provides no actionable requirement, ask what to build or change.

## Default Workflow

1. Locate the site directory. If given a rendered URL, fetch origin +
   `/.well-known/creght.json`, then pull if needed.
2. Read local `AGENTS.md` if present.
3. Read `talizen.config.ts` when config, imports, metadata, custom code, or
   site-level CSS may be involved.
4. Inspect relevant page/component/backend files, `/types`, and root configs.
5. Apply focused edits that preserve local conventions.
6. Before upload, run `creght diff` inside a pulled workspace when remote/editor
   changes are possible. Pull to merge conflicts; resolve markers before push.
7. Validate with local checks or Creght platform checks. Without a local
   renderer, use `creght push` or `creght preview` as verification.
8. On typecheck, build, lint/validate, runtime, or browser errors, immediately
   read `references/error-handling.md` before fixing.

## Hard Platform Rules

- Preserve existing `/pages` or `/page` route root and `/components` or
  `/component` UI root. Prefer plural roots only for new projects.
- Do not add `react-router-dom`, `next/link`, `next/router`,
  `next/navigation`, `getStaticProps`, or `getStaticPaths`.
- Use native anchors for navigation. On multilingual sites, use Talizen's
  locale-aware `<Link>`; never use router libraries.
- Use `getServerSideProps(context)` for route params and public first-render
  data. Do not read auth, import browser SDKs, or call Func in SSR.
- Do not create `*.canvas.ts(x)` files unless explicitly asked.
- Prefer Tailwind v4 utilities. Use `/index.css` only for tokens, keyframes,
  complex selectors, or custom utilities. No inline `style` or page `<style>`.
- Use relative imports for local files; aliases such as `@/lib/utils` are
  unsupported.
- Do not commit/import local binaries. Use absolute URLs, Creght CDN URLs from
  `creght upload`, or tiny `data:` URIs.
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

## Reference Routing

- `references/cli.md`: CLI install/use, discovery, pull/diff/push/resolve,
  platform data, backend commands, publish, asset upload.
- `references/site-code.md`: routes, pages/components, SSR, imports, import
  maps, `talizen.config.ts`, redirects, package types.
- `references/css.md`: Tailwind v4 and `/index.css`.
- `references/cms.md`: CMS schema types and fetch patterns.
- `references/forms.md`: form schema and `talizen/form`.
- `references/auth.md`: auth UI, current user, logout, OAuth, protected flows.
- `references/func.md`: Func code, JSON tables, secrets, asset uploads, auth in
  Func, CLI management, browser `invoke("file.method")`.
- `references/seo.md`: `metadata`, viewport, OG, keywords, legacy migration.
- `references/i18n.md`: multilingual routing, locale APIs, `_i18n`, messages.
- `references/sitemap.md`: root-level sitemap.
- `references/carousel.md`: carousel/slideshow setup.
- `references/analytics.md`: visit analytics and custom event tracking.
- `references/console-operations.md`: question-only editor guidance.
- `references/error-handling.md`: bounded recovery for validation/runtime errors.

## Read Before

- General site-authoring: read `references/site-code.md`.
- CLI pull/push/conflicts/assets/publish: read `references/cli.md`.
- Auth UI or protected flows: read `references/auth.md`.
- Func, JSON tables, backend actions, secrets, `invoke(...)`, or `/api/func`:
  read `references/func.md`.
- SEO, OG, keywords, favicon, viewport, or legacy SEO: read `references/seo.md`.
- Multilingual work: read `references/i18n.md`.
- Editor-navigation questions only: read `references/console-operations.md` and
  answer directly without editing or running CLI.

## Common Patterns

- Use SSR only for public or cookie-vary-safe first-render data; keep private
  user data, auth state, writes, and Func calls in browser SDK/Func/API flows.
- Password-gated pages should render a public gate, verify through Func/API, set
  a signed access cookie, then fetch protected content from Func/API.
- Article lists with fast-changing counters should SSR/cache the list and fetch
  counters after hydration.
