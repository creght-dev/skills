# Creght Skills

This repository provides Codex/agent skills for Creght. They help agents understand Creght project structure, CLI workflows, page development conventions, CMS/Form/SEO features, and other platform capabilities.

## Skills

- **`creght`** — the base platform skill: CLI workflows, page/component conventions, CMS, forms, SEO, publishing.
- **`site-replica`** — replicate any existing website onto Creght ("复刻网站"): probes the source in a real browser, audits every animation and interaction, rebuilds it as an original React/Tailwind implementation with license-safe placeholder assets, then verifies desktop + mobile against the source in a loop until parity. Builds on top of `creght`.

## What This Skill Does

- Guides agents through Creght CLI workflows for creating projects, pulling, pushing, syncing, previewing, and publishing sites.
- Discovers project and site IDs from rendered Creght page URLs through `/.well-known/creght.json`.
- Enforces Creght page development conventions, such as `/page` routes, the `/component` directory, native `<a>` navigation, and `getServerSideProps` for data loading.
- Helps write React + Tailwind v4 pages and components that follow Creght platform requirements.
- Provides implementation references for common platform capabilities such as CMS, form submissions, SEO metadata, sitemaps, and carousel components.
- Helps debug local-to-platform sync, preview, and publishing issues.

## Examples

```text
Add an About page to this Creght project, following the existing page and component structure. {YOUR_CREGHT_PROJECT_EDIT_URL like https://creght.cn/editor/project/pveao61akhoy/site/pveao646es1u}
```

```text
Connect the homepage to Creght CMS data, using the schema and types that already exist in the project. {YOUR_CREGHT_PROJECT_EDIT_URL like https://creght.cn/editor/project/pveao61akhoy/site/pveao646es1u}
```

```text
Optimize the project's SEO configuration, including title, description, keywords, Open Graph, and related metadata. {YOUR_CREGHT_PROJECT_EDIT_URL like https://creght.cn/editor/project/pveao61akhoy/site/pveao646es1u}
```

```text
https://www.creght.cn/docs/ai/ai-edit-content-guide 新增一个文章，内容是关于 ai 积分的价格
```

```text
复刻 https://example-portfolio.framer.website/ 到 Creght，保留布局和所有动效，独立运行直到完成
```

## Installation

Install with `npx`:

```bash
npx skills add creght-dev/skills -g -y
```

Or use `bunx`:

```bash
bunx skills add creght-dev/skills -g -y
```

After installation, supported Codex/agent environments will automatically load the corresponding skill guidance when working with Creght projects.

## Update

Update to the latest version with `npx`:

```bash
npx skills update creght
```

Or use `bunx`:

```bash
bunx skills update creght
```

Re-running the add command above also works — it is idempotent and pulls the latest.
