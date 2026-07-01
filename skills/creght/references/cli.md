# Creght CLI

The Creght CLI is a local bridge for Creght site code. It handles auth,
project creation and discovery, file pull/push with three-way merge and
conflict resolution, remote preview, publishing, platform data operations, and
asset uploads.

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
creght pull --site_id=<project_id>/<site_id> --dir=./mysite   # first pull
creght diff
creght push
creght resolve --list
creght preview --site_id=<project_id>/<site_id>
creght publish --site_id=<project_id>/<site_id>
creght importmap   # print the site's effective importMap (platform built-ins + talizen.config)
```

Only the first pull needs `--site_id` (and usually `--dir`). After that,
`.creght/state.json` records the site reference; from the workspace root or
any child directory, `pull`, `diff`, `push`, `cat`, and `resolve` discover it
by walking upward, so ongoing usage passes neither `--site_id` nor `--dir`.
Pass them explicitly only when targeting a different workspace or site.

Single-file `<path>` arguments resolve from the current directory, git-style:
`Index.tsx` run from inside `pages/` means `/pages/Index.tsx`. Paths starting
with `/` are always workspace-root paths. When the discovered workspace root
differs from the current directory, commands print `workspace: <root>` first —
if that path looks unexpected, stop and check before pushing.

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

`page/` and `component/` are also supported. Keep existing roots; use plural
names for new workspaces.

Func key `booking` maps to `backend/func/booking.ts`; Func key
`profile/settings` maps to `backend/func/profile/settings.ts`.

`push` safely uploads local changes and exits.

`pull` merges remote files into the local workspace and records a local base
snapshot (`.creght/state.json` plus base file contents under `.creght/base/`).
It updates local files that have not been changed locally, keeps local-only
edits, and three-way merges files that changed on both sides: non-overlapping
edits merge automatically (reported as `merged`, the result stays local until
the next push), overlapping edits write git-style conflict markers
(`<<<<<<< local` / `=======` / `>>>>>>> remote`) into the file and `pull`
exits non-zero. `diff` and `push` compare three versions: the last base state,
current local files, and current remote files. This is the normal
collaboration workflow:

```bash
creght pull --site_id=<project_id>/<site_id> --dir=./mysite   # first pull only
cd ./mysite
# edit site files, e.g. pages/ and backend/func/
creght diff
creght pull      # merge any remote edits; resolve markers if reported
creght push
```

Default safety rules:

- Remote files/functions that were added or changed elsewhere are kept. If the
  local copy did not change from the base, `push` does not overwrite the remote
  update.
- Local deletions are skipped by default, so a stale local workspace does not
  delete remote files such as `messages/*.json`. Use `--delete` only when the
  deletion is intentional.
- If the same file/function changed locally and remotely, `diff`/`push` report
  a conflict. Run `creght pull` to three-way merge it (or `push
  --skip-conflicts` to push everything else and leave it for a later pull).
  Conflicts can be inspected and resolved per file — `cat`, `diff`, `pull`,
  and `push` accept a single `<path>`, and `diff --json` prints a
  machine-readable plan whose conflict entries carry `reason`,
  `auto_mergeable`, and `base_to_local_diff` / `base_to_remote_diff`; see each
  command's `-h`.
- When `pull` leaves conflict markers in a file, `push` refuses to upload it.
  Run `creght resolve --list` to find marker files and `creght resolve <path>
  --ours|--theirs` (or edit the markers by hand) before pushing.
- Use `--force` only for intentional overwrite behavior. Before overwriting,
  the CLI backs up the losing side (local files on `pull`, diverged remote
  copies on `push --force`) under `.creght/backup/<timestamp>-*/`.

`push` is still a local-to-remote upload flow; it does not merge Web editor
changes into local files. If remote changes should become local files, run
`pull`; use `pull --force` only when overwriting local edits is intentional.

Use `preview` when verification depends on platform rendering. Do not start a
generic local renderer unless the project explicitly provides one.

Operational gotchas:

- If `pull` fails with an API-route error (for example
  `GET /api/p/project/<id>/func_list: route not found`), the installed CLI is
  likely stale relative to the backend. Run `npm i -g creght-cli@latest` and
  retry before debugging anything else.
- `push` requires a pulled workspace: without a discoverable
  `.creght/state.json` it refuses to treat an arbitrary directory as a
  workspace (this guards against uploading an unrelated repo). Run the first
  `pull` before pushing; afterwards `push` works from the root or any child
  directory.

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
  code. `creght push` and `creght dev` diff these files and apply Func CRUD
  through the backend.
- Func keys are extensionless paths such as `booking` or `profile/settings`,
  derived from file paths under `backend/func/`.
- Invoke methods with `key.method`, for example `booking.create`.
- Use `creght func run` only to self-test a Func method with sample input.
- The CLI intentionally does not expose `creght func list/get/create/update/delete`.
  Func CRUD must go through `backend/func` files plus `creght push` or
  `creght dev`.
- Use `talizen/auth` for auth UI. React components should use `useAuth()` for
  login/register/logout/current-user state; do not implement passwords,
  sessions, or OAuth callbacks in Func.

Read `references/auth.md` before building auth flows. Read
`references/func.md` before using `creght table`, editing `backend/func`, or
calling `talizen/func`.

`creght content create/update --data` requires a specific payload format and
`content update` treats "no field changed" as a non-zero error — see
`creght content -h` for the format and semantics before building payloads.

Rich-text body fields (such as an article `body`) must be **HTML, not
Markdown** — they render via `dangerouslySetInnerHTML`. Writing Markdown into
them produces broken, literal-text output. See `references/cms.md` for the
exact HTML conventions, and match an existing entry's `body` when unsure.

## Asset Upload

Use `creght upload` (see its `-h`) when site code needs an existing local file
to become a Creght-hosted asset (downloaded stock images, generated favicons,
mockups). For assets created inside a Func at runtime, use
`ctx.assets.upload({ filename, mimeType, base64 })` from the Func instead;
persist the returned CDN URL in JSON tables, never base64 payloads.
