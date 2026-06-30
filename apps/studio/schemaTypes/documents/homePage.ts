import { defineType, defineField } from "sanity";

/**
 * homePage — the home page singleton.
 *
 * Sections modeled for editing so far: hero, intro, care, scaling, operations,
 * cta, triageCta. Still stored-but-unmodeled (rendered fine, but show under
 * "fields not in schema" until modeled): triage, platform, trust, numbers,
 * clinicalLayer — these are deeper/structural and land next.
 *
 * Headings keep their structured shape (line1/highlight/accent/…) for now; the
 * styledHeadline Portable Text conversion is a later refinement.
 */

const obj = (name: string, fields: any[], title?: string) =>
  defineField({ name, type: "object", title, fields });

const str = (name: string, type = "string", title?: string) =>
  defineField({ name, type, title } as any);

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  fields: [
    // ---- Hero ----
    obj("hero", [
      obj("eyebrow", [str("prefix"), str("link"), str("href"), str("hrefMobile")]),
      str("headline"),
      str("paragraph", "text"),
      defineField({ name: "cta", type: "cta" }),
    ]),

    // ---- Intro ----
    obj("intro", [
      obj("lead", [str("before"), str("highlight"), str("after")]),
      defineField({
        name: "logos",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "src", type: "image", title: "Logo" },
              { name: "alt", type: "string" },
            ],
            preview: { select: { media: "src", title: "alt" } },
          } as any,
        ],
      }),
      obj("media", [
        { ...str("src", "file", "Video") } as any,
        defineField({ name: "poster", type: "image" }),
        str("alt"),
      ]),
    ]),

    // ---- Care ----
    obj(
      "care",
      [
        obj("heading", [str("line1"), str("line2"), str("highlight"), str("after")]),
        str("subheading"),
        defineField({
          name: "cards",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                { name: "label", type: "string" },
                { name: "description", type: "text" },
                { name: "image", type: "file", title: "Video" },
              ],
              preview: { select: { title: "label" } },
            } as any,
          ],
        }),
        obj("banner", [
          str("label"),
          str("before"),
          str("highlight"),
          defineField({ name: "graphic", type: "image" }),
          str("graphicAlt"),
        ]),
      ],
      "Care",
    ),

    // ---- Scaling ----
    obj("scaling", [
      str("eyebrow"),
      obj("heading", [str("line1"), str("line2"), str("accent"), str("after")]),
      str("body", "text"),
      defineField({
        name: "stats",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "icon", type: "image" },
              { name: "value", type: "string" },
              { name: "plus", type: "boolean" },
              { name: "label", type: "string" },
            ],
            preview: { select: { title: "value", subtitle: "label", media: "icon" } },
          } as any,
        ],
      }),
    ]),

    // ---- Operations ----
    obj("operations", [
      str("eyebrow"),
      defineField({
        name: "heading",
        type: "array",
        of: [{ type: "string" }],
        description: "One entry per line.",
      }),
    ]),

    // ---- CTA ----
    obj("cta", [
      obj("heading", [str("line1"), str("line2Before"), str("accent"), str("after")]),
      defineField({ name: "cta", type: "cta" }),
    ]),

    // ---- Triage CTA ----
    obj("triageCta", [
      obj("heading", [str("line1"), str("line2")]),
      defineField({ name: "cta", type: "cta" }),
    ]),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
