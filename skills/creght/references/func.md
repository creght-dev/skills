# Creght Func Usage

Use Creght Func for small project-level backend workflows that cannot be done
safely in browser code: appointments, waitlists, RSVP, lead routing,
registration-like submissions, profile updates, availability checks, protected
status updates, and simple JSON-table reads or writes.

Func is project-scoped. The platform runs each Func inside the current project
context, so user code must not receive, hard-code, read, or branch on
`project_id`. A site may call a Func through its own domain, but the Func and
its JSON data belong to the project.

## When To Use Func

Use Func when the user asks for behavior such as:

- Save an appointment, booking, RSVP, signup, or lead.
- Check availability before creating a record.
- Update an existing JSON-table record.
- Read a small list of project records for an interactive UI.
- Run validation that must not be trusted to the browser.
- Run protected business actions for the currently signed-in project auth user.

Do not use Func for:

- Normal content rendering that CMS already covers.
- Static contact forms that only need `talizen/form`.
- Long-running jobs, streaming, file processing, or heavy computation.
- Direct database, Redis, network, token, or credential access from page code.
- Custom identity/session systems, including OAuth callbacks and token exchange.
  Use the platform project auth APIs instead.

For login, registration, logout, current user, OAuth/social login, and account
UI, read `references/auth.md` and use the browser-side `talizen/auth` SDK from
page/component code.

## Func Keys And Methods

Each Func has a project-unique key. Treat the key like an extensionless file
path:

- Good: `booking`, `booking/admin`, `profile/settings`
- Avoid: `booking.js`, `user/auth.ts`, `auth.login`, `user/auth.login`

Dots are reserved for method invocation. The client call format is:

```ts
invoke("file.method", input)
```

Examples:

- `invoke("booking.create", input)` calls Func key `booking`, method `create`.
- `invoke("profile/settings.update", input)` calls Func key
  `profile/settings`, method `update`.
- `invoke("booking", input)` calls Func key `booking`, method `main`.

If a Func contains only one operation, implement `main`. If a feature has
closely related operations, put multiple exported methods in one Func file.

## Writing Func Code

Func code can be authored as TypeScript. The platform compiles it with esbuild
and runs it in the Func runtime.

Rules:

1. Export methods with ESM syntax: `export function method(input, ctx)`.
2. Use `export function main(input, ctx)` for the default method.
3. Put all platform runtime access behind `ctx`.
4. Import only TypeScript types from `talizen/func-runtime` when needed.
5. Do not write a manual `main` dispatcher. Export each callable method
   directly.
6. Validate and normalize all input inside the Func.
7. Return structured JSON. Use expected business results such as
   `{ status: "slot_taken", message: "This time is unavailable." }` instead of
   throwing.
8. Throw only for unexpected failures or invalid requests that should surface as
   errors.
9. Do not hard-code API keys, bearer tokens, passwords, webhook secrets, or
   service credentials in Func source.
10. Methods may be `async` when they need request body readers, `fetch`, or
    other Promise-returning runtime APIs.

Preferred type import:

```ts
import type { TalizenFuncContext } from "talizen/func-runtime"

export function create(input, ctx: TalizenFuncContext) {
  return ctx.db.insert("appointments", input)
}
```

Available helpers:

- `ctx.db.get(tableKey, id)`
- `ctx.db.query(tableKey, query)`
- `ctx.db.insert(tableKey, body)`
- `ctx.db.update(tableKey, id, body)`
- `ctx.db.delete(tableKey, id)`
- `ctx.auth.currentUser()`
- `ctx.auth.requireUser()`
- `ctx.assets.upload({ filename, mimeType, base64 })`
- `ctx.cache.get(key)`
- `ctx.cache.set(key, value, ttlSeconds)`
- `ctx.cache.del(key)`
- `ctx.cache.incr(key, delta?)`
- `ctx.cache.expire(key, ttlSeconds)`
- `ctx.request.host`, `ctx.request.ip`, `ctx.request.method`, `ctx.request.path`
- `ctx.request.headers.get(name)`
- `ctx.request.cookies.get(name)`
- `ctx.request.bodyUsed`
- `ctx.request.text()`
- `ctx.request.json()`
- `ctx.request.arrayBuffer()`
- `ctx.response.status(code)`
- `ctx.cookies.get(name)`
- `ctx.cookies.set(name, value, options?)`
- `ctx.cookies.delete(name, options?)`
- `console.log/warn/error`
- `ctx.trace_id` and optional `ctx.extra`

