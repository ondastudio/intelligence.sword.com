/**
 * Idempotent migration: src/data/*.json → Sanity.
 *
 * Two passes:
 *   1. Upload every referenced /public asset once, building a path→assetId map
 *      (cached, so re-runs never duplicate).
 *   2. Build documents (deterministic _id per slug → createOrReplace), converting
 *      Overview HTML paragraphs to Portable Text and wiring related → references.
 *
 * Usage:
 *   node --experimental-strip-types scripts/migrate.ts --dry-run   # emit JSON, no network
 *   node --experimental-strip-types scripts/migrate.ts             # upload + import
 *
 * Env (non-dry-run): PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET,
 *                    SANITY_API_WRITE_TOKEN
 *
 * v1 scope: customerStory. The singleton pages (home/about/customers) extend the
 * `builders` map in later issues.
 */
import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DRY = process.argv.includes("--dry-run");

// ---------- HTML (inline) → Portable Text ------------------------------------

type Span = { _type: "span"; _key: string; text: string; marks: string[] };
type MarkDef = { _type: "link"; _key: string; href: string };
type Block = {
  _type: "block";
  _key: string;
  style: "normal";
  markDefs: MarkDef[];
  children: Span[];
};

const TOKEN =
  /<a\b[^>]*\bhref="([^"]*)"[^>]*>(.*?)<\/a>|<strong\b[^>]*>(.*?)<\/strong>|<em\b[^>]*>(.*?)<\/em>/gis;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Convert one HTML paragraph string into a Portable Text block. */
function htmlToBlock(html: string, key: string): Block {
  const children: Span[] = [];
  const markDefs: MarkDef[] = [];
  let i = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  const pushText = (text: string, marks: string[]) => {
    if (!text) return;
    children.push({
      _type: "span",
      _key: `${key}s${i++}`,
      text: decode(text),
      marks,
    });
  };

  while ((m = TOKEN.exec(html)) !== null) {
    pushText(html.slice(last, m.index), []);
    if (m[1] !== undefined) {
      const def: MarkDef = { _type: "link", _key: `${key}l${i}`, href: m[1] };
      markDefs.push(def);
      pushText(m[2], [def._key]);
    } else if (m[3] !== undefined) {
      pushText(m[3], ["strong"]);
    } else if (m[4] !== undefined) {
      pushText(m[4], ["em"]);
    }
    last = TOKEN.lastIndex;
  }
  pushText(html.slice(last), []);

  return { _type: "block", _key: key, style: "normal", markDefs, children };
}

const htmlToRichText = (paragraphs: string[]): Block[] =>
  paragraphs.map((p, idx) => htmlToBlock(p, `b${idx}`));

/** Sanity requires a unique _key on every array-of-objects item. */
const withKeys = <T extends object>(
  arr: T[] | undefined,
  prefix: string,
): (T & { _key: string })[] =>
  (arr ?? []).map((item, i) => ({ _key: `${prefix}${i}`, ...item }));

// ---------- asset upload (pass 1) --------------------------------------------

type AnyClient = {
  assets: {
    upload: (
      kind: "image" | "file",
      data: Buffer,
      opts: { filename: string },
    ) => Promise<{ _id: string }>;
  };
  createOrReplace: (doc: unknown) => Promise<unknown>;
};

const assetCache = new Map<string, string>();

