/**
 * Corrector Ai — Manifest V3 Background Service Worker.
 *
 * Handles:
 * - Local settings persistence (chrome.storage.local)
 * - Context menu actions (inspect selection in Side Panel)
 * - Deterministic rule fallback execution
 * - Local Chrome Built-in AI (Gemini Nano) routing (direct in SW or via Offscreen document)
 *
 * Zero external network calls — all processing is strictly local.
 */

import { loadSettings, saveSettings } from '../core/settings.js';
import { auditText, localizeText, lookupTerms } from '../core/zh-audit-engine.js';
import { loadBundledShards } from '../core/shards-loader.js';
import { GeminiNanoManager, getPromptApiProvider } from '../core/nano-client.js';

const nano = new GeminiNanoManager(globalThis);
const OFFSCREEN_URL = 'offscreen/offscreen.html';
let offscreenCreating = null;

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) return false;
  const existingContexts = await chrome.runtime.getContexts?.({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)]
  });
  if (existingContexts && existingContexts.length > 0) {
    return true;
  }

  if (offscreenCreating) {
    await offscreenCreating;
    return true;
  }

  offscreenCreating = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['DOM_SCRAPING'],
    justification: 'Run Chrome Built-in AI (Gemini Nano) locally in a document context when unavailable in service worker.'
  });
  try {
    await offscreenCreating;
    return true;
  } finally {
    offscreenCreating = null;
  }
}

async function queryOffscreen(payload) {
  const ready = await ensureOffscreenDocument();
  if (!ready) {
    return {
      ok: false,
      status: 'unavailable',
      api: 'none',
      detail: 'Chrome Built-in AI (LanguageModel) is not available in this Chrome version.'
    };
  }
  return chrome.runtime.sendMessage({ ...payload, target: 'offscreen' });
}

async function getNanoStatus() {
  const provider = getPromptApiProvider(globalThis);
  if (provider.kind !== 'none') {
    const res = await nano.checkAvailability();
    return { ok: true, ...res };
  }
  return queryOffscreen({ type: 'OFFSCREEN_NANO_STATUS' });
}

async function runNanoAudit(text, options, existingFindings) {
  const provider = getPromptApiProvider(globalThis);
  if (provider.kind !== 'none') {
    const shards = await loadBundledShards();
    const res = await nano.auditText(text, options, existingFindings, shards);
    return { ok: true, ...res };
  }
  return queryOffscreen({
    type: 'OFFSCREEN_NANO_AUDIT',
    text,
    options,
    existingFindings
  });
}

async function runNanoPolish(text, options) {
  const provider = getPromptApiProvider(globalThis);
  if (provider.kind !== 'none') {
    const shards = await loadBundledShards();
    const res = await nano.polishText(text, options, shards);
    return { ok: true, ...res };
  }
  return queryOffscreen({
    type: 'OFFSCREEN_NANO_POLISH',
    text,
    options
  });
}

// Register context menus on install / startup
function setupContextMenus() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'corrector-ai-check-selection',
      title: 'Check Chinese / Cantonese with Corrector Ai',
      contexts: ['selection', 'editable']
    });
    chrome.contextMenus.create({
      id: 'corrector-ai-open-sidepanel',
      title: 'Open Corrector Ai Workbench (Localizer & Glossary)',
      contexts: ['page', 'selection', 'editable']
    });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadSettings();
  setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  // Call sidePanel.open synchronously BEFORE any await to preserve Chrome's transient user gesture!
  const openSidePanelSync = () => {
    if (!chrome.sidePanel?.open) return Promise.resolve();
    if (tab?.id) {
      return chrome.sidePanel.open({ tabId: tab.id }).catch(() => {
        if (tab?.windowId) {
          return chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
        }
      });
    }
    if (tab?.windowId) {
      return chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
    }
    return Promise.resolve();
  };

  if (info.menuItemId === 'corrector-ai-check-selection') {
    const openPromise = openSidePanelSync();
    if (info.selectionText) {
      chrome.storage.local.set({
        correctorAiPendingSelection: {
          text: info.selectionText,
          timestamp: Date.now()
        }
      });
    }
    void openPromise;
  } else if (info.menuItemId === 'corrector-ai-open-sidepanel') {
    void openSidePanelSync();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.target === 'offscreen') return false;
  if (sender?.id && sender.id !== chrome.runtime.id) return false;

  (async () => {
    try {
      switch (message.type) {
        case 'GET_SETTINGS': {
          const settings = await loadSettings();
          sendResponse({ ok: true, settings });
          return;
        }
        case 'SAVE_SETTINGS': {
          const settings = await saveSettings(message.settings || {});
          sendResponse({ ok: true, settings });
          return;
        }
        case 'ADD_IGNORED_TERM': {
          const term = String(message.term || '').trim();
          const current = await loadSettings();
          if (term && !current.ignoredTerms.includes(term)) {
            const next = await saveSettings({
              ignoredTerms: [...current.ignoredTerms, term]
            });
            sendResponse({ ok: true, settings: next });
          } else {
            sendResponse({ ok: true, settings: current });
          }
          return;
        }
        case 'GET_SHARDS': {
          const shards = await loadBundledShards();
          sendResponse({ ok: true, shards });
          return;
        }
        case 'AUDIT_TEXT': {
          const shards = await loadBundledShards();
          const settings = message.options || (await loadSettings());
          const findings = auditText(message.text || '', settings, shards);
          sendResponse({ ok: true, findings });
          return;
        }
        case 'LOCALIZE_TEXT': {
          const shards = await loadBundledShards();
          const result = localizeText(
            message.text || '',
            message.targetProfiles || ['zh-Hant-HK', 'zh-Hant-TW', 'zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans-MY'],
            message.standard || 'ui',
            shards
          );
          sendResponse({ ok: true, result });
          return;
        }
        case 'LOOKUP_TERMS': {
          const shards = await loadBundledShards();
          const results = lookupTerms(message.query || '', message.standard || 'official', shards);
          sendResponse({ ok: true, results });
          return;
        }
        case 'NANO_STATUS': {
          const status = await getNanoStatus();
          sendResponse(status);
          return;
        }
        case 'NANO_AUDIT': {
          const settings = await loadSettings();
          if (!settings.useGeminiNano && !message.force) {
            sendResponse({ ok: true, findings: [], status: 'disabled' });
            return;
          }
          const options = {
            profile: message.options?.profile || settings.profile,
            register: message.options?.register || settings.register,
            standard: message.options?.standard || settings.standard,
            ignoredTerms: settings.ignoredTerms
          };
          const res = await runNanoAudit(
            message.text || '',
            options,
            message.existingFindings || []
          );
          sendResponse(res);
          return;
        }
        case 'NANO_POLISH': {
          const settings = await loadSettings();
          const options = {
            profile: message.options?.profile || settings.profile,
            register: message.options?.register || settings.register,
            standard: message.options?.standard || settings.standard
          };
          const res = await runNanoPolish(message.text || '', options);
          sendResponse(res);
          return;
        }
        case 'OPEN_SIDEPANEL': {
          const tabId = message.tabId || sender?.tab?.id;
          const windowId = message.windowId || sender?.tab?.windowId;
          if (chrome.sidePanel?.open) {
            if (tabId) {
              await chrome.sidePanel.open({ tabId });
            } else if (windowId) {
              await chrome.sidePanel.open({ windowId });
            }
          }
          sendResponse({ ok: true });
          return;
        }
        default:
          sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || String(err) });
    }
  })();

  return true;
});
