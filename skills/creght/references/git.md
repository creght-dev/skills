# Git remote

A site's version history is served as a real git repository. It is a second way
into the same data, not a replacement for `pull`/`push` — see "Which tool" below
before reaching for it.

```
creght git clone --site_id=<project_id>/<site_id> [dir]
```

Credentials are written into the new repository's own config, so later `fetch`
and `push` keep working. Nothing outside that repository is touched — not the
global git config, not the OS keychain. Clone through `creght` rather than
copying the URL into a plain `git clone`, which would have no credentials and
would prompt for a password.

**AI-site projects only.** A visual-builder project's source is items and pages,
not a file tree; cloning one yields an empty repository and pushing to it is
refused. For those projects `pull`/`push` is the only option.

## Refs

| Ref | Is |
| --- | --- |
| `main` | the newest version |
| `refs/tags/v<no>` | each version, so `git show v195:page/Price.tsx` works |
| `published` | the version production currently serves |

`git diff published..main` therefore answers "what would go live if I published
now" at source level, which is more precise than comparing rendered output.

Commits carry the identity of whoever pushed them; versions created in the editor
or by publishing are attributed to `Creght <noreply@creght.com>` and their subject
is `v<no>: <note>`.

## Only the most recent versions are served

Git serves a bounded window of the newest versions, not the whole history. Clones
are therefore shallow, which is normal and needs no flag. Two consequences:

- `--depth` / `--deepen` are refused. A plain clone is already bounded, so they
  buy nothing.
- A clone left idle until the window moves past it cannot be fast-forwarded; the
  versions in between are gone. The server says so and asks for a fresh clone.
  Re-clone rather than trying to repair it.

## The remote is read-only

`git push` is refused, in a sentence rather than an HTTP error:

```
! [remote rejected] main -> main (this remote is read-only; run `creght push`
  to publish changes, or `creght version create` to record a version)
```

Mapping commits onto versions was built and then removed. It made a version per
commit, which buries the history in noise, and interleaving it with `creght push`
cost a rejected push and a rebase on every alternation. One write path is enough.

To undo one file, read the old content out of history and push it the normal way
(from a throwaway clone — see below):

```
git show v190:page/Price.tsx > ~/work/site/page/Price.tsx
cd ~/work/site && creght push
```

To roll **production** back to an earlier version, git is not involved at all:
`creght version publish <version_no>`.

## Which tool

git **reads**, `creght` **writes**. That is the whole rule.

Reach for git to see what a file looked like at some version, to compare two
versions, to find when something changed, or to pull old content back out. None of
that was possible before: `creght cat --ref` only takes `remote | local`, and
`creght diff` compares the workspace against the remote, never version against
version.

Reach for `creght push` to put changes on preview, `creght version create` to
record a version, and `publish` / `version publish` to go live. Also for everything
git does not carry at all: CMS content (content is live and is not part of a version
snapshot), forms, JSON tables, Func env vars, and asset uploads.

## Keep it in a throwaway directory

Do **not** clone into your creght workspace, and do not run `creght pull` inside a
git clone. Tested, and it goes wrong in two ways:

- `git add -A` sweeps `.creght/` into git history. A later `git checkout <version>`
  then restores a stale `.creght/state.json`, and the next `creght push` computes
  its diff against the wrong base.
- The two tools mean different things by "remote". `creght pull` merges the **live
  files**; git's history only moves when a **version** is created. So a `creght push`
  from elsewhere changes the site while `git pull` reports "Already up to date" —
  and each tool runs its own three-way merge, against its own base, unaware of the
  other.

Clone somewhere disposable, read what you need, copy it across, delete it:

```
creght git clone --site_id=<project_id>/<site_id> /tmp/look
cd /tmp/look && git show v190:page/Price.tsx > ~/work/site/page/Price.tsx
rm -rf /tmp/look
cd ~/work/site && creght push
```
