import { sanityClient } from "./client";
import { imageUrl } from "./image";
import { serializeHeadline } from "./portableText";
import type { PortableTextBlock } from "@portabletext/types";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET;

/**
 * Flatten Sanity asset objects back to URL strings in place, preserving all
 * other structure (sibling alts, nested arrays). Lets us store a section's JSON
 * faithfully (paths → asset refs) and render it with its original shape — no
 * per-section GROQ projection needed.
 */
function resolveAssets(node: any): any {
  if (Array.isArray(node)) return node.map(resolveAssets);
  if (node && typeof node === "object") {
    if (node._type === "image" && node.asset?._ref) {
      return imageUrl(node).url();
    }
    if (node._type === "file" && node.asset?._ref) {
      const m = /^file-([a-f0-9]+)-(\w+)$/.exec(node.asset._ref);
      return m
        ? `https://cdn.sanity.io/files/${projectId}/${dataset}/${m[1]}.${m[2]}`
        : undefined;
    }
    const out: any = {};
    for (const k in node) out[k] = resolveAssets(node[k]);
    return out;
  }
  return node;
}

/**
 * Home page. Faithful section objects stored as-is in the homePage singleton;
 * we resolve asset refs → URLs post-fetch so the existing section components
 * consume their current shape unchanged. Memoized (every home section + the
 * page share one fetch).
 */
let homePromise: Promise<any> | null = null;

export function getHomePage() {
  return (homePromise ??= sanityClient
    .fetch<any>(`*[_type == "homePage"][0]`)
    .then((doc) => (doc ? resolveAssets(doc) : null)));
}

/**
 * customerStory queries. GROQ resolves asset URLs + related references so the
 * page only has to serialize the Overview Portable Text into the `paragraphs`
 * (HTML strings) that CustomerStory.astro already consumes.
 */
const STORY_PROJECTION = /* groq */ `{
  title, metaTitle, metaDescription,
  hero{
    eyebrow,
    "logo": logo.asset->url, "logoAlt": logo.alt, logoMono,
    "image": image.asset->url, "imageAlt": image.alt,
    stats[]{value, label}
  },
  id{customerType, patientsServed, location, useCases},
  overview{title, body},
  testimonial{
    eyebrow,
    "activeTab": panels[0].label,
    panels[]{label, quote, "avatar": avatar.asset->url, "avatarAlt": avatar.alt, author, role}
  },
  related{
    title,
    "seeAll": {"label": "See all stories", "href": "/customers"},
    "cards": cards[]{
      "type": "story",
      tone,
      "logo": story->hero.logo.asset->url,
      "logoAlt": story->hero.logo.alt,
      "title": story->title,
      "stat": featuredStat{value, label},
      "cta": {"label": "Read more", "href": "/customers/" + story->slug.current}
    }
  }
}`;

/**
 * Customers index page. GROQ resolves image URLs + the story-link slug; we then
 * fold the slug into each cell's CTA href so ui/StoryCard.astro gets its current
 * flat shape unchanged.
 */
export async function getCustomersPage() {
  const page = await sanityClient.fetch<any>(`*[_type == "customersPage"][0]{
    title, loadMore,
    rows[]{
      _key, layout,
      cells[]{
        type, tone, title, statWidth, quote, author, role, logoClass,
        "logo": logo.asset->url, "logoAlt": logo.alt,
        "photo": photo.asset->url, "photoAlt": photo.alt,
        stat, stats[]{value, label},
        cta, ctas,
        "storySlug": storyRef->slug.current
      }
    }
  }`);
  if (!page) return null;
  for (const row of page.rows ?? []) {
    row.cells = (row.cells ?? []).map((cell: any) => {
      const { storySlug, ...rest } = cell;
      if (storySlug && rest.cta) {
        rest.cta = { ...rest.cta, href: `/customers/${storySlug}` };
      }
      // GROQ returns null for absent fields; strip them so StoryCard's prop
      // defaults apply (Astro defaults only kick in for undefined, not null —
      // e.g. logoClass → its max-h-[48.97px] cap).
      return Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v != null),
      );
    });
  }
  return page;
}

/**
 * About page. Memoized so the six About* components + the page share one fetch.
 * Reshaped to the exact src/data/about.json shape the components consume.
 */
let aboutPromise: Promise<any> | null = null;

async function fetchAbout() {
  const a = await sanityClient.fetch<any>(`*[_type == "aboutPage"][0]{
    hero{ eyebrow, statement, "videoUrl": video.asset->url },
    story{ paragraphs[]{ segments[]{text, bold} } },
    storySoFar{
      eyebrow, title, body[]{text, bold},
      stats[]{ "icon": icon.asset->url, value, plus, label },
      trustedBy{ label, logos[]{ "src": image.asset->url, "alt": image.alt, width, height } }
    },
    operations{
      intro{ statement, body[]{text, bold} },
      born{
        statement, body[]{text, bold},
        stats[]{ value, plus, label },
        certs{ label, badges[]{ "src": image.asset->url, "alt": image.alt, w, h } }
      }
    },
    cta, finalCta,
    team{ eyebrow, title, members[]{ name, role, "photo": photo.asset->url, linkedin } }
  }`);
  if (!a) return null;
  return {
    ...a,
    hero: {
      eyebrow: a.hero.eyebrow,
      statement: a.hero.statement,
      media: { src: a.hero.videoUrl, alt: "Sword Intelligence manifesto film" },
    },
    story: {
      // [[{text,bold}]] — one inner array of segments per paragraph.
      paragraphs: (a.story?.paragraphs ?? []).map((p: any) => p.segments ?? []),
    },
  };
}

export function getAboutPage() {
  return (aboutPromise ??= fetchAbout());
}

export async function getCustomerStorySlugs(): Promise<string[]> {
  return sanityClient.fetch(
    `*[_type == "customerStory" && defined(slug.current)].slug.current`,
  );
}

type RawStory = {
  overview: { title: string; body?: PortableTextBlock[] };
  [k: string]: unknown;
};

/** Fetch one story and shape it exactly as CustomerStory.astro expects. */
export async function getCustomerStory(slug: string) {
  const story = await sanityClient.fetch<RawStory | null>(
    `*[_type == "customerStory" && slug.current == $slug][0]${STORY_PROJECTION}`,
    { slug },
  );
  if (!story) return null;
  return {
    ...story,
    overview: {
      title: story.overview.title,
      // One block → one paragraph of inline HTML (no <p>; the component wraps it).
      paragraphs: (story.overview.body ?? []).map((block) =>
        serializeHeadline([block]),
      ),
    },
  };
}
