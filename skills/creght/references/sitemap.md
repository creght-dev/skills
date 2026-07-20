# Creght Sitemap

Creght supports a root-level `/sitemap.ts` file for generating XML sitemap
entries. Its authoring rules follow Next.js `sitemap.ts`: export a default
function that returns an array of sitemap entries, or a promise resolving to
that array.

Use `talizen/cms` inside `/sitemap.ts` when sitemap entries depend on CMS list
pages or CMS detail pages.

## File Location

Create the file at the project root:

```text
/sitemap.ts
```

Do not place sitemap files under `/pages`, `/page`, or `/app`. Sitemap
generation is site-level configuration, not a route component.

## Return Shape

Each sitemap entry follows this shape:

```ts
{
  url: string
  lastModified?: string | Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
}
```

Rules:

1. `url` must be an absolute URL.
2. Use the `TALIZEN_PUBLIC_SITE_URL` environment variable for the site URL.
3. Include static routes such as the home page manually.
4. Fetch CMS lists with `listContents` from `talizen/cms`.
5. Read generated collection types from `/types/cms.d.ts` before referencing
   CMS fields.
6. Treat CMS fields as optional and skip entries that cannot produce a valid
   URL.
7. Keep sitemap data serializable; do not return React elements or page props.

## CMS Pages

Use `listContents` for list-based sitemap generation. For collections with many
items, request a high enough `limit` or paginate if the project needs complete
coverage.

Common CMS route patterns:

- List page: add the static list route manually, for example
  `https://example.com/blogs`.
- Detail page: map CMS items to URLs, for example
  `https://example.com/blogs/${item.slug}`.

## Minimal Example

```ts
// /sitemap.ts
import { listContents } from "talizen/cms"
import type { Blogs } from "./types/cms"

const siteUrl = process.env.TALIZEN_PUBLIC_SITE_URL

export default async function sitemap() {
  const blogs = await listContents<Blogs>("blogs", {
    limit: 100,
    orderBy: "updated_at desc",
  })

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...(blogs?.list ?? [])
      .filter((item) => item.slug)
      .map((item) => ({
        url: `${siteUrl}/blogs/${item.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      })),
  ]
}
```

## Notes

- Replace `Blogs` and `"blogs"` with the actual collection type and key from
  `/types/cms.d.ts`.
- Replace `/blogs` with the real route used by the project.
- If CMS items expose an update timestamp in the generated type, prefer that
  value for `lastModified`; otherwise `new Date()` is acceptable for a minimal
  sitemap.
