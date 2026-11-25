import { SUPPORTED_PROFILES, loadSettings, saveSettings } from '../core/settings.js';
import {
  auditText,
  localizeText,
  lookupTerms,
  applyFix,
  applyAllFixes,
  getSuggestionOptions
} from '../core/zh-audit-engine.js';
import { loadBundledShards } from '../core/shards-loader.js';
import { GeminiNanoManager } from '../core/nano-client.js';

const nanoLocal = new GeminiNanoManager(globalThis);

let shards = null;
let settings = null;
let lastRuleFindings = [];
let lastNanoFindings = [];

// DOM refs
const chkProfile = document.getElementById('chk-profile');
const chkStandard = document.getElementById('chk-standard');
const chkInput = document.getElementById('chk-input');
const btnFixAll = document.getElementById('btn-fix-all');
const btnNanoCheck = document.getElementById('btn-nano-check');
const btnNanoPolish = document.getElementById('btn-nano-polish');
const btnLoadSample = document.getElementById('btn-load-sample');
const btnCopyChk = document.getElementById('btn-copy-chk');
const chkSummary = document.getElementById('chk-summary');
const chkNanoStatus = document.getElementById('chk-nano-status');
const chkResults = document.getElementById('chk-results');

const locStandard = document.getElementById('loc-standard');
const locInput = document.getElementById('loc-input');
const btnLocSample = document.getElementById('btn-loc-sample');
const btnRunLocalize = document.getElementById('btn-run-localize');
const locCarveouts = document.getElementById('loc-carveouts');
const locOutputs = document.getElementById('loc-outputs');

const glossQuery = document.getElementById('gloss-query');
const glossStandard = document.getElementById('gloss-standard');
const glossResults = document.getElementById('gloss-results');

const dictInput = document.getElementById('dict-input');
const btnDictAdd = document.getElementById('btn-dict-add');
const dictList = document.getElementById('dict-list');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach((p) => {
        p.classList.toggle('active', p.id === `tab-${target}`);
      });
    });
  });
}

function runCheckerAudit() {
  const text = chkInput.value;
  if (!text.trim()) {
    lastRuleFindings = [];
    lastNanoFindings = [];
    chkSummary.textContent = 'Enter Chinese or Cantonese text to inspect.';
    btnFixAll.disabled = true;
    chkResults.innerHTML = '';
    return;
  }

  lastRuleFindings = auditText(
    text,
    {
      ...settings,
      profile: chkProfile.value,
      standard: chkStandard.value
    },
    shards
  );
  renderCheckerResults();
}

function renderCheckerResults() {
  const all = [...lastRuleFindings, ...lastNanoFindings].sort((a, b) => a.start - b.start);
  const certainCount = all.filter((f) => f.confidence === 'CERTAIN').length;
  const advisoryCount = all.length - certainCount;

  btnFixAll.disabled = certainCount === 0;
  btnFixAll.textContent = certainCount > 0 ? `Fix All Certain (${certainCount})` : 'Fix All Certain';

  if (all.length === 0) {
    chkSummary.textContent = `✓ Clean for ${chkProfile.value} (${chkStandard.value})`;
    chkResults.innerHTML = `<div class="empty-state">No issues detected for <strong>${escapeHtml(chkProfile.value)}</strong>.</div>`;
    return;
  }

  chkSummary.textContent = `${certainCount} certain • ${advisoryCount} advisory/AI`;
  chkResults.innerHTML = '';

  for (const f of all) {
    const card = document.createElement('div');
    card.className = 'card';

    const pillCls =
      f.source === 'gemini-nano'
        ? 'pill pill-nano'
        : f.confidence === 'CERTAIN'
          ? 'pill pill-certain'
          : 'pill pill-advisory';
    const pillText =
      f.source === 'gemini-nano' ? '✦ Gemini Nano' : f.confidence === 'CERTAIN' ? 'Certain' : 'Advisory';

    card.innerHTML = `
      <div class="issue-head">
        <span style="font-size:11px;color:#64748b;font-weight:600;">L${f.line}:C${f.column} • ${escapeHtml(f.rule_id)}</span>
        <span class="${pillCls}">${pillText}</span>
      </div>
      <div class="diff-line">
        <span class="found-text">${escapeHtml(f.found)}</span>
        <span style="color:#94a3b8;font-weight:700;">→</span>
        <span class="chips"></span>
      </div>
      <p class="rationale">${escapeHtml(f.rationale)}</p>
    `;

    const chips = card.querySelector('.chips');
    for (const opt of getSuggestionOptions(f.suggestion)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = f.source === 'gemini-nano' ? 'sug-btn sug-btn-nano' : 'sug-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        chkInput.value = applyFix(chkInput.value, f, opt);
        lastNanoFindings = [];
        runCheckerAudit();
      });
      chips.appendChild(btn);
    }

    chkResults.appendChild(card);
  }
}

