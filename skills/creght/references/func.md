# Creght Func Usage

Func is the project-scoped backend runtime for work that cannot be done safely
in browser code: bookings, waitlists, RSVP, lead routing, profile updates,
availability checks, protected user actions, third-party API calls with secrets,
webhooks, payment, and simple JSON-table reads/writes.

This file is **not** the Func API reference. It holds the rules that must hold
whether or not you read anything else. The API surface — `ctx` signatures,
return shapes, integration options, defaults and limits — lives in the live
documentation below and changes with each platform release.

## Live Documentation

Single stable entry point; fetch it first, then the topic doc it lists:

```
https://www.creght.cn/api.md
```

Any page path also serves markdown with a `.md` suffix.

1. Before writing or editing Func code, open the index and read the doc for the
   topic at hand. Do not answer from memory of a `ctx` signature, default,
   limit, or config field — those are exactly what the docs update.
2. For anything involving a **third-party service, an integration, payment,
   email or verification codes, or any Func capability not stated below**: check
   the index for a matching doc *before* writing provider HTTP calls. Only when
   the index has no such doc is the capability genuinely unwrapped by the
   platform — then it is ordinary Func code with the credential in
   `process.env`.
3. If the fetch fails, do not invent an API surface. Follow only the rules
   below, and tell the user the documentation is unreachable.

## Invariants

Scope and structure

- Confirm CMS or `talizen/form` is insufficient before reaching for Func. Func
  is not for content rendering, static contact forms, detached background jobs,
  heavy file processing, timer polling, unbounded streams, self-built
  account/session systems, OAuth callbacks, or token exchange. Bounded SSE
  streaming is supported.
- Func is project-scoped. User code must not receive, hard-code, read, or branch
  on `project_id`, `site_id`, internal tokens, or table IDs — and none of them
  belong in a client payload.
- Files live under `backend/func` in the workspace. The extensionless path is
  the key (`backend/func/booking.ts` → `booking`,
  `backend/func/profile/settings.ts` → `profile/settings`); dots are reserved
  for methods (`invoke("booking.create", input)`). Export callable methods
  directly — never hand-write a dispatcher. Use `main` only for a
  single-operation Func.
- The public HTTP path is `/func/<key>`. Do not create `/func/*` pages.

Runtime

- Reach every platform capability through `ctx`. Never use the legacy globals
  `data`, `db`, `auth`, `cache`, or CommonJS exports.
- Func is not a full Node.js runtime: no Node built-ins (including
  `node:crypto`), and no `setTimeout` / `setInterval` — they cannot be used for
  delays, polling, or retries.
- Validate and normalize all input inside the Func. Return structured JSON for
  expected business states; throw only for invalid requests or unexpected
  failures.
- Import types from `talizen/func-runtime` with `import type`. Func has no
  module loader, so a runtime value import from it always fails.

Secrets and integrations

- Never hard-code an API key, bearer token, password, webhook secret, or service
  credential — not in Func files, `talizen.config.ts`, pages, components,
  examples, comments, or generated output. Secrets come from `process.env`.
- Env vars and integrations are configured by the **user** in
  `panel/backend/env` and `panel/backend/integrations`. The CLI cannot manage
  either; never claim to have set one up.
- Where the platform has a managed integration, the credential stays server-side
  and the capability is used through `ctx`. Never call the provider's HTTP API or
  write an `Authorization` header for such a capability, and never work around a
  "not configured / not verified / disabled" error by going direct — that is a
  user action in the panel.
- Which capabilities are managed changes every release: the index answers it, this
  file does not. Read the matching doc first — the platform already enforces what
  fails silently when hand-rolled, so reimplementing it is a regression, not a
  fallback. A verified code proves mailbox control, not a session.
- For a callback the platform does not wrap: verify the signature over the **raw**
  body, then merchant identity, local order, amount and paid state, update
  idempotently, return the provider's exact acknowledgement. Re-serialising the body
  breaks the signature; a browser redirect parameter is not payment.

Data and identity

- A JSON table must exist before writes. Its definition is
  `platform/table/<key>.json` in the workspace (file name = table key); the CLI
  `creght table` commands manage the same definitions, and records go through
  `creght table record`. Use JSON Schema only to describe record shape — no
  dynamic SQL migrations or DDL.
- Store the platform `user.id` as the ownership key. Never use an email as an
  identity key, and never create account identity tables such as `users` or
  `auth_users`.
- Use `ctx.auth.requireUser()` for protected backend actions. Auth UI uses
  `useAuth()` from `talizen/auth` (see `references/auth.md`); never build
  passwords, sessions, login, registration, or OAuth callbacks in Func.

Boundaries

- Do not call Func from `getServerSideProps`. SSR intentionally exposes no
  `ctx.auth`, `ctx.func`, `ctx.db`, or `ctx.cache`.
- Call Func from browser event handlers for mutations, and keep persistent
  writes in Func — never fake persistence in React state.
- A browser-selected `File`/`Blob` uploads through `uploadAsset` from
  `talizen/assets`. Do not base64-encode browser files through `invoke()` just
  to reach `ctx.assets.upload`, which is only for bytes generated inside Func.
  Never store or return large base64 payloads. Use `creght upload` only for
  local build-time files.

Timeouts

- `invoke` has a short default timeout; bounded long work (model image or video
  generation, slow third-party calls) needs an explicit `timeoutMs` at the call
  site. Detached background work is not an option.
- For `context deadline exceeded` / `context timeout`: inspect the page's actual
  `invoke(..., { timeoutMs })`, then re-run the same input and model with a
  larger timeout. A timeout passed to `creght func run` / `run_func` affects
  only that self-test and is never evidence of a platform hard limit. Never
  "fix" a deadline by shortening the requested output, lowering `max_tokens`,
  switching models or providers, creating tables, or faking a background job.

## ctx Surface

Deliberately not listed: a stale list is worse than none — it denies a capability
that exists, and you hand-roll what the platform wraps. Take the current set from
the index, or from `import type { TalizenFuncContext } from 'talizen/func-runtime'`.

- Reach capabilities only through `ctx`, never the legacy globals.
- `fetch`, `Response`, `TextDecoder` and Web Crypto (`crypto`) are globals; a
  returned `Response` bypasses the JSON envelope — that is how a callback returns
  the provider's exact acknowledgement.
- Request body readers follow Fetch semantics and can be consumed once.
- `console.*` / `ctx.trace_id` correlate one call across logs.

## CLI Management

When native platform tools are unavailable, use the CLI for table and Func work.

```bash
creght table create --site_id=<project_id>/<site_id> --key=appointments --schema=./appointments.schema.json
creght table record list --site_id=<project_id>/<site_id> --table=appointments
creght pull --site_id=<project_id>/<site_id> --dir=./mysite
$EDITOR ./mysite/backend/func/booking.ts
creght push --site_id=<project_id>/<site_id> --dir=./mysite
creght func run --site_id=<project_id>/<site_id> --key=booking.create --input=./input.json
```

Deleting local Func files deletes remote Funcs only on `push --delete`.

## Checklist

1. Confirm CMS or `talizen/form` cannot do it.
2. Read the relevant doc from the index above.
3. Create or verify the JSON tables.
4. Write the Func under `backend/func`; validate input, secrets from
   `process.env`.
5. Call it with `invoke("key.method", input)`; native Fetch + SSE only for
   streaming.
6. Use `creght func run` / `run_func` with sample input for backend self-tests.
7. Run lint or preview validation after page/component edits, then verify the
   real path: success, expected business failure, signed-out, third-party
   failure, timeout.

On any runtime failure, read `references/error-handling.md`.
