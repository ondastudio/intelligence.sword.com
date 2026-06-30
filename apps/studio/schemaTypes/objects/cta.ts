import { defineType, defineField } from "sanity";

/** cta — a label + destination. href is optional when a storyRef drives it. */
export const cta = defineType({
  name: "cta",
  title: "Call to action",
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "href", type: "string" }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});
