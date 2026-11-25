#!/usr/bin/env bash
set -euo pipefail

# Sync the five modular JSON reference shards from a local checkout of
# seventhmoon/chinese-locale-and-orthography into data/.
#
# Usage:
#   bash scripts/sync-skill-data.sh /path/to/chinese-locale-and-orthography

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC_REPO="${1:-../chinese-locale-and-orthography}"

if [[ ! -d "${SRC_REPO}/references" ]]; then
  echo "Error: references/ directory not found at '${SRC_REPO}/references'." >&2
  echo "Usage: bash scripts/sync-skill-data.sh /path/to/chinese-locale-and-orthography" >&2
  exit 1
fi

SHARDS=(
  "profiles_and_code.json"
  "orthography_and_glyphs.json"
  "cantonese.json"
  "regional_lexicon.json"
  "official_translations.json"
)

for shard in "${SHARDS[@]}"; do
  cp "${SRC_REPO}/references/${shard}" "${REPO_ROOT}/data/${shard}"
  echo "Synced data/${shard}"
done

echo "Done. Run 'npm test' to verify parity."
