# Creght CSS And Tailwind

Creght uses Tailwind CSS v4.

## Component Styling — utility-first

Style with Tailwind utility classes on the elements. This is the default, not a
preference: the platform's Tailwind pipeline is more reliable than hand-written
CSS in `index.css`, which has caused real bugs (a later generic class silently
overriding an earlier rule, cascade/purge quirks). Arbitrary values are fine
when no token fits (`pt-[92px]`, `text-[clamp(26px,4.6vw,58px)]`).

Write standalone CSS (in `index.css`) only for what utilities can't express:
`@keyframes`, `:has()`/complex-selector state (especially driving CSS
variables), and scales reused across many elements (hoist to an `@utility`). Do
not re-author component layout as semantic CSS classes. Never use inline `style`
(except genuinely dynamic values like a JS-computed transform) or `<style>` tags
in components, and never add one-off `.css` files.

When adding color transitions, drive the color from one source to avoid double
hover transitions. Either let children inherit the parent color or control the
child color with a single hover or `group-hover` rule.

## Site-Level `index.css`

Use `/index.css` only for `@theme` tokens, `@utility` definitions (applied back
as classes), base layers, and the narrow escape-hatch CSS above — not for
component layout. Supports both plain CSS and Tailwind directives.

Minimal example:

```css
@theme inline {
  --color-brand: #005aa7;
  --color-brand-foreground: #ffffff;
  --radius: 0.75rem;
}

@utility shadow-soft {
  box-shadow: 0 18px 40px -25px rgba(0, 0, 0, 0.35);
}

@utility btn-primary {
  background-color: var(--color-brand);
  color: var(--color-brand-foreground);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius);

  &:hover {
    opacity: 0.92;
  }
}
```
