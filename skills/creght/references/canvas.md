# Canvas Files (Editor Artboards)

`<Page>.canvas.tsx` next to a page file is the drawing board the Creght visual
editor renders for that page. It is editor-only: never routed, never publicly
rendered. Create or edit one only when the user explicitly asks — typically to
stage a draft section or component for visual review before wiring it into the
real page.

## Shape

- Default-export `Canvas(props)` and spread `{...props}` into the page frame.
- Each direct child with `position: absolute` and an explicit width is a
  movable frame (artboard) in the editor. Inline `style` is allowed here for
  frame geometry only; everything inside a frame uses Tailwind as usual.

## Staging Drafts: Keep Page and Draft Side by Side

When staging a draft, do NOT replace the page frame — add the draft as a second
frame next to it so the user compares both on one canvas. Keep the draft
self-contained in this file (hardcoded copy in one locale is fine) and wrap it
in the page's background/font wrapper classes so it previews with the real
look.

```tsx
import React from 'react'
import Page from './Index.tsx'

function NewSectionDraft() {
  return (
    <div className="bg-[#040506] py-24 text-white">
      {/* draft section markup */}
    </div>
  )
}

export default function Canvas(props) {
  return (
    <div>
      <div style={{ position: 'absolute', width: '1440px' }}>
        <NewSectionDraft />
      </div>
      <div style={{ position: 'absolute', width: '1440px', left: '1600px' }}>
        <Page {...props} />
      </div>
    </div>
  )
}
```
