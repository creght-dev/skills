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

`/sitemap.ts` also shapes `/llms.txt`, which reuses this page enumeration. See
`platform-endpoints.md` before writing `sitemap.xml` anywhere else.

## Return Shape

An entry is `{ url, lastModified?, changeFrequency?, priority? }`, following the
Next.js sitemap item shape. `url` may be absolute or an in-site path such as
`/blog/hello`. Read `SitemapEntry` from the `talizen` package for the full
shape, allowed values, and language alternates.

Rules:

1. Include static routes such as the home page manually — this file replaces the
   automatic page scan, it does not extend it.
2. Fetch CMS lists with `listContents` from `talizen/cms`.
3. Read generated collection types from `/types/cms.d.ts` before referencing
   CMS fields.
4. Treat CMS fields as optional and skip entries that cannot produce a valid
   URL.
5. Keep sitemap data serializable; do not return React elements or page props.

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
