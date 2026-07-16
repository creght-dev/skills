# Creght Editor Operations

Use this reference for question-only editor guidance. Answer directly without
editing files, creating versions, running lint, invoking the CLI, or changing
platform state unless the user also requests an action.

## Custom Domains

Manage domains in **Settings → Domains**. For setup instructions, see the
[custom domain guide](https://www.creght.cn/docs/ai/custom-domain).

View supported server locations in **Settings → Server Node**. A custom domain
using a Mainland China node must complete ICP filing before it can be accessed.
If DNS verification or SSL certificate application fails after a DNS change,
check the filing status and see the
[ICP filing guide](https://www.creght.cn/docs/beian).

## Analytics

View published-site statistics in **Settings → Analytics**. Preview visits are
not counted. For custom event tracking changes, read `references/analytics.md`.

## Publishing

A site has separate preview and production domains. The preview domain reflects
editor changes in real time. The production domain updates only after selecting
**Publish**. Custom domains also serve published content, so their changes take
effect only after publishing.

## Environment Variables

Configure secrets manually in **Backend → Env** (`panel/backend/env`). Never
place secrets in site or Func source code, and do not claim the agent or CLI
configured them.

## Members And Plans

Manage members in **Settings → Members**. Use the editor's plan or upgrade entry
when a feature is unavailable on the current plan.

When an operation fails, ask for the visible status or error before suggesting
code changes.
