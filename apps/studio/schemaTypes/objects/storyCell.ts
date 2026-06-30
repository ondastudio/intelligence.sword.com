import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * storyCell — one editorial card in the Customers masonry. Heterogeneous by
 * `type`: highlighted / story (logo+title+stat+cta), quote (pull-quote+author),
 * logo (logo only). Content is curated inline; a cell that links to a detail
 * page sets `storyRef` (drives the CTA href — no brittle slug strings). GROQ
 * projects this back to the flat shape ui/StoryCard.astro spreads.
 */
export const storyCell = defineType({
  name: "storyCell",
  title: "Card",
  type: "object",
  fields: [
    defineField({
      name: "type",
      type: "string",
      options: {
        list: ["highlighted", "story", "quote", "logo"],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tone",
      type: "string",
      options: { list: ["white", "lavender", "outline"] },
    }),
    defineField({ name: "logo", type: "figure" }),
    defineField({
      name: "logoClass",
      type: "string",
      description: "Optional CSS override (e.g. full-colour logos).",
    }),
    defineField({
      name: "title",
      type: "text",
      rows: 3,
      description: "Line breaks are preserved.",
    }),
    // story cells use a single stat; highlighted cells use several.
    defineField({ name: "stat", type: "stat" }),
    defineField({ name: "statWidth", type: "string" }),
    defineField({
      name: "stats",
      type: "array",
      of: [defineArrayMember({ type: "stat" })],
    }),
    // quote cells
    defineField({ name: "quote", type: "text", rows: 3 }),
    defineField({ name: "author", type: "string" }),
    defineField({ name: "role", type: "string" }),
    // optional photo panel
    defineField({ name: "photo", type: "figure" }),
    // links — one or several; storyRef wins for the destination if set.
    defineField({
      name: "storyRef",
      title: "Linked story",
      type: "reference",
      to: [{ type: "customerStory" }],
      description: "Optional — sets the CTA destination from the story slug.",
    }),
    defineField({ name: "cta", type: "cta" }),
    defineField({
      name: "ctas",
      type: "array",
      of: [defineArrayMember({ type: "cta" })],
    }),
  ],
  preview: {
    select: { type: "type", title: "title", author: "author", media: "logo" },
    prepare: ({ type, title, author, media }) => ({
      title: title || author || `(${type})`,
      subtitle: type,
      media,
    }),
  },
});
