# AGENTS.md — how the Creght / Talizen skills relate

This repo holds the **external Creght skill**. It is one of **three sibling
agent-skills** for the same platform; they share most guidance but target
different audiences and must be kept consistent. Read this before editing.

## The three skills

| Skill | Location | Audience | Tooling model |
| --- | --- | --- | --- |
| **talizen-system** | `talizen-system/` in the **`talizen/skills`** repo | The **in-platform agent** that runs inside the Talizen / Creght editor | Has platform tools: `lint`, `create_version`, `diff_patch_file`, `fetch_module_types`, import-map, preview. **No CLI workflow.** |
| **talizen** (external) | `skills/talizen/` in the **`talizen/skills`** repo | End users / general-purpose agents working **locally via the Talizen CLI** | CLI workflow (pull / push / watch / preview). Platform tools only *"if the environment exposes them, otherwise use the CLI"*. |
| **creght** (external) | `skills/creght/` (this repo) | End users of **Creght** | Same as external `talizen`, but Creght-branded. |

- **Creght integrates Talizen's capabilities**, and Talizen is also operated as
  an independent platform. Creght and Talizen therefore share the same code
  model and SDK — the only differences are the platform name and branding.
- **`talizen-system` is the source of truth.** It is the newest and most
  complete. This external Creght skill is downstream and is kept in sync with its
  *audience-neutral* content, then rebranded (see below).

## Syncing content from `talizen-system` → this skill

Do **not** blind-copy. When porting guidance from `talizen-system`:

1. **Filenames** — all three skills use lowercase kebab-case under `references/`
   (`cms.md`, `forms.md`, `error-handling.md`, `site-code.md`); `SKILL.md` links
   files by name, so keep this consistent across the three.
2. **Keep external-only files** — `cli.md` and `site-code.md` exist only in the
   external skills (they document the CLI / local workflow). `talizen-system` has
   no equivalent; never delete them during a sync.
3. **Filter platform-only content** — strip or rewrite anything that assumes the
   in-platform agent: the `lint` / `create_version` / `diff_patch_file` /
   `fetch_module_types` / `create_collection` / import-map tools, and the
   `LINT_ERROR` / `BROWSER_ERROR_RENDER` events plus preview-runtime specifics.
   Those events are delivered **only** to the in-platform agent — a local CLI
   agent never receives them, so external docs must not wait for or trigger on
   them. Re-express as CLI / general guidance, or drop it.
4. **`error-handling` is intentionally its own document** — `talizen-system`
   keeps a platform/preview version (`BROWSER_ERROR_RENDER`, preview-runtime, the
   built-in React runtime). This skill carries a **CLI-oriented** version. Keep
   them separate; do not merge them back into one.

## Creght rebranding

Creght runs on Talizen, so only **prose brand words** change when porting:

- Prose: `Talizen` → `Creght`; `talizen.com` → `creght.cn`.
- **Unchanged**: package imports stay `talizen`, `talizen/cms`, `talizen/form`;
  the config file stays `talizen.config.ts`; the locale cookie stays
  `CREGHT_LOCALE` (it is already Creght-named upstream).
