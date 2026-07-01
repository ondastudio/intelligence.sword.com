/**
 * One-off: seed homePage.order + swirlEndSection on the live dataset so editors
 * see a pre-filled, draggable Section-order list (Sanity initialValue only
 * applies to *new* docs). Non-destructive: setIfMissing never overwrites values
 * an editor may already have set. Patches every homePage doc id (published +
 * any draft). Safe to run more than once.
 *
 *   node --env-file=.env.local scripts/seed-home-order.mjs
 */
import { createClient } from "@sanity/client";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error("Missing SANITY_API_WRITE_TOKEN");
  process.exit(1);
}

// Must match SECTION_ORDER in apps/studio/schemaTypes/documents/homePage.ts.
const KEYS = [
  "hero", "intro", "care", "triage", "triageCta", "platform",
  "trust", "operations", "numbers", "clinicalLayer", "scaling", "cta",
];

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  token,
  useCdn: false,
  perspective: "raw", // include drafts
});

const docs = await client.fetch(`*[_type == "homePage"]{ _id, order }`);
if (!docs.length) {
  console.error("No homePage document found.");
  process.exit(1);
}

for (const doc of docs) {
  // Preserve any existing (possibly editor-arranged) items, then append the
  // canonical keys that are missing so the list is complete. Non-destructive.
  const existing = Array.isArray(doc.order) ? doc.order : [];
  const present = new Set(existing.map((o) => o?.key).filter(Boolean));
  const appended = KEYS.filter((k) => !present.has(k)).map((key) => ({
    _type: "sectionRef",
    _key: key,
    key,
  }));
  const order = [...existing, ...appended];

  const res = await client
    .patch(doc._id)
    .set({ order })
    .setIfMissing({ swirlEndSection: "care" })
    .commit();
  const seeded = Array.isArray(res.order) ? res.order.map((o) => o.key) : [];
  console.log(
    `patched ${doc._id} → +${appended.length} appended, order[${seeded.length}] = [${seeded.join(", ")}], swirlEndSection=${res.swirlEndSection}`,
  );
}
console.log("done");
