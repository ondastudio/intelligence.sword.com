#!/usr/bin/env bash
# Transcode heavy hero films to web-optimized H.264 mp4 (issue 4).
#
# Levers that matter for these muted, autoplaying background films:
#   - downscale to 1080p (manifesto ships as 4K — pointless for a bg video)
#   - strip audio (-an); the films are always muted
#   - CRF 30, faststart for progressive playback
#
# Single optimized mp4 per video (universal playback) — the Sanity-fed
# components use one <source>, dropping the old webm+mp4 pairing.
#
# Run from apps/web:  bash scripts/transcode-videos.sh
set -euo pipefail
cd "$(dirname "$0")/../public"

opt() { # src
  local src="$1"
  local tmp="${src%.mp4}.opt.mp4"
  echo "transcoding $src ($(du -h "$src" | cut -f1)) ..."
  ffmpeg -y -loglevel error -i "$src" \
    -vf "scale='min(1920,iw)':-2" \
    -c:v libx264 -crf 30 -preset medium -movflags +faststart \
    -an -pix_fmt yuv420p "$tmp"
  mv "$tmp" "$src"
  echo "  → $(du -h "$src" | cut -f1)"
}

opt about/manifesto.mp4
opt intro/product.mp4

# Care + triage card videos: transcode each .webm → an .mp4 sibling. Sanity URLs
# are content-hashed, so the old .webm→.mp4 basename fallback can't work there —
# we migrate a single optimized mp4 per video instead.
for f in care/*.webm triage/*.webm; do
  out="${f%.webm}.mp4"
  echo "transcoding $f ($(du -h "$f" | cut -f1)) → mp4 ..."
  ffmpeg -y -loglevel error -i "$f" \
    -vf "scale='min(1920,iw)':-2" \
    -c:v libx264 -crf 28 -preset medium -movflags +faststart \
    -an -pix_fmt yuv420p "$out"
done
echo "done."
