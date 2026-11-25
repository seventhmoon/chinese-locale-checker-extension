/**
 * Local shard loader for Chrome Extension contexts.
 * Reads bundled JSON shards from extension package storage (chrome-extension://) only.
 */

const SHARD_FILES = {
  profiles_and_code: 'data/profiles_and_code.json',
  orthography: 'data/orthography_and_glyphs.json',
  cantonese: 'data/cantonese.json',
  lexicon: 'data/regional_lexicon.json',
  official: 'data/official_translations.json'
};

let cachedShardsPromise = null;

export function loadBundledShards() {
  if (!cachedShardsPromise) {
    cachedShardsPromise = (async () => {
      const entries = await Promise.all(
        Object.entries(SHARD_FILES).map(async ([key, relPath]) => {
          const url = chrome.runtime.getURL(relPath);
          const resp = await fetch(url);
          if (!resp.ok) {
            throw new Error(`Failed to load bundled shard ${relPath}: HTTP ${resp.status}`);
          }
          return [key, await resp.json()];
        })
      );
      return Object.fromEntries(entries);
    })().catch((err) => {
      cachedShardsPromise = null;
      throw err;
    });
  }
  return cachedShardsPromise;
}
