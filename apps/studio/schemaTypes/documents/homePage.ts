import { defineType, defineField } from "sanity";

/**
 * homePage — the home page singleton.
 *
 * STEEL THREAD: every home section's content is migrated and stored on this
 * document (hero, intro, care, triage, triageCta, platform, trust, operations,
 * numbers, clinicalLayer, scaling, cta) and the site renders it from Sanity via
 * the generic resolveAssets() path. Detailed, per-section EDITING fields are the
 * next refinement — until they land, those values show under "fields not in
 * schema" in the studio. (Numbers/Platform will be modeled as fixed content
 * slots, not arrays — see prds/sanity-cms-issues.md issue 7.)
 */
export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  fields: [
    defineField({
      name: "note",
      type: "text",
      readOnly: true,
      initialValue:
        "Home content is stored and live. Per-section editing fields are being added incrementally (refine phase).",
    }),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
