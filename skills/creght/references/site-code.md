# Creght Site Code

Creght apps are React-based websites with file-based routes under `/page`, a
root `talizen.config.ts`, Tailwind v4 styling, generated project types, and
platform APIs for CMS, forms, Auth, Func, metadata, import maps, previews, and
publishing.

## Routing

Routing is derived from `/page` file names by Creght conventions:

- `/page/Index.tsx` -> `/`
- `/page/About.tsx` -> `/about`

For non-`Index` pages, do not guess kebab-case routes. Prefer the lowercase
canonical path returned by lint or platform validation; for example,
`/page/BlockElementsPage.tsx` should be linked as `/blockelementspage`.

Files like `/page/XXXX.canvas.tsx` are canvas preview entries used by the
platform editor, not normal route files to generate by hand.

For localized routing (locale prefixes and per-locale page files), see
`references/i18n.md`.

## Navigation

Use native anchors for navigation:

```tsx
<a href="/about">About</a>
```

On a multilingual site, use talizen's locale-aware `<Link>` for internal links —
it auto-prefixes the current locale, so a link never drops the visitor out of
their language (a plain `<a>` does not add the prefix). See `references/i18n.md`.

```tsx
import { Link } from "talizen"

<Link href="/about">About</Link>
```

Do not import `next/link`, `next/router`, `next/navigation`, or any other router
library. talizen's own `<Link>` is the only allowed link component.

## Data Loading

Prefer `getServerSideProps(context)` for route params and first-render data.
Read dynamic params from `context.params`; do not use client-side param hooks
when SSR params are available.

Do not read auth state in `getServerSideProps`. The render runtime deliberately
does not expose `context.auth` because HTML caching relies on explicit
dependencies and cookie-vary names; hidden user-specific auth reads would make
cache safety unpredictable. Use `useAuth()` in React UI, or Func `ctx.auth` for
protected backend actions.

Example:

```tsx
export async function getServerSideProps(context) {
  const slug = context.params?.slug;

  return {
    props: { slug },
  };
}
```

## Components

Keep page files focused on route-level composition. Put reusable UI in
`/component` or another shared components directory that already exists in the
project.

If the user asks only for a component but also wants a preview, make the
component visible in a page whenever possible. A standalone component cannot
render as a site page by itself.

## Component Registries And Effects

For carousels and slideshows, see `references/carousel.md`.

The platform supports shadcn/ui-style registry components. Configure the
registries in `components.json`, then install components from them with the
shadcn CLI (or platform install tools if the environment exposes them). Common
registries: `@spell`, `@fancy`, `@react-bits`, and `@talizen-sections`. Prefer a
registry component for polished visual effects — animations, particles, cursor
or text effects, creative backgrounds — before hand-rolling one, and make sure
animated layers do not block content, hurt readability, or break responsive
layouts.

Minimal `components.json`:

```json
{
  "registries": {
    "@spell": "https://spell.sh/r/{name}.json",
    "@fancy": "https://fancycomponents.dev/r/{name}.json",
    "@react-bits": "https://reactbits.dev/r/{name}.json",
    "@talizen-sections": "https://unpkg.com/@talizen/talizen-sections/public/r/{name}.json"
  }
}
```

## Local Imports

Use relative paths for local project imports. The Creght platform does not
support alias imports such as `@/lib/utils`; write them as relative imports from
the importing file, for example `../lib/utils`, `../../lib/utils`, or
`./lib/utils`.

Package imports and Creght platform imports still use their normal specifiers,
such as `react`, `talizen/cms`, and import-map keys configured in
`talizen.config.ts`.

## Import Map

There are two import map views:

- The effective runtime import map may include platform-provided modules and
  user-defined entries.
- `talizen.config.ts` contains user-defined extra imports.

Edit `talizen.config.ts` `importMap.imports` when adding or changing third-party
dependencies.

Rules:

- Only add packages that are actually used.
- Prefer `esm.sh` unless compatibility requires another CDN.
- Do not add `react`, `react-dom`, or `talizen`; the platform already provides
  them.
- For React-dependent esm.sh packages, use `?external=react` so they use the
  host React copy.
- If you see duplicate-React symptoms such as `Cannot read properties of null
  (reading 'useState')` with both `react.mjs` and an esm.sh package in the stack,
  add `?external=react` to that package URL, including React wrapper subpaths
  such as `swiper/react`.
- Keep the import specifier exactly the same as the `imports` key.
- Creght's compiler supports Vite-style local asset queries for relative imports:
  `import assetUrl from "./asset.ext?url"` returns a browser-accessible Blob URL,
  and `import source from "./file.ext?raw"` returns the original file contents as
  a string. Use these for worker source, WASM/worker helper scripts, and other
  local assets that need URL or raw-string semantics.

Example:

```ts
export default {
  importMap: {
    imports: {
      "framer-motion": "https://esm.sh/framer-motion@12.34.5?external=react",
    },
  },
};
```

## talizen.config.ts

Use `export default` with a plain object. Do not import packages in this file
except type-only imports such as `import type { Metadata } from "talizen"`.
Do not use `defineConfig` from `talizen/config`.

`talizen.config.ts` can define:

- `importMap.imports` for user-defined third-party dependencies.
- `metadata` for global SEO.
- `customCode.head` and `customCode.body` for small analytics, verification, or
  script snippets not covered by structured metadata.
- `redirects` for site-level URL redirects (see below).

Do not duplicate metadata in `customCode`; prefer structured `metadata` whenever
the field fits.

## Redirects

Configure site-level redirects with the `redirects` array in `talizen.config.ts`.
This is the Creght equivalent of Next.js `redirects()`. Because the config must
be a plain object, `redirects` is an array literal, not an `async` function.

Each rule has:

- `source`: path to match. Supports exact matches (`/old-page`) and a trailing
  wildcard segment (`/blog/*`).
- `destination`: target path. May be an internal path (`/new-page`), a wildcard
  backreference (`/posts/*`), an absolute URL, or a protocol-relative URL.
- `permanent`: `true` for a 308 permanent redirect (best for SEO), `false` for a
  307 temporary redirect.

Rules match in order; the first matching rule wins. A rule whose target would
match itself (an obvious loop) is skipped. Redirects are evaluated before page
routing, so they take precedence over pages and `/public` files, and the
original query string is preserved for internal targets.

```ts
import type { Redirect } from "talizen";

export default {
  redirects: [
    { source: "/old-page", destination: "/new-page", permanent: true },
    { source: "/blog/*", destination: "/posts/*", permanent: false },
  ] satisfies Redirect[],
};
```

For per-request or conditional redirects that depend on data, return `redirect`
from `getServerSideProps` instead of using `redirects`.

## Package Types

When the current environment provides a Creght module-type lookup tool, use it
only when exact package signatures are needed, an uncommon package or subpath is
involved, the effective URL/version changed, the user explicitly asks to verify
the API, or lint/typecheck suggests quick reference examples are stale.

Do not fetch package declarations for common packages already covered by model
knowledge, such as `react`.
