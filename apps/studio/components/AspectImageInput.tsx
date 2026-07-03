import styled from "styled-components";
import type { ImageInputProps } from "sanity";

/**
 * AspectImageInput — the default Sanity image input, but the uploaded preview
 * thumbnail keeps the asset's natural aspect ratio instead of being stretched to
 * fill a fixed box. We force `object-fit: contain` + `height: auto` on the
 * preview `img`, and cap its height so a large source asset doesn't dominate the
 * form. Small `icon` fields additionally cap the width at 150px.
 *
 * Scoped to the preview `img` only, so the upload controls (SVG-icon buttons)
 * keep their normal layout — just the thumbnail respects its real dimensions.
 */
const Aspect = styled.div<{ $maxWidth: string }>`
  & img {
    object-fit: contain !important;
    width: auto !important;
    height: auto !important;
    max-width: ${(p) => p.$maxWidth};
    max-height: 260px;
  }
`;

/** Factory: build an input capped at `maxWidth` (default 100% of the field). */
export const aspectImageInput =
  (maxWidth = "100%") =>
  (props: ImageInputProps) =>
    <Aspect $maxWidth={maxWidth}>{props.renderDefault(props)}</Aspect>;

/** Default aspect-respecting input for regular image fields. */
export const AspectImageInput = aspectImageInput();

/** Compact variant for small icon fields (preview capped at 150px wide). */
export const CompactImageInput = aspectImageInput("150px");
