import { defineConfig, buildLegacyTheme } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { SparklesIcon } from "@sanity/icons";
import { schemaTypes } from "./schemaTypes";
import { deskStructure } from "./structure";

/** Singletons — one editable document each; can't be created/deleted/duplicated. */
const SINGLETON_TYPES = new Set(["homePage", "aboutPage", "customersPage"]);
const SINGLETON_ACTIONS = new Set(["publish", "discardChanges", "restore"]);

/**
 * Brand-purple chrome (#7700ee) so the Studio reads as Sword, not stock Sanity.
 * buildLegacyTheme keeps us on zero extra deps while restyling accents/focus.
 */
const brand = "#7700ee";
const theme = buildLegacyTheme({
  "--brand-primary": brand,
  "--default-button-primary-color": brand,
  "--focus-color": brand,
  "--main-navigation-color": "#141414",
  "--main-navigation-color--inverted": "#ffffff",
  "--state-info-color": brand,
});

export default defineConfig({
  name: "default",
  title: "Sword Intelligence",
  icon: SparklesIcon,

  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  theme,

  plugins: [structureTool({ structure: deskStructure }), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Strip create/delete/duplicate/unpublish from singleton documents.
    actions: (prev, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? prev.filter((a) => a.action && SINGLETON_ACTIONS.has(a.action))
        : prev,
    // Keep singletons out of the global "＋ New" menu.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter((t) => !SINGLETON_TYPES.has(t.templateId))
        : prev,
  },
});
