# Creght CMS Usage

`/types/cms.d.ts` is the source of truth for content shapes; `talizen/cms` is
the fetch API, called from server-side data-loading code. Read the generated
file before writing CMS code and import from it:
`import type { Blogs, Authors } from "./types/cms"`. Do not edit it — it
regenerates when collections change, and new collections are created through
the Creght platform (or a collection-creation tool if your environment exposes
one), not by hand. Each item is `{ __cmsKey, id, slug, body: { …fields } }`;
treat fields as optional unless the schema guarantees otherwise and use optional
chaining, especially on `body`.

The helpers below cover the common cases: `listContents` (paginated lists),
`getContent` (one item by slug), `getContentWithPrevNext` (detail pages needing
neighbours). For an exact signature, consult the `talizen/cms` package's own
type declarations (for example in `node_modules`) and treat them as the source
of truth over these examples.

Keep CMS requests in `getServerSideProps` unless the project has a clear
alternative data-loading pattern.

## Existing Content Operations

For edits to existing CMS entries, use the CLI data path directly:
`creght content list`, `get`, then `update`. Preserve unrelated fields and
re-read the entry once to verify. If the field is missing or the page does not
render it, make the minimal schema or source change instead. See
`references/cli.md` for exact flags and payload format.

## List Content

```tsx
import { listContents } from "talizen/cms"
import type { Blogs } from "./types/cms"

export async function getServerSideProps() {
  const content = await listContents<Blogs>("blogs", {
    limit: 10,
    offset: 0,
    orderBy: "created_at desc",
  })
  return { props: { content } }
}
```

Returns `{ list?: T[]; total?: number }`. Optional params: `limit`, `offset`,
`searchKey`, `orderBy`, `filter`.

## Ordering

`orderBy` is comma-separated `<field>[ asc|desc]`, default `asc`. Fields are
system columns (`id`, `created_at`, `updated_at`, `sort`) or body fields written
`body.<key>` (nested: `body.meta.rank`), e.g.
`orderBy: "body.date desc, created_at desc"`. Default is `sort desc, id desc`,
matching the CMS admin list.

- A bare body name (`"date desc"`) is a 400; unsupported fields fail loudly
  instead of silently falling back to the default order.
- Values compare as stored, so dates only sort correctly in ISO form
  (`2026-07-17`), which `format: date` produces.
- Entries missing the field sort last.
- Sort server-side; do not fetch a large `limit` and re-sort in JS.
- To change the order editors see, set each entry's `sort` (bigger first). Never
  delete and recreate entries to reorder: ids change, and site versions do not
  snapshot CMS content, so it cannot be undone. Reorder in place with
  `creght content update --collection=<key> --id=<id> --data=./content.json
  --sort=<n>`; `--sort` works on `create` too, and `--sort=0` is a real value,
  not "unset".
- `sort` set only inside a `--data` file is honoured as long as `--sort` is not
  passed; the flag wins when it is. Passing neither omits `sort` from the
  request: `create` takes the platform default (appended last) and `update`
  keeps the entry's current value.
- Older CLI builds fail `content update --sort` with
  `flag provided but not defined: -sort`, and drop a file-only `sort` on
  `create` (entry lands at the end). If you hit either, upgrade the CLI rather
  than working around it by deleting and recreating entries.

## Filter Content

Use `filter` for structured server-side filtering.

```ts
const content = await listContents<Blogs>("blogs", {
  limit: 10,
  filter: {
    match: "all",
    conditions: [
      { fieldId: "status", operator: "eq", value: "published" },
      { fieldId: "category", operator: "eq", value: "news" },
    ],
  },
})
```

## Get A Single Item

```tsx
const content = await getContent<Blogs>("blogs", context.params?.slug)
if (!content) return { notFound: true }
```

Arguments: collection key, slug, optional params, optional request options.

## Get Current Item With Prev/Next

```ts
const article = await getContentWithPrevNext<Blogs>("blogs", slug, {
  prev: true,
  next: true,
})
```

Returns `{ current?: T; next?: T; prev?: T }`.

Known limitation: neighbours are resolved against the default
`sort desc, id desc` order only; any other `orderBy` still returns
default-order neighbours.

## Writing Content Bodies (Rich Text Is HTML, Not Markdown)

Rich-text body fields (e.g. an article `body`) store HTML, not Markdown: the
editor produces HTML, pages render it via `dangerouslySetInnerHTML`, and TOCs
are derived by scanning for `<h2>` / `<h3>`. Markdown put there renders as
literal text and yields no TOC.

Author them as HTML: `<h2>`/`<h3>` (no `<h1>` — the title is its own field),
`<p>`, `<strong>`, `<em>`, `<ul>`/`<ol>` with `<li><p>…</p></li>`,
`<blockquote>`, `<code>`, `<pre><code>` (HTML-escape `<`, `>`, `&` inside),
`<table>` with `<thead>`/`<tbody>`, and
`<a target="_blank" rel="noopener noreferrer nofollow">`.

Plain string fields (title, description, slug, …) stay plain text. When unsure,
read an existing entry with `creght content list` / `creght content get` and
match its `body` format.

## General CMS Guidelines

- Return `notFound: true` when content does not exist; use `redirect` when
  access or routing should change.
- Follow the collection JSON Schema when creating or updating content.
- On multilingual sites, `listContents` / `getContent` /
  `getContentWithPrevNext` return each item already decoded to the current
  locale — just read the fields; don't read or merge `_i18n` yourself. See
  `references/i18n.md`.
- A field's `contentMediaType` picks the editor control: `text/markdown` → the
  Markdown editor (use it with `type: "string"` for Markdown bodies),
  `text/html` → rich text, `image/*` / `video/*` → URL/upload, anything else →
  a generic file field.
- Do not rely on old helper names from legacy docs.