Do not use legacy globals such as `data`, `db`, `auth`, or `cache`. Do not use
CommonJS exports such as `exports.method = ...` or `module.exports`. New Func
code must use ESM exports and the `(input, ctx)` signature.

The request body readers follow Fetch `Request` semantics: they return Promises
and the body can be consumed only once. For webhook signatures, prefer
`await ctx.request.arrayBuffer()` so the exact incoming bytes are verified.
The runtime exposes `TextEncoder`/`TextDecoder` and a global Web Crypto `crypto`
(a global — do not import it; `node:crypto` is not available). It follows the
standard WebCrypto shape (async, Promises in/out, `ArrayBuffer`):

- `crypto.subtle.digest` — SHA-1 / SHA-256 / SHA-384 / SHA-512 (no key, no importKey)
- `crypto.subtle.importKey` — `raw` (HMAC, AES), `pkcs8` (RSA private), `spki`
  (RSA public); pass DER bytes for pkcs8/spki
- `crypto.subtle.sign` / `verify` — HMAC, RSASSA-PKCS1-v1_5, RSA-PSS
- `crypto.subtle.encrypt` / `decrypt` — AES-GCM, RSA-OAEP
- `crypto.subtle.generateKey` / `exportKey`
- `crypto.getRandomValues`, `crypto.randomUUID`

This covers HMAC webhook verification (Stripe, Creem), RSA2 / SHA256withRSA
signing and verification (Alipay), and RSA + AES-256-GCM flows (WeChat Pay v3).

`ctx.response.status(code)` sets the real HTTP response status for the Func
request. It accepts statuses from 100 through 599 and remains effective when a
Func sets it and then throws, which is useful for Webhook retry responses.

Func HTTP responses use status codes and do not include a top-level execution
`ok` field. A successful direct HTTP call returns `{ "result": ... }`; a thrown
Func error returns `{ "error": "..." }`. The browser-side `invoke()` helper
unwraps successful responses and returns the `result` value directly. If a Func
does `return { id: "evt_123" }`, the public HTTP response is
`{ "result": { "id": "evt_123" } }`, while `await invoke(...)` resolves to
`{ id: "evt_123" }`.

`ctx.project_id`, `ctx.site_id`, and platform user IDs are intentionally not
visible to Func code. The platform uses them internally for project isolation.
For browser visitor identity, use `ctx.auth.currentUser()` or
`ctx.auth.requireUser()`.

## Secrets And Environment Variables

Keep secrets out of source files. If a Func needs a third-party API key or other
secret, read it from `process.env.NAME`:

```ts
export async function generate(input, ctx) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { status: "missing_openai_token", message: "OPENAI_API_KEY is not configured." }
  }
  // Use apiKey only inside server-side Func code.
}
```

The env value itself must be added manually in the Creght platform Backend / Env
panel at `panel/backend/env` for the project. Do not put a real value in
`talizen.config.ts`, `backend/func/*.ts`, page/component code, examples,
comments, or generated test fixtures. The Creght CLI cannot create, list,
update, or delete project env variables, so do not attempt or claim CLI env
management.

## Assets In Func

Use `ctx.assets.upload({ filename, mimeType, base64 })` when a Func creates a
large binary asset at runtime, such as an AI-generated image. It uploads the
asset to the project's Creght-hosted OSS/CDN storage and returns:

