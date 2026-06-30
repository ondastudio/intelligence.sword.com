import { defineType, defineArrayMember } from "sanity";

/**
 * richText — body prose (customer-story Overview, etc.). Normal paragraphs with
 * inline Strong/Emphasis and links. Rendered by serializeRichText().
 */
export const richText = defineType({
  name: "richText",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              {
                name: "href",
                type: "url",
                title: "URL",
                validation: (r) =>
                  r.uri({ scheme: ["http", "https", "mailto", "tel"] }),
              },
            ],
          },
        ],
      },
    }),
  ],
});
