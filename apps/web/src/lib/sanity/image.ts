/**
 * Image URL builder — turns a Sanity image reference into an optimized CDN URL
 * (auto AVIF/WebP via .auto('format')). Use in place of a raw /public path:
 *   imageUrl(story.hero.image).width(1600).url()
 */
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

export function imageUrl(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}
