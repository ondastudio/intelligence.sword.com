/**
 * Sanity client for build-time GROQ fetches (the site is fully static — content
 * is read at build, refreshed by a rebuild webhook on publish).
 *
 * Perspective is env-driven so the same code serves both contexts:
 *   - production build  → SANITY_PERSPECTIVE unset/"published"  (live content)
 *   - Netlify preview   → SANITY_PERSPECTIVE="previewDrafts"    (unpublished)
 *
 * Required env: PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET.
 * Optional:     SANITY_API_READ_TOKEN (needed only for drafts/previewDrafts),
 *               SANITY_PERSPECTIVE.
 */
import { createClient } from "@sanity/client";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET;
const perspective = import.meta.env.SANITY_PERSPECTIVE ?? "published";
const token = import.meta.env.SANITY_API_READ_TOKEN; // only required for drafts

if (!projectId || !dataset) {
  throw new Error(
    "Missing Sanity env: set PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET (.env).",
  );
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  // Drafts must bypass the CDN; published content uses it for speed.
  useCdn: perspective === "published",
  perspective: perspective as "published" | "previewDrafts",
  token,
});
