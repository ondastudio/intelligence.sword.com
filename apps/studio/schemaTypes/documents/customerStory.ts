import { defineType, defineField, defineArrayMember } from "sanity";
import { CaseIcon } from "@sanity/icons";

/**
 * customerStory — one /customers/<slug> detail page. Faithful to the shape
 * CustomerStory.astro consumes (src/data/customer-stories.json), but with images
 * as `figure` refs, Overview as `richText`, and related items as references to
 * other customerStory docs (no more hardcoded hrefs).
 */
export const customerStory = defineType({
  name: "customerStory",
  title: "Customer story",
  type: "document",
  icon: CaseIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "metaTitle", type: "string", group: "seo" }),
    defineField({ name: "metaDescription", type: "text", rows: 3, group: "seo" }),

    defineField({
      name: "hero",
      type: "object",
      group: "content",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "logo", type: "figure" }),
        defineField({
          name: "logoMono",
          type: "boolean",
          title: "Render logo monochrome",
          initialValue: false,
        }),
        defineField({ name: "image", type: "figure", title: "Hero photo" }),
        defineField({
          name: "stats",
          type: "array",
          of: [defineArrayMember({ type: "stat" })],
          validation: (r) => r.max(3),
        }),
      ],
    }),

    defineField({
      name: "id",
      title: "ID fact sheet",
      type: "object",
      group: "content",
      fields: [
        defineField({
          name: "customerType",
          type: "array",
          of: [defineArrayMember({ type: "string" })],
        }),
        defineField({ name: "patientsServed", type: "string" }),
        defineField({ name: "location", type: "string" }),
        defineField({
          name: "useCases",
          type: "array",
          of: [defineArrayMember({ type: "string" })],
        }),
      ],
    }),

    defineField({
      name: "overview",
      type: "object",
      group: "content",
      fields: [
        defineField({ name: "title", type: "string", initialValue: "Overview" }),
        defineField({ name: "body", type: "richText" }),
      ],
    }),

    defineField({
      name: "testimonial",
      type: "object",
      group: "content",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({
          name: "panels",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "panel",
              fields: [
                defineField({ name: "label", type: "string" }),
                defineField({ name: "quote", type: "text", rows: 3 }),
                defineField({ name: "avatar", type: "figure" }),
                defineField({ name: "author", type: "string" }),
                defineField({ name: "role", type: "string" }),
              ],
              preview: { select: { title: "author", subtitle: "label" } },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "related",
      title: "Related stories",
      type: "object",
      group: "content",
      fields: [
        defineField({ name: "title", type: "string" }),
        defineField({
          name: "cards",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "relatedCard",
              fields: [
                defineField({
                  name: "story",
                  type: "reference",
                  to: [{ type: "customerStory" }],
                  validation: (r) => r.required(),
                }),
                defineField({
                  name: "title",
                  type: "text",
                  rows: 3,
                  description:
                    "Card title — line breaks are preserved. Falls back to the linked story's title if empty.",
                }),
                defineField({
                  name: "featuredStat",
                  type: "stat",
                  description: "Stat shown on the related card.",
                }),
                defineField({
                  name: "tone",
                  type: "string",
                  options: {
                    list: ["white", "lavender", "outline"],
                    layout: "radio",
                  },
                  initialValue: "white",
                }),
              ],
              preview: {
                select: { title: "story.title", media: "story.hero.logo" },
              },
            }),
          ],
        }),
      ],
    }),
  ],

  preview: {
    select: { title: "title", media: "hero.logo" },
  },
});
