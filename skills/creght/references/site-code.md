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

A page whose filename contains `[param]` must **also** export
`generateStaticParams`, or none of its URLs reach `sitemap.xml` and static
export, silently. `getServerSideProps` renders one URL on request;
`generateStaticParams` is what tells the platform those URLs exist at all. See
`sitemap.md`.

```tsx
import { listContents } from "talizen/cms"
import type { GenerateStaticParams } from "talizen"

export const generateStaticParams: GenerateStaticParams = async () => {
  const res = await listContents("blogs", { limit: 100, offset: 0 })
  return (res?.list ?? [])
    .filter((item) => item.slug)
    .map((item) => ({ slug: item.slug, lastModified: item.updated_at }))
}
```

Do not read auth or call Func in SSR. Use `useAuth()` in React UI and Func
`ctx.auth` for protected backend actions.

SSR is for public or cookie-vary-safe first-render data only; keep login state,
private user data, and writes in browser SDK/Func/API flows. When part of the
page changes fast (e.g. an article list with view counters), SSR/cache the
stable part and fetch the volatile part after hydration.

## Components

Keep page files for route composition. Put reusable UI in the existing
component root or shared component folder. If a component needs preview, make it
visible from a page when possible.

For carousels, read `references/carousel.md`.

### Visual component props

For visual configuration or multiple editable variants, define typed React
props with literal defaults and pass literal values at the component call site.
The editor supports `string`, `number`, `boolean`, and arrays of those primitive
types; literal unions become option controls, and string props named `color` or
`colors` become color controls.

For registry components, configure `components.json`, then use
`shadcn_search_items`, `shadcn_list_items`, and `shadcn_install_item`. Common
registries: `@spell`, `@fancy`, `@react-bits`, `@talizen-sections`.

## Local Imports

Use relative imports for local files: `../lib/utils`, `../../lib/utils`, or
`./lib/utils`. Alias imports like `@/lib/utils` are unsupported.

Package/platform imports keep normal specifiers, such as `react`,
`talizen/cms`, and import-map keys configured in `talizen.config.ts`.

## Import Map

`creght runtime packages` lists every specifier the site can import, each with
its `url`, `source` (`builtin` or the config file that added it), and `ssr`.
The built-in set is broad and changes over time, so look it up rather than
assuming — e.g. `three`, `gsap` (with `gsap/*` plugins), `lenis`, and `motion`
are built in today. Import a built-in by its specifier with no config entry.

Add a dependency in `talizen.config.ts` `importMap.imports` only when the
lookup lacks it. Leave built-in specifiers out of the config: an override
changes only the browser's copy, while SSR keeps the platform's version.

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

### Text Imports (`?raw`)

Append `?raw` to import any site file as a string, in SSR and the browser alike:

```ts
import vertexShader from "../components/scene/shaders/particles.vert.glsl?raw"
```

Keep shaders, SVG markup, and other text sources as their own files this way.

### SSR Availability

The browser resolves importMap entries from their CDN URLs. SSR resolves bare
imports from the render server's `node_modules`, which holds only the platform
built-ins — the entries `creght runtime packages` marks `ssr: true`.

Importing a project-added package anywhere in a page's module graph therefore
breaks that page's SSR. The page falls back to client-only rendering, losing SSR
and SEO, and may also lose its `getServerSideProps` props and render its own
empty or not-found branch while route and data are fine. Lint only checks that
the specifier is declared, so it still passes.

To use a project-added package and keep SSR, load it only in the browser: put
the code that imports it in its own module and pull that module in with
`await import()` inside `useEffect` (effects never run during SSR). Otherwise
write the logic in project code, or use a built-in.

Browser globals cause a softer version of the same downgrade: keep `window`,
`document`, and `navigator` out of module scope and render (including
`useState` / `useRef` initializers), inside `useEffect` and handlers.

Verify on the real preview URL, not on lint.

## talizen.config.ts

