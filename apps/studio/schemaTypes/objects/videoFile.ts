import { defineType, defineField } from "sanity";

/**
 * videoFile — an uploaded, web-optimized video (single H.264 mp4; muted,
 * autoplaying background films). Transcode before upload (Sanity does not
 * optimize video) — see apps/web/scripts/transcode-videos.sh. GROQ resolves
 * `asset->url` to feed MediaFrame / ProductVideo a single source.
 *
 * If bandwidth crosses the tripwire (~70 GB/mo), swap the heavy films to a
 * streaming host by replacing the file asset with a `url` here — the section
 * schemas reference this type either way.
 */
export const videoFile = defineType({
  name: "videoFile",
  title: "Video",
  type: "file",
  options: { accept: "video/mp4" },
  fields: [
    defineField({ name: "poster", type: "figure", title: "Poster image" }),
  ],
});
