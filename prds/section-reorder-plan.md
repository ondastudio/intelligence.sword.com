# Section reorder — implementation plan (home page)

> Companion to `section-reorder-audit.md`. Turns the home page into a
> CMS-ordered list of **fully independent** sections by dissolving the two
> page-level "context div" wrappers, then drives render order from a Sanity
> `order` field. Ordering only (no show/hide toggle in this pass).

## Context

Today `apps/web/src/pages/index.astro` hard-codes both the section sequence and
two wrapper `<div>`s that entangle groups of sections:

- `relative isolate bg-surface` around `SwirlBackground · Hero · Intro · Care`
- `triage-usecase-bg bg-surface` around `Triage · TriageCta`

Those wrappers are what forced the audit to treat the opening four and the
triage pair as non-reorderable atomic blocks. The goal here is to **remove the
wrappers while keeping the visuals**, so every section is a bare sibling of
`.page-content` and can be reordered from the CMS — the model `/solutions`
already uses.

Decision (from review): go for the **full decouple** — Hero, Intro, Care,
Triage, TriageCta all become independent units. The swirl's fade target becomes
**data-driven** via a CMS field. The accepted trade-off: a bad reorder (e.g.
dragging a spine section into the opening band) can make the swirl overlay the
wrong section. That misconfiguration risk is acceptable; it is confined to the
top-of-page swirl band and breaks nothing structural.

## Why the visuals survive the decouple

`.page-content` is already `position: relative; z-index: 1; background: var(--color-surface)`
(`global.css:292`). That is exactly what the swirl wrapper supplied
(`relative` + `bg-surface`), and its `isolate` is covered by page-content's
existing stacking context. So:

- **Swirl** — promote `SwirlBackground` to the first child of `.page-content`
  (`absolute inset-x-0 top-0 z-0`) and repoint its script from
  `stage.parentElement` to the `.page-content` ancestor. It still finds the first
  `<section>` (Hero) for the solid region and reaches to `[data-swirl-end]`.
  Because the old wrapper was itself the first child of `.page-content`,
  `wrapper.top ≈ pageContent.top` — the mask geometry is unchanged when the
  opening sections stay first. Intro/Care already render transparent over it and
  need no background of their own (page-content's `#f9f9f9` is the fade-out
  surface). Care keeps its independent card-swirl (`Care.astro:81-89`), which is
  already self-contained.
- **Triage wash** — the `.triage-usecase-bg` rule is **mobile-only**
  (`≤1023.98px`) and merely swaps both sections' `bg-surface` for a shared
  `linear-gradient(45deg,#f4f3fb,transparent)`. `TriageCta` already owns
  `bg-surface` + its own swirl bloom (`TriageCta.astro:27,33`). Move the mobile
  gradient into `Triage.astro` (self-contained, sized to itself) and let
  `TriageCta` keep its existing `bg-surface`. Minor caveat: the 45° wash no
  longer spans both as one diagonal — acceptable (subtle, mobile-only).

## Architecture: block registry + Sanity `order`

Render the page as a flat, data-ordered list. No wrapper divs in the page file.

```astro
<div class="page-content">
  <SwirlBackground />            {/* page-level bg layer; reach is data-driven */}
  {order.map((key) => { const S = REGISTRY[key]; return <S swirlEnd={key === swirlEndSection} />; })}
</div>
<Footer />
```

- `REGISTRY` maps each section key → its existing component. Passing an unknown
  `swirlEnd` prop to components that ignore it is harmless in Astro, so the map
  stays uniform.
- Section components are **unchanged internally** — they still self-fetch their
  slice via the memoized `getHomePage()`. Only Hero/Intro/Care gain an optional
  `swirlEnd?: boolean` prop that conditionally stamps `data-swirl-end` on their
  heading (Care already has the marker at `Care.astro:66` — make it conditional).

Units (12): `hero, intro, care, triage, triageCta, platform, trust, operations,
numbers, clinicalLayer, scaling, cta`. `Footer` is never in the list (pinned).
`SwirlBackground` is page chrome, not a list entry.

## Sanity schema changes — `apps/studio/schemaTypes/documents/homePage.ts`

Add a **Layout** group and two fields (kept out of the content beats):

1. `order` — array of `{ _key, key }` objects; `key` constrained to the 12 known
   section keys via `options.list` (dropdown), with a `preview` that shows the
   human label. `validation`: unique keys. Reordering the array = reordering the
   page. Seed `initialValue` with the 12 keys in current order.
2. `swirlEndSection` — string dropdown over `hero | intro | care`, default
   `care`. Drives which opening section carries `data-swirl-end`.

Add `{ name: "layout", title: "Layout" }` to `groups`. These render inside the
new `SectionField` chrome only if wrapped; here they're plain fields under the
Layout tab (not sections), so leave them un-wrapped.