```ts
{
  fileUrl: "https://...",
  filePath: "project/...",
  size: 123456
}
```

Store `fileUrl`, `filePath`, `size`, and other metadata in JSON tables. Do not
store base64 image/video/audio payloads in `ctx.db` records and do not return
large base64 payloads from Func methods; Func results have a bounded response
size and community/list endpoints should stay lightweight. Use `creght upload`
only for local build-time files, not for runtime-generated Func assets.

## Auth In Func

Use platform auth helpers inside Func only for protected business actions:

```ts
import type { TalizenFuncContext } from "talizen/func-runtime"

export function create(input, ctx: TalizenFuncContext) {
  const user = ctx.auth.requireUser()
  return ctx.db.insert("appointments", { userId: user.id, date: input.date })
}
```

`ctx.auth.currentUser()` returns the project auth user or `null`.
`ctx.auth.requireUser()` throws `login required` when the visitor is not logged
in. These helpers do not create accounts or sessions. Registration, password
login, OAuth login, logout, and current-user UI are browser-side platform auth
operations from `talizen/auth`; see `references/auth.md`.

## JSON Tables

Func stores persistent project data through project JSON tables. A table must
exist before a Func writes to it. The table key is the string passed to
`ctx.db.*`, for example `appointments`.

Use JSON Schema only to describe and validate table record shape. Do not design
Func features that require dynamic SQL migrations or table DDL.

Common query shape:

```ts
ctx.db.query("appointments", {
  where: { email: "person@example.com" },
  limit: 20,
  offset: 0,
  order_by: "created_at desc",
})
```

Keep query payloads small and predictable. Use simple top-level fields for
filters that the platform can index later.

## CLI Management

In general-purpose agent environments, use the Creght CLI when platform table or
Func tools are unavailable.

The CLI cannot manage project env variables. If Func code uses
`process.env.NAME`, instruct the user to add or update that value manually in
the Creght platform Backend / Env panel at `panel/backend/env` before running
or publishing the Func.

Create or update a JSON table:

```bash
creght table create --site_id=<project_id>/<site_id> --key=appointments --name="Appointments" --schema=./appointments.schema.json
creght table update --site_id=<project_id>/<site_id> --key=appointments --schema=./appointments.schema.json
```

Manage records:

```bash
creght table record list --site_id=<project_id>/<site_id> --table=appointments
creght table record create --site_id=<project_id>/<site_id> --table=appointments --data=./record.json
creght table record update --site_id=<project_id>/<site_id> --table=appointments --id=<record_id> --data=./patch.json
```

Create, update, rename, and delete Func code by editing files:

```bash
creght pull --site_id=<project_id>/<site_id> --dir=./mysite
$EDITOR ./mysite/backend/func/booking.ts
creght push --site_id=<project_id>/<site_id> --dir=./mysite
```

Path mapping:

```text
backend/func/booking.ts -> Func key booking
backend/func/profile/settings.ts -> Func key profile/settings
```

`creght push`, `creght sync`, and `creght dev` diff `backend/func/**/*.ts` and
apply create/update/delete operations automatically. Deleting a local Func file
deletes the remote Func on the next push/sync. Renaming a file is treated as
delete old key + create new key.

Self-test Func methods with:

```bash
creght func run --site_id=<project_id>/<site_id> --key=booking.create --input=./input.json
```

When an environment exposes native tools, use their equivalents:
`list_tables`, `create_table`, `update_table`, `list_table_records`,
`create_table_record`, `update_table_record`, `list_funcs`, `create_func`,
`update_func`, and `run_func`. In external CLI workflows, edit `backend/func`
files for Func CRUD; the CLI only exposes `creght func run` for self-tests.

## Minimal Booking Example

Func key: `booking`

