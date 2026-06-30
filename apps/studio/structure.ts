import type { StructureResolver } from "sanity/structure";

/**
 * Desk structure. Singletons (homePage / aboutPage / customersPage) are pinned
 * as single editable documents; customerStory is a normal document list.
 *
 * Singletons get added in the page-modeling issues; for now only customerStory
 * (the tracer) plus a placeholder for the singletons section.
 */
const SINGLETONS: { id: string; title: string; schemaType: string }[] = [
  { id: "homePage", title: "Home page", schemaType: "homePage" },
  { id: "aboutPage", title: "About page", schemaType: "aboutPage" },
  { id: "customersPage", title: "Customers page", schemaType: "customersPage" },
];

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      ...SINGLETONS.map((s) =>
        S.listItem()
          .title(s.title)
          .id(s.id)
          .child(S.document().schemaType(s.schemaType).documentId(s.id)),
      ),
      ...(SINGLETONS.length ? [S.divider()] : []),
      S.documentTypeListItem("customerStory").title("Customer stories"),
    ]);
