import { defineType, defineField } from "sanity";

/** stat — a value + label pair (hero stats, ID sheet, related-card stat). */
export const stat = defineType({
  name: "stat",
  title: "Stat",
  type: "object",
  fields: [
    defineField({
      name: "value",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "value", subtitle: "label" },
  },
});
