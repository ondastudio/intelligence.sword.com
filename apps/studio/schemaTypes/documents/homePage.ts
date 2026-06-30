import { defineType, defineField } from "sanity";

/**
 * homePage — the home page singleton, fully modeled for editing.
 *
 * Headings keep their structured shape (line1/highlight/accent/before/after) for
 * now; the styledHeadline Portable Text conversion is a later refinement.
 * Numbers uses named slots (intake/roi/readmissions/workdays) — not an array —
 * so editors change copy without disturbing the fixed bento geometry.
 */

// helpers ---------------------------------------------------------------------
const str = (name: string, type = "string", title?: string) =>
  defineField({ name, type, title } as any);
const img = (name: string, title?: string) =>
  defineField({ name, type: "image", title } as any);
const file = (name: string, title = "Video") =>
  defineField({ name, type: "file", title } as any);
const obj = (name: string, fields: any[], title?: string) =>
  defineField({ name, type: "object", title, fields });
const arr = (name: string, fields: any[], opts: any = {}) =>
  defineField({
    name,
    type: "array",
    of: [{ type: "object", fields, ...(opts.preview ? { preview: opts.preview } : {}) }],
    ...(opts.title ? { title: opts.title } : {}),
  } as any);
const strArr = (name: string, title?: string) =>
  defineField({ name, type: "array", of: [{ type: "string" }], title } as any);

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
      arr("logos", [img("src", "Logo"), str("alt")], {
        preview: { select: { media: "src", title: "alt" } },
      }),
      obj("media", [file("src"), img("poster"), str("alt")]),
    ]),

    // ---- Care ----
    obj("care", [
      obj("heading", [str("line1"), str("line2"), str("highlight"), str("after")]),
      str("subheading"),
      arr("cards", [str("label"), str("description", "text"), file("image")], {
        preview: { select: { title: "label" } },
      }),
      obj("banner", [
        str("label"),
        str("before"),
        str("highlight"),
        img("graphic"),
        str("graphicAlt"),
      ]),
    ]),

    // ---- Triage ----
    obj("triage", [
      str("eyebrow"),
      obj("heading", [str("before"), str("highlight"), str("afterBreak"), str("after")]),
      obj("tabs", [str("label"), str("active")]),
      obj("orchestration", [
        str("navLabel"),
        strArr("tabs"),
        arr(
          "cards",
          [
            str("title"),
            obj("headline", [str("highlight"), str("rest")]),
            arr("points", [str("before"), str("strong"), str("rest")]),
            obj("media", [str("variant"), file("src")]),
            obj("case", [
              img("logo"),
              str("logoAlt"),
              str("stat"),
              str("statPlus", "boolean"),
              str("statOnly", "boolean"),
              str("statLabel"),
              defineField({ name: "cta", type: "cta" }),
              obj("mobile", [
                str("stat"),
                str("statPlus", "boolean"),
                str("statLabel"),
                str("hideLogo", "boolean"),
              ]),
            ]),
          ],
          { preview: { select: { title: "title" } } },
        ),
      ]),
      obj("card", [
        img("icon"),
        str("title"),
        obj("badge", [img("icon"), img("text"), str("alt")]),
        obj("headline", [str("highlight"), str("rest")]),
        obj("media", [str("variant"), file("src")]),
        arr("points", [str("strong"), str("rest")]),
      ]),
      obj("case", [
        img("logo"),
        str("logoAlt"),
        str("stat"),
        str("statLabel"),
        defineField({ name: "cta", type: "cta" }),
      ]),
    ]),

    // ---- Trust ----
    obj("trust", [
      str("heading"),
      arr(
        "badges",
        [
          str("alt"),
          str("w", "number"),
          str("h", "number"),
          arr("layers", [
            img("src"),
            str("w", "number"),
            str("h", "number"),
            str("x", "number"),
            str("y", "number"),
          ]),
        ],
        { preview: { select: { title: "alt" } } },
      ),
      arr("points", [img("icon"), str("title"), str("body", "text")], {
        preview: { select: { title: "title" } },
      }),
    ]),

    // ---- Platform (fixed diagram; content-editable) ----
    obj("platform", [
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
      arr("stats", [str("value"), str("plus", "boolean"), str("label")], {
        preview: { select: { title: "value", subtitle: "label" } },
      }),
      obj("memory", [img("icon"), str("label")]),
      arr("governance", [img("icon"), str("label")], {
        preview: { select: { title: "label", media: "icon" } },
      }),
    ]),

    // ---- Numbers (fixed bento — named slots, not an array) ----
    obj("numbers", [
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
    obj("clinicalLayer", [
      obj("heading", [str("before"), str("accent"), str("after")]),
      arr("steps", [str("num"), str("label")], {
        preview: { select: { title: "label", subtitle: "num" } },
      }),
      arr("cards", [str("label"), strArr("lines")], {
        preview: { select: { title: "label" } },
      }),
      // restructured from array-of-arrays → rows of { logos: [...] }
      arr("integrationLogos", [
        arr("logos", [img("src"), str("alt"), str("h", "number")], {
          preview: { select: { media: "src", title: "alt" } },
        }),
      ]),
      obj("closing", [
        strArr("heading"),
        arr("subtitle", [str("text"), str("br", "boolean")]),
        arr("cards", [img("icon"), str("alt"), arr("segments", [str("text"), str("br", "boolean")])], {
          preview: { select: { title: "alt", media: "icon" } },
        }),
      ]),
    ]),

    // ---- Scaling ----
    obj("scaling", [
      str("eyebrow"),
      obj("heading", [str("line1"), str("line2"), str("accent"), str("after")]),
      str("body", "text"),
      arr("stats", [img("icon"), str("value"), str("plus", "boolean"), str("label")], {
        preview: { select: { title: "value", subtitle: "label", media: "icon" } },
      }),
    ]),

    // ---- Operations ----
    obj("operations", [str("eyebrow"), strArr("heading")]),

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
