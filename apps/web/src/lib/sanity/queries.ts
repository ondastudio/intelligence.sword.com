import { sanityClient } from "./client";
import { serializeHeadline } from "./portableText";
import type { PortableTextBlock } from "@portabletext/types";

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
      return rest;
    });
  }
  return page;
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
