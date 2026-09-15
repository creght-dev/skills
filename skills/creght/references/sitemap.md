# Creght Sitemap

A site gets `/sitemap.xml` in one of two ways, and **the default is not
"nothing"** (this is where Creght differs from Next.js, which emits no sitemap
at all unless you write `sitemap.ts`):

1. **Automatic page scan (default).** Creght walks the page files and emits one
   URL per static route. For a **dynamic route** (`[param]` in the filename) it
   calls that page's exported `generateStaticParams()` to expand it into real
   URLs.
2. **`/sitemap.ts` (override).** When this file exists it **replaces** the scan
   entirely; nothing is added automatically.

Read the next section before writing any page with `[param]` in its filename.

## Dynamic routes must export `generateStaticParams`

**Every page file with `[param]` in its name must export
`generateStaticParams`**, unless the site uses `/sitemap.ts`.

Skipping it fails silently. `page/blog/[slug].tsx` without it means **not one
`/blog/*` URL exists in the sitemap**, while `sitemap.xml` still returns 200 with
the home page and the static routes in it. Nothing errors, nothing logs, and the
site owner has no way to notice. Two things break:

- Search engines never discover the detail pages.
- **Static HTML export produces a package with no detail pages**, because the
  export decides what to render from the sitemap's `<loc>` list.

```ts
// page/blog/[slug].tsx
import { listContents } from "talizen/cms";
import type { GenerateStaticParams } from "talizen";
import type { Blogs } from "../../types/cms";

export const generateStaticParams: GenerateStaticParams = async () => {
  const res = await listContents<Blogs>("blogs", { limit: 100, offset: 0 });
  return (res?.list ?? [])
    .filter((item) => item.slug)
    .map((item) => ({
      slug: item.slug,
      // Use the content's own timestamp. Without it every URL from this route
      // shares one lastmod: the page file's own date, to the day. Editing an
      // article then never changes it, so crawlers are not told to come back.
      lastModified: item.updated_at,
    }));
};
```

Rules for the returned array:

- One key per `[param]` in the path. `page/docs/[category]/[slug].tsx` needs both
  `category` and `slug`; an entry missing one is dropped without an error.
- `lastModified` is strongly recommended and takes a CMS timestamp or a `Date`.
  `changeFrequency` and `priority` are optional. `lastmod` / `changefreq` are
  accepted as aliases, but write the camelCase names: they match `sitemap.ts`.
- Paginate when a collection has more items than one request returns. Items you
  do not fetch are not reported as missing, they are simply absent.
- Filter out items that should not be indexed (drafts, deprecated, untranslated).
  Every entry returned here is submitted to search engines, so an entry whose
  page 404s costs more than a missing one.

Import the type from the `talizen` package: `GenerateStaticParams` and
`StaticParamsEntry` carry the full shape.

## Writing `/sitemap.ts` instead

Creght supports a root-level `/sitemap.ts` file for generating XML sitemap
entries. Its authoring rules follow Next.js `sitemap.ts`: export a default
function that returns an array of sitemap entries, or a promise resolving to
that array.

Prefer `generateStaticParams` for ordinary sites: it keeps each route's URL list
next to that route. Reach for `/sitemap.ts` when the sitemap needs something the
per-route expansion cannot express, such as cross-domain language alternates or
URLs that belong to no page file.

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
