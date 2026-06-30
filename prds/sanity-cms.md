# Sanity CMS Integration

## Problem

Content on intelligence.sword.com currently lives in ~20 hand-edited JSON files
under `src/data/` (e.g. `triage.json`, `customers.json`, `about.json`). Any copy
change, new customer story, stat update, or media swap requires a developer to
edit JSON, open a PR, and redeploy. Marketing cannot self-serve.

The site is also structurally hostile to naive editing: headlines encode partial
styling as positional fragments (`{before, highlight, rest, afterBreak}` — ~70
occurrences across 5 files), several sections are bespoke fixed-canvas layouts
(`Numbers` 1280×877 bento, `Platform` 1280×781 diagram) with hand-placed cards,
and backgrounds/animations couple sections together (`SwirlBackground` bleeds
Hero→Intro→Care; `AboutField` is one continuous scroll-driven background wrapping
the last four About beats). A generic page-builder would let an editor break all
of this.

We want a headless CMS (Sanity) that lets a marketing editor own **content**
(text, media, repeatable cards/stats, customer stories) while developers keep
ownership of **section composition and layout**, with a preview-before-publish
workflow and a static rebuild on publish.

## Goals

1. A marketing editor can edit all About + Customers content and homepage
   text/media in Sanity Studio without developer involvement.
2. Editors can **reorder and add/remove items within sections** (cards, stats,
   team members, customer grid cells) where the layout supports it.
3. Editors can author styled headlines (partial purple highlight, bold runs,
   forced line breaks) without touching positional fragment fields.
4. Customer stories are first-class documents driving `/customers/[slug]`, and
   grid cells reference them (no brittle hardcoded `href` strings).
5. Preview-before-publish: editors review unpublished changes on a preview URL,
   then Publish promotes to a production rebuild.
6. The production site stays **fully static**; content updates via webhook →
   Netlify rebuild.
7. Editors cannot break fixed-geometry layouts or alter schemas (validation +
   role separation).

## Non-goals

- **Section/beat reordering** (page assembly / page-builder). v1 keeps section
  composition hardcoded in each page's `.astro`. *Flagged for likely revisit.*
- **New pages** authored by editors. Managing existing pages only.
- **Live/SSR per-request content.** Content updates on rebuild only.
- **Live visual editing** (Sanity Presentation / click-to-edit). The fetch layer
  is written so this is reachable later, but it is out of scope for v1.
- **Self-serve video upload to an external host.** Video lives in Sanity for v1
  (with a defined tripwire to migrate heavy files to Cloudflare Stream/Mux).
- **Reworking animations to make beats position-independent.**

## Design

### User experience

- **Editor (marketing):** one Editor seat, content-only role. Works in Sanity
  Studio (hosted at `*.sanity.studio`). Edits singletons (Home, About,
  Customers) and `customerStory` documents. Reorders flex arrays via drag
  handles. Authors headlines with a `highlight`/`strong` toolbar on a constrained
  rich-text field. Reviews on a preview URL, clicks **Publish**, and the live
  site rebuilds in ~1–2 min.
- **Developer (admin):** Administrator role. Owns schemas (`/studio` workspace in
  the repo), section composition (`.astro` pages), and layout. Adds new bespoke
  sections in code.

### Technical design

**Stack:** Sanity (hosted Studio) + Astro static build on Netlify, via
`@sanity/astro` (wraps `@sanity/client`), build-time GROQ.

**Repo layout (monorepo):**
- `/studio` — Sanity Studio workspace; schemas version-controlled here.
- Astro app — page frontmatter fetches GROQ at build time, replacing
  `import x from "../data/x.json"`.

**Preview model (B1 — single dataset, native draft/publish):**
- Production build: webhook on `publish` → Netlify build hook → builds with
  `perspective: 'published'` → deploys live.
- Preview build: Netlify preview context builds with
  `perspective: 'previewDrafts'`; triggered by a **manual "Build preview"
  button** in Studio (not auto-built on every draft change).
- Perspective selected by env var. No SSR; no separate staging dataset.
- (Content Releases available later for batched/scheduled publishing.)

**Document model:**
```
Singletons (named fields; .astro composition unchanged):
  homePage      — all text + media per section (fully editor-owned)
  aboutPage     — per-beat content as named fields
  customersPage — title + rows[] → cells[] (reference customerStory)
Documents:
  customerStory — slug-routed → /customers/[slug]
```

**Modeling rules:**

