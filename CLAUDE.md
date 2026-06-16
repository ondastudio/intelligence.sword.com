# CLAUDE.md

Guidance for working in this repository. Read this first — the project is
already set up, so you can start building immediately without any setup steps.

## What this is

A static marketing/content website for **intelligence.sword.com**, built with
**Astro + Tailwind CSS**. It is structured so that **non-developers can edit
content and design tokens** without touching component code, and so that UI is
built from a **reusable component library extracted from a design**.

## Tech stack

- **Astro 6** — static site framework
- **Tailwind CSS 4** — via the `@tailwindcss/vite` plugin (configured in `astro.config.mjs`)
- **TypeScript** — strict mode

## Commands

```bash
npm run dev      # start the dev server (http://localhost:4321)
npm run build    # build the static site to ./dist
npm run preview  # preview the production build locally
npx astro check  # type-check .astro files
```

## Project structure

```
src/
  components/
    ui/        # primitives & building blocks (Button, Eyebrow, CircleButton, …)
    layout/    # structural pieces (Logo, Navbar, …)
    sections/  # page sections composed from ui + layout (Hero, …)
    README.md  # component library rules
  data/        # editable content (JSON/Markdown) for non-developers
  layouts/
    Layout.astro   # base HTML shell; loads global.css; renders <slot />
  pages/
    index.astro       # home page
    styleguide.astro  # living catalog of tokens + components
  styles/
    global.css   # design tokens (@theme) + Tailwind import + base styles
COMPONENTS.md   # registry of every component — the "check before creating" list
```

## Core workflow rules

1. **The component library is EXTRACTED FROM THE DESIGN — never invented.**
   Do not guess at components, colors, or spacing. Wait for the design link
   (Figma / Pencil `.pen` / live URL), then pull tokens and components from it.

2. **Check before you create.** Before adding any component, look in
   `src/components/ui` and `src/components/layout`, and scan `COMPONENTS.md`.
   If it already exists, reuse or extend it — do not duplicate. After adding a
   component, register it in `COMPONENTS.md` and add it to `/styleguide`.

3. **Style with tokens, not hardcoded values.** All colors, fonts, radii, and
   spacing live as tokens in `src/styles/global.css` inside `@theme`. In Tailwind 4
   each token becomes both a CSS variable and a utility class (e.g.
   `--color-brand-600` → `bg-brand-600` / `text-brand-600`). Components must use
   these utility classes. Never paste raw hex values or one-off pixel sizes into
   a component — add or adjust a token instead.

4. **Keep it editable by non-developers.** Text, links, and settings belong in
   `src/data` (JSON/Markdown), not inline in components. Design changes happen by
   editing tokens in `global.css`. Components stay generic and content-free.

## Component conventions

- Astro components (`.astro`). Declare a typed `interface Props`.
- Accept a `class` prop and merge it last so callers can extend styling.
- Use semantic token classes (`text-ink`, `bg-surface`, `border-border`,
  `rounded-card`) over literal Tailwind colors where a token exists.
- Keep variants/sizes as small lookup maps typed `Record<string, string>`.
