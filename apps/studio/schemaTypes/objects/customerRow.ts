import { defineType, defineField, defineArrayMember } from "sanity";
import { StackCompactIcon } from "@sanity/icons";

/**
 * customerRow — one masonry row. `layout` selects the column template in
 * Customers.astro (full / half / third / logo-wide / wide-third); `cells` are
 * the cards in that row (reorderable).
 */
export const customerRow = defineType({
  name: "customerRow",
  title: "Row",
  type: "object",
  icon: StackCompactIcon,
  fields: [
    defineField({
      name: "layout",
      type: "string",
      options: {
        list: ["full", "half", "third", "logo-wide", "wide-third"],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "cells",
      type: "array",
      of: [defineArrayMember({ type: "storyCell" })],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { layout: "layout", c0: "cells.0.type", count: "cells.length" },
    prepare: ({ layout, count }) => ({
      title: layout,
      subtitle: `${count ?? 0} card(s)`,
    }),
  },
});
