import { SectionField } from "../../components/SectionField";

/**
 * withSection — mark a top-level object field as a collapsible page "section".
 *
 * Merges the SectionField chrome (bold header + collapse toggle) and the
 * collapsible options onto a field config. Sections are expanded by default; a
 * caller can override by passing `options.collapsed` / `components.field`.
 *
 * Apply only to object-type fields that represent a page beat — not to leaf
 * fields (string/slug/styledHeadline), which have no inner form to collapse.
 *
 *   defineField(withSection({ name: "hero", type: "object", group: "top", fields: [...] }))
 */
export const withSection = <T extends Record<string, any>>(field: T): T =>
  ({
    ...field,
    options: { collapsible: true, collapsed: false, ...(field.options ?? {}) },
    components: { field: SectionField, ...(field.components ?? {}) },
  }) as T;
