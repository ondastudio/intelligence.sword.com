import styled from "styled-components";
import type { ImageInputProps } from "sanity";

/**
 * CompactImageInput — the default Sanity image input, but the uploaded preview
 * thumbnail is capped at 150px. Applied to small `icon` image fields so a large
 * source asset doesn't render as a full-width preview in the form.
 *
 * We scope the cap to `img` only, so the upload controls (SVG-icon buttons) keep
 * their normal width — just the preview shrinks.
 */
const Compact = styled.div`
  & img {
    max-width: 150px;
    height: auto;
  }
`;

export function CompactImageInput(props: ImageInputProps) {
  return <Compact>{props.renderDefault(props)}</Compact>;
}
