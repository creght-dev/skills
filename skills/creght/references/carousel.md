# Cregh Carousel Usage

Use `embla-carousel` as the default carousel/slideshow engine. For React
projects, use `embla-carousel-react`.

## Import Map Setup

Configure third-party libraries in `talizen.config.ts`, then import by specifier
in components.

```ts
export default {
  importMap: {
    imports: {
      "embla-carousel-react": "https://esm.sh/embla-carousel-react?external=react",
      "embla-carousel-autoplay": "https://esm.sh/embla-carousel-autoplay?external=react",
    },
  },
}
```

## React Example

Prefer utility classes instead of writing separate carousel CSS files.

```tsx
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

const slides = ["Slide 1", "Slide 2", "Slide 3"]

export function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4000, stopOnInteraction: true })],
  )

  return (
    <section aria-label="Featured slides" className="w-full">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide) => (
            <article
              key={slide}
              className="min-w-0 flex-[0_0_100%] px-4"
              aria-roledescription="slide"
            >
              {slide}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

## Recommended Options

- `loop: true` for seamless cyclical navigation.
- `containScroll: "trimSnaps"` to prevent over-scrolling at edges.
- `Autoplay({ delay, stopOnInteraction })` for optional auto-advance behavior.
- Keep slide basis explicit, such as `flex-[0_0_100%]`.

## Accessibility

- Provide a clear region label.
- Add previous/next controls that are keyboard reachable when the carousel is
  interactive.
- Ensure autoplay can be paused or stopped when enabled.
- Respect reduced motion preference for auto-advancing behavior.
