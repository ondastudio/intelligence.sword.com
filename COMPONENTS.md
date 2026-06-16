# Component registry

The single source of truth for what already exists in the library. **Check this
list before creating any component.** When you add or change a component, update
the table and showcase it on the `/styleguide` page.

All components are extracted from the Figma design (Sword Intelligence 2026) and
styled with design tokens from `src/styles/global.css` (`bg-brand`, `font-serif`, …).

## UI primitives — `src/components/ui/`

| Component | Path | Props | Description |
| --------- | ---- | ----- | ----------- |
| Button | `ui/Button.astro` | `variant` (`solid`\|`glass`), `href`, `caret`, `type`, `class` | Pill action. `solid` = purple CTA, `glass` = translucent nav item. Renders `<a>` if `href`, else `<button>`. `caret` adds a dropdown chevron. |
| Eyebrow | `ui/Eyebrow.astro` | `class` + slot | Small uppercase label preceded by a dot (the design's "Label"). |
| CircleButton | `ui/CircleButton.astro` | `href`, `label`, `class` | 134px circular dotted button (round-capped dashes) with a downward chevron. Inlined SVG from the design. |

## Layout — `src/components/layout/`

| Component | Path | Props | Description |
| --------- | ---- | ----- | ----------- |
| Logo | `layout/Logo.astro` | `href`, `class` | "Sword Intelligence" wordmark, rendered from `public/logotype.svg` (168×21). Accessible label reads `data/site.json`. |
| Navbar | `layout/Navbar.astro` | — | Transparent top bar: logo, centered glass nav pills, purple CTA. Reads `data/site.json`. |

## Sections — `src/components/sections/`

| Component | Path | Props | Description |
| --------- | ---- | ----- | ----------- |
| Hero | `sections/Hero.astro` | — | "Home • Desktop" landing screen: mesh-gradient bg, navbar, eyebrow, Lora headline, divider cross, paragraph, circle button. Reads `data/hero.json`. |
