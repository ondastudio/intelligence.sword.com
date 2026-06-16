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
| LabelPill | `ui/LabelPill.astro` | `class` + slot | Outlined (black border) rounded-full uppercase 14px semibold pill. The card category label ("ALWAYS ON", "HUMANS IN THE LOOP"). Borderless variant is Eyebrow. |
| FeatureCard | `ui/FeatureCard.astro` | `label`, `description`, `class` | Frosted white capability card (`rounded-[24px]`, tall on desktop) with a LabelPill at top and a centered description at bottom. Used in the Care grid. |
| CircleButton | `ui/CircleButton.astro` | `href`, `label`, `class` | 134px circular dotted button (round-capped dashes) with a downward chevron. Inlined SVG from the design. |
| MediaFrame | `ui/MediaFrame.astro` | `src`, `alt`, `aspect`, `poster`, `controls`, `class` | Large rounded media container (`rounded-card`) holding an image **or** an autoplaying muted/looping video at a fixed aspect ratio (default 1920/1080). Video sources (`.webm/.mp4/.mov/.ogg`) use `poster` as the first frame; with `controls` (default on) a white play/pause button and a lime-accent mute button overlay the bottom corners. Used for the product demo. |

## Layout — `src/components/layout/`

| Component | Path | Props | Description |
| --------- | ---- | ----- | ----------- |
| Logo | `layout/Logo.astro` | `href`, `class` | "Sword Intelligence" wordmark, rendered from `public/logotype.svg` (168×21). Accessible label reads `data/site.json`. |
| Navbar | `layout/Navbar.astro` | — | Transparent top bar: logo, centered glass nav pills, purple CTA. Reads `data/site.json`. |
| LogoStrip | `layout/LogoStrip.astro` | `logos` (`{src, alt}[]`), `class` | Responsive row of partner/client logos, each cell topped by a divider line. Content passed in (home page feeds `data/intro.json`). |

## Sections — `src/components/sections/`

| Component | Path | Props | Description |
| --------- | ---- | ----- | ----------- |
| Hero | `sections/Hero.astro` | — | "Home • Desktop" landing screen: mesh-gradient bg, navbar, eyebrow, Lora headline, divider cross, paragraph, circle button. Reads `data/hero.json`. |
| Intro | `sections/Intro.astro` | — | "AI Care Managers" section below the hero: mesh-gradient wash, centered mixed-weight statement, partner LogoStrip, and a MediaFrame product screenshot. Reads `data/intro.json`. |
| Care | `sections/Care.astro` | — | "AI Care Managers" capabilities section: mesh-gradient wash, serif display headline with purple accent, supporting line, 3×2 grid of FeatureCards, and a full-width "Humans in the loop" banner with a dotted-globe graphic. Reads `data/care.json`. |
