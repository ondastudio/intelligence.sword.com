# Section-reorder audit — intelligence.sword.com

> **Purpose:** Input for the CMS migration. Determines which page sections can be
> reordered independently and which are entangled (shared backgrounds, cross-section
> scripts, wrapper-driven animations). Written for downstream agents implementing the
> Sanity-powered reorder feature.
>
> **Repo layout:** monorepo — web app at `apps/web`, Sanity studio at `apps/studio`.
> Pages: `apps/web/src/pages/*.astro`. Sections: `apps/web/src/components/sections/*.astro`.

## How the site is assembled

Every route follows the same shell: sections are composed directly in the page
`.astro` file inside a `.page-content` pane, with `<Footer>` pinned behind it (the
"footer-reveal" trick in `apps/web/src/styles/global.css`). So **"reorderable section"
= the sequence of children inside `.page-content`**, and two structural constraints
apply to *every* page:

- **`Footer` is never reorderable** — it's pinned behind the scroll pane and revealed
  at the end (`.footer-reveal` in `global.css`). It must live outside the CMS-ordered list.
- **`Cta`** is the conventional closer (reused on 4 routes). It's self-contained (own
  mesh canvas) and *can* move, but on About it's trapped inside a wrapper (see below).

The decisive signal for entanglement is **wrapper `<div>`s in the page file** that
provide a shared background/stacking context to a *group* of sections, plus **scripts
that `querySelector` a sibling section**. Sections that are bare siblings of
`.page-content` with self-scoped scripts reorder freely.

---

## Route: `/` (`index.astro`) — mixed

Current order: `[Swirl·Hero·Intro·Care]` → `[Triage·TriageCta]` → Platform → Trust →
Operations → Numbers → ClinicalLayer → Scaling → Cta.

### ✅ Freely reorderable (the "spine")

**Platform, Trust, Operations, Numbers, ClinicalLayer, Scaling** — each is a bare
`<section>` sibling with its own background and its own scroll mechanics scoped *inside
itself* (e.g. Operations' `margin-top:-100vh` and ClinicalLayer's fixed swirl are
internal pin tricks — verified they do not bleed into neighbours). These six can be
arbitrarily reordered today. **Cta** also belongs here (self-contained), just
conventionally last.

- Soft dependency: **Hero → Numbers**. Hero's eyebrow link (`data-hero-scroll-to`)
  targets `#numbers` / `#numbers-intake` by ID. Reorder is fine (ID-based, not
  positional), but if Numbers is *removed*, the link silently dead-ends (guarded, no crash).

### ⚠️ Entangled — hard boundaries

1. **SwirlBackground + Hero + Intro + Care** — wrapped together in
   `<div class="relative isolate bg-surface">`. A **single swirl canvas bleeds across
   the Hero→Intro boundary**; `isolate` establishes the stacking context they share;
   `bg-surface` shows through as the swirl fades into Intro. These four cannot be
   separated or individually reordered — one atomic "opening" block. (Care additionally
   uses a `position:fixed` pinned card deck.)
2. **Triage + TriageCta** — wrapped in `<div class="triage-usecase-bg">`, which paints
   a shared mobile gradient and forces both children transparent via
   `[data-triage-section]` / `[data-triage-cta-section]`. They move as a **locked pair**;
   splitting them breaks the shared gradient.

### Soft: Hero "scroll down" chevron

`data-hero-scroll` scrolls to the *next sibling* `<section>`. Order-dependent but
self-healing — always targets whatever ends up next.

---

## Route: `/about` (`about.astro`) — most entangled on the site

Current order: AboutHero → AboutStory → AboutStats →
`AboutField[ AboutOperations · AboutCta · AboutTeam · Cta ]`.

### ✅ Reorderable

- **AboutStory, AboutStats** — no scripts, self-contained. Free to reorder.
- **AboutHero** — sticky video hero with self-contained scroll-driven overlay;
  reorderable in principle but designed as the opener.

### ⚠️ Entangled — the `AboutField` group

