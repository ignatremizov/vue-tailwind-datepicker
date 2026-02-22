#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${1:-http://127.0.0.1:5173/}"
PLAYWRIGHT_PAYLOAD="${ROOT_DIR}/scripts/generate-doc-wheel-videos.playwright.js"
OUTPUT_DIR="${ROOT_DIR}/docs/assets/screenshots/animations"
VIDEO_FPS="${VIDEO_FPS:-60}"
VIDEO_SCALE_WIDTH="${VIDEO_SCALE_WIDTH:-0}"
VIDEO_CRF="${VIDEO_CRF:-16}"

if [[ ! -f "${PLAYWRIGHT_PAYLOAD}" ]]; then
  echo "Missing payload script: ${PLAYWRIGHT_PAYLOAD}" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to generate MP4 videos." >&2
  exit 1
fi

if command -v playwright-cli >/dev/null 2>&1; then
  PWCLI=(playwright-cli)
elif [[ -x "${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh" ]]; then
  PWCLI=("${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh")
else
  echo "playwright-cli is not available." >&2
  echo "Install/enable the local playwright-cli wrapper, then re-run." >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"

cd "${ROOT_DIR}"
echo "Opening browser session against ${BASE_URL}"
"${PWCLI[@]}" open "${BASE_URL}" >/dev/null

echo "Recording animation scenarios..."
RUN_OUTPUT="$("${PWCLI[@]}" run-code "$(cat "${PLAYWRIGHT_PAYLOAD}")" 2>&1)"
printf '%s\n' "${RUN_OUTPUT}"
if printf '%s\n' "${RUN_OUTPUT}" | grep -q "^### Error"; then
  echo "Video scenario capture failed." >&2
  exit 1
fi

RESULT_JSON="$(printf '%s\n' "${RUN_OUTPUT}" | awk '/^### Result/{getline; print; exit}')"
if [[ -z "${RESULT_JSON}" ]]; then
  echo "Failed to parse capture result JSON." >&2
  exit 1
fi

SCENARIO_LINES="$(node -e 'const data=JSON.parse(process.argv[1]); for (const c of (data.captures||[])) console.log(`${c.name}\t${c.path||""}`);' "${RESULT_JSON}")"
if [[ -z "${SCENARIO_LINES}" ]]; then
  echo "No capture scenarios returned from recorder." >&2
  exit 1
fi

echo "Encoding MP4 files..."
while IFS=$'\t' read -r name path; do
  if [[ -z "${name}" || -z "${path}" ]]; then
    echo "Skipping invalid scenario entry: name='${name}' path='${path}'" >&2
    continue
  fi
  if [[ ! -f "${path}" ]]; then
    echo "Recorded video missing for scenario '${name}': ${path}" >&2
    exit 1
  fi

  output_path="${OUTPUT_DIR}/${name}.mp4"
  video_filter="fps=${VIDEO_FPS}"
  if [[ "${VIDEO_SCALE_WIDTH}" != "0" ]]; then
    video_filter="${video_filter},scale=${VIDEO_SCALE_WIDTH}:-2:flags=lanczos"
  else
    video_filter="${video_filter},scale=trunc(iw/2)*2:trunc(ih/2)*2"
  fi
  video_filter="${video_filter},format=yuv420p"

  ffmpeg -y \
    -nostdin \
    -i "${path}" \
    -vf "${video_filter}" \
    -c:v libx264 \
    -preset slow \
    -crf "${VIDEO_CRF}" \
    -movflags +faststart \
    "${output_path}" >/dev/null 2>&1
done <<< "${SCENARIO_LINES}"

echo "Done. Animation MP4 files updated in docs/assets/screenshots/animations/"
