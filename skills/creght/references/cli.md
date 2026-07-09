# Creght CLI

The Creght CLI is the local bridge for Creght site code: auth, project
discovery, file pull/push/sync, single-file inspect, remote preview, publishing,
platform data (CMS/content/forms/tables/Func), and asset uploads. It does not
render sites locally — rendering, CMS, realtime preview, and publication happen
in the Creght backend and web app.

## Commands and flags come from `creght -h`

Do not memorize or duplicate the command surface here — it changes. The
authoritative reference is the CLI's own help, which carries usage, flags, and
examples per command:

```bash
creght -h                 # list every command
creght <command> -h       # usage, flags, and examples for one command
creght pull -h            # e.g. pull semantics + single-file usage
```

This file only covers what `-h` cannot: setup, site discovery, the sync model,
and agent-specific rules.

## Setup

```bash
npm install -g creght-cli
creght -v
```

Defaults to the production endpoint (`https://creght.cn`). For another Creght
environment set `CREGHT_API_HOST`; pass `--web` to `login` only when the user
gives an explicit web host.

## Discovering a site from a rendered URL

When the user gives a rendered page URL (not an editor URL or explicit IDs),
resolve the site from its origin first:

```bash
curl -fsSL https://<host>/.well-known/creght.json
```

It returns `{ "project_id", "site_id", "canonical_host", ... }`. Use
`--site_id=<project_id>/<site_id>` with any command. Unknown domains return
`404` — treat that as "not a Creght site" and ask for an editor URL or IDs.

## Workspace layout

`pull` writes a local workspace and records a base snapshot in
`.creght/state.json`:

```text
mysite/
  frontend/      site files: page/, component/, talizen.config.ts
                 (remote /page/x.tsx  <->  frontend/page/x.tsx)
  backend/func/  Func code
                 (Func key booking          <->  backend/func/booking.ts)
                 (Func key profile/settings <->  backend/func/profile/settings.ts)
```

## Sync model (base / local / remote)

`diff`, `push`, and `sync` compare three versions: the base snapshot, current
local files, and current remote files.

- Remote-only changes are kept; a local copy unchanged from base never
  overwrites a newer remote file.
- Local deletions are skipped unless `--delete`, so a stale workspace can't
  wipe remote files (for example `messages/*.json`).
- A file changed both locally and remotely is a **conflict**. Resolve it with
  the single-file tools rather than a full `pull --force`:
  - `creght cat <path> --ref remote` — read the remote version.
  - `creght diff --json` — machine-readable status per file
    (`conflict | remote-only | local-change | no-base`).
  - `creght diff <path>` — line diff of one file (remote vs local).
  - `creght pull <path>` — pull just that file (`--force` to overwrite local).

  Then re-apply your change and `push`. Whole-workspace `pull --force` is a last
  resort (it discards unpushed local edits).
- Run `push`/`diff` from the workspace **root** (the directory containing
  `frontend/`), not a subdirectory, or you get spurious "no base state"
  conflicts.

## Agent rules

- **Never `publish` unless the user asks.** `push`/`sync` upload to the project
  but do not make changes live; `publish` promotes the remote version to live.
- If `pull`/`push` fails with an API route-not-found error, the installed CLI
  is stale — run `npm i -g creght-cli@latest` and retry before debugging
  anything else.
- Do not assume Creght-system-only tools (`create_collection`, `create_form`,
  `create_table`, `create_func`, internal patch helpers) exist. Use CLI
  commands.

## Platform data and backend

Manage CMS, content, forms, JSON tables, and Func through the CLI; see
`creght cms|content|form|table|func -h` for exact flags (for example, the
`content` `--data` body-wrapping format and `--out` are documented in
`creght content -h`).

- Func code lives in `backend/func/**/*.ts` and is created/updated/deleted by
  editing those files plus `push`/`sync`/`dev` — there is no
  `func create/delete` command. `creght func run` only self-tests a method with
  sample input.
- Use `talizen/auth` for login/register/logout/OAuth UI; never implement
  passwords, sessions, or OAuth callbacks in Func.
- After changing collections/forms, `pull` (or refresh) the generated
  `/types/cms.d.ts` and `/types/form.d.ts` before importing those types.

Read `references/auth.md` before building auth flows and `references/func.md`
before using `creght table`, editing `backend/func`, or calling `talizen/func`.