Use `export default` with a plain object. Do not import packages except
type-only imports such as `import type { Metadata } from "talizen"`. Do not use
`defineConfig` from `talizen/config`.

Common fields: `importMap.imports`, `metadata`, `viewport`, `redirects`, `html` /
`body` (tag attributes) and `head` / `bodyEnd` (injected snippets) — both described
below. Prefer structured `metadata` over duplicate SEO in raw snippets.

## Site Shell (`talizen.config.ts`)

Site-wide `<html>` / `<body>` attributes and injected HTML are config fields, not a
component. **There is no `layout.tsx`** — do not create one, it is silently ignored.

```ts
// talizen.config.ts
import type { TalizenConfig } from "talizen"

export default {
  html: { className: "dark scroll-smooth" },
  body: { className: "antialiased bg-neutral-950 text-neutral-100" },
  head: `<link rel="preconnect" href="https://fonts.gstatic.com" />`,
  bodyEnd: `<script src="/widget.js" defer></script>`,
} satisfies TalizenConfig
```

`className` and `class` are equivalent. Omit `lang` — the platform fills it from the
current locale. `head` injects before `</head>`, `bodyEnd` before `</body>`; both
supersede `customCode.head` / `customCode.body` and are injected after them.

Shared header/footer stays a component that pages import: interactive chrome needs
hydration, which a static shell cannot provide, and pages differ (landing pages,
full-screen pages, embeds).

## Per-Request Config Fields

Fields that only shape the rendered HTML may be written as `(ctx) => value`, evaluated
per request. This is how site config branches on locale or host:

```ts
import type { TalizenConfig, TalizenConfigContext } from "talizen"

export default {
  metadata: (ctx: TalizenConfigContext) => ({
    title: { template: ctx.locale === "en" ? "%s | Acme" : "%s ｜ Acme", default: "Acme" },
    description: ctx.locale === "en" ? "English description" : "中文描述",
  }),
  html: (ctx) => ({ className: "dark", "data-locale": ctx.locale }),
  head: (ctx) =>
    ctx.host.endsWith(".cn")
      ? `<script async src="https://hm.baidu.com/hm.js?x"></script>`
      : `<script async src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>`,
} satisfies TalizenConfig
```

- **Allowed as functions:** `metadata`, `html`, `body`, `head`, `bodyEnd`, `viewport`.
- **Must be static values:** `importMap`, `i18n`, `redirects` — bundling and route
  building happen before a request exists. Writing them as a function is a load-time
  error (and `satisfies TalizenConfig` catches it while typing).
- `ctx` has only `locale`, `locales`, `defaultLocale`, `routingDefaultLocale`, `host`,
  `path`. No cookies, no `talizen/cms` — config must not fetch data.
- If a function throws, the request fails rather than silently dropping site config.
  Keep them simple and synchronous.

Things that have their own URL are files, not config: `/robots.ts` → `/robots.txt`,
`/sitemap.ts` → `/sitemap.xml`, `/llms.ts` → `/llms.txt`.

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

`public/` files are site source: stored in the database and copied into every
version. Each file has a small size cap — read it with `creght runtime limits`
(`public_file_max_bytes`); push rejects a file over it. Keep `public/` to small
text files, and put images, bundles, models, and other large files on the CDN
with `creght upload`, referencing the returned URL.

## Porting A Bundler Project

To bring an existing Vite/webpack app into a Creght site, port its source, not
its build output — the platform bundles site code itself:

1. Move the modules under `components/` and turn the entry into a page.
2. Replace dependencies with built-ins where `creght runtime packages` has
   them; load the rest per "SSR Availability".
3. Move module-scope `window` / `document` work into a function the page calls
   from `useEffect`.
4. Keep `?raw` imports; replace `import.meta.env` with constants.
5. Upload large binary assets (models, point clouds, videos) with
   `creght upload`.

## Package Types

Use `fetch_module_types(specifier)` only when exact signatures are unknown, the
user asks to verify an API, or validation reports a mismatch.