async function runNanoCheckInWorkbench() {
  const text = chkInput.value;
  if (!text.trim()) return;

  btnNanoCheck.disabled = true;
  chkNanoStatus.textContent = '✦ Running local Gemini Nano…';

  try {
    const profileMeta = shards.profiles_and_code.profiles[chkProfile.value];
    const register = settings.register === 'auto' ? profileMeta.default_register : settings.register;

    const res = await nanoLocal.auditText(
      text,
      {
        profile: chkProfile.value,
        register,
        standard: chkStandard.value,
        ignoredTerms: settings.ignoredTerms
      },
      lastRuleFindings,
      shards
    );

    if (res.status === 'ok') {
      lastNanoFindings = res.findings;
      chkNanoStatus.textContent =
        res.findings.length > 0
          ? `✦ Gemini Nano added ${res.findings.length} suggestion(s)`
          : '✦ Gemini Nano: looks natural';
      renderCheckerResults();
    } else {
      chkNanoStatus.textContent = res.detail || `Gemini Nano: ${res.status}`;
    }
  } catch (err) {
    chkNanoStatus.textContent = err?.message || 'Gemini Nano error';
  } finally {
    btnNanoCheck.disabled = false;
  }
}

async function runNanoPolishInWorkbench() {
  const text = chkInput.value;
  if (!text.trim()) return;

  btnNanoPolish.disabled = true;
  chkNanoStatus.textContent = '✦ Polishing locally with Gemini Nano…';

  try {
    const profileMeta = shards.profiles_and_code.profiles[chkProfile.value];
    const register = settings.register === 'auto' ? profileMeta.default_register : settings.register;

    const res = await nanoLocal.polishText(
      text,
      {
        profile: chkProfile.value,
        register,
        standard: chkStandard.value
      },
      shards
    );

    if (res.status === 'ok' && res.text) {
      chkInput.value = res.text;
      lastNanoFindings = [];
      chkNanoStatus.textContent = '✦ Polished locally with Gemini Nano';
      runCheckerAudit();
    } else {
      chkNanoStatus.textContent = res.detail || `Gemini Nano: ${res.status}`;
    }
  } catch (err) {
    chkNanoStatus.textContent = err?.message || 'Gemini Nano error';
  } finally {
    btnNanoPolish.disabled = false;
  }
}

function runLocalizer() {
  const src = locInput.value;
  if (!src.trim()) {
    locCarveouts.innerHTML = '';
    locOutputs.innerHTML = '<div class="empty-state">Enter Chinese text above to localize across profiles.</div>';
    return;
  }

  const targets = ['zh-Hant-HK', 'zh-Hant-MO', 'zh-Hant-TW', 'zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans-MY'];
  const res = localizeText(src, targets, locStandard.value, shards);

  if (res.preserved_carveouts.length > 0) {
    const spans = res.preserved_carveouts.map((c) => `「${escapeHtml(c.span)}」 (${escapeHtml(c.type)})`).join('、');
    locCarveouts.innerHTML = `<div class="carveout-box"><strong>Protected Carve-Outs:</strong> ${spans}</div>`;
  } else {
    locCarveouts.innerHTML = '';
  }

  locOutputs.innerHTML = '';
  for (const [pid, text] of Object.entries(res.localizations)) {
    const card = document.createElement('div');
    card.className = 'locale-card';
    card.innerHTML = `
      <div class="locale-head">
        <span class="locale-tag">${escapeHtml(pid)}</span>
        <button type="button" class="btn" style="padding:2px 7px;font-size:11px;">Copy</button>
      </div>
      <div class="locale-text" lang="${escapeHtml(pid)}">${escapeHtml(text)}</div>
    `;
    const copyBtn = card.querySelector('button');
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
    });
    locOutputs.appendChild(card);
  }
}

function runGlossarySearch() {
  const q = glossQuery.value.trim();
  if (!q) {
    glossResults.innerHTML = '<div class="empty-state">Type an English or Chinese term to compare across HK, MO, TW, CN, SG, MY.</div>';
    return;
  }

  const matches = lookupTerms(q, glossStandard.value, shards);
  if (matches.length === 0) {
    glossResults.innerHTML = `<div class="empty-state">No bundled glossary entry matched "${escapeHtml(q)}".</div>`;
    return;
  }

  glossResults.innerHTML = '';
  for (const item of matches) {
    const card = document.createElement('div');
    card.className = 'card';
    const rows = Object.entries(item.translations)
      .map(([pid, val]) => `<span class="term-prof">${escapeHtml(pid)}</span><span lang="${escapeHtml(pid)}">${escapeHtml(val)}</span>`)
      .join('');
    card.innerHTML = `
      <div class="issue-head">
        <strong>${escapeHtml(item.english)}</strong>
        <span class="pill pill-advisory">${escapeHtml(item.category)}</span>
      </div>
      <div class="term-grid">${rows}</div>
      ${item.notes ? `<p class="rationale" style="margin-top:6px;">${escapeHtml(item.notes)}</p>` : ''}
    `;
    glossResults.appendChild(card);
  }
}

