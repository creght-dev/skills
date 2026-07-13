# Creght CLI

The Creght CLI is a local bridge for Creght site code. It handles auth,
project creation and discovery, file pull/push/sync, remote preview, publishing,
platform data operations, and asset uploads.

The CLI does not render sites locally. Rendering, CMS, assets, realtime preview,
and publication are handled by the Creght backend and web app.

## Basics

Install and verify:

```bash
npm install -g creght-cli
creght version
```

Use the production endpoint by default. Omit `--web` unless the user explicitly
provides another Creght environment. For a non-default API host, use
`CREGHT_API_HOST`.

```text
API: https://creght.cn
Web: https://creght.cn
```

`creght -h` and `creght <command> -h` are the authoritative, always-current
command reference: exact flags, arguments, output formats, and examples. This
document only covers the workflow model and platform conventions the CLI help
cannot explain; when in doubt about a command's usage, run its `-h` instead of
relying on examples here.

## Discovering a Site From a Rendered URL

When the user provides a rendered page URL, such as
`https://www.creght.cn/docs/ai/ai-edit-content-guide`, discover the Creght site
before using CLI commands. Fetch the URL's origin with
`/.well-known/creght.json`:

```bash
curl -fsSL https://www.creght.cn/.well-known/creght.json
```

A successful response is JSON like:

```json
{
  "schema_version": 1,
  "type": "site",
  "site_id": "site-1",
  "project_id": "project-1",
  "provider": {
    "name": "Creght",
    "url": "https://creght.cn"
  },
  "canonical_host": "example.com"
}
```

Use the returned IDs as the CLI site identifier:

```bash
creght pull --site_id=<project_id>/<site_id> --dir=./mysite
creght content create --site_id=<project_id>/<site_id> --collection=<key> --data=./content.json
```

Discovery details:

- `site_id` comes from the site resolved from the request host.
- `project_id` comes from that site's project.
- `canonical_host` is the cleaned request host.
- Unknown domains return `404`; treat that as "not a Creght site" or ask for an
  editor URL / explicit IDs.
- Successful responses use `Content-Type: application/json; charset=utf-8` and
  may be cached for 300 seconds.

## Core Workflow

```bash
creght login
creght logout
creght project list
creght project create --name="My Project"
creght pull --site_id=<project_id>/<site_id> --dir=./mysite
creght diff --site_id=<project_id>/<site_id> --dir=./mysite
creght push --site_id=<project_id>/<site_id> --dir=./mysite
creght sync --site_id=<project_id>/<site_id> --dir=./mysite
creght preview --site_id=<project_id>/<site_id>
creght publish --site_id=<project_id>/<site_id>
```

`project list` lists available projects and sites. `project create` creates a
new project and prints the created project ID.

Project creation can copy from an existing project or template when the backend
allows it:

```bash
creght project create --name="My Project" --from_id=<project_id>
creght project create --name="My Project" --tpl_id=<template_id>
```

`pull` downloads a local workspace whose paths mirror remote site paths
exactly:

```text
mysite/
  pages/          e.g. pages/Index.tsx <-> remote /pages/Index.tsx
  components/
  talizen.config.ts
  backend/func/  project Func files such as booking.ts
```

Func key `booking` maps to `backend/func/booking.ts`; Func key
`profile/settings` maps to `backend/func/profile/settings.ts`.

`push` safely uploads local changes and exits. `sync` first runs the same safe
push check, then watches local file changes and keeps uploading them.

`pull` safely merges remote files into the local workspace and records a local
base state in `.creght/state.json`. It updates local files that have not been
changed locally, keeps local-only edits, and reports conflicts when local and
remote both changed the same file/function. `diff`, `push`, and `sync` compare
three versions: the last base state, current local files, and current remote
files. This is the normal collaboration workflow:

```bash
creght pull --site_id=<project_id>/<site_id> --dir=./mysite
# edit site files, e.g. pages/ and backend/func/
creght diff --site_id=<project_id>/<site_id> --dir=./mysite
creght push --site_id=<project_id>/<site_id> --dir=./mysite
```

Default safety rules:

- Remote files/functions that were added or changed elsewhere are kept. If the
  local copy did not change from the base, `push` does not overwrite the remote
  update.
- Local deletions are skipped by default, so a stale local workspace does not
  delete remote files such as `messages/*.json`. Use `--delete` only when the
  deletion is intentional.