async function uploadAsset(
  client: AnyClient | null,
  publicPath: string,
  kind: "image" | "file" = "image",
): Promise<string> {
  if (assetCache.has(publicPath)) return assetCache.get(publicPath)!;
  let id: string;
  if (DRY || !client) {
    // Deterministic placeholder so dry-run output is stable + diffable.
    id = `${kind}-DRYRUN-${basename(publicPath).replace(/[^a-z0-9]/gi, "_")}`;
  } else {
    const buf = readFileSync(resolve(ROOT, "public", publicPath.replace(/^\//, "")));
    const res = await client.assets.upload(kind, buf, {
      filename: basename(publicPath),
    });
    id = res._id;
  }
  assetCache.set(publicPath, id);
  return id;
}

/** A videoFile reference (uploads the optimized mp4 as a Sanity file asset). */
async function video(client: AnyClient | null, path: string | undefined) {
  if (!path) return undefined;
  return {
    _type: "file",
    asset: { _type: "reference", _ref: await uploadAsset(client, path, "file") },
  };
}

async function figure(
  client: AnyClient | null,
  path: string | undefined,
  alt: string | undefined,
) {
  if (!path) return undefined;
  return {
    _type: "image",
    alt: alt ?? "",
    asset: { _type: "reference", _ref: await uploadAsset(client, path) },
  };
}

// ---------- customerStory builder (pass 2) -----------------------------------

async function buildCustomerStories(client: AnyClient | null) {
  const data = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/customer-stories.json"), "utf8"),
  ) as Record<string, any>;

  const validSlugs = new Set(Object.keys(data));
  const docs = [];
  for (const [slug, s] of Object.entries(data)) {
    docs.push({
      _id: `customerStory.${slug}`,
      _type: "customerStory",
      title: s.title,
      slug: { _type: "slug", current: slug },
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      hero: {
        eyebrow: s.hero?.eyebrow,
        logo: await figure(client, s.hero?.logo, s.hero?.logoAlt),
        logoMono: s.hero?.logoMono ?? false,
        image: await figure(client, s.hero?.image, s.hero?.imageAlt),
        stats: withKeys(s.hero?.stats, "st"),
      },
      id: s.id,
      overview: {
        title: s.overview?.title ?? "Overview",
        body: htmlToRichText(s.overview?.paragraphs ?? []),
      },
      testimonial: s.testimonial
        ? {
            eyebrow: s.testimonial.eyebrow,
            panels: await Promise.all(
              (s.testimonial.panels ?? []).map(async (p: any, idx: number) => ({
                _type: "panel",
                _key: `p${idx}`,
                label: p.label,
                quote: p.quote,
                avatar: await figure(client, p.avatar, p.avatarAlt),
                author: p.author,
                role: p.role,
              })),
            ),
          }
        : undefined,
      related: s.related
        ? {
            title: s.related.title,
            cards: (s.related.cards ?? [])
              .map((c: any, idx: number) => {
                const targetSlug = (c.cta?.href ?? "").replace(
                  /^\/customers\//,
                  "",
                );
                if (!validSlugs.has(targetSlug)) {
                  console.error(
                    `  skip related card in "${slug}" → "${c.cta?.href}" (not a customerStory)`,
                  );
                  return null;
                }
                return {
                  _type: "relatedCard",
                  _key: `rc${idx}`,
                  // Weak: a loose "see also" link, and avoids create-order coupling.
                  story: {
                    _type: "reference",
                    _ref: `customerStory.${targetSlug}`,
                    _weak: true,
                  },
                  featuredStat: c.stat,
                  tone: c.tone ?? "white",
                };
              })
              .filter(Boolean),
          }
        : undefined,
    });
  }
  return docs;
}

// ---------- customersPage builder (singleton) --------------------------------

async function buildCustomersPage(client: AnyClient | null) {
  const data = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/customers.json"), "utf8"),
  ) as any;
  const validSlugs = new Set(
    Object.keys(
      JSON.parse(
        readFileSync(resolve(ROOT, "src/data/customer-stories.json"), "utf8"),
      ),
    ),
  );

  const buildCell = async (cell: any, key: string) => {
    const out: any = { _key: key, ...cell };
    if (cell.logo) out.logo = await figure(client, cell.logo, cell.logoAlt);
    if (cell.photo) out.photo = await figure(client, cell.photo, cell.photoAlt);
    delete out.logoAlt; // alt now lives inside the figure
    delete out.photoAlt;
    if (cell.stats) out.stats = withKeys(cell.stats, `${key}st`);
    if (cell.ctas) out.ctas = withKeys(cell.ctas, `${key}c`);
    // Link a story by reference when a cell points at a /customers/<slug> page.
    const href = cell.cta?.href ?? cell.ctas?.[0]?.href;
    const slug = (href ?? "").replace(/^\/customers\//, "");
    if (validSlugs.has(slug)) {
      out.storyRef = {
        _type: "reference",
        _ref: `customerStory.${slug}`,
        _weak: true,
      };
    }
    return out;
  };

  const rows = await Promise.all(
    (data.rows ?? []).map(async (row: any, ri: number) => ({
      _key: `r${ri}`,
      layout: row.layout,
      cells: await Promise.all(
        (row.cells ?? []).map((c: any, ci: number) =>
          buildCell(c, `r${ri}c${ci}`),
        ),
      ),
    })),
  );

  return {
    _id: "customersPage",
    _type: "customersPage",
    title: data.title,
    rows,
    loadMore: data.loadMore,
  };
}

// ---------- aboutPage builder (singleton) ------------------------------------

async function buildAboutPage(client: AnyClient | null) {
  const a = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/about.json"), "utf8"),
  ) as any;

  // A {text, bold} run with keys.
  const body = (arr: any[] | undefined, prefix: string) =>
    withKeys(
      (arr ?? []).map((s: any) => ({ text: s.text, bold: !!s.bold })),
      prefix,
    );

  const iconStats = await Promise.all(
    (a.storySoFar.stats ?? []).map(async (s: any, i: number) => ({
      _key: `ss${i}`,
      icon: await figure(client, s.icon, s.label),
      value: s.value,
      plus: !!s.plus,
      label: s.label,
    })),
  );
  const logos = await Promise.all(
    (a.storySoFar.trustedBy?.logos ?? []).map(async (l: any, i: number) => ({
      _key: `lg${i}`,
      image: await figure(client, l.src, l.alt),
      width: l.width,
      height: l.height,
    })),
  );
  const badges = await Promise.all(
    (a.operations.born.certs?.badges ?? []).map(async (b: any, i: number) => ({
      _key: `bd${i}`,
      image: await figure(client, b.src, b.alt),
      w: b.w,
      h: b.h,
    })),
  );
  const members = await Promise.all(
    (a.team.members ?? []).map(async (m: any, i: number) => ({
      _key: `m${i}`,
      name: m.name,
      role: m.role,
      photo: await figure(client, m.photo, m.name),
      linkedin: m.linkedin,
    })),
  );

  return {
    _id: "aboutPage",
    _type: "aboutPage",
    hero: {
      eyebrow: a.hero.eyebrow,
      statement: a.hero.statement,
      video: await video(client, a.hero.media?.src),
    },
    story: {
      paragraphs: withKeys(
        (a.story.paragraphs ?? []).map((p: any, i: number) => ({
          segments: body(p, `p${i}s`),
        })),
        "p",
      ),
    },
    storySoFar: {
      eyebrow: a.storySoFar.eyebrow,
      title: a.storySoFar.title,
      body: body(a.storySoFar.body, "ssb"),
      stats: iconStats,
      trustedBy: { label: a.storySoFar.trustedBy?.label, logos },
    },
    operations: {
      intro: {
        statement: a.operations.intro.statement,
        body: body(a.operations.intro.body, "ib"),
      },
      born: {
        statement: a.operations.born.statement,
        body: body(a.operations.born.body, "bb"),
        stats: withKeys(
          (a.operations.born.stats ?? []).map((s: any) => ({
            value: s.value,
            plus: !!s.plus,
            label: s.label,
          })),
          "obs",
        ),
        certs: { label: a.operations.born.certs?.label, badges },
      },
    },
    cta: a.cta,
    finalCta: a.finalCta,
    team: { eyebrow: a.team.eyebrow, title: a.team.title, members },
  };
}

// ---------- runner -----------------------------------------------------------

async function main() {
  let client: AnyClient | null = null;
  if (!DRY) {
    const { createClient } = await import("@sanity/client");
    const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.PUBLIC_SANITY_DATASET;
    const token = process.env.SANITY_API_WRITE_TOKEN;
    if (!projectId || !dataset || !token) {
      throw new Error(
        "Set PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN (or pass --dry-run).",
      );
    }
    client = createClient({
      projectId,
      dataset,
      token,
      apiVersion: "2024-10-01",
      useCdn: false,
    }) as unknown as AnyClient;
  }

  const docs = [
    ...(await buildCustomerStories(client)),
    await buildCustomersPage(client),
    await buildAboutPage(client),
  ];

  if (DRY) {
    console.log(JSON.stringify(docs, null, 2));
    console.error(`\n[dry-run] built ${docs.length} docs (no upload).`);
    return;
  }

  // One transaction → atomic + cross-references resolve together.
  const tx = (client as any).transaction();
  for (const doc of docs) tx.createOrReplace(doc);
  await tx.commit();
  for (const doc of docs) console.error(`upserted ${doc._id}`);
  console.error(`\nMigrated ${docs.length} docs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
