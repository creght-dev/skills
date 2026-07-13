---
name: creght
description: >
  Use when working with Creght sites or the Creght CLI, including pulling site
  code locally, pushing local changes, running watch-mode sync, writing
  Creght-compatible React page/component code, CMS, form, Auth, and Func
  backend integration, routing, styling, metadata, previewing, publishing, or
  debugging local-to-platform workflows.
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
- `pull` downloads remote site files into a local workspace whose paths mirror
  remote site paths exactly (`page/Index.tsx` <-> `/page/Index.tsx`); Func
  backend code lives under `backend/func/`.
- `pull` safely merges remote site files into the local workspace and
  records `.creght/state.json`, the local base state used by `diff`, `push`,
  and `sync` to compare base/local/remote safely. It reports conflicts instead
  of overwriting local edits; `pull --force` intentionally overwrites local
  files with remote files.
- `diff` shows which site files would be created, updated, deleted, skipped,
  or blocked by conflicts.
- `push` safely uploads local changes relative to the last pull/push base and
  exits. It does not delete remote files/functions unless `--delete` is
  explicitly passed, and it reports conflicts when the same file/function
  changed locally and remotely.
- `sync` is watch mode: it starts with the same safe push check, then keeps
  listening for local file changes and pushes them in realtime.
- The CLI does not render sites locally.
- Rendering, CMS, forms, Auth, Func, assets, realtime preview, and publication
  are handled by the Creght backend and web app.
- Site code must follow Creght platform rules; do not treat a Creght site as a
  generic Vite, Next.js, or browser SPA project.
- If the user's message does not contain an actionable requirement, such as only
  attaching an image without instructions, do not create or modify a website.
  Ask the user what they want to build or change.

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
6. Before uploading, run `creght diff --site_id=<project_id>/<site_id>
   --dir=<dir>` when there may be other people or Web editor changes. Resolve
   conflicts by pulling/inspecting remote changes instead of overwriting by
   default.
7. Validate with available local checks or Creght platform checks. If no local
   renderer exists, use `creght push`, `creght sync`, or `creght preview` as
   the verification path. Use `creght push` for a one-time safe upload and
   `creght sync` when you want watch mode.

## Error Trigger

When a typecheck, build, or lint/validate command fails, or the user reports a
runtime or browser error, immediately activate the error-handling protocol by
reading `references/error-handling.md`. Do not perform speculative fixes before
checking the relevant guidance.

## Hard Platform Rules

- Pages live in `/page` as `.tsx` React components.
- Keep reusable UI in `/component` or another shared components directory.
- Do not introduce `react-router-dom`, `next/link`, `next/router`,
  `next/navigation`, `getStaticProps`, or `getStaticPaths`.
- Use native anchors such as `<a href="/about">...</a>` for navigation. On a
  multilingual site, use talizen's locale-aware `<Link>`
  (`import { Link } from "talizen"`, v0.2.0+) for internal links — it
  auto-prefixes the current locale (a plain `<a>` drops the visitor out of their
  language). talizen's own `<Link>` is allowed; do not use `next/link`,
  `next/router`, `next/navigation`, or other router libraries.
- Prefer `getServerSideProps(context)` for route params and public first-render
  data. Read route params from `context.params` when SSR params are available.
  In SSR code, use `context.request` and `context.cookies`; do not read auth
  state, import `talizen/auth`, or call Func from `getServerSideProps`.
- Do not proactively create `*.canvas.ts` or `*.canvas.tsx` files. They are
  platform editor preview entries. Edit existing canvas files only when the user
  explicitly asks.
- Style utility-first: Tailwind v4 utility classes on the elements are the
  default (the platform's Tailwind pipeline is more reliable than hand CSS).
  Standalone CSS in `index.css` only for what Tailwind can't express (keyframes,
  `:has()`/complex selectors, fluid `@utility` scales); never re-author
  component layout as semantic CSS, and no inline `style` or `<style>` in pages.
  See `references/css.md`.
- Use relative paths for local project imports. The Creght platform does not
  support alias imports such as `@/lib/utils`; write them as relative imports
  like `../lib/utils` or `./lib/utils` from the importing file.
