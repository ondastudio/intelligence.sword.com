import { defineType, defineField } from "sanity";
import { LaunchIcon } from "@sanity/icons";

/** cta — a label + destination. href is optional when a storyRef drives it. */
export const cta = defineType({
  name: "cta",
  title: "Call to action",
  type: "object",
  icon: LaunchIcon,
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
