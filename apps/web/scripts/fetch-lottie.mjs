/**
 * Pre-build step: mirror Sanity-hosted dotLottie assets into /public/lottie so
 * they're served same-origin.
 *
 * Why: editors upload .lottie files to Sanity (file assets), but the
 * dotlottie-web player loads them via fetch() and Sanity's file CDN sends no
 * CORS header for file assets — a cross-origin .lottie is blocked and the canvas
 * renders blank. Downloading them server-side (no CORS at build) into /public
 * lets resolveAssets() point the player at /lottie/<hash>.lottie instead.
 *
 * Runs before `astro build` / `astro dev` (see package.json). Idempotent.
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;
if (!projectId || !dataset) {
  console.error("[fetch-lottie] missing PUBLIC_SANITY_PROJECT_ID / DATASET — skipping.");
  process.exit(0);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

const outDir = resolve(process.cwd(), "public/lottie");
mkdirSync(outDir, { recursive: true });

const assets = await client.fetch(
  `*[_type == "sanity.fileAsset" && extension == "lottie"]{ url }`,
);

let pulled = 0;
for (const a of assets) {
  if (!a.url) continue;
  const dest = resolve(outDir, basename(a.url)); // <sha1>.lottie
  if (existsSync(dest)) continue; // content-hashed name → immutable, cache hit
  const res = await fetch(a.url);
  if (!res.ok) {
    console.error(`[fetch-lottie] ${res.status} for ${a.url}`);
    continue;
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  pulled++;
}
console.log(
  `[fetch-lottie] ${assets.length} lottie asset(s), ${pulled} downloaded → public/lottie/`,
);
