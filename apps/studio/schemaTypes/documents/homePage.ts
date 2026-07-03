import { defineType, defineField } from "sanity";
import { HomeIcon } from "@sanity/icons";
import { AspectImageInput, CompactImageInput } from "../../components/AspectImageInput";
import { withSection } from "../lib/section";

/**
 * homePage — the home page singleton, fully modeled for editing.
 *
 * Sections are split across field-group tabs (see `groups`) so editors work one
 * beat of the page at a time instead of scrolling a wall of fields. Heavy nested
 * objects collapse by default. Field names are unchanged — GROQ still projects
 * the exact shape the section components consume.
 *
 * Headings keep their structured shape (line1/highlight/accent/before/after) for
 * now; the styledHeadline Portable Text conversion is a later refinement.
 * Numbers uses named slots (intake/roi/readmissions/workdays) — not an array —
 * so editors change copy without disturbing the fixed bento geometry.
 */

// helpers ---------------------------------------------------------------------
const str = (name: string, type = "string", title?: string, description?: string) =>
  defineField({ name, type, title, description } as any);
const img = (name: string, title?: string) =>
  defineField({
    name,
    type: "image",
    title,
    // Every preview respects the asset's natural aspect ratio (no stretch);
    // small `icon` images additionally cap the preview width at 150px.
    components: { input: name === "icon" ? CompactImageInput : AspectImageInput },
  } as any);
const file = (name: string, title = "Video") =>
  defineField({ name, type: "file", title } as any);
const obj = (name: string, fields: any[], title?: string, opts: any = {}) =>
  defineField({ name, type: "object", title, fields, ...opts });
const arr = (name: string, fields: any[], opts: any = {}) =>
  defineField({
    name,
    type: "array",
    of: [{ type: "object", fields, ...(opts.preview ? { preview: opts.preview } : {}) }],
    ...(opts.title ? { title: opts.title } : {}),
  } as any);
const strArr = (name: string, title?: string) =>
  defineField({ name, type: "array", of: [{ type: "string" }], title } as any);
// A top-level page section pinned to a group tab. Rendered with the SectionField
// chrome (bold header + collapse toggle) so the form scans as distinct sections.
// Expanded by default; a caller can still override via opts.options / opts.components.
const section = (name: string, group: string, fields: any[], title?: string, opts: any = {}) =>
  defineField(withSection({ name, type: "object", title, group, fields, ...opts }) as any);
// Collapse-by-default for the dense nested objects.
const collapsed = { options: { collapsed: true } };
// Flatten a styledHeadline / Portable Text value to plain text for previews.
const ptText = (blocks: any) =>
  Array.isArray(blocks)
    ? blocks
        .map((b: any) => (b?.children || []).map((c: any) => c?.text || "").join(""))
        .join(" ")
        .trim()
    : "";
// Preview for a `points` array member (one styledHeadline `content` field):
// show the actual headline text instead of "Untitled".
const pointsPreview = {
  preview: {
    select: { content: "content" },
    prepare: ({ content }: any) => ({ title: ptText(content) || "(empty point)" }),
  },
};

