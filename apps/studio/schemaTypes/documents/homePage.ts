import { defineType, defineField } from "sanity";
import { HomeIcon } from "@sanity/icons";
import { CompactImageInput } from "../../components/CompactImageInput";

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
    // `icon` images are small — cap their form preview at 150px.
    ...(name === "icon" ? { components: { input: CompactImageInput } } : {}),
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
// A top-level page section pinned to a group tab.
const section = (name: string, group: string, fields: any[], title?: string, opts: any = {}) =>
  defineField({ name, type: "object", title, group, fields, ...opts } as any);
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

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "Hero & intro", default: true },
    { name: "care", title: "Care" },
    { name: "triage", title: "Triage" },
    { name: "trust", title: "Trust & platform" },
    { name: "proof", title: "Numbers & proof" },
    { name: "closing", title: "Closing" },
  ],
  fields: [
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
      obj("tabs", [str("label"), str("active")]),
      // Card comes before Orchestration to match the site's render order.
      obj(
        "card",
        [
          img("icon"),
          str("title"),
          obj("badge", [img("icon"), img("text"), str("alt")]),
          defineField({ name: "headline", type: "styledHeadline" }),
          obj("media", [str("variant"), file("src")]),
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
              obj("media", [str("variant"), file("src")]),
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

    // ---- Triage CTA ----
    section(
      "triageCta",
      "triage",
      [
        defineField({ name: "heading", type: "styledHeadline" }),
        defineField({ name: "cta", type: "cta" }),
      ],
      "Triage CTA",
    ),

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

    // ---- Platform (fixed diagram; content-editable) ----
    section(
      "platform",
      "trust",
      [
        str("heading"),
        str("subheading"),
        obj("orb", [str("title"), str("badgeLine1"), str("badgeLine2")]),
        str("learnsLabel"),
        str("governedLabel"),
        obj("patients", [
          str("label"),
          arr("icons", [img("src"), str("alt")], {
            preview: { select: { media: "src", title: "alt" } },
          }),
        ]),
        obj("audits", [img("icon"), str("label")]),
        arr("stats", [str("value"), str("plus", "boolean", "Show + suffix"), str("label")], {
          preview: { select: { title: "value", subtitle: "label" } },
        }),
        obj("memory", [img("icon"), str("label")]),
        arr("governance", [img("icon"), str("label")], {
          preview: { select: { title: "label", media: "icon" } },
        }),
      ],
      undefined,
    ),

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
        arr("cards", [str("label"), strArr("lines")], {
          preview: { select: { title: "label" } },
        }),
        // restructured from array-of-arrays → rows of { logos: [...] }
        arr("integrationLogos", [
          arr("logos", [img("src"), str("alt"), str("h", "number", "Height (px)")], {
            preview: { select: { media: "src", title: "alt" } },
          }),
        ]),
        obj("closing", [
          strArr("heading"),
          arr("subtitle", [str("text"), str("br", "boolean", "Line break after")]),
          arr(
            "cards",
            [img("icon"), str("alt"), arr("segments", [str("text"), str("br", "boolean", "Line break after")])],
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

    // ---- Operations ----
    section("operations", "closing", [str("eyebrow"), strArr("heading")]),

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
