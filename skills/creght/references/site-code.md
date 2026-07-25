# Creght Site Code

Creght sites are React websites with file-based routes under `/pages` or
`/page`, a root `talizen.config.ts`, Tailwind v4, generated types, and platform
APIs for CMS, forms, metadata, import maps, previews, and publishing.

Both route roots (`/pages` and `/page`) and component roots (`/components` and
`/component`) are supported. Use existing roots; for new projects, prefer
`/pages` and `/components`.

## Routing

- `/pages/Index.tsx` -> `/`
- `/pages/About.tsx` -> `/about`

For non-`Index` pages, do not guess kebab-case routes. Prefer the lowercase
canonical path from lint/platform validation, such as
`/pages/BlockElementsPage.tsx` -> `/blockelementspage`.

Do not create `*.canvas.tsx` files by hand unless the user explicitly asks;
they are editor-only artboards, not routes — read `references/canvas.md`. For
localized routing, read `references/i18n.md`.

## Navigation

Use native anchors:

```tsx
<a href="/about">About</a>
```

On multilingual sites, use Talizen's locale-aware `<Link>`:

```tsx
import { Link } from "talizen"
<Link href="/about">About</Link>
```

Do not import `next/link`, `next/router`, `next/navigation`, or other routers.

## Data Loading

Use `getServerSideProps(context)` for route params and public first-render data.
Read dynamic params from `context.params`.

Type the context — don't use `any` or an untyped `context`. Type the whole
function with `GetServerSideProps<Props, Params>` and the page props with
`InferGetServerSidePropsType`, both imported from `talizen`:

```tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "talizen"

export const getServerSideProps: GetServerSideProps<{ slug: string }, { slug: string }> = async (context) => {
  return { props: { slug: context.params.slug } }
}

export default function Page(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <main>{props.slug}</main>
}
```

Fields: `params`, `searchParams`, `request` (`host` / `headers.get()`), `cookies`
(`get`/`has`/`set`/`delete`), and `locale` / `locales` / `defaultLocale` /
`routingDefaultLocale`. `req`, `query`, and `request.cookies` are deprecated aliases.

Do not read auth or call Func in SSR. Use `useAuth()` in React UI and Func
`ctx.auth` for protected backend actions.

## Components

Keep page files for route composition. Put reusable UI in the existing
component root or shared component folder. If a component needs preview, make it
visible from a page when possible.

For carousels, read `references/carousel.md`.

For registry components, configure `components.json`, then use
`shadcn_search_items`, `shadcn_list_items`, and `shadcn_install_item`. Common
registries: `@spell`, `@fancy`, `@react-bits`, `@talizen-sections`.

## Local Imports

Use relative imports for local files: `../lib/utils`, `../../lib/utils`, or
`./lib/utils`. Alias imports like `@/lib/utils` are unsupported.

Package/platform imports keep normal specifiers, such as `react`,
`talizen/cms`, and import-map keys configured in `talizen.config.ts`.

## Import Map

The platform provides common packages such as `react`, `react-dom`, and
`talizen`; do not add them manually. Add third-party dependencies in
`talizen.config.ts` `importMap.imports`.

```ts
export default {
  importMap: {
    imports: {
      "lucide-react": "https://esm.sh/lucide-react",
    },
  },
}
```

Do not commit/import local binaries. Use absolute URLs, Creght CDN URLs from
upload tools, or tiny `data:` URIs. Runtime Func assets use
`ctx.assets.upload(...)` and store returned metadata.

### SSR Availability

The browser resolves every importMap entry from its CDN URL. SSR resolves bare
imports from the render server's `node_modules`, which holds only the platform
built-ins: `react`, `talizen/*`, `lucide-react`, `clsx`, `tailwind-merge`,
`class-variance-authority`, `radix-ui`, `motion` / `framer-motion`, `gsap`,
`three`, `@react-three/*`, `lenis`, `ogl`, `matter-js`, `react-icons`.

A package added to `talizen.config.ts` therefore works in the browser but breaks
SSR of every page importing it: the page drops to client-only rendering and may
show its own empty or not-found branch while route and data are fine. Lint only
checks that the specifier is declared, so it still passes.

- Prefer writing the code over adding a dependency for a small job.
- If one is required, isolate it in a component file whose first line is
  `'use client'` — that file is stubbed during SSR. On the page file itself the
  directive does nothing.
- Verify on the real preview URL, not on lint.

Browser globals cause a softer version of the same downgrade: keep `window`,
`document`, and `navigator` out of module scope and render (including
`useState` / `useRef` initializers), inside `useEffect` and handlers.

## talizen.config.ts

Use `export default` with a plain object. Do not import packages except
type-only imports such as `import type { Metadata } from "talizen"`. Do not use
`defineConfig` from `talizen/config`.

Common fields: `importMap.imports`, `metadata`, `viewport`, `redirects`, and
`customCode.head/bodyStart/bodyEnd`. Prefer structured `metadata` over duplicate
SEO in `customCode`.

## Viewport

Configure viewport as site-level `viewport`, not under `metadata`, page exports,
or raw head tags. Read `references/seo.md` for fields.

## Redirects

```ts
export default {
  redirects: [
    { source: "/old", destination: "/new", permanent: true },
    { source: "/posts/:slug", destination: "/blog/:slug", permanent: false },
  ],
}
```

Use `redirects` for static site-level redirects. For data-dependent redirects,
return `redirect` from `getServerSideProps`.

## Public Static Files

`public/` holds raw static files served verbatim at the domain root, outside
React/SSR/routing: `public/<path>` -> `<domain>/<path>` (e.g. `public/deck.html`
-> `<domain>/deck.html`, `public/logo.svg` -> `<domain>/logo.svg`).

Default all website work to Creght pages. Use `public/` only for a genuinely
self-contained artifact the user explicitly wants as one HTML file — a
roadshow/presentation deck, poster, or one-off preview. Such a file may inline
its own CSS/JS or load CDN assets, and is previewable/shareable by URL.

A `public/*.html` file is not part of routing, SSR, `metadata`/SEO, i18n, CMS,
or the component system; do not use it for real site pages. Never write a
project-root `index.html` to satisfy a "single HTML file" request — it is not
served; put it in `public/`.

## Package Types

Use `fetch_module_types(specifier)` only when exact signatures are unknown, the
user asks to verify an API, or validation reports a mismatch.