- *Styled headlines* → constrained Portable Text (styles/lists disabled), two
  custom decorators: `highlight` (→ purple accent span) and `strong`. Editor
  soft-breaks → `<br>`. One shared Portable-Text→HTML serializer reused by every
  headline. Replaces all `{before, highlight, rest, afterBreak}` fragments.

- *Flex arrays* (reorderable, variable count, with validation):
  - Care features `min(6).max(6)` (3×2 grid)
  - About "story so far" stats `min(6).max(6)` (3×2 grid)
  - Triage orchestration cards `min(4).max(4)` (4-tab control)
  - Team members `min(1)`
  - Customer grid rows + cells; Scaling stats; Trust badges; customerStory stats;
    logo strips
  - Required-field validation on all headline/CTA fields.

- *Fixed slots* (content-only, **not** arrays — each card hand-placed on a fixed
  canvas with unique illustration):
  - `Numbers` bento tiles → named object fields per slot (intake, ROI,
    readmissions, workdays, testimonial…).
  - `Platform` diagram nodes → named object fields per slot.

- *Customer grid cells* reference `customerStory` documents (drives the link,
  prevents 404s on slug rename) + carry display-only overrides (`layout`, which
  stat to feature, `tone`, optional photo).

**Assets:**
- *Images → Sanity* asset pipeline (hotspot/crop, auto AVIF/WebP, responsive).
  Changes `<img src>` from `/path.png` to a Sanity CDN URL builder.
- *Video → Sanity*, **transcode-before-upload is a hard precondition** (Sanity
  does not optimize video — it serves uploaded bytes as-is). Targets:
  `manifesto.mp4` 92MB→~15MB, `product.mp4` 36MB→~10MB (ffmpeg).
- *Bandwidth tripwire:* alert at ~70 GB/mo Sanity bandwidth. If crossed (~6–7k
  video-page-views/mo), move **only** `manifesto` + `product` to Cloudflare
  Stream/Mux (1-field change, video referenced the same way). Context: without
  transcode the Growth 100 GB cap blows at ~4.6× on a 10k-visit month.

**Migration (scripted, idempotent, two-pass):**
1. Upload referenced `/public` assets → capture returned asset IDs →
   old-path→assetId map.
2. Transform each `src/data/*.json`: split-text → Portable Text, wire grid cells
   → `customerStory` references, emit NDJSON.
3. `sanity dataset import`. Re-runnable until correct. Run **before** editor
   handover (re-running clobbers live edits).

### Dependencies

- Sanity project on the **Growth plan** (committed — 100 GB bandwidth, seats).
- `@sanity/astro`, `@sanity/client`, `@portabletext/to-html` (or equivalent
  serializer), `@sanity/image-url`.
- Netlify build hook + Sanity webhook (GROQ-filtered, fire on publish).
- ffmpeg (one-time, local) for video transcode.

## Implementation plan

1. **Scaffold** `/studio` workspace + base schema types (singletons +
   `customerStory`) and the shared Portable Text headline type + serializer.
2. **Migration script** against the dataset (drafts): assets two-pass,
   split-text conversion, story references.
3. **Vertical slice — Customers** (cleanest fit): wire `customersPage` +
   `customerStory` to GROQ in `customers.astro` and `customers/[slug].astro`;
   validate the flex-array + reference model end to end.
4. **Roll out** About (`about.astro`) then Home (`index.astro`), including
   fixed-slot modeling for `Numbers`/`Platform` and image-pipeline swap.
5. **Ops:** Netlify build hook + Sanity webhook; preview context with
   `previewDrafts`; bandwidth alert.
6. **Roles + handover:** Editor seat (content-only), Administrator for devs; run
   final migration; hand over.

## Success criteria

1. Editor changes a headline (with highlight), adds a customer story + grid cell,
   reorders team members, and swaps an image — all in Studio, no PR — and it ships
   via Publish → rebuild.
2. Preview URL reflects unpublished drafts; production reflects only published.
3. No regression vs current site: all sections render identically post-migration
   (visual parity, including styled headlines and fixed-canvas layouts).
4. Validation blocks layout-breaking edits (e.g. 5th Triage card, 7th Care
   feature, blank required headline).
5. Production build remains fully static; rebuild-on-publish ≤ ~2 min.
6. Sanity bandwidth stays under tripwire post-transcode at current traffic.

## Open questions

1. **Reordering granularity** — v1 is within-section only. When does section/beat
   reordering become a real requirement, and is the answer then the zone-aware
   model (locked leaders + continuous `AboutField` background) or animation
   decoupling?
2. **Video host longevity** — confirm transcode targets hit quality bar; confirm
   tripwire threshold against real analytics once live.
