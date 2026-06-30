# intelligence.sword.com

Website for intelligence.sword.com, built with **Astro** and **Tailwind CSS**.
The project is set up so that **non-developers can make changes safely** and so
that UI is assembled from a **reusable component library**.

## Running the site

You need [Node.js](https://nodejs.org) installed. Then, from this folder:

```bash
npm install      # first time only
npm run dev      # start the local site at http://localhost:4321
```

Other commands:

```bash
npm run build    # build the final site into ./dist
npm run preview  # preview the built site locally
```

## Making changes without coding

You can change a lot without writing code:

- **Colors, fonts, and rounded corners** — edit the tokens in
  [`src/styles/global.css`](src/styles/global.css). Change a value once and it
  updates across the whole site.
- **Text, links, and settings** — edit the files in [`src/data`](src/data).
- **See what building blocks exist** — visit the `/styleguide` page in the
  running site, or read [`COMPONENTS.md`](COMPONENTS.md).

When changing values, keep the names and structure the same — only change the
value (the part after the `:`).

## How it's organized

| Folder | What's in it |
| ------ | ------------ |
| `src/styles/global.css` | Design tokens (colors, fonts, sizes) + base styles |
| `src/components/ui` | Reusable UI building blocks (buttons, cards, …) |
| `src/components/layout` | Page structure (header, footer, …) |
| `src/data` | Editable content (text, links, settings) |
| `src/pages` | The pages of the site |

## For developers

See [`CLAUDE.md`](CLAUDE.md) for conventions and the component-extraction
workflow. The component library is **extracted from the design**, not invented;
design tokens drive all styling.
