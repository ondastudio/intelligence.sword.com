import { defineType, defineField } from "sanity";

/**
 * figure — an image with required alt text. Used everywhere a /public image
 * path lives today (logos, hero photos, avatars). GROQ projects this back to
 * { url, alt } so section components keep their current shape.
 */
export const figure = defineType({
  name: "figure",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      type: "string",
      title: "Alt text",
      validation: (r) => r.required(),
    }),
  ],
});
