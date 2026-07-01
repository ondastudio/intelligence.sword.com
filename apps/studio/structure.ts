import type { StructureResolver } from "sanity/structure";
import {
  HomeIcon,
  InfoOutlineIcon,
  UsersIcon,
  DocumentsIcon,
} from "@sanity/icons";

/**
 * Desk structure. Singletons (homePage / aboutPage / customersPage) are pinned
 * as single editable documents (locked in sanity.config.ts document.actions);
 * customerStory is a normal document list.
 */
const SINGLETONS: {
  id: string;
  title: string;
  schemaType: string;
  icon: typeof HomeIcon;
}[] = [
  { id: "homePage", title: "Home page", schemaType: "homePage", icon: HomeIcon },
  { id: "aboutPage", title: "About page", schemaType: "aboutPage", icon: InfoOutlineIcon },
  { id: "customersPage", title: "Customers page", schemaType: "customersPage", icon: UsersIcon },
];

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      ...SINGLETONS.map((s) =>
        S.listItem()
          .title(s.title)
          .id(s.id)
          .icon(s.icon)
          .child(
            S.document()
              .schemaType(s.schemaType)
              .documentId(s.id)
              .title(s.title),
          ),
      ),
      S.divider(),
      S.documentTypeListItem("customerStory")
        .title("Customer stories")
        .icon(DocumentsIcon),
    ]);