- Media assets (images, PDFs, videos, fonts, other binaries) are hosted
  resources, not editable site/Func source files. Reference each by a complete
  absolute URL — the Creght CDN, a user-supplied URL, an external/third-party
  host (hotlinking is allowed), or a `data:` URI for tiny inline assets are all
  fine. Do NOT commit or import binaries as local project files, reference them
  by relative or local paths, or guess/synthesize a fallback path. Prefer the
  Creght CDN for anything you ship — external hotlinks can rot, be slow, or get
  blocked — so when you have a local binary that must ship, or want to stabilize
  a hotlink before publish, upload it through the platform/CLI asset flow
  (`creght upload`, which returns a CDN URL) instead of committing the file.
- Use structured `metadata` for SEO instead of custom `seo` fields or raw
  `<title>` / `<meta name="description">` tags.
- For simple backend workflows such as booking, RSVP, lead capture,
  availability checks, status updates, and JSON-table reads/writes, use Func.
  Do not fake persistent backend state in client code, do not expose project
  IDs, and do not create `/func/*` pages. Read `references/func.md` before
  writing Func code or client code that calls Func.
- Never write API keys, tokens, passwords, or other secrets into page,
  component, config, or Func source code. Func code must read secrets through
  `process.env.NAME`, and the user must manually add those variables in the
  Creght platform Backend / Env panel at `panel/backend/env`. The Creght CLI
  cannot create, list, update, or delete project env variables.
- Use the browser-side `talizen/auth` SDK for auth UI. React components must
  use `useAuth()` for login, registration, logout, and current-user state;
  do not import top-level `login` / `logout`. Page `getServerSideProps` does
  not expose `ctx.auth`; protected backend actions must read the user from Func
  `ctx.auth`. Do not create a `user` / `users` / `auth_users` database table
  for account identity, and do not write Func code that implements passwords,
  sessions, OAuth callbacks, login, or registration. Read `references/auth.md`
  before building login, signup, account, OAuth, or protected UI flows.
- Before using `talizen/auth` or `talizen/func`, read the type definitions from
  the `talizen` version used by the current project when exact signatures are
  needed.
- When a typecheck, build, lint/validate, or user-reported runtime or browser
  error occurs, the first response must be to read and follow
  `references/error-handling.md`. Do not make speculative code changes before
  checking that guidance.

## Backend Capability Patterns

Read `references/auth.md` before writing login, registration, logout, current
user, OAuth/social login, account, or protected UI code. In React UI, use
`useAuth()` instead of importing top-level `login` / `logout`.

Read `references/func.md` before using Func or database table CLI commands, or
writing client code that calls Func. This includes requests involving custom
backend actions, `invoke(...)`, `/api/func`, database tables, record CRUD,
booking/RSVP/lead capture, protected user-specific business logic, or any
question about whether to create a user database table, write backend logic, or
use a third-party API key from backend code.

Use SSR for public or cookie-vary-safe first-render data. Do not put login
state, private user data, writes, or Func calls in `getServerSideProps`; keep
those flows in browser-side SDK/Func/API interactions.

For password-gated pages, keep protected content out of SSR HTML and client
bundles: render a public password gate, verify the password through Func/API,
set a signed access cookie, then fetch protected content from Func/API.

For article lists with fast-changing like counts, SSR/cache the CMS article list
only; fetch like counts after hydration with Func/API and update/toggle likes
client-side so the whole page cache is not invalidated by counters.

## Reference Map

- `references/cli.md`: CLI install/use, endpoint defaults, platform data and
  backend commands, rendered URL site discovery, and asset upload commands.
- `references/site-code.md`: routing, page/component structure, import maps,
  and config rules.
- `references/cms.md`: CMS data fetching and generated schema usage.
- `references/forms.md`: form submissions and payload typing.
- `references/auth.md`: platform auth, password login/register, current user,
  logout, OAuth/social login providers, and protected UI patterns.
- `references/func.md`: project-level Func code, JSON-table access,
  Func-generated asset uploads, multi-method files, platform auth usage, and client-side
  `invoke("file.method")` calls.
- `references/seo.md`: site and page metadata.
- `references/i18n.md`: multilingual sites — locale routing, reading the
  locale, `_i18n` content storage, and `/messages` UI text.
- `references/css.md`: Tailwind v4 and `index.css` conventions.
- `references/sitemap.md`: root-level sitemap generation.
- `references/carousel.md`: carousel/slideshow default approach.
- `references/error-handling.md`: bounded handling for typecheck, build,
  lint/validate, and user-reported runtime or browser errors.

For most site-authoring tasks, read `references/site-code.md` first, then load
the specific topic reference only if the task touches that area.
