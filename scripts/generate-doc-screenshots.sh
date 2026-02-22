#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${1:-http://127.0.0.1:4180/}"
PLAYWRIGHT_PAYLOAD="${ROOT_DIR}/scripts/generate-doc-screenshots.playwright.js"
export DOC_SCREENSHOT_VIEWPORT_WIDTH="${DOC_SCREENSHOT_VIEWPORT_WIDTH:-1800}"
export DOC_SCREENSHOT_VIEWPORT_HEIGHT="${DOC_SCREENSHOT_VIEWPORT_HEIGHT:-1300}"
export DOC_SCREENSHOT_DEVICE_SCALE="${DOC_SCREENSHOT_DEVICE_SCALE:-2}"
export DOC_SCREENSHOT_ZOOM="${DOC_SCREENSHOT_ZOOM:-1.0}"

if [[ ! -f "${PLAYWRIGHT_PAYLOAD}" ]]; then
  echo "Missing payload script: ${PLAYWRIGHT_PAYLOAD}" >&2
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

cd "${ROOT_DIR}"
mkdir -p docs/assets/screenshots
mkdir -p docs/assets/screenshots/context

echo "Opening browser session against ${BASE_URL}"
"${PWCLI[@]}" open "${BASE_URL}" >/dev/null

echo "Generating docs screenshots..."
echo "Screenshot quality: viewport=${DOC_SCREENSHOT_VIEWPORT_WIDTH}x${DOC_SCREENSHOT_VIEWPORT_HEIGHT}, dpr=${DOC_SCREENSHOT_DEVICE_SCALE}, zoom=${DOC_SCREENSHOT_ZOOM}"
RUN_CODE="$(cat "${PLAYWRIGHT_PAYLOAD}")"
RUN_CODE="${RUN_CODE//__DOC_SCREENSHOT_VIEWPORT_WIDTH__/${DOC_SCREENSHOT_VIEWPORT_WIDTH}}"
RUN_CODE="${RUN_CODE//__DOC_SCREENSHOT_VIEWPORT_HEIGHT__/${DOC_SCREENSHOT_VIEWPORT_HEIGHT}}"
RUN_CODE="${RUN_CODE//__DOC_SCREENSHOT_DEVICE_SCALE__/${DOC_SCREENSHOT_DEVICE_SCALE}}"
RUN_CODE="${RUN_CODE//__DOC_SCREENSHOT_ZOOM__/${DOC_SCREENSHOT_ZOOM}}"
RUN_OUTPUT="$("${PWCLI[@]}" run-code "${RUN_CODE}" 2>&1)"
printf '%s\n' "${RUN_OUTPUT}"
if printf '%s\n' "${RUN_OUTPUT}" | grep -q "^### Error"; then
  echo "Screenshot generation failed." >&2
  exit 1
fi

echo "Done. Screenshots updated in docs/assets/screenshots/"
