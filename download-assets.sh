#!/usr/bin/env bash
# Downloads the assets exported by the Figma MCP server into ./assets
#
# IMPORTANT: these URLs are temporary — Figma expires them roughly 7 days after
# export (around 22 August 2026). Run this soon. If the links have already
# expired, export the same layers from Figma by hand; the filenames below are
# what the HTML expects.
#
# Everything is pulled from the DESKTOP frames — those are the highest-resolution
# exports, and the CSS scales them down for tablet and mobile.

set -euo pipefail
mkdir -p assets

dl () { echo "  $2"; curl -fsSL "$1" -o "assets/$2"; }
B="https://www.figma.com/api/mcp/asset"

echo "Shared…"
dl "$B/023cdf7d-15bf-4ce0-b537-4bd3975d1be2.svg" "logo-aea.svg"
dl "$B/c1729b09-9d6a-4bb0-b242-9966b70bd6fb.svg" "wordmark.svg"
dl "$B/b0e37453-c419-48bf-a289-a193d749c021.svg" "nav-wordmark.svg"
dl "$B/a60e0983-840d-42e0-934d-b40b1ed2c9d0.svg" "nav-monogram.svg"

echo "Home page…"
dl "$B/a177b6f5-4f6e-45f5-b331-ccaac2bfcd6e.png" "hero.png"
dl "$B/550d23c5-72f8-42e2-a380-2058d72221c6.png" "imarchi-1.png"
dl "$B/13061100-2c2f-42e2-ab0a-46be5ae36e29.png" "imarchi-2.png"
dl "$B/3add0c55-608c-4657-be1b-6d79b0bc3a90.png" "imarchi-3.png"
dl "$B/cbc0ca0b-6fe8-47d2-b616-72a27fbbf52f.png" "solen-voss-1.png"
dl "$B/c76f4afe-d11f-41e9-8a5a-a1f5a9101898.png" "solen-voss-2.png"
dl "$B/2f5deeaa-c0fc-428f-894a-0bd62bb4daac.png" "solen-voss-3.png"

echo "Project page…"
dl "$B/fe57b705-d9e7-4775-b580-142034b66738.svg" "masthead-aea.svg"
dl "$B/595df8e7-9b50-4c70-8733-f1bd44da8787.png" "sv-1.png"
dl "$B/71a8e6b1-38fd-49a7-9e21-65f4fa046c50.png" "sv-2.png"
dl "$B/93bcea8a-e43e-45b9-a3e9-3d3487e7af48.png" "sv-3.png"
dl "$B/6f6770bd-e660-4b80-baaa-1e7341b6b08d.png" "sv-4.png"
dl "$B/913e7847-4f4f-4986-9dbe-4bcbe522aaa5.png" "sv-5.png"
dl "$B/4f605bc8-37c0-4355-b2e2-fedd07345bc9.png" "sv-6.png"
dl "$B/10f2dee1-3253-4a6c-9fec-2e008663f69f.png" "sv-7.png"
dl "$B/acc8bba4-2534-4845-b835-16368ff18563.png" "other-range-crazy.png"
dl "$B/17f1be11-4e80-4708-8357-ea9c67ac58d7.png" "other-madame-fc.png"
dl "$B/1ec7ea3a-1072-4714-9d75-d80f18e91dd7.png" "other-veloce.png"

echo "About page…"
dl "$B/dd458f05-d31c-4f84-ab6f-1a0a049f53dc.svg" "about-masthead.svg"
dl "$B/994a0c35-5a42-4257-ab0f-2dbd5f771ee8.png" "about-portrait.png"
dl "$B/3aea1ba3-b904-4e6e-9955-1d5fbd6ab2fe.svg" "awards.svg"

echo "Done — 25 files in ./assets"
