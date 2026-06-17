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
| Eyebrow | `ui/Eyebrow.astro` | `class`, `dotClass` + slot | Small uppercase label preceded by a dot (the design's "Label"). `dotClass` overrides the dot color (defaults to `bg-brand`). |
| LabelPill | `ui/LabelPill.astro` | `class` + slot | Outlined (black border) rounded-full uppercase 14px semibold pill. The card category label ("ALWAYS ON", "HUMANS IN THE LOOP"). Borderless variant is Eyebrow. |
| FeatureCard | `ui/FeatureCard.astro` | `label`, `description`, `class` | Frosted white capability card (`rounded-[24px]`, tall on desktop) with a LabelPill at top and a centered description at bottom. Used in the Care grid. |
| CircleButton | `ui/CircleButton.astro` | `href`, `label`, `class` | 134px circular dotted button (round-capped dashes) with a downward chevron. Inlined SVG from the design. |
| SolutionCard | `ui/SolutionCard.astro` | `theme` (`lime`\|`purple`), `title`, `headline`, `points`, `glow`, `badge?`, `logo?`\|`logoText?`, `logoAlt?`, `stat`, `statLabel`, `cta`, `class` | Use-case capability card. Logo + title row (optional MDR `badge`), Lora headline, proof-point list, white media panel, over a themed glow; plus a "case" bar with a partner `logo` (image) **or** `logoText`, a `stat` + highlight bar, and a Learn More CTA (pill + circle arrow). `lime` = Triage/Clinical; `purple` = Care Orchestration. Content-free — fed from `data/*.json`. |
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
| Triage | `sections/Triage.astro` | — | "Agentic workforce" use-case section: serif headline with purple accent, a tab/segmented control marking the active use case, and a lime-themed `SolutionCard` (logo + MDR badge, Lora headline, proof points, 10M stat). The card slides in horizontally on first view, then scales down + fades out (scrubbed) as the Care Orchestration section rises over it. Reads `data/triage.json`. |
| CareOrchestration | `sections/CareOrchestration.astro` | — | Scroll-choreographed continuation of Triage: an expanding nav ("CARE ORCHESTRATION" + 4 solution tabs, active = purple) and four purple-themed `SolutionCard`s. Pulled up over the Triage card so the first card rises from below as Triage fades; subsequent cards reveal with a horizontal slide; the sticky nav's active tab tracks the card in view. Reads `data/care-orchestration.json`. |
| Platform | `sections/Platform.astro` | — | "Clinical Intelligence" system diagram: centered Lora headline + subhead over a fixed-canvas (1280×781) diagram — a glowing orb (CSS inset-shadow bloom + dashed ring + MDR badge) fed on the left by stat cards (85K, 14M) and Unified Clinical Memory, governed on the right (certifications, deterministic logic, protocols), with Patients in at top and Full audits out the bottom, plus full-bleed connector curves. The diagram scales to fit container width via a ResizeObserver (never upscaled). Reads `data/platform.json`. |
| Trust | `sections/Trust.astro` | — | "Trusted by the most regulated industry in the world." section: a rounded lavender panel with a soft blurred purple bloom, a centered Lora headline, a wrapping grid of 14 certification/compliance badges (ISO, MDR, NHS, FDA, HIPAA, GDPR, Cyber Essentials… — transparent pills with an inner purple glow ring, logos composed from native-sized SVG layers), and three bottom points (Proven in practice / Clinically validated / Built for privacy) with `purple-150` icon discs and left hairline rules. Blocks fade-up on reveal. Reads `data/trust.json`. |
| Operations | `sections/Operations.astro` | — | Closing statement banner ("Unbreakable operations. Undeniable outcomes."): a heavily-blurred purple→lime→lavender bloom (`/operations/bloom.svg`) centered behind an `Eyebrow` (with a `purple-500` dot) and a large two-line Lora headline. Content fades up on reveal. Reads `data/operations.json`. |
