# Creght Skills

This repository provides Codex/agent skills for Creght. They help agents understand Creght project structure, CLI workflows, page development conventions, CMS/Form/SEO features, and other platform capabilities.

## What This Skill Does

- Guides agents through Creght CLI workflows for creating projects, pulling, pushing, syncing, previewing, and publishing sites.
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