```ts
function required(value, field) {
  const text = String(value || "").trim()
  if (!text) throw new Error(field + " is required")
  return text
}

export function create(input, ctx) {
  const date = required(input.date, "date")
  const time = required(input.time, "time")
  const existing = ctx.db.query("appointments", {
    where: { date: date, time: time, status: "confirmed" },
    limit: 1,
  })
  if (existing.list.length > 0) {
    return { status: "slot_taken", message: "This time is unavailable." }
  }

  const inserted = ctx.db.insert("appointments", {
    name: required(input.name, "name"),
    email: required(input.email, "email").toLowerCase(),
    date: date,
    time: time,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  })
  return { id: inserted.id }
}
```

Expected table key: `appointments`. Its JSON Schema should include at least
`name`, `email`, `date`, `time`, `status`, and `createdAt`.

## Calling Func From A Page

Use the SDK exported by `talizen/func` for browser-side page/component
interactions. For exact declarations, fetch package types only when needed:

```ts
fetch_module_types("talizen/func")
```

Common client-side call:

```tsx
import { invoke, TalizenFuncError } from "talizen/func"

type BookingResult =
  | { id: string }
  | { status: "slot_taken"; message: string }

try {
  const result = await invoke<BookingResult>("booking.create", {
    name,
    email,
    date,
    time,
  })
  if ("status" in result) {
    setMessage(result.message)
    return
  }
  setMessage("Your booking is confirmed.")
} catch (error) {
  setMessage(error instanceof TalizenFuncError ? error.message : "Unable to book.")
}
```

Rules for page code:

- Call Func from event handlers for mutations.
- Keep all persistent writes inside Func, not in React state alone.
- Import Func client helpers from `talizen/func`, not from a relative SDK path.
- Use `invoke("file.method", input)` for normal use.
- Use `invoke("file", input)` only when the Func exports `main`.
- Handle expected `{ status, message }` business responses separately
  from thrown errors.
- Do not include `project_id`, `site_id`, internal tokens, or table IDs in the
  client payload.

## Func And getServerSideProps

Do not call Func from `getServerSideProps`. Server-side page code receives a
small request context, but it does not expose `ctx.auth`, `ctx.func`, `ctx.db`,
or `ctx.cache`. Keep Func calls in browser-side interactions or API-style flows.

```ts
import type { TalizenServerSideContext } from "talizen/server-runtime"

export async function getServerSideProps(ctx: TalizenServerSideContext) {
  return { props: { path: ctx.request.path } }
}
```

Available `getServerSideProps` context helpers:

- `ctx.request.host`, `ctx.request.ip`, `ctx.request.method`, `ctx.request.path`
- `ctx.request.headers.get(name)`
- `ctx.request.cookies.get(name)`
- `ctx.cookies.get(name)`
- `ctx.cookies.set(name, value, options?)`
- `ctx.cookies.delete(name, options?)`

`getServerSideProps` intentionally does not expose `ctx.auth`, `ctx.func`,
`ctx.db`, or `ctx.cache`. Business reads/writes should stay in Func code and be
called from browser-side code via `talizen/func`.

Render cache behavior:

- `ctx.cookies.*` makes the SSR response private/no-store.
- Func is deliberately unavailable in SSR so arbitrary db/cache/auth/cookie
  logic cannot make HTML caching unpredictable.

## Agent Checklist

Before building a Func-backed feature:

1. Identify the project JSON table keys required by the workflow.
2. Create or update the JSON Schema for those tables if the platform tools or
   CLI expose table management.
3. Create a project-level Func with an extensionless key.
4. Export one method per operation.
5. If the Func needs secrets, read `process.env.NAME` and tell the user to add
   the env value manually in Creght Backend / Env at `panel/backend/env`.
6. Call the method with `invoke("key.method", input)` from the page.
7. Run lint or preview validation after editing page/component code.

For a simple appointment workflow, the normal shape is:

- Table: `appointments`
- Func key: `booking`
- Methods: `create`, optionally `listByEmail` or `cancel`
- Client call: `invoke("booking.create", input)`
