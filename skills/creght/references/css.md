# Cregh CSS And Tailwind

Cregh uses Tailwind CSS v4.

## Component Styling

- Use utility classes for component styling.
- Avoid inline `style` props except for genuinely dynamic values that cannot be
  represented with classes or CSS variables.
- Do not add ad-hoc `<style>` tags in page components.
- Do not create arbitrary extra CSS files for one-off component styling.

When adding color transitions, drive the color from one source to avoid double
hover transitions. Either let children inherit the parent color or control the
child color with a single hover or `group-hover` rule.

## Site-Level `index.css`

Use `/index.css` for site-level Tailwind source such as `@theme`, `@utility`,
and base layers.

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
