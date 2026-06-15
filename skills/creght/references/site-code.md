# Cregh Site Code

Cregh apps are React-based websites with file-based routes under `/page`, a
root `talizen.config.ts`, Tailwind v4 styling, generated project types, and
platform APIs for CMS, forms, metadata, import maps, previews, and publishing.

## Routing

Routing is derived from `/page` file names by Cregh conventions:

- `/page/Index.tsx` -> `/`
- `/page/About.tsx` -> `/about`

For non-`Index` pages, do not guess kebab-case routes. Prefer the lowercase
canonical path returned by lint or platform validation; for example,
`/page/BlockElementsPage.tsx` should be linked as `/blockelementspage`.

Files like `/page/XXXX.canvas.tsx` are canvas preview entries used by the
platform editor, not normal route files to generate by hand.

## Navigation

Use native anchors:

```tsx
<a href="/about">About</a>
```

Do not import `Link` from `talizen`, `next/link`, or any router library.

## Data Loading

Prefer `getServerSideProps(context)` for route params and first-render data.
Read dynamic params from `context.params`; do not use client-side param hooks
when SSR params are available.

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

## Local Imports

Use relative paths for local project imports. The Cregh platform does not
support alias imports such as `@/lib/utils`; write them as relative imports from
the importing file, for example `../lib/utils`, `../../lib/utils`, or
`./lib/utils`.

Package imports and Cregh platform imports still use their normal specifiers,
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
- Keep the import specifier exactly the same as the `imports` key.
- Cregh's compiler supports Vite-style local asset queries for relative imports:
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

Do not duplicate metadata in `customCode`; prefer structured `metadata` whenever
the field fits.

## Package Types

When the current environment provides a Cregh module-type lookup tool, use it
only when exact package signatures are needed, an uncommon package or subpath is
involved, the effective URL/version changed, the user explicitly asks to verify
the API, or lint/typecheck suggests quick reference examples are stale.

Do not fetch package declarations for common packages already covered by model
knowledge, such as `react`.
