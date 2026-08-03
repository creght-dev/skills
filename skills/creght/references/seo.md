# Creght SEO And Metadata

Use structured `metadata` for SEO. It applies at two levels: site defaults in
`talizen.config.ts`, and page metadata exported from page components. Avoid
custom `seo` objects and raw tags when `metadata` can express the same thing.

## Metadata

Supported fields mirror common Next.js `Metadata`: `title`, `description`,
`keywords`, `creator`, `publisher`, `applicationName`, `generator`,
`referrer`, `formatDetection`, `openGraph`, and `icons`.

Put OG values under `metadata.openGraph`; use absolute URLs for OG media.
Keywords are a string array.

```ts
import type { Metadata } from "talizen"

export default {
  metadata: {
    title: { template: "%s | Acme", default: "Acme" },
    description: "Acme makes better tools.",
    keywords: ["Acme", "Tools"],
    openGraph: {
      title: "Acme",
      description: "Acme makes better tools.",
      url: "https://example.com",
      siteName: "Acme",
      images: [{ url: "https://example.com/og.png", width: 1200, height: 630 }],
      type: "website",
    },
  } satisfies Metadata,
}
```

## Page Metadata

Pages may export `metadata` or `generateMetadata`. Use `generateMetadata` when
SEO depends on params, query data, or CMS content.

```tsx
import type { Metadata } from "talizen"
export const metadata: Metadata = { title: "About", description: "About Acme." }
```

```tsx
import { getContent } from "talizen/cms"

export async function generateMetadata({ params }) {
  const content = await getContent("blogs", params.slug, { builtinRef: true })
  return {
    title: content?.body?.title ?? params.slug,
    description: content?.body?.description ?? "Blog detail page",
  }
}
```

## Merge Rules

- Literal page `title` overrides site title.
- Site title templates wrap literal page titles.
- Page `{ title: { absolute: "About" } }` bypasses the site template.
- Other page fields override matching site fields when defined.
- `metadata.icons` merges by slot: non-empty page `shortcut`, `icon`, `apple`,
  or `other` replaces that slot.

Site `metadata.title` and `metadata.description` also drive `/llms.txt`; never
hand-write one. See `platform-endpoints.md`.

## Icons

`metadata.icons` emits favicon/touch links in this order: `shortcut`, `icon`,
`apple-touch-icon`, `other`. `shortcut`, `icon`, and `apple` may be a string,
object `{ url, media?, sizes?, type? }`, or array. `other` may be
`{ rel, url }` or array.

## Viewport

Viewport is site-level config, separate from `metadata`.

```ts
export default {
  viewport: {
    width: 1200,
    initialScale: null,
    maximumScale: 1,
    userScalable: false,
    interactiveWidget: "resizes-visual",
    themeColor: "#111111",
    colorScheme: "dark",
  },
}
```

If omitted, Creght renders:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Do not use `metadata.viewport`, page-level viewport exports, or raw viewport
tags in `customCode.head`. Supported fields: `width`, `height`, `initialScale`,
`minimumScale`, `maximumScale`, `userScalable`, `interactiveWidget`,
`themeColor`, and `colorScheme`.

## Legacy SEO Migration

1. Move `seo.title` and `seo.description` to `metadata.title` and
   `metadata.description`.
2. Convert OG tags to `metadata.openGraph`.
3. Convert keywords tags to `metadata.keywords`.
4. Keep `customCode.head` only for tags that cannot be represented by
   `metadata`.

For "add OG" or "add keywords", edit `metadata.openGraph` and
`metadata.keywords`; do not add duplicate raw tags.
