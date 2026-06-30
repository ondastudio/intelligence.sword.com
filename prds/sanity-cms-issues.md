# Sanity CMS — Implementation Issues

Derived from `prds/sanity-cms.md`. Issues are in dependency order; issue 1 is the
tracer bullet (thinnest slice through every layer: Studio → schema → migration
conventions → `@sanity/astro` build-time GROQ → static Astro render → visual
parity).

## Dependency graph

```
1  Tracer: customerStory end-to-end
├─ 2  Migration script (two-pass, idempotent)
│     ├─ 3  Customers grid (customersPage)        ← completes Customers vertical
│     ├─ 5  About page (aboutPage)
│     ├─ 6  Home — flow sections (homePage pt.1)
│     └─ 7  Home — fixed-canvas sections (pt.2)   ← also depends on 6
├─ 4  Media / video model + transcode            ← feeds 5, 6
└─ 8  Build pipeline + preview workflow
9  Roles + final migration + handover            ← depends on 3, 5, 7, 8
```

**Parallelizable:**
- After **1**: issues **2**, **4**, **8** can run in parallel.
- After **2**: issues **3**, **5**, **6** can run in parallel (5 & 6 also need 4).
- **7** follows **6** (same `homePage` doc). **9** is last.

---

## 1. Tracer bullet — `customerStory` rendered end-to-end from Sanity

**Depends on:** none

### Description
Prove the whole architecture with the thinnest real slice: scaffold the Studio,
define the `customerStory` schema (including the shared styled-headline type +
serializer and the image pipeline), hand-enter **one** story, and render
`/customers/[slug]` from Sanity via build-time GROQ with visual parity to today.
No migration script yet (issue 2), no grid yet (issue 3).

### Acceptance criteria
- [ ] `/studio` workspace scaffolded in the monorepo against the committed Sanity
      Growth project; `sanity deploy` serves it at `*.sanity.studio`.
- [ ] `customerStory` schema exists (slug, logo image, title, stats[], overview,
      testimonial) using the shared `styledHeadline` Portable Text type
      (decorators `highlight` + `strong`, styles/lists disabled).
- [ ] One story entered by hand in Studio renders at `/customers/[slug]` via
      `@sanity/astro` build-time GROQ, replacing the JSON import in
      `src/pages/customers/[slug].astro`.
- [ ] Styled headline renders through the shared PT→HTML serializer
      (`highlight`→purple accent span, `strong`→`<strong>`, soft-break→`<br>`);
      images render through `@sanity/image-url` (AVIF/WebP).
- [ ] The rendered page is visually at parity with the current static page.

### Technical notes
- Source of truth for parity: `src/components/sections/CustomerStory.astro` +
  `src/data/customer-stories.json` (object keyed by slug; 5 stories).
- Build the serializer once here; everything downstream reuses it.
- Keep `perspective` wired via env (`published` default) so issue 8 can flip on
  `previewDrafts` without a rewrite.

---

## 2. Migration script — idempotent, two-pass

**Depends on:** 1

### Description
A re-runnable Node script that seeds the dataset from `src/data/*.json`. Two-pass:
upload `/public` assets first (capture asset IDs → old-path→assetId map), then
emit documents transforming split-text → Portable Text and wiring references.
First target: the 5 `customerStory` documents.

### Acceptance criteria
- [ ] Pass 1 uploads referenced `/public` images, builds an old-path→assetId map;
      re-running does not duplicate assets.
- [ ] Pass 2 converts `{before, highlight, rest, afterBreak}` fragments to
      `styledHeadline` Portable Text (`highlight`→decorator, `afterBreak`→soft
      break) deterministically.
- [ ] Emits NDJSON imported via `sanity dataset import`; all 5 stories present.
- [ ] Script is idempotent (re-run replaces, never duplicates) and lives in the
      repo as one command.
- [ ] All `/customers/[slug]` pages render at parity from migrated content.

### Technical notes
- Two-pass ordering is mandatory: documents reference asset IDs that must exist
  first.
- Reuse the split-text→PT mapping logic shape from issue 1's serializer (inverse
  direction).
- Must run **before** editor handover (re-run clobbers live edits) — see issue 9.

---

## 3. Customers grid — `customersPage` singleton

**Depends on:** 1, 2

### Description
Model the Customers index: a singleton with `title` + reorderable `rows[]`, each
row a `layout` enum + reorderable `cells[]`, each cell **referencing** a
`customerStory` document plus display-only overrides. Wire `customers.astro`.
Completes the Customers vertical slice.

### Acceptance criteria
- [ ] `customersPage` singleton: `title`, `rows[]` (reorderable, `layout` ∈
      full/half/thirds/416+848/848+416), `cells[]` (reorderable).
- [ ] Each cell is a `reference` to `customerStory` + overrides (`tone`, featured
      stat, optional `photo`, `type`); the link derives from the referenced
      story's slug (no hardcoded `href`).
- [ ] `src/pages/customers.astro` renders from GROQ; masonry layout at parity.
- [ ] Reordering rows/cells in Studio reorders the rendered grid after rebuild.
- [ ] Migration script (issue 2) seeds `customersPage` from `customers.json`.

### Technical notes
- Parity target: `src/components/sections/Customers.astro` (row column-templates
  keyed off `layout`) + `src/data/customers.json`.
- Renaming a story slug must not break grid links (the point of references).

---

## 4. Media / video model + transcode

**Depends on:** 1

### Description
Establish the video reference pattern in Sanity and satisfy the
**transcode-before-upload precondition**. Transcode heavy files, upload, expose a
video reference field reused by media components, and set the bandwidth tripwire.

### Acceptance criteria
- [ ] ffmpeg transcode: `manifesto.mp4` 92MB→~15MB, `product.mp4` 36MB→~10MB
      (and `.webm` equivalents kept), quality reviewed.
