# Components

The reusable component library for this site. **Components are extracted from
the design — they are not invented.** When a design link is provided, primitives
and patterns are pulled out of it into this folder.

## Folders

- `ui/` — primitives and reusable building blocks (Button, Heading, Card, Input, Badge, …)
- `layout/` — structural pieces (Header, Footer, Nav, Container, Section, …)

## Rules

1. **Check before you create.** Look in `ui/` and `layout/`, and scan the
   registry in [`COMPONENTS.md`](../../COMPONENTS.md), before adding anything.
   If a component already exists, reuse or extend it — never duplicate.
2. **Style with tokens, not hardcoded values.** Use Tailwind utility classes
   that reference the design tokens defined in `src/styles/global.css`
   (e.g. `bg-brand-600`, `text-ink`, `rounded-card`). Never paste raw hex
   colors or one-off pixel values into a component.
3. **Register it.** After adding a component, add a row to `COMPONENTS.md` and
   showcase it on the `/styleguide` page.
