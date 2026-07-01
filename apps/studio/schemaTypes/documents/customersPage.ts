import { defineType, defineField, defineArrayMember } from "sanity";
import { UsersIcon } from "@sanity/icons";

/**
 * customersPage — the "Our Customers" index (singleton). title + reorderable
 * rows of reorderable cells, plus the load-more CTA. Rendered by
 * src/pages/customers.astro → sections/Customers.astro.
 */
export const customersPage = defineType({
  name: "customersPage",
  title: "Customers page",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "rows",
      type: "array",
      of: [defineArrayMember({ type: "customerRow" })],
    }),
    defineField({ name: "loadMore", type: "cta", title: "Load more" }),
  ],
  preview: {
    select: { title: "title", rows: "rows.length" },
    prepare: ({ title, rows }) => ({
      title: title || "Customers page",
      subtitle: `${rows ?? 0} row(s)`,
    }),
  },
});