function renderDictionary() {
  const terms = settings.ignoredTerms || [];
  if (terms.length === 0) {
    dictList.innerHTML = '<div class="empty-state" style="width:100%;">No ignored words yet.</div>';
    return;
  }
  dictList.innerHTML = '';
  for (const term of terms) {
    const chip = document.createElement('span');
    chip.className = 'word-chip';
    chip.innerHTML = `<span>${escapeHtml(term)}</span><button type="button" aria-label="Remove">×</button>`;
    chip.querySelector('button').addEventListener('click', async () => {
      settings = await saveSettings({
        ignoredTerms: settings.ignoredTerms.filter((t) => t !== term)
      });
      renderDictionary();
      runCheckerAudit();
    });
    dictList.appendChild(chip);
  }
}

async function consumePendingSelection() {
  if (!chrome.storage?.local) return;
  const data = await chrome.storage.local.get('zhorthoPendingSelection');
  const pending = data.zhorthoPendingSelection;
  if (pending?.text && Date.now() - pending.timestamp < 30000) {
    chkInput.value = pending.text;
    await chrome.storage.local.remove('zhorthoPendingSelection');
    runCheckerAudit();
  }
}

async function init() {
  setupTabs();
  [shards, settings] = await Promise.all([loadBundledShards(), loadSettings()]);

  chkProfile.innerHTML = '';
  for (const p of SUPPORTED_PROFILES) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    chkProfile.appendChild(opt);
  }
  chkProfile.value = settings.profile;
  chkStandard.value = settings.standard;
  locStandard.value = settings.standard;

  renderDictionary();
  runGlossarySearch();
  await consumePendingSelection();

  chkInput.addEventListener('input', () => {
    lastNanoFindings = [];
    runCheckerAudit();
  });
  chkProfile.addEventListener('change', () => {
    lastNanoFindings = [];
    runCheckerAudit();
  });
  chkStandard.addEventListener('change', () => {
    lastNanoFindings = [];
    runCheckerAudit();
  });

  btnFixAll.addEventListener('click', () => {
    const { text } = applyAllFixes(chkInput.value, lastRuleFindings, { certainOnly: true });
    chkInput.value = text;
    lastNanoFindings = [];
    runCheckerAudit();
  });

  btnNanoCheck.addEventListener('click', runNanoCheckInWorkbench);
  btnNanoPolish.addEventListener('click', runNanoPolishInWorkbench);

  btnLoadSample.addEventListener('click', () => {
    chkInput.value =
      '請在系統帳戶群組完成身份驗證，並確認注文確認及税込価格。截止今日必需完成注冊，請稍後！載入中……';
    lastNanoFindings = [];
    runCheckerAudit();
  });

  btnCopyChk.addEventListener('click', async () => {
    if (!chkInput.value) return;
    await navigator.clipboard.writeText(chkInput.value);
    btnCopyChk.textContent = 'Copied!';
    setTimeout(() => { btnCopyChk.textContent = 'Copy'; }, 1200);
  });

  btnLocSample.addEventListener('click', () => {
    locInput.value =
      '請閱讀我們的私隱政策及個人資料收集聲明，或親臨香港中環荷里活道聯絡香港個人資料（私隱）專員公署，查閱《個人資料（私隱）條例》並品嚐冰糖燉雪梨。';
    runLocalizer();
  });
  btnRunLocalize.addEventListener('click', runLocalizer);
  locStandard.addEventListener('change', runLocalizer);

  glossQuery.addEventListener('input', runGlossarySearch);
  glossStandard.addEventListener('change', runGlossarySearch);
  document.querySelectorAll('[data-quick-term]').forEach((btn) => {
    btn.addEventListener('click', () => {
      glossQuery.value = btn.dataset.quickTerm;
      runGlossarySearch();
    });
  });

  btnDictAdd.addEventListener('click', async () => {
    const val = dictInput.value.trim();
    if (!val) return;
    if (!settings.ignoredTerms.includes(val)) {
      settings = await saveSettings({ ignoredTerms: [...settings.ignoredTerms, val] });
    }
    dictInput.value = '';
    renderDictionary();
    runCheckerAudit();
  });

  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.zhorthoSettings?.newValue) {
      settings = changes.zhorthoSettings.newValue;
      renderDictionary();
    }
    if (changes.zhorthoPendingSelection?.newValue?.text) {
      consumePendingSelection();
    }
  });
}

init();