`AboutField` is a **wrapper component** that renders one continuous animated background
(lavender wash + sticky swirl bloom) behind four slotted sections. Critically, **its
animation is driven by AboutOperations' scroll geometry** — `AboutField.astro` reads
`[data-about-ops]` to scrub the wash and swirl. So:

- **AboutOperations, AboutCta, AboutTeam, Cta** all render transparent *on top of* this
  shared background and cannot be pulled out without losing their background.
- AboutCta/AboutTeam are individually trivial (no scripts) but are **positionally
  dependent** on the wrapper.
- Reordering *within* the group is risky: the wash timing is calibrated to
  AboutOperations being first and the background releasing in the closing Cta.
- Note `Cta` here also receives `about.finalCta` from Sanity.

This whole "born → team → closing CTA" run is effectively **one CMS block**, not four
reorderable sections.

---

## Route: `/solutions` (`solutions.astro`) — cleanest, fully reorderable

Order: SolutionsHero → SolutionsLogos → SolutionsHandoff → SolutionsVideo →
SolutionsHowItWorks → Cta.

Flat list of bare siblings — **no wrappers, no shared backgrounds, no cross-section
`querySelector`s.** SolutionsHandoff and SolutionsHowItWorks have their own scoped
animation scripts. **All of these reorder freely.** This is the model the other pages
would need to be refactored toward.

---

## Routes: `/customers`, `/customers/[slug]`, `/book-an-intro` — single-section, N/A

- **`/customers`**: Navbar → Customers → Cta. Only one content section.
- **`/customers/[slug]`**: Navbar → CustomerStory (787 lines, 5 scripts — a whole
  data-driven story template) → Cta. One monolithic section; "reordering" doesn't
  apply — intra-section templating, already Sanity-fed.
- **`/book-an-intro`**: SwirlBackground + BookIntroForm share a `relative isolate`
  gradient wrapper (same pattern as Hero). Single form page.

---

## Summary table

| Section(s) | Route | Status | Coupling mechanism |
|---|---|---|---|
| Platform, Trust, Operations, Numbers, ClinicalLayer, Scaling, Cta | `/` | ✅ Free | Bare siblings, self-scoped scripts |
| All 6 Solutions sections | `/solutions` | ✅ Free | Flat list, zero coupling |
| AboutStory, AboutStats, AboutHero | `/about` | ✅ Free | No scripts / self-contained |
| **Swirl+Hero+Intro+Care** | `/` | ⛔ Atomic block | Shared swirl canvas bleed + `isolate`/`bg-surface` wrapper |
| **Triage+TriageCta** | `/` | ⛔ Locked pair | Shared `.triage-usecase-bg` gradient + transparency data-attrs |
| **AboutOperations+AboutCta+AboutTeam+Cta** | `/about` | ⛔ Atomic block | `AboutField` wrapper bg *driven by AboutOperations scroll* |
| Footer | all | 🔒 Never reorder | Pinned via `.footer-reveal` |
| Hero→`#numbers` | `/` | soft | ID-based scroll link; needs Numbers to exist |

---

## Implications for the CMS reorder feature

1. **Model entangled groups as single "block" documents**, not as independently-orderable
   sections. Three composite blocks exist: home-opening (`Swirl/Hero/Intro/Care`),
   home-triage (`Triage/TriageCta`), and about-field
   (`AboutOperations/AboutCta/AboutTeam/Cta`). Expose these to editors as one draggable
   unit each.
2. **The reorderable "free" pool** is: the home spine (6 sections), all of Solutions,
   and AboutStory/AboutStats. These can back a true drag-to-reorder array today.
3. **To unlock more reordering**, the refactor target is to move shared backgrounds *out
   of page-level wrappers and into the sections themselves* (as Solutions already does) —
   i.e. give Hero/Intro their own self-contained backgrounds, and invert AboutField so
   each section owns its slice of the wash instead of the wrapper reading a sibling's
   scroll position.
4. **Keep Footer, and each page's closing Cta, as fixed slots** in the template rather
   than entries in the ordered list — Footer is structurally pinned, and Cta on About is
   background-bound.