// Reorderable page sections. Keys MUST match the REGISTRY in
// apps/web/src/pages/index.astro. Footer is not a section; the swirl is page
// chrome, not a list entry. See prds/section-reorder-plan.md.
const SECTION_ORDER: { key: string; title: string }[] = [
  { key: "hero", title: "Hero" },
  { key: "intro", title: "Intro" },
  { key: "care", title: "Care" },
  { key: "triage", title: "Triage" },
  { key: "platform", title: "Platform" },
  { key: "trust", title: "Trust" },
  { key: "operations", title: "Operations" },
  { key: "numbers", title: "Numbers" },
  { key: "clinicalLayer", title: "Clinical layer" },
  { key: "scaling", title: "Scaling" },
  { key: "cta", title: "Closing CTA" },
];
const SECTION_TITLES: Record<string, string> = Object.fromEntries(
  SECTION_ORDER.map((s) => [s.key, s.title]),
);

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "layout", title: "Layout" },
    { name: "hero", title: "Hero & intro", default: true },
    { name: "care", title: "Care" },
    { name: "triage", title: "Triage" },
    { name: "trust", title: "Trust & platform" },
    { name: "proof", title: "Numbers & proof" },
    { name: "closing", title: "Closing" },
  ],
  fields: [
    // ---- Layout: section order + swirl target ----
    defineField({
      name: "order",
      title: "Section order",
      type: "array",
      group: "layout",
      description:
        "Drag to reorder the page's sections. Keep Hero / Intro / Care first — the opening swirl overlays whatever sits at the top of the page. Any section left out of this list still renders (appended at the end).",
      of: [
        {
          type: "object",
          name: "sectionRef",
          fields: [
            defineField({
              name: "key",
              title: "Section",
              type: "string",
              options: {
                list: SECTION_ORDER.map((s) => ({ value: s.key, title: s.title })),
              },
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { key: "key" },
            prepare: ({ key }: any) => ({ title: SECTION_TITLES[key] ?? (key || "(unset)") }),
          },
        },
      ],
      validation: (r) =>
        r.custom((items: any) => {
          const keys = (items ?? []).map((i: any) => i?.key).filter(Boolean);
          return new Set(keys).size === keys.length || "Each section can appear only once";
        }),
      initialValue: SECTION_ORDER.map((s) => ({ _type: "sectionRef", _key: s.key, key: s.key })),
    }),
    defineField({
      name: "swirlEndSection",
      title: "Swirl fades into",
      type: "string",
      group: "layout",
      description:
        "Which opening section the hero swirl bleeds down into before fading out.",
      options: {
        list: [
          { value: "hero", title: "Hero (shortest bleed)" },
          { value: "intro", title: "Intro" },
          { value: "care", title: "Care (default)" },
        ],
      },
      initialValue: "care",
    }),

    // ---- Hero ----
    section("hero", "hero", [
      obj("eyebrow", [str("prefix"), str("link"), str("href"), str("hrefMobile", "string", "Href (mobile)")]),
      str("headline"),
      str("paragraph", "text"),
      defineField({ name: "cta", type: "cta" }),
    ]),

    // ---- Intro ----
    section("intro", "hero", [
      defineField({ name: "lead", type: "styledHeadline" }),
      arr("logos", [img("src", "Logo"), str("alt")], {
        preview: { select: { media: "src", title: "alt" } },
      }),
      obj("media", [file("src"), img("poster"), str("alt")]),
    ]),

    // ---- Care ----
    section("care", "care", [
      defineField({ name: "heading", type: "styledHeadline" }),
      str("subheading"),
      arr("cards", [str("label"), str("description", "text"), file("image")], {
        preview: { select: { title: "label" } },
      }),
      obj("banner", [
        str("label"),
        defineField({ name: "text", type: "styledHeadline" }),
        img("graphic"),
        str("graphicAlt"),
      ]),
    ]),

    // ---- Triage ----
    section("triage", "triage", [
      str("eyebrow"),
      defineField({ name: "heading", type: "styledHeadline" }),
      // Label + Active laid out side by side (two-column fieldset).
      defineField({
        name: "tabs",
        title: "Tabs",
        type: "object",
        fieldsets: [{ name: "row", options: { columns: 2 } }],
        fields: [
          defineField({ name: "label", type: "string", fieldset: "row" }),
          defineField({ name: "active", type: "string", fieldset: "row" }),
        ],
      }),
      // Card comes before Orchestration to match the site's render order.
      obj(
        "card",
        [
          img("icon"),
          str("title"),
          defineField({ name: "headline", type: "styledHeadline" }),
          file("media"),
          arr("points", [defineField({ name: "content", type: "styledHeadline" })], pointsPreview),
        ],
        undefined,
        collapsed,
      ),
      // Case sits right after Card to match the site's render order.
      obj("case", [
        img("logo"),
        str("logoAlt"),
        str("stat"),
        str("statLabel"),
        // Unlike the shared `cta`, this one links to a customer story by
        // reference — the frontend derives the href from the story slug.
        defineField({
          name: "cta",
          title: "Call to action",
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "story",
              title: "Linked customer story",
              type: "reference",
              to: [{ type: "customerStory" }],
              description:
                "The CTA links to this customer story (drives the destination — no hand-typed URL).",
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "story.title" } },
        }),
      ]),
      obj(
        "orchestration",
        [
          str("navLabel"),
          strArr("tabs"),
          arr(
            "cards",
            [
              str("title"),
              defineField({ name: "headline", type: "styledHeadline" }),
              arr("points", [defineField({ name: "content", type: "styledHeadline" })], pointsPreview),
              file("media"),
              obj("case", [
                img("logo"),
                str("logoAlt"),
                str("stat"),
                str("statPlus", "boolean", "Show + suffix"),
                str("statOnly", "boolean", "Stat only (no label)"),
                str("statLabel"),
                defineField({ name: "cta", type: "cta" }),
                obj("mobile", [
                  str("stat"),
                  str("statPlus", "boolean", "Show + suffix"),
                  str("statLabel"),
                  str("hideLogo", "boolean", "Hide logo"),
                ]),
              ]),
            ],
            { preview: { select: { title: "title" } } },
          ),
        ],
        undefined,
        collapsed,
      ),
    ]),

    // ---- Trust ----
    section("trust", "trust", [
      str("heading"),
      arr(
        "badges",
        [
          str("alt"),
          str("w", "number", "Width (px)"),
          str("h", "number", "Height (px)"),
          arr("layers", [
            img("src"),
            str("w", "number", "Width (px)"),
            str("h", "number", "Height (px)"),
            str("x", "number", "Offset X (px)"),
            str("y", "number", "Offset Y (px)"),
          ]),
        ],
        { preview: { select: { title: "alt" } } },
      ),
      arr("points", [img("icon"), str("title"), str("body", "text")], {
        preview: { select: { title: "title" } },
      }),
    ]),

    // ---- Platform (fixed diagram) ----
    // Only the stats are CMS-driven; the rest of the diagram (headings, orb,
    // labels, icons) is baked from src/data/platform.json in Platform.astro.
    section(
      "platform",
      "trust",
      [
        arr("stats", [str("value"), str("plus", "boolean", "Show + suffix"), str("label")], {
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
      undefined,
    ),

    // ---- Operations (renders between Trust and Numbers on the site) ----
    section("operations", "proof", [str("eyebrow"), strArr("heading")]),

    // ---- Numbers (fixed bento — named slots, not an array) ----
    section("numbers", "proof", [
      obj("stats", [
        obj("intake", [str("value"), str("label"), str("href")]),
        obj("roi", [str("value"), str("label"), str("href")]),
        obj("readmissions", [str("value"), str("label"), str("href")]),
        obj("workdays", [str("value"), str("label"), str("href")]),
      ]),
      obj("testimonial", [
        img("logo"),
        str("logoAlt"),
        str("quote", "text"),
        str("name"),
        str("role"),
        img("photo"),
        str("photoAlt"),
        str("href"),
      ]),
      defineField({ name: "cta", type: "cta" }),
    ]),

    // ---- Clinical layer ----
    section(
      "clinicalLayer",
      "proof",
      [
        defineField({ name: "heading", type: "styledHeadline" }),
        arr("steps", [str("num", "string", "Number"), str("label")], {
          preview: { select: { title: "label", subtitle: "num" } },
        }),
        arr("cards", [str("label"), defineField({ name: "lines", title: "Body", type: "richText" })], {
          preview: { select: { title: "label" } },
        }),
        // restructured from array-of-arrays → rows of { logos: [...] }
        arr(
          "integrationLogos",
          [
            arr("logos", [img("src"), str("alt"), str("h", "number", "Height (px)")], {
              preview: { select: { media: "src", title: "alt" } },
            }),
          ],
          {
            // Rows have no meaningful field of their own; label them "Row N"
            // (derived from the seeded _key) instead of dumping raw JSON.
            preview: {
              select: { key: "_key", a0: "logos.0.alt", a1: "logos.1.alt", a2: "logos.2.alt" },
              prepare: ({ key, a0, a1, a2 }: any) => {
                const m = /(\d+)$/.exec(key || "");
                return {
                  title: m ? `Row ${Number(m[1]) + 1}` : "Logo row",
                  subtitle: [a0, a1, a2].filter(Boolean).join(", "),
                };
              },
            },
          },
        ),
        obj("closing", [
          strArr("heading"),
          defineField({ name: "subtitle", type: "richText" }),
          arr(
            "cards",
            [img("icon"), str("alt"), defineField({ name: "segments", title: "Body", type: "richText" })],
            { preview: { select: { title: "alt", media: "icon" } } },
          ),
        ]),
      ],
      "Clinical layer",
      collapsed,
    ),

    // ---- Scaling ----
    section("scaling", "proof", [
      str("eyebrow"),
      defineField({ name: "heading", type: "styledHeadline" }),
      str("body", "text"),
      arr("stats", [img("icon"), str("value"), str("plus", "boolean", "Show + suffix"), str("label")], {
        preview: { select: { title: "value", subtitle: "label", media: "icon" } },
      }),
    ]),

    // ---- CTA ----
    section(
      "cta",
      "closing",
      [
        defineField({ name: "heading", type: "styledHeadline" }),
        defineField({ name: "cta", type: "cta" }),
      ],
      "Closing CTA",
    ),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
