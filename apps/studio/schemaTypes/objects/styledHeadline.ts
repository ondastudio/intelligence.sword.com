import { defineType, defineArrayMember } from "sanity";

/**
 * styledHeadline — a single-line rich headline. Styles and lists are disabled,
 * so editors only get inline marks: "Highlight" (purple accent) and "Strong".
 * Forced line breaks are authored as soft breaks (Shift+Enter → \n → <br/>).
 * Rendered by src/lib/sanity/portableText.ts → serializeHeadline().
 */
export const styledHeadline = defineType({
  name: "styledHeadline",
  title: "Headline",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [], // no h1/h2/blockquote — it's one inline run
      lists: [],
      marks: {
        decorators: [
          { title: "Highlight", value: "highlight" },
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [],
      },
    }),
  ],
});
