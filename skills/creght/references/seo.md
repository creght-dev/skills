# Creght SEO And Metadata

Creght uses a structured `metadata` model inspired by Next.js `Metadata`.
Prefer structured metadata over ad-hoc `seo` objects or raw `<title>` and
`<meta>` tags.

## Two-Level Metadata Model

Creght combines:

- Site-level `metadata` in `talizen.config.ts`.
- Page-level `export const metadata` or `export async function generateMetadata`
  from each page component file.

Common fields include:

- `title`
- `description`
- `keywords`
- `creator`
- `publisher`
- `applicationName`
- `generator`
- `referrer`
- `formatDetection`
- `openGraph`
- `icons`

Creght converts structured fields into rendered HTML tags.

## Site-Level Metadata

```ts
import type { Metadata } from "talizen"

export default {
  metadata: {
    title: {
      template: "%s | Acme",
      default: "Acme",
    },
    description: "Acme builds useful things.",
    keywords: ["Acme", "widgets"],
    openGraph: {
      title: "Acme",
      description: "Acme builds useful things.",
      url: "https://example.com",
      siteName: "Acme",
      images: [
        {
          url: "https://example.com/og.png",
          width: 1200,
          height: 630,
        },
      ],
      type: "website",
    },
  } satisfies Metadata,
}
```

Guidelines:

- Always use the `metadata` field for SEO.
- Place Open Graph data under `metadata.openGraph`.
- Use absolute URLs for Open Graph images, videos, and audio.
- Do not duplicate metadata in `customCode.head`.

## Page-Level Metadata

```tsx
import type { Metadata } from "talizen"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Acme.",
}

export default function Page() {
  return <main>...</main>
}
```

Use `generateMetadata` when metadata depends on route params or CMS data:

```tsx
import type { Metadata } from "talizen"
import { getContent } from "talizen/cms"
import type { Blogs } from "./types/cms"

export async function generateMetadata({ params }): Promise<Metadata> {
  const content = await getContent<Blogs>("blogs", params.slug, {})

  return {
    title: content?.body?.title ?? params.slug,
    description: content?.body?.description ?? "Blog detail page",
  }
}
```

## Icons

`metadata.icons` supports `shortcut`, `icon`, `apple`, and `other`.

```ts
export const metadata = {
  icons: {
    icon: "/icon.png",
    shortcut: "/shortcut-icon.png",
    apple: "/apple-icon.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/apple-touch-icon-precomposed.png",
    },
  },
}
```

Each of `shortcut`, `icon`, and `apple` may be a string URL, a single object, or
an array. `other` may be a single `{ rel, url }` object or an array.