- If the same file/function changed locally and remotely, `diff`/`push` report
  a conflict. Conflicts can be inspected and resolved per file — `cat` and
  `diff`/`pull` accept a single `<path>`, and `diff --json` prints a
  machine-readable plan; see each command's `-h`.
- Use `--force` only for intentional full local-snapshot overwrite behavior.

`push` and `sync` are still local-to-remote upload flows; they do not merge Web
editor changes into local files. If remote changes should become local files,
run `pull`; use `pull --force` only when overwriting local edits is intentional.

Use `preview` when verification depends on platform rendering. Do not start a
generic local renderer unless the project explicitly provides one.

Operational gotchas:

- If `pull` fails with an API-route error (for example
  `GET /api/p/project/<id>/func_list: route not found`), the installed CLI is
  likely stale relative to the backend. Run `npm i -g creght-cli@latest` and
  retry before debugging anything else.
- Run `push` from the workspace **root** (the directory containing
  `.creght/state.json`), matching where the pull state was created. Pushing
  from a subdirectory such as `pages/` fails with
  "no base state for remote file" conflicts even when nothing is actually in
  conflict.

## Publishing

Changing project files does not publish them to the live site by default. Use
`publish` to promote the latest remote site code to the live version after
pushing or syncing changes.

Publishing requires a site ID:

```bash
creght publish --site_id=<project_id>/<site_id>
creght publish --site_id=<project_id>/<site_id> --note=<note>
```

Run `creght publish --help` if you need to confirm current publish flags.

## Platform Data And Backend

For CMS, content, forms, project JSON tables, Func backend code, and generated
types, prefer CLI commands in general-purpose agent environments. Do not assume
Creght-system-only tools such as `create_collection`, `create_form`,
`create_table`, `create_func`, or internal patch helpers exist.

Common entry points:

```bash
creght cms collections --site_id=<project_id>/<site_id>
creght content list --site_id=<project_id>/<site_id> --collection=<key>
creght content get --site_id=<project_id>/<site_id> --collection=<key> --id=<content_id> --out=./content.json
creght content create --site_id=<project_id>/<site_id> --collection=<key> --data=./content.json
creght form list --site_id=<project_id>/<site_id>
creght table list --site_id=<project_id>/<site_id>
creght table record get --site_id=<project_id>/<site_id> --table=<key> --id=<record_id> --out=./record.json
creght table record create --site_id=<project_id>/<site_id> --table=<key> --data=./record.json
creght func run --site_id=<project_id>/<site_id> --key=<key.method> --input=./input.json
```

Use file-based JSON input for schemas, content, and form payloads when a command
accepts it. After creating or changing collections/forms, pull or refresh
generated files such as `/types/cms.d.ts` and `/types/form.d.ts` before writing
code that imports those types.

Detail commands print JSON to stdout by default. Use `--out=./file.json` when
the agent should save a CMS item or table record detail to disk before editing
or comparing it.

For backend features:

- Use `creght table` to manage project JSON tables used by Func `ctx.db.*`.
- Use `creght table record` for seed data or user-requested operational data.
- Use `backend/func/**/*.ts` files to create, update, rename, and delete Func
  code. `creght push`, `creght sync`, and `creght dev` diff these files and
  apply Func CRUD through the backend.
- Func keys are extensionless paths such as `booking` or `profile/settings`,
  derived from file paths under `backend/func/`.
- Invoke methods with `key.method`, for example `booking.create`.
- Use `creght func run` only to self-test a Func method with sample input.
- The CLI intentionally does not expose `creght func list/get/create/update/delete`.
  Func CRUD must go through `backend/func` files plus `creght push`, `creght sync`,
  or `creght dev`.
- Use `talizen/auth` for auth UI. React components should use `useAuth()` for
  login/register/logout/current-user state; do not implement passwords,
  sessions, or OAuth callbacks in Func.

Read `references/auth.md` before building auth flows. Read
`references/func.md` before using `creght table`, editing `backend/func`, or
calling `talizen/func`.

`creght content create/update --data` requires a specific payload format and
`content update` treats "no field changed" as a non-zero error — see
`creght content -h` for the format and semantics before building payloads.

## Asset Upload

Use `creght upload` (see its `-h`) when site code needs an existing local file
to become a Creght-hosted asset (downloaded stock images, generated favicons,
mockups). For assets created inside a Func at runtime, use
`ctx.assets.upload({ filename, mimeType, base64 })` from the Func instead;
persist the returned CDN URL in JSON tables, never base64 payloads.
