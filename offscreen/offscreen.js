/**
 * Offscreen document runner for local Chrome Built-in AI (Gemini Nano).
 *
 * Used automatically as a fallback whenever `LanguageModel` requires a Document
 * context instead of a Service Worker context. Runs 100% locally.
 */

import { GeminiNanoManager } from '../core/nano-client.js';
import { loadBundledShards } from '../core/shards-loader.js';

const nano = new GeminiNanoManager(globalThis);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.target !== 'offscreen') return false;

  (async () => {
    try {
      if (message.type === 'OFFSCREEN_NANO_STATUS') {
        const status = await nano.checkAvailability();
        sendResponse({ ok: true, ...status });
        return;
      }

      if (message.type === 'OFFSCREEN_NANO_AUDIT') {
        const shards = await loadBundledShards();
        const result = await nano.auditText(
          message.text,
          message.options || {},
          message.existingFindings || [],
          shards
        );
        sendResponse({ ok: true, ...result });
        return;
      }

      if (message.type === 'OFFSCREEN_NANO_POLISH') {
        const shards = await loadBundledShards();
        const result = await nano.polishText(
          message.text,
          message.options || {},
          shards
        );
        sendResponse({ ok: true, ...result });
        return;
      }

      sendResponse({ ok: false, error: `Unknown offscreen message type: ${message.type}` });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || String(err) });
    }
  })();

  return true;
});
