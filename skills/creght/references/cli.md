# Cregh CLI

The Cregh CLI is a local bridge for Cregh site code. It handles auth,
project creation and discovery, file pull/push/sync, remote preview, publishing,
platform data operations, and asset uploads.

The CLI does not render sites locally. Rendering, CMS, assets, realtime preview,
and publication are handled by the Cregh backend and web app.

## Basics

Install and verify:

```bash
npm install -g creght-cli
creght version
```

Use the production endpoint by default. Omit `--web` unless the user explicitly
provides another Cregh environment. For a non-default API host, use
`CREGHT_API_HOST`.

```text
API: https://creght.cn
Web: https://creght.cn
```

Use `creght <command> --help` for exact flags. Prefer this over memorizing
rare subcommands because the CLI surface can change.

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

## Platform Data

For CMS, content, forms, and generated types, prefer CLI commands in
general-purpose agent environments. Do not assume Cregh-system-only tools such
as `create_collection`, `create_form`, or internal patch helpers exist.

Common entry points:

```bash
creght cms collections --site_id=<project_id>/<site_id>
creght content list --site_id=<project_id>/<site_id> --collection=<key>
creght content create --site_id=<project_id>/<site_id> --collection=<key> --data=./content.json
creght form list --site_id=<project_id>/<site_id>
```

Use file-based JSON input for schemas, content, and form payloads when a command
accepts it. After creating or changing collections/forms, pull or refresh
generated files such as `/types/cms.d.ts` and `/types/form.d.ts` before writing
code that imports those types.

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
Cregh-hosted asset.

```bash
creght upload --site_id=<project_id>/<site_id> --file=./image.png
creght upload --site_id=<project_id>/<site_id> --file=./image.png --json
```

With `--json`, the command returns one key, `file_url`, containing the full CDN
URL for the uploaded file.
