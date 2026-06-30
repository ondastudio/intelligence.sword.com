import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * aboutPage — the About page (singleton). Named fields per beat (composition
 * stays hardcoded in about.astro); within-beat arrays (story-so-far stats, team
 * members, etc.) are reorderable. Faithful to src/data/about.json; GROQ projects
 * image/video assets back to the shape the About* components consume.
 */

// A run of {text, bold?} segments (the ScrollLetterReveal / body shape).
// Anonymous inline members avoid duplicate named-type registration.
const bodyField = (name: string, title = "Body") =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        fields: [
          defineField({ name: "text", type: "text", rows: 3 }),
          defineField({ name: "bold", type: "boolean", initialValue: false }),
        ],
        preview: { select: { title: "text" } },
      }),
    ],
  });

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({
      name: "hero",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "statement", type: "text", rows: 3 }),
        defineField({ name: "video", type: "videoFile", title: "Manifesto film" }),
      ],
    }),

    defineField({
      name: "story",
      type: "object",
      fields: [
        defineField({
          name: "paragraphs",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              fields: [bodyField("segments", "Segments")],
              preview: { select: { s: "segments.0.text" }, prepare: ({ s }) => ({ title: s }) },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "storySoFar",
      title: "The story so far",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "title", type: "string" }),
        bodyField("body"),
        defineField({
          name: "stats",
          type: "array",
          validation: (r) => r.min(6).max(6),
          of: [
            defineArrayMember({
              type: "object",
              name: "iconStat",
              fields: [
                defineField({ name: "icon", type: "figure" }),
                defineField({ name: "value", type: "string" }),
                defineField({ name: "plus", type: "boolean" }),
                defineField({ name: "label", type: "string" }),
              ],
              preview: { select: { title: "value", subtitle: "label" } },
            }),
          ],
        }),
        defineField({
          name: "trustedBy",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({
              name: "logos",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "logo",
                  fields: [
                    defineField({ name: "image", type: "figure" }),
                    defineField({ name: "width", type: "number" }),
                    defineField({ name: "height", type: "number" }),
                  ],
                  preview: { select: { media: "image" } },
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "operations",
      type: "object",
      fields: [
        defineField({
          name: "intro",
          type: "object",
          fields: [
            defineField({ name: "statement", type: "text", rows: 2 }),
            bodyField("body"),
          ],
        }),
        defineField({
          name: "born",
          type: "object",
          fields: [
            defineField({ name: "statement", type: "text", rows: 2 }),
            bodyField("body"),
            defineField({
              name: "stats",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "plusStat",
                  fields: [
                    defineField({ name: "value", type: "string" }),
                    defineField({ name: "plus", type: "boolean" }),
                    defineField({ name: "label", type: "string" }),
                  ],
                  preview: { select: { title: "value", subtitle: "label" } },
                }),
              ],
            }),
            defineField({
              name: "certs",
              type: "object",
              fields: [
                defineField({ name: "label", type: "string" }),
                defineField({
                  name: "badges",
                  type: "array",
                  of: [
                    defineArrayMember({
                      type: "object",
                      name: "badge",
                      fields: [
                        defineField({ name: "image", type: "figure" }),
                        defineField({ name: "w", type: "number" }),
                        defineField({ name: "h", type: "number" }),
                      ],
                      preview: { select: { media: "image" } },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "cta",
      type: "object",
      fields: [
        defineField({
          name: "heading",
          type: "object",
          fields: [
            defineField({ name: "line1", type: "string" }),
            defineField({ name: "line2", type: "string" }),
          ],
        }),
        defineField({ name: "cta", type: "cta" }),
      ],
    }),

    defineField({ name: "finalCta", type: "styledHeadline" }),

    defineField({
      name: "team",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "title", type: "string" }),
        defineField({
          name: "members",
          type: "array",
          validation: (r) => r.min(1),
          of: [
            defineArrayMember({
              type: "object",
              name: "member",
              fields: [
                defineField({ name: "name", type: "string" }),
                defineField({ name: "role", type: "string" }),
                defineField({ name: "photo", type: "figure" }),
                defineField({ name: "linkedin", type: "url" }),
              ],
              preview: { select: { title: "name", subtitle: "role", media: "photo" } },
            }),
          ],
        }),
      ],
    }),
  ],

  preview: { prepare: () => ({ title: "About page" }) },
});
