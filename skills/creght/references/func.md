# Creght Func Usage

Use Func for small project-level backend workflows: bookings, waitlists, RSVP,
lead routing, profile updates, availability checks, protected user actions,
third-party API calls with secrets, and simple JSON-table reads/writes. Func is
project-scoped; user code must not receive, hard-code, read, or branch on
`project_id`.

## When To Use

Use Func when CMS or `talizen/form` is insufficient and validation, secrets,
persistence, or protected user logic must stay server-side. Do not use Func for
normal CMS rendering, long-running jobs, heavy processing, custom identity,
OAuth callbacks, or token exchange. For auth UI, read `references/auth.md`.

## Keys And Calls

Func keys are extensionless paths: `booking`, `booking/admin`,
`profile/settings`. Avoid `booking.js`, `user/auth.ts`, or `auth.login`.

```ts
invoke("booking.create", input)
invoke("profile/settings.update", input)
invoke("booking", input) // method main
```

Use `main` only for a single-operation Func; otherwise export named methods.

## Code Rules

1. Export ESM functions: `export function method(input, ctx)`.
2. Put platform access behind `ctx`.
3. Import only TypeScript types from `talizen/func-runtime` when needed.
4. Validate and normalize all input inside Func.
5. Return structured JSON for expected business states; throw for invalid or
   unexpected failures.
6. Never hard-code secrets or project IDs.
7. Do not use legacy globals (`data`, `db`, `auth`, `cache`) or CommonJS
   exports.

```ts
import type { TalizenFuncContext } from "talizen/func-runtime"

export function create(input, ctx: TalizenFuncContext) {
  return ctx.db.insert("appointments", input)
}
```

Common helpers: `ctx.db.get/query/insert/update/delete`, `ctx.auth.currentUser`,
`ctx.auth.requireUser`, `ctx.assets.upload`, `ctx.cache.*`, `ctx.request.*`,
`ctx.cookies.*`, `ctx.response.status(code)`, `console.*`, `ctx.trace_id`.

Request body readers follow Fetch semantics and can be consumed once. For
webhook signatures, use `await ctx.request.arrayBuffer()`. Web Crypto is
available as global `crypto`; `node:crypto` is not.

Func HTTP responses return `{ "result": ... }` or `{ "error": "..." }`.
Browser `invoke()` unwraps successful results and throws `TalizenFuncError`.

## Secrets, Payment, Assets

Read secrets from `process.env.NAME`. Users manually add env vars in Creght
Backend / Env at `panel/backend/env`; the CLI cannot manage env vars.

Payment integrations are custom server-side Func work: use REST/webhooks,
verify signatures over raw bytes, keep operations idempotent, and store order
state in JSON tables.

Use `ctx.assets.upload({ filename, mimeType, base64 })` for runtime-generated
large assets. Store returned URL/path/size metadata; do not store or return
large base64 payloads. Use `creght upload` only for local build-time files.

## Auth And JSON Tables

Use Func auth only for protected backend actions:

```ts
export function create(input, ctx) {
  const user = ctx.auth.requireUser()
  return ctx.db.insert("orders", { ...input, userId: user.id })
}
```

React UI must use `talizen/auth` `useAuth()`. Do not implement passwords,
sessions, login, registration, or OAuth callbacks in Func.

JSON tables must exist before writes. Use JSON Schema for record shape; do not
design dynamic SQL migrations or DDL. For user-specific data, store platform
`user.id`, not email identity keys. Do not create identity tables.

## CLI Management

When native platform tools are unavailable, use the CLI for table and Func work.
The CLI cannot manage env vars.

```bash
creght table create --site_id=<project_id>/<site_id> --key=appointments --schema=./appointments.schema.json
creght table record list --site_id=<project_id>/<site_id> --table=appointments
creght pull --site_id=<project_id>/<site_id> --dir=./mysite
$EDITOR ./mysite/backend/func/booking.ts
creght push --site_id=<project_id>/<site_id> --dir=./mysite
creght func run --site_id=<project_id>/<site_id> --key=booking.create --input=./input.json
```

Path mapping: `backend/func/booking.ts` -> `booking`;
`backend/func/profile/settings.ts` -> `profile/settings`. Deleting local Func
files deletes remote Funcs only on `push --delete`.

## Calling From Pages

```tsx
import { invoke, TalizenFuncError } from "talizen/func"

try {
  const result = await invoke("booking.create", input)
} catch (error) {
  const message = error instanceof TalizenFuncError ? error.message : "Unable to submit."
}
```

Call Func from event handlers for mutations. Keep persistent writes inside Func.
Do not include `project_id`, `site_id`, internal tokens, or table IDs in client
payloads.

## SSR Boundary

Do not call Func from `getServerSideProps`. SSR exposes request/cookie helpers,
but not `ctx.auth`, `ctx.func`, `ctx.db`, or `ctx.cache`. Auth/private
data/writes/cache/db logic belongs in Func/browser flows.

## Checklist

1. Confirm CMS or `talizen/form` is insufficient.
2. Create/update required JSON tables.
3. Add Func code under `backend/func`.
4. Validate input and keep secrets in `process.env`.
5. Call with `invoke("key.method", input)` from UI.
6. Use `creght func run`/`run_func` for sample tests when useful.
7. Run lint or preview validation after page/component edits.
