/**
 * One-off: sync main's copy edits (post-merge) into the live Sanity dataset,
 * since home/about now render from Sanity, not the JSON main edited.
 *
 * Guarded + idempotent: each change only applies when the *old* value is still
 * present, so re-running is safe and editor changes aren't clobbered. Patches
 * every homePage/aboutPage doc (published + drafts).
 *
 *   node --env-file=.env.local scripts/sync-main-content.mjs
 *
 * NOT synced (trivial, left for manual Studio edits):
 *  - clinical-layer closing-segment punctuation
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) { console.error("Missing SANITY_API_WRITE_TOKEN"); process.exit(1); }

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-10-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const docs = await client.fetch(`*[_type in ["homePage","aboutPage"]]`);

for (const doc of docs) {
  const set = {};
  const isHome = doc._type === "homePage";

  // --- /book-an-intro → /book (all CTA hrefs) ---
  const fixHref = (path, cur) => { if (cur === "/book-an-intro") set[path] = "/book"; };
  if (isHome) {
    fixHref("cta.cta.href", doc.cta?.cta?.href);
    fixHref("numbers.cta.href", doc.numbers?.cta?.href);
    fixHref("triageCta.cta.href", doc.triageCta?.cta?.href);
  } else {
    fixHref("cta.cta.href", doc.cta?.cta?.href);
  }

  if (isHome) {
    // --- hero: eyebrow scroll anchor retarget + headline period ---
    if (doc.hero?.eyebrow?.href === "#numbers") set["hero.eyebrow.href"] = "#scaling";
    if (doc.hero?.eyebrow?.hrefMobile === "#numbers-intake") set["hero.eyebrow.hrefMobile"] = "#scaling-heading";
    if (doc.hero?.headline === "The clinical intelligence behind your care operations")
      set["hero.headline"] = "The clinical intelligence behind your care operations.";

    // --- numbers: drop trailing period on workdays label ---
    if (doc.numbers?.stats?.workdays?.label === "Admin workdays saved in one year.")
      set["numbers.stats.workdays.label"] = "Admin workdays saved in one year";

    // --- care: subheading ':' → '.' ---
    if (doc.care?.subheading === "Here's what they can do for you and your patients:")
      set["care.subheading"] = "Here's what they can do for you and your patients.";

    // --- care banner (PT): reword, keep the strong mark ---
    const b = doc.care?.banner?.text;
    if (Array.isArray(b) && b[0]?.children?.[0]?.text?.includes("99% of the busywork")) {
      const blk = structuredClone(b[0]);
      blk.children[0].text = "AI handles most of the busywork. Your care teams stay in control, owning the interactions and decisions that ";
      if (blk.children[1]) blk.children[1].text = "only humans can.";
      set["care.banner.text"] = [blk];
    }

    // --- platform: audits label ---
    if (doc.platform?.audits?.label === "Full audits") set["platform.audits.label"] = "Full Auditability";

    // --- scaling: Sword Health → Sword ---
    if (doc.scaling?.eyebrow?.includes("Sword Health"))
      set["scaling.eyebrow"] = doc.scaling.eyebrow.replaceAll("Sword Health", "Sword");
    if (doc.scaling?.body?.includes("Sword Health"))
      set["scaling.body"] = doc.scaling.body.replaceAll("Sword Health", "Sword");

    // --- clinical layer: remove step "05 Clinical data foundation" ---
    if (Array.isArray(doc.clinicalLayer?.steps) && doc.clinicalLayer.steps.some((s) => s?.num === "05"))
      set["clinicalLayer.steps"] = doc.clinicalLayer.steps.filter((s) => s?.num !== "05");

    // --- triage: card headline reworded + fully highlighted (main's restructure) ---
    const ch = doc.triage?.card?.headline;
    if (Array.isArray(ch) && ch[0]?.children?.[0]?.text?.includes("Health Triage line")) {
      const blk = structuredClone(ch[0]);
      blk.children = [{ ...blk.children[0], text: "Guide every patient to the right care.", marks: ["highlight"] }];
      set["triage.card.headline"] = [blk];
    }

    // --- triage: "predicts DNAs" → "predicts no-shows" (surgical span text) ---
    const cards = doc.triage?.orchestration?.cards;
    if (Array.isArray(cards)) {
      let touched = false;
      const next = structuredClone(cards);
      for (const card of next)
        for (const pt of card?.points ?? [])
          for (const blk of pt?.content ?? [])
            for (const span of blk?.children ?? [])
              if (typeof span?.text === "string" && span.text.includes("predicts DNAs")) {
                span.text = span.text.replace("predicts DNAs", "predicts no-shows");
                touched = true;
              }
      if (touched) set["triage.orchestration.cards"] = next;
    }
  }

  const keys = Object.keys(set);
  if (!keys.length) { console.log(`${doc._id}: nothing to change`); continue; }
  await client.patch(doc._id).set(set).commit();
  console.log(`${doc._id}: set ${keys.length} field(s) → ${keys.join(", ")}`);
}
console.log("done");
