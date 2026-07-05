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

Use `creght <command> --help` for exact flags. Prefer this over memorizing
rare subcommands because the CLI surface can change.

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

`pull` downloads remote site files. `push` uploads the current local directory
snapshot and exits. `sync` first pushes the current snapshot, then watches local
file changes and keeps uploading them.

`push` and `sync` are one-way local-to-remote flows. They do not pull Web editor
changes back into the local directory. If the site may have been edited in the
Web editor, run `pull` manually or restart from a clean local copy before
continuing.

Use `preview` when verification depends on platform rendering. Do not start a
generic local renderer unless the project explicitly provides one.

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
creght content create --site_id=<project_id>/<site_id> --collection=<key> --data=./content.json
creght form list --site_id=<project_id>/<site_id>
creght table list --site_id=<project_id>/<site_id>
creght table record create --site_id=<project_id>/<site_id> --table=<key> --data=./record.json
creght func list --site_id=<project_id>/<site_id>
creght func create --site_id=<project_id>/<site_id> --key=<key> --file=./func.ts
creght func run --site_id=<project_id>/<site_id> --key=<key.method> --input=./input.json
```

Use file-based JSON input for schemas, content, and form payloads when a command
accepts it. After creating or changing collections/forms, pull or refresh
generated files such as `/types/cms.d.ts` and `/types/form.d.ts` before writing
code that imports those types.

For backend features:

- Use `creght table` to manage project JSON tables used by Func `ctx.db.*`.
- Use `creght table record` for seed data or user-requested operational data.
- Use `creght func` to create, update, inspect, delete, and self-test Func code.
- Func keys are extensionless paths such as `booking` or `profile/settings`.
- Invoke methods with `key.method`, for example `booking.create`.
- Use `talizen/auth` for login/register/logout/current-user/OAuth UI; do not
  implement passwords, sessions, or OAuth callbacks in Func.

Read `references/auth.md` before building auth flows. Read
`references/func.md` before using `creght table`, `creght func`, or
`talizen/func`.

For `creght content create`, `--data` may be either a plain CMS content body or
a full content object. Top-level wrapper fields such as `slug`, `id`, `status`,
`sort`, and `tags` make the CLI treat the file as a full content
object. If imported business JSON has a top-level `slug`, either pass the slug
as a flag and remove it from the data file:

```bash
creght content create --site_id=<project_id>/<site_id> --collection=prompts --data=./content-body.json --slug=typography-v02
```

Or wrap business fields under `body`:

```json
{
  "slug": "typography-v02",
  "body": {
    "title": "Typography V.02",
    "description": "100vh",
    "tags": ["skill"]
  }
}
```

## Asset Upload

Use `creght upload` when site code needs a local file to become a
Creght-hosted asset.

```bash
creght upload --site_id=<project_id>/<site_id> --file=./image.png
creght upload --site_id=<project_id>/<site_id> --file=./image.png --json
```

With `--json`, the command returns one key, `file_url`, containing the full CDN
URL for the uploaded file.
