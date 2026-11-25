#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${REPO_ROOT}/dist"
VERSION="$(node -p "require('${REPO_ROOT}/manifest.json').version")"
OUT_ZIP="${DIST_DIR}/corrector-ai-v${VERSION}.zip"

mkdir -p "${DIST_DIR}"
rm -f "${OUT_ZIP}"

cd "${REPO_ROOT}"
zip -r "${OUT_ZIP}" \
  manifest.json \
  LICENSE \
  PRIVACY.md \
  _locales \
  background \
  content \
  core \
  data \
  icons \
  offscreen \
  popup \
  sidepanel

echo "Packaged Chrome Web Store upload archive: ${OUT_ZIP}"
