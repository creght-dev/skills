---
title: Creght Analytics & Event Tracking
---

# Creght Analytics & Event Tracking

Creght sites get **visit analytics automatically** and support **custom event
tracking** with almost no setup. Both are collected by the platform and shown in
the site editor under **Settings → Analytics**. You write code only for custom
events.

## Automatic visit analytics (no code)

Every published page reports a pageview on load — the platform injects the beacon
during rendering (published sites only, never in preview). Each pageview records:

- PV / UV (unique visitors, deduped by a first-party cookie) / unique IPs
- Country + city (from IP)
- Device type / browser / OS (from User-Agent)
- The page URL (for a "top pages" breakdown)
- The **external referrer domain** (e.g. `google.com`, `t.co`) — same-site
  navigation is ignored, so this reflects real traffic sources

Do **not** add your own pageview beacon or a third-party analytics snippet for
this; it is already handled.

## Custom events (track)

Use custom events to measure actions inside the page (button clicks, tab
switches, etc.). Two ways, pick whichever fits:

### 1. Declarative — `data-track` (no JS)

Add `data-track="<event_name>"` to any element. It reports automatically when the
element (or any child) is clicked. Any `data-track-*` attributes become event
properties (the key is the part after `data-track-`).

```tsx
<button data-track="click_buy" data-track-plan="pro" data-track-position="hero">
  Buy Pro
</button>
// → event "click_buy", props { plan: "pro", position: "hero" }
```

### 2. Imperative — `track()` from `talizen/analytics`

Import `track` from the SDK (`talizen` package, v0.2.25+) and call it from client
code (event handlers, effects). No site id or setup is needed — it posts to the
site's own `/api/site_event` and the platform resolves the site from the request
domain (same model as `submitForm`). It is a no-op during SSR (no `window`), and
fire-and-forget: a failed report never throws or blocks the UI.

```tsx
import { track } from "talizen/analytics";

function Hero() {
  return (
    <button onClick={() => track("signup_click", { from: "hero" })}>
      Sign up
    </button>
  );
}
```

Do not call `track` from `getServerSideProps` or module top-level; call it in
response to a user action or inside an effect.

## Rules & limits

- Fires on **published** sites only, not in the editor preview.
- Event name is capped at 128 chars; the property payload must serialize to ≤ 2KB
  JSON or it is dropped. Keep names stable and low-cardinality (e.g. `click_buy`,
  not `click_buy_1699…`) so they aggregate.
- Do not put personal/sensitive data in event props.

## Where the data shows up

Site editor → **Settings → Analytics**: summary (PV/UV/IP), traffic trend,
referrers, regions, devices, browsers, top pages, and a **custom events** table
(each event name with its count and unique visitors). Property values are stored
but not broken down in the report yet — the report aggregates by event name.
