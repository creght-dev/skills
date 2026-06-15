# Cregh Sitemap

Cregh supports a root-level `/sitemap.ts` file for generating XML sitemap
entries. Its authoring rules follow Next.js `sitemap.ts`: export a default
function that returns an array of sitemap entries, or a promise resolving to
that array.

## File Location

Create the file at the project root:

```text
/sitemap.ts
```

Do not place sitemap files under `/page` or `/app`.

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
4. Fetch CMS lists with `listContents` from `talizen/cms` when entries depend
   on CMS data.
5. Read generated collection types from `/types/cms.d.ts` before referencing
   CMS fields.
6. Treat CMS fields as optional and skip entries that cannot produce a valid
   URL.
7. Keep sitemap data serializable; do not return React elements or page props.

## Minimal Example

```ts
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