Note: `initialValue` only applies to *new* documents. The existing homePage
singleton will show an empty `order` until seeded — the web fallback (below)
covers that, so the feature is safe to ship without a migration. Optional: a
one-off `sanity documents` patch to seed `order`/`swirlEndSection` on the live
doc so editors see the list pre-filled.

## Web changes

- **GROQ: no change.** `getHomePage()` already spreads `...`
  (`queries.ts:49`), so `order` and `swirlEndSection` come through
  automatically. `resolveAssets` passes the plain order objects untouched.
- **`apps/web/src/pages/index.astro`** — rewrite the template to the registry +
  `order.map` form above; delete both wrapper divs and the `.triage-usecase-bg`
  `<style>` block (its logic moves into `Triage.astro`). Add
  `const home = await getHomePage()` and compute the render order:

  ```ts
  const KEYS = ["hero","intro","care","triage","triageCta","platform","trust",
                "operations","numbers","clinicalLayer","scaling","cta"];
  const wanted = (home?.order ?? []).map((o) => o.key).filter((k) => KEYS.includes(k));
  // Fallback + never-drop: use default order when empty; append any known
  // section the CMS list omits, so content can't silently vanish.
  const order = (wanted.length ? wanted : KEYS)
    .concat(KEYS.filter((k) => !wanted.includes(k)));
  const swirlEndSection = home?.swirlEndSection ?? "care";
  ```
- **`SwirlBackground.astro`** — render as first child of `.page-content` (the
  page template places it; the component markup is largely unchanged). In the
  script, replace `const wrapper = stage?.parentElement` with a lookup of the
  `.page-content` ancestor (`stage.closest(".page-content")`), keeping the
  `querySelector("section")` / `[data-swirl-end]` logic. Verify the sm+ `reach`
  math against the new ancestor.
- **`Care.astro` / `Intro.astro` / `Hero.astro`** — accept `swirlEnd?: boolean`;
  render `data-swirl-end` on the primary heading only when true. Care defaults
  the marker today; make it conditional and default-driven by `swirlEndSection`.
- **`Triage.astro`** — add a self-contained mobile background (the
  `linear-gradient(45deg,#f4f3fb,transparent)` currently in index.astro), scoped
  to the section and gated at `≤1023.98px`. Drop reliance on the wrapper forcing
  transparency.

## Risks & guardrails

- **Swirl overlay depends on the opening staying at the top.** If reordered so a
  spine section lands in the swirl band, the swirl bleeds over it. Accepted.
  Guardrail: the `swirlEndSection` dropdown + the Layout-tab ordering make the
  intent explicit; document "keep Hero/Intro/Care first" in the field
  description.
- **Content never disappears.** The web appends any known section missing from
  the CMS list, so an incomplete `order` array still renders every section.
- **No hidden GROQ coupling.** Verified the only cross-section hooks are the
  swirl (`data-swirl-end`, now data-driven) and the triage wash (now
  self-contained); Hero→`#numbers` link is ID-based and already order-safe.

## Phasing

1. **Schema**: add Layout group + `order` + `swirlEndSection`; seed initialValue.
2. **Swirl decouple**: re-anchor `SwirlBackground` to `.page-content`; make
   `data-swirl-end` conditional via `swirlEnd` prop. Verify visual parity.
3. **Triage decouple**: move mobile wash into `Triage.astro`; remove wrapper +
   `<style>`.
4. **Registry render**: rewrite `index.astro` to the `order.map` form.
5. (Optional) seed the live singleton's `order`.

## Files

- `apps/studio/schemaTypes/documents/homePage.ts` — Layout group + 2 fields.
- `apps/web/src/pages/index.astro` — registry + `order.map`; delete wrappers/style.
- `apps/web/src/components/sections/SwirlBackground.astro` — anchor to `.page-content`.
- `apps/web/src/components/sections/Care.astro` (+ `Intro`, `Hero`) — `swirlEnd` prop.
- `apps/web/src/components/sections/Triage.astro` — self-contained mobile wash.
- `apps/web/src/lib/sanity/queries.ts` — no change (verify `order` passes through).

## Verification

1. **Studio**: `npm run studio`; open Home page → Layout tab; confirm the `order`
   list drags/reorders and `swirlEndSection` shows.
2. **Visual parity (default order)**: `npm run dev` in `apps/web`; compare against
   current build at desktop *and* `≤639px` / `≤1023px` breakpoints —
   specifically the swirl bleed Hero→Intro→Care heading, the `bg-surface`
   fade-out, and the Triage/TriageCta mobile wash. Reduced-motion + no-JS
   (static mesh fallback) still correct.
3. **Reorder smoke test**: swap two spine sections (e.g. Numbers ↔ Scaling) in
   the CMS (or a local stub) and confirm the page reflects the new order with no
   layout breakage; confirm Hero's `#numbers` scroll link still resolves.
4. **Fallback**: with `order` empty, page renders the default sequence.
5. `npx astro check` (web) and `apps/studio` `tsc --noEmit` both clean; `npm run
   build` in `apps/web` succeeds.
