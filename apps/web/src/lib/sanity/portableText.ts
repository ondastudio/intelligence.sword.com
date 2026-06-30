/**
 * Portable Text → HTML serializers, shared by every Sanity-fed field.
 *
 * Two shapes, one set of mark rules:
 *   - serializeHeadline() renders an inline run (no wrapping <p>) for the
 *     `styledHeadline` type — styles/lists are disabled in the schema, so a
 *     headline is one block of spans with `highlight` / `strong` decorators and
 *     editor soft-breaks (\n → <br />).
 *   - serializeRichText() renders block prose (<p> per block) for body copy like
 *     the customer-story Overview, preserving inline links + strong.
 *
 * Mark conventions match the hand-written markup we are replacing:
 *   highlight → <span class="text-brand">      (Triage/Care purple accent)
 *   strong    → <strong class="font-semibold"> (CustomerStory overview)
 *   link      → <a class="underline" target rel>
 */
import { toHTML, type PortableTextComponents } from "@portabletext/to-html";
import type { PortableTextBlock } from "@portabletext/types";

const marks: PortableTextComponents["marks"] = {
  highlight: ({ children }) => `<span class="text-brand">${children}</span>`,
  strong: ({ children }) => `<strong class="font-semibold">${children}</strong>`,
  em: ({ children }) => `<em>${children}</em>`,
  link: ({ children, value }) => {
    const href = (value as { href?: string })?.href ?? "#";
    const external = /^https?:\/\//.test(href);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}" class="underline"${rel}>${children}</a>`;
  },
};

// Editor soft-breaks (Shift+Enter → "\n" inside a span) become <br />.
const hardBreak = () => "<br />";

/** Inline HTML for a single-line styled headline (no <p> wrapper). */
export function serializeHeadline(
  value: PortableTextBlock | PortableTextBlock[] | undefined | null,
): string {
  if (!value) return "";
  return toHTML(value, {
    components: {
      marks,
      hardBreak,
      block: { normal: ({ children }) => `${children}` },
    },
  });
}

/** Block-level HTML for body prose (<p> per block, inline links/strong kept). */
export function serializeRichText(
  value: PortableTextBlock[] | undefined | null,
): string {
  if (!value) return "";
  return toHTML(value, {
    components: {
      marks,
      hardBreak,
      block: { normal: ({ children }) => `<p>${children}</p>` },
    },
  });
}
