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
- `openGraph` (with `title`, `description`, `url`, `siteName`, `images`,
  `videos`, `audio`, `locale`, `type`)
- `icons` (favicons and touch icons — see below)

Creght converts these structured fields into `<title>`, `<meta>`,
`<link rel="…" href="…">`, and Open Graph tags in the rendered HTML.

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

Each page can export its own `metadata` object, or export `generateMetadata`
for dynamic values. Both participate in the merge rules with the site-level
metadata. Prefer `generateMetadata` when page SEO depends on route params or
query data.

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

This produces tags such as:

```html
<title>About Us</title>
<meta name="description" content="Learn about Acme." />
```

Other fields (e.g. `openGraph`) fall back to `talizen.config.ts` unless
overridden at the page level.

Use `generateMetadata` when metadata depends on route params or CMS data. This
uses the stable CMS helper `getContent`. If you need exact signatures, refer to
the generated `./types/*.d.ts` files (for CMS content, `./types/cms`).

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

## Merge Rules: Site vs Page

When both levels define the same field:

- **Literal page title wins**:

  ```tsx
  // Page.tsx
  export const metadata = {
    title: 'About Us',
  }

  // talizen.config.ts
  export default {
    metadata: {
      title: 'Index',
    },
  }
  ```

  Result:

  ```html
  <title>About Us</title>
  ```

- **Template at root + literal on page**:

  ```tsx
  // Page.tsx
  export const metadata = {
    title: 'About Us',
  }

  // talizen.config.ts
  export default {
    metadata: {
      title: {
        template: '%s | Acme',
        default: 'Acme',
      },
    },
  }
  ```

  Result:

  ```html
  <title>About Us | Acme</title>
  ```

  If the page does not define `title`, the `default` value is used:

  ```html
  <title>Acme</title>
  ```

- **Absolute page title ignores template**:

  ```tsx
  // Page.tsx
  export const metadata = {
    title: {
      absolute: 'About',
    },
  }

  // talizen.config.ts
  export default {
    metadata: {
      title: {
        template: '%s | Acme',
        default: 'Acme',
      },
    },
  }
  ```

  Result:

  ```html
  <title>About</title>
  ```

## OG & Keywords Mapping

Example metadata:

```ts
export const metadata = {
  title: 'Acme',
  description: 'A demo site',
  keywords: ['Next.js', 'React', 'JavaScript'],
  openGraph: {
    title: 'Next.js',
    description: 'The React Framework for the Web',
    url: 'https://nextjs.org',
    siteName: 'Next.js',
    images: [
      {
        url: 'https://nextjs.org/og.png',
        width: 800,
        height: 600,
      },
    ],
    type: 'website',
  },
}
```

Generates tags like:

```html
<meta name="keywords" content="Next.js,React,JavaScript" />
<meta property="og:title" content="Next.js" />
<meta property="og:description" content="The React Framework for the Web" />
<meta property="og:image" content="https://nextjs.org/og.png" />
```

When users ask to "加 OG" or "加 keywords", prefer:

- Editing `metadata.openGraph` for Open Graph data.
- Editing `metadata.keywords` (array of strings) for keywords.

Avoid writing raw `<meta>` tags for things that `metadata` already covers.

## Icons

`metadata.icons` follows the Next.js `Metadata.icons` shape and supports
`shortcut`, `icon`, `apple`, and `other`. Creght emits `<link>` tags in this
order: **shortcut** → **icon** → **apple-touch-icon** → **other** (custom
`rel`).

Each of `shortcut`, `icon`, and `apple` may be:

- a string URL (or path),
- a single object `{ url, media?, sizes?, type? }`,
- or an array mixing strings and objects.

`other` may be a single `{ rel, url }` object or an array of such objects.

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

Arrays, media queries, and sizes are also supported:

```ts
export const metadata = {
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: ["/shortcut-icon.png"],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/apple-icon-x3.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon-precomposed.png",
      },
    ],
  },
}
```

Merge rule with site-level `metadata.icons`: each slot (`shortcut`, `icon`,
`apple`, `other`) is replaced by the page when that slot is non-empty on the
page; otherwise the site default for that slot is kept.

## Migrating from `seo` + Custom Head to `metadata`

Legacy Creght projects may use a custom `seo` block and embed `<meta>` tags
directly via `customCode.head`:

```ts
export default {
  importMap: {
    imports: {
      'lucide-react': 'https://esm.sh/lucide-react',
    },
  },
  seo: {
    title: 'Merry Gradient | Professional CSS Gradient & Light Glow Studio',
    description:
      'Craft sophisticated multi-layered CSS background textures and stunning lightglow gradients.',
  },
  customCode: {
    head: `
      <meta name="keywords" content="CSS Gradient, Light Glow, Web Design Tool">
      <meta property="og:type" content="website">
      <meta property="og:title" content="Merry Gradient | Professional CSS Gradient & Light Glow Studio">
      <meta property="og:description" content="Professional visual tool for designing sophisticated CSS background textures and lighting effects.">
      <meta name="twitter:card" content="summary_large_image">
    `,
  },
}
```

Migration steps:

1. Move `seo.title` and `seo.description` into `metadata.title` and
   `metadata.description`.
2. Convert Open Graph `<meta>` tags into `metadata.openGraph`.
3. Convert `keywords` `<meta>` into `metadata.keywords` (array of strings).
4. Remove duplicated SEO tags from `customCode.head`, keeping only tags that
   cannot be represented via `metadata` (for example certain verification tags
   or platform-specific meta).

Example migrated config:

```ts
import type { Metadata } from 'talizen'

export default {
  importMap: {
    imports: {
      'lucide-react': 'https://esm.sh/lucide-react',
    },
  },
  metadata: {
    title: 'Merry Gradient | Professional CSS Gradient & Light Glow Studio',
    description:
      'Craft sophisticated multi-layered CSS background textures and stunning lightglow gradients.',
    keywords: [
      'CSS Gradient',
      'Light Glow',
      'Web Design Tool',
      'Background Texture',
      'Multi-layered Gradient',
      'UI Design',
      'CSS Generator',
    ],
    openGraph: {
      type: 'website',
      title: 'Merry Gradient | Professional CSS Gradient & Light Glow Studio',
      description:
        'Professional visual tool for designing sophisticated CSS background textures and lighting effects.',
      // Optionally add url, siteName, images, etc.
    },
  } satisfies Metadata,
  customCode: {
    head: `
      <meta name="twitter:card" content="summary_large_image">
    `,
  },
}
```

## SEO Workflow

When asked to do things like:

- "基于当前的代码，帮我优化一下页面的 SEO 标题和描述"
- "帮我补全 OG 和 keywords"

Recommended steps:

1. Inspect `talizen.config.ts` to understand global `metadata`.
2. Inspect the relevant page component to see if it exports `metadata`.
3. Propose and apply changes primarily in:
   - `metadata.title` / `metadata.description`
   - `metadata.keywords`
   - `metadata.openGraph`
4. Only use `customCode.head` for SEO when something cannot be expressed through
   `metadata`.