- [ ] Videos uploaded to Sanity; a reusable video reference field/pattern feeds
      `MediaFrame` / `ProductVideo` (src swapped from `/public` path to Sanity).
- [ ] Sanity bandwidth alert configured at ~70 GB/mo (tripwire documented).
- [ ] No visual/playback regression on demo film + manifesto film.

### Technical notes
- Parity targets: `MediaFrame.astro`, `ProductVideo.astro`, `AboutHero.astro`
  (manifesto), `Intro.astro`/`SolutionsVideo.astro` (product), `triage/*.webm`.
- Sanity does **not** transcode video — this issue owns the ffmpeg step.
- Reference shape must allow a later 1-field swap to Cloudflare Stream/Mux.

---

## 5. About page — `aboutPage` singleton

**Depends on:** 1, 2, 4

### Description
Model About as a named-fields singleton (composition stays in `about.astro`) with
flex arrays for the repeatable beats and content fields for the rest. Migrate and
wire.

### Acceptance criteria
- [ ] `aboutPage` singleton: hero, story, cta, finalCta (content fields) +
      `storySoFar.stats[]` (min 6/max 6), `team.members[]` (min 1),
      trusted-by logos[], operations stats[].
- [ ] Strict validation on geometry-bound arrays; required headline/CTA fields.
- [ ] `src/pages/about.astro` renders from GROQ; all beats at parity, including
      the `AboutField` continuous background and manifesto video (issue 4).
- [ ] Reordering team members / story-so-far stats reorders the rendered grids.
- [ ] Migration seeds `aboutPage` from `about.json`.

### Technical notes
- Parity targets: `AboutHero/Story/Stats/Operations/Cta/Team.astro`,
  `AboutField.astro`, `src/data/about.json`.
- Composition is **not** reorderable in v1 — only within-section arrays.

---

## 6. Home — flow sections (`homePage` pt. 1)

**Depends on:** 1, 2, 4

### Description
Model the homepage's flowing sections into the `homePage` singleton: all
text/media plus the flex arrays. Image pipeline + video references swapped.
Excludes the fixed-canvas sections (issue 7).

### Acceptance criteria
- [ ] `homePage` fields for Hero, Intro, Care, Triage, Trust, Scaling, Operations,
      CTA text/media; all editor-owned.
- [ ] Flex arrays with validation: Care features (6/6), Triage orchestration
      cards (4/4) + each card's proof points, Scaling stats, Trust badges, logo
      strips.
- [ ] `src/pages/index.astro` flow sections render from GROQ at parity; images via
      pipeline, videos via issue 4 references.
- [ ] Reordering Care features / Triage cards reorders rendered output.
- [ ] Migration seeds these fields from the relevant `src/data/*.json`.

### Technical notes
- Parity targets: `Hero/Intro/Care/Triage/Trust/Scaling/Operations/Cta.astro`
  and their JSON (`hero/intro/care/triage/trust/scaling/operations/cta.json`).
- `SwirlBackground` coupling (Hero→Intro→Care) stays in code — content only.

---

## 7. Home — fixed-canvas sections (`homePage` pt. 2)

**Depends on:** 6

### Description
Extend `homePage` with **fixed-slot** modeling for `Numbers` and `Platform` —
each bespoke tile/node is a named object field (content-only), **not** a
reorderable array, because both are hand-placed on a fixed canvas.

### Acceptance criteria
- [ ] `Numbers` tiles modeled as named slot fields (intake, ROI, readmissions,
      workdays, testimonial, portrait) — labels/stats editable, no reorder/add.
- [ ] `Platform` diagram nodes modeled as named slot fields — content-only.
- [ ] `index.astro` renders both from GROQ; fixed-canvas geometry unchanged.
- [ ] Migration seeds these slots from `numbers.json` / `platform.json`.

### Technical notes
- `Numbers.astro` tiles use hardcoded `--l/--t/--w/--h` on a 1280×877 canvas with
  unique inner illustrations; `numbers.json` has no `cards` array. Do **not**
  introduce one — slot fields only.
- Same for `Platform.astro` (1280×781). See PRD "fixed slots" rule.

---

## 8. Build pipeline + preview workflow

**Depends on:** 1

### Description
Wire the rebuild-on-publish loop and the manual preview workflow (B1).

### Acceptance criteria
- [ ] Sanity publish webhook (GROQ-filtered) → Netlify build hook → production
      build with `perspective: 'published'`.
- [ ] A **manual "Build preview" button** in Studio triggers the Netlify preview
      context build with `perspective: 'previewDrafts'` (not auto-on-draft).
- [ ] Perspective selected by env var; production stays fully static.
- [ ] Publishing a change rebuilds and reflects on the live site in ≤ ~2 min.

### Technical notes
- One dataset, native draft/publish (no staging dataset).
- Content Releases noted as a later option for batched publishing.

---

## 9. Roles + final migration + editor handover

**Depends on:** 3, 5, 7, 8

### Description
Lock down access, run the final migration, verify full-site parity, and hand the
Studio to the editor.

### Acceptance criteria
- [ ] Editor role (content-only) on 1 seat; Administrator role for devs
      (schema/structure).
- [ ] Final idempotent migration run; full-site visual parity verified across
      Home, About, Customers, and `/customers/[slug]`.
- [ ] Editor can, unaided: edit a styled headline, add a customerStory + grid
      cell, reorder team members, swap an image — shipped via Publish → rebuild.
- [ ] Validation blocks layout-breaking edits (5th Triage card, 7th Care feature,
      blank required headline).
- [ ] Handover doc / walkthrough delivered.

### Technical notes
- Migration must precede handover; re-running after editors start clobbers edits.
- This is the success-criteria checklist from the PRD, made executable.
