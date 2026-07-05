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
- `pull` downloads remote frontend files into `frontend/` and Func backend code
  into `backend/func/`.
- `push` uploads the current local workspace snapshot to Creght and exits.
- `sync` is watch mode: it pushes the current local snapshot, then keeps
  listening for local frontend and Func file changes and pushes them in
  realtime.
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
6. Validate with available local checks or Creght platform checks. If no local
   renderer exists, use `creght push`, `creght sync`, or `creght preview` as
   the verification path. Use `creght push` for a one-time upload and
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
  In SSR code, use only `context.request` and `context.cookies`; do not read
  auth state or call Func from `getServerSideProps`.
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
- For simple backend workflows such as booking, RSVP, lead capture,
  availability checks, status updates, and JSON-table reads/writes, use Func.
  Do not fake persistent backend state in client code, do not expose project
  IDs, and do not create `/func/*` pages. Read `references/func.md` before
  writing Func code or client code that calls Func.
- Use the browser-side `talizen/auth` SDK for user login, registration, logout,
  current user state, and OAuth/social login providers configured in the
  project. Do not create a `user` / `users` / `auth_users` database table for
  account identity, and do not write Func code that implements passwords,
  sessions, OAuth callbacks, login, or registration. Read
  `references/auth.md` before building login, signup, account, OAuth, or
  protected UI flows.
- Before using `talizen/auth` or `talizen/func`, read the type definitions from
  the `talizen` version used by the current project when exact signatures are
  needed.
- When a typecheck, build, lint/validate, or user-reported runtime or browser
  error occurs, the first response must be to read and follow
  `references/error-handling.md`. Do not make speculative code changes before
  checking that guidance.

## Backend Capability Patterns

Read `references/auth.md` before writing login, registration, logout, current
user, OAuth/social login, account, or protected UI code.

Read `references/func.md` before using Func or database table CLI commands, or
writing client code that calls Func. This includes requests involving custom
backend actions, `invoke(...)`, `/api/func`, database tables, record CRUD,
booking/RSVP/lead capture, protected user-specific business logic, or any
question about whether to create a user database table or write backend logic.

Use SSR only for public or cache-friendly first-render data. Do not put login
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
  multi-method files, platform auth usage, and client-side
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
