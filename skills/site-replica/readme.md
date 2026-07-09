# Site Replica

English | [中文](./readme.zh.md)

`site-replica` is a Creght skill for rebuilding an existing website as an
original Creght implementation. It is designed for requests such as "clone this
site to Creght", "replicate this Framer site", or "复刻这个网站".

The goal is visual and behavioral parity with the live source site while keeping
the implementation license-safe: the agent studies the source design in a real
browser, then rebuilds the layout, motion, responsive behavior, and interactions
with original React/Tailwind code, substituted assets, and rewritten copy.

## Approach

The skill treats the source website as the reference oracle and works through a
measured pipeline:

1. **Recon**: crawl the source site, discover routes, list page sections, record
   breakpoints, typography, spacing, colors, imagery slots, and key responsive
   behaviors.
2. **Motion audit**: capture cold-load animation, scroll effects, hovers,
   marquees, menus, carousels, and other interactive states.
3. **Build**: create an original Creght project using the base `creght` skill,
   mapping repeated list/detail content into Creght CMS and forms into Creght
   Form where needed.
4. **Verify**: compare source and replica on the preview URL across desktop and
   mobile, including route coverage, section structure, screenshot pairs,
   motion, interactions, console errors, broken assets, and platform behavior.
5. **Iterate**: when a mismatch appears, re-measure the live source first, then
   fix and re-verify.

The skill does not copy the source site's code, images, videos, fonts, or long
copy. It reproduces the design as a new implementation and replaces proprietary
materials with license-safe alternatives.

## Examples

All examples below were created with **Fable 5**.

| Source site | Replica | After secondary development | Model |
| --- | --- | --- | --- |
| https://trifecta.framer.media/ | https://p1io0guo97bm.site.creght.cn/ | https://p1it45pqg8q6.site.creght.cn/ | Fable 5 |
| https://bildium.webflow.io/home-one | Not listed | https://p1qhs734c56q.site.creght.cn/ | Fable 5 |

## When To Use

Use this skill when the user wants to move a public website design onto Creght,
including Framer, Webflow, portfolio, landing-page, agency, SaaS, editorial, or
marketing sites.

It also applies when you do not want to use Creght hosting or backend
capabilities and instead want to self-host the source code. Say: "Use the
site-replica skill to replicate this website, and put the React source code
locally."

For commercial de-identification work, where the result should preserve the
structural quality of the source but intentionally reduce recognizability, use
the skill's differentiated mode.
