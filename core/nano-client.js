/**
 * Local Chrome Built-in AI (Gemini Nano) Prompt API client.
 *
 * Uses Chrome's on-device `LanguageModel` API (Chrome 138+ stable for Extensions),
 * with compatibility fallback for legacy `ai.languageModel`.
 *
 * Strictly on-device: zero network calls, zero API keys, zero cloud egress.
 */

import { hasCJK, offsetToLineCol } from './zh-audit-engine.js';

const NANO_AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          found: { type: 'string' },
          suggestion: { type: 'string' },
          category: {
            type: 'string',
            enum: ['grammar', 'typo', 'word_choice', 'register', 'collocation', 'punctuation']
          },
          rationale: { type: 'string' }
        },
        required: ['found', 'suggestion', 'category', 'rationale']
      }
    }
  },
  required: ['issues']
};

/**
 * Resolve whichever Prompt API surface is exposed in the current Chrome build.
 */
export function getPromptApiProvider(globalObj = globalThis) {
  if (globalObj?.LanguageModel && typeof globalObj.LanguageModel.availability === 'function') {
    return { kind: 'LanguageModel', api: globalObj.LanguageModel };
  }
  if (globalObj?.ai?.languageModel && typeof globalObj.ai.languageModel.capabilities === 'function') {
    return { kind: 'ai.languageModel', api: globalObj.ai.languageModel };
  }
  return { kind: 'none', api: null };
}

/**
 * Check on-device Gemini Nano availability without triggering a download.
 */
export async function checkNanoAvailability(globalObj = globalThis) {
  const provider = getPromptApiProvider(globalObj);
  if (provider.kind === 'none') {
    return {
      status: 'unavailable',
      api: 'none',
      detail: 'Chrome Built-in AI Prompt API (LanguageModel) not detected. Requires Chrome 138+ desktop.'
    };
  }

  try {
    if (provider.kind === 'LanguageModel') {
      const rawStatus = await provider.api.availability();
      // Chrome 138+ returns 'available' | 'downloadable' | 'downloading' | 'unavailable'
      // Earlier builds returned 'readily' | 'after-download' | 'no'
      const normalized = normalizeAvailability(rawStatus);
      return {
        status: normalized,
        api: 'LanguageModel',
        detail: describeAvailability(normalized)
      };
    }

    const caps = await provider.api.capabilities();
    const normalized = normalizeAvailability(caps?.available);
    return {
      status: normalized,
      api: 'ai.languageModel',
      detail: describeAvailability(normalized)
    };
  } catch (err) {
    return {
      status: 'unavailable',
      api: provider.kind,
      detail: err?.message || 'Unable to query Chrome Built-in AI availability.'
    };
  }
}

export function normalizeAvailability(raw) {
  switch (String(raw || '').toLowerCase()) {
    case 'available':
    case 'readily':
      return 'available';
    case 'downloadable':
    case 'after-download':
      return 'downloadable';
    case 'downloading':
      return 'downloading';
    default:
      return 'unavailable';
  }
}

function describeAvailability(status) {
  switch (status) {
    case 'available':
      return 'Gemini Nano is ready on this device (100% local).';
    case 'downloadable':
      return 'Gemini Nano is supported and ready to download on-device. Click "Prepare Model" to start.';
    case 'downloading':
      return 'Gemini Nano model is downloading in Chrome…';
    default:
      return 'Gemini Nano is unavailable on this browser/device. Enable chrome://flags/#prompt-api-for-gemini-nano and check chrome://on-device-internals.';
  }
}

export function buildAuditSystemPrompt({ profile = 'zh-Hant-HK', register = 'formal_swc', standard = 'ui', profileMeta = null }) {
  const scriptDesc = profileMeta?.script === 'Hans' ? 'Simplified Chinese (Hans)' : 'Traditional Chinese (Hant)';
  const glyphDesc = profileMeta?.glyph_standard || (profile.includes('TW') ? 'TW_MOE' : profile.includes('Hans') ? 'CN_TGH' : 'HK_EDB');
  const regDesc = register === 'colloquial_yue'
    ? 'Written Cantonese (粵文 / colloquial_yue)'
    : 'Formal Standard Written Chinese (書面語 / formal_swc)';
  const stdDesc = standard === 'official'
    ? 'Official / Educational authority (HK EDB, TW MoE, PRC TGH, LSHK 正字, W3C clreq)'
    : 'Commercial Software UI style guide (natural commercial HK/TW/CN UX copy)';

  return [
    'You are a strict local Chinese and Cantonese proofreading assistant.',
    `Target profile: ${profile} (${scriptDesc}, glyph standard: ${glyphDesc}).`,
    `Target register: ${regDesc}.`,
    `Normative standard: ${stdDesc}.`,
    'Your task: inspect the user text for genuine contextual grammar errors, wrong homophones or characters (e.g. 在/再, 的/得/地, 發/髮, 乾/幹/干, 復/複, 做/作, 帳/賬), unnatural regional wording, or register mismatches.',
    'Rules:',
    '1. Return ONLY a JSON object {"issues": [...]}. If the text is already natural and correct, return {"issues": []}.',
    '2. Every "found" value MUST be an exact short substring copied verbatim from the input text (1 to 18 characters).',
    '3. Every "suggestion" MUST be a concrete replacement string different from "found".',
    '4. Do NOT alter proper nouns, domestic agency names, street names (e.g. 荷里活道), book/statute titles 《…》, or culinary names (e.g. 冰糖燉雪梨).',
    '5. Keep "rationale" concise (under 18 words) explaining why the fix is needed.',
    '6. Be conservative: never invent stylistic rewrites when the original text is already correct.'
  ].join('\n');
}

export function buildAuditUserPrompt(text, existingFindings = []) {
  const existingNote = existingFindings.length > 0
    ? `\nAlready flagged by deterministic rules (do not repeat these spans): ${existingFindings
        .slice(0, 12)
        .map((f) => `"${f.found}"`)
        .join(', ')}`
    : '';
  return `Proofread the following text strictly for the target Chinese/Cantonese profile:${existingNote}\n\nTEXT:\n${text}`;
}

/**
 * Parse raw JSON or fenced JSON returned by Gemini Nano into an array of raw issue items.
 */
export function parseNanoIssuesResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(candidate);
  if (!parsed) {
    const objStart = candidate.indexOf('{');
    const objEnd = candidate.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
      parsed = tryParse(candidate.slice(objStart, objEnd + 1));
    }
  }
  if (!parsed) {
    const arrStart = candidate.indexOf('[');
    const arrEnd = candidate.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd > arrStart) {
      parsed = tryParse(candidate.slice(arrStart, arrEnd + 1));
    }
  }

  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.issues)) return parsed.issues;
  return [];
}

/**
 * Validate and map Gemini Nano issues onto exact text spans, filtering hallucinations,
 * carve-outs, and overlaps with deterministic rule findings.
 */
export function validateNanoFindings(rawIssues, text, options = {}, existingFindings = [], shards = null) {
  if (!Array.isArray(rawIssues) || !text) return [];

  const ignoredTerms = new Set(options.ignoredTerms || []);
  const profileId = options.profile || 'zh-Hant-HK';
  const register = options.register || 'formal_swc';
  const standard = options.standard || 'ui';

  // Mark occupied ranges from deterministic rule findings & carve-outs
  const blocked = new Uint8Array(text.length);
  for (const f of existingFindings) {
    for (let i = Math.max(0, f.start); i < Math.min(text.length, f.end); i++) {
      blocked[i] = 1;
    }
  }

  // Block 《…》 titles and preserved carve-outs from AI rewrites
  for (const m of text.matchAll(/《[^》]+》/g)) {
    for (let i = m.index; i < m.index + m[0].length; i++) blocked[i] = 1;
  }
  if (shards?.official?.preserved_carveouts) {
    for (const item of shards.official.preserved_carveouts) {
      for (const span of [item.span_hant, item.span_hans]) {
        if (!span) continue;
        let p = 0;
        while ((p = text.indexOf(span, p)) !== -1) {
          for (let i = p; i < p + span.length; i++) blocked[i] = 1;
          p += span.length;
        }
      }
    }
  }

  const results = [];
  const validCategories = new Set(['grammar', 'typo', 'word_choice', 'register', 'collocation', 'punctuation']);

  for (const item of rawIssues) {
    if (!item || typeof item !== 'object') continue;
    const found = typeof item.found === 'string' ? item.found.trim() : '';
    const suggestion = typeof item.suggestion === 'string' ? item.suggestion.trim() : '';
    const rationale = typeof item.rationale === 'string' ? item.rationale.trim() : 'Suggested by local Gemini Nano.';
    const rawCat = typeof item.category === 'string' ? item.category.trim().toLowerCase() : 'grammar';
    const category = validCategories.has(rawCat) ? `nano_${rawCat}` : 'nano_grammar';

    if (!found || !suggestion || found === suggestion) continue;
    if (found.length > 24 || suggestion.length > 36) continue;
    if (ignoredTerms.has(found)) continue;

    // Locate first non-blocked exact match in text
    let searchFrom = 0;
    let matchedIndex = -1;
    while (true) {
      const idx = text.indexOf(found, searchFrom);
      if (idx === -1) break;
      let overlaps = false;
      for (let i = idx; i < idx + found.length; i++) {
        if (blocked[i]) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        matchedIndex = idx;
        break;
      }
      searchFrom = idx + 1;
    }

    if (matchedIndex === -1) continue;

    const end = matchedIndex + found.length;
    for (let i = matchedIndex; i < end; i++) blocked[i] = 1;

    const { line, column } = offsetToLineCol(text, matchedIndex);
    results.push({
      id: `NANO_${rawCat.toUpperCase()}:${matchedIndex}:${end}`,
      start: matchedIndex,
      end,
      line,
      column,
      rule_id: `GEMINI_NANO_${rawCat.toUpperCase()}`,
      confidence: 'CONTEXT_DEPENDENT',
      severity: 'MEDIUM',
      category,
      found,
      suggestion,
      rationale,
      source: 'gemini-nano',
      profile: profileId,
      register,
      standard
    });
  }

  return results;
}

/**
 * Stateful session manager for on-device Gemini Nano inference.
 */
export class GeminiNanoManager {
  constructor(globalObj = globalThis) {
    this.globalObj = globalObj;
    this.baseSession = null;
    this.baseSessionKey = null;
  }

  async checkAvailability() {
    return checkNanoAvailability(this.globalObj);
  }

  async _createSession(systemPrompt, onProgress = null, signal = undefined) {
    const provider = getPromptApiProvider(this.globalObj);
    if (provider.kind === 'none') {
      throw new Error('Chrome Built-in AI (LanguageModel) is not available in this browser.');
    }

    const monitor = (m) => {
      if (typeof onProgress === 'function' && m && typeof m.addEventListener === 'function') {
        m.addEventListener('downloadprogress', (e) => {
          const pct = typeof e.loaded === 'number'
            ? (e.total && e.total > 0 ? Math.round((e.loaded / e.total) * 100) : Math.round(e.loaded * 100))
            : 0;
          onProgress(Math.min(100, Math.max(0, pct)));
        });
      }
    };

    if (provider.kind === 'LanguageModel') {
      const opts = {
        initialPrompts: [{ role: 'system', content: systemPrompt }],
        monitor
      };
      if (signal) opts.signal = signal;

      // Use deterministic low-temperature sampling when params() is supported in Extensions
      try {
        if (typeof provider.api.params === 'function') {
          const params = await provider.api.params();
          if (params && typeof params.defaultTopK === 'number') {
            opts.topK = Math.min(3, params.maxTopK || 3);
            opts.temperature = 0.2;
          }
        }
      } catch {
        // Ignore and use defaults
      }

      return provider.api.create(opts);
    }

    // Legacy ai.languageModel fallback
    return provider.api.create({
      systemPrompt,
      temperature: 0.2,
      topK: 3,
      monitor
    });
  }

  /**
   * Explicitly trigger model download / warm-up (should be called from a user click).
   */
  async prepareModel(onProgress = null) {
    const avail = await this.checkAvailability();
    if (avail.status === 'unavailable') {
      return { ok: false, ...avail };
    }
    const session = await this._createSession('You are a concise Chinese proofreading assistant.', onProgress);
    try {
      session.destroy?.();
    } catch {
      // ignore
    }
    const after = await this.checkAvailability();
    return { ok: after.status === 'available', ...after };
  }

  async _getWorkingSession(key, systemPrompt, signal) {
    if (this.baseSession && this.baseSessionKey === key) {
      if (typeof this.baseSession.clone === 'function') {
        try {
          return await this.baseSession.clone(signal ? { signal } : undefined);
        } catch {
          // Base session may have been invalidated; recreate below
          this.destroy();
        }
      }
    }

    this.destroy();
    this.baseSession = await this._createSession(systemPrompt, null, signal);
    this.baseSessionKey = key;

    if (typeof this.baseSession.clone === 'function') {
      try {
        return await this.baseSession.clone(signal ? { signal } : undefined);
      } catch {
        return this.baseSession;
      }
    }
    return this.baseSession;
  }

  /**
   * Run local Gemini Nano contextual proofreading on Chinese/Cantonese text.
   */
  async auditText(text, options = {}, existingFindings = [], shards = null, signal = undefined) {
    if (!text || !hasCJK(text) || text.trim().length < 4) {
      return { findings: [], status: 'skipped' };
    }

    const avail = await this.checkAvailability();
    if (avail.status !== 'available') {
      return { findings: [], status: avail.status, detail: avail.detail };
    }

    // Cap single-pass input length to stay comfortably inside Gemini Nano's local context window
    const clippedText = text.length > 1500 ? text.slice(0, 1500) : text;
    const profileMeta = shards?.profiles_and_code?.profiles?.[options.profile] || null;
    const systemPrompt = buildAuditSystemPrompt({
      profile: options.profile,
      register: options.register,
      standard: options.standard,
      profileMeta
    });

    const key = `${options.profile}|${options.register}|${options.standard}`;
    const workingSession = await this._getWorkingSession(key, systemPrompt, signal);
    const isClone = workingSession !== this.baseSession;

    try {
      const userPrompt = buildAuditUserPrompt(clippedText, existingFindings);
      let raw;
      try {
        raw = await workingSession.prompt(userPrompt, {
          responseConstraint: NANO_AUDIT_SCHEMA,
          ...(signal ? { signal } : {})
        });
      } catch (err) {
        if (err?.name === 'AbortError') throw err;
        // Fallback for Chrome builds that do not support responseConstraint
        raw = await workingSession.prompt(userPrompt, signal ? { signal } : undefined);
      }

      const parsed = parseNanoIssuesResponse(raw);
      const findings = validateNanoFindings(parsed, clippedText, options, existingFindings, shards);
      return { findings, status: 'ok' };
    } finally {
      if (isClone) {
        try {
          workingSession.destroy?.();
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Optional local polish / rewrite for the Side Panel workbench.
   */
  async polishText(text, options = {}, shards = null) {
    if (!text || !text.trim()) return { text: '', status: 'skipped' };
    const avail = await this.checkAvailability();
    if (avail.status !== 'available') {
      return { text: '', status: avail.status, detail: avail.detail };
    }

    const profileMeta = shards?.profiles_and_code?.profiles?.[options.profile] || null;
    const systemPrompt = [
      'You are a local Chinese & Cantonese copy editor.',
      `Rewrite the text naturally into ${options.profile} (${profileMeta?.script || 'Hant'}, register: ${options.register}, standard: ${options.standard}).`,
      'Preserve meaning, placeholders, proper nouns, street names, and 《…》 titles. Output ONLY the revised text without explanations.'
    ].join('\n');

    const session = await this._createSession(systemPrompt);
    try {
      const result = await session.prompt(text.slice(0, 1500));
      return { text: String(result || '').trim(), status: 'ok' };
    } finally {
      try {
        session.destroy?.();
      } catch {
        // ignore
      }
    }
  }

  destroy() {
    if (this.baseSession) {
      try {
        this.baseSession.destroy?.();
      } catch {
        // ignore
      }
      this.baseSession = null;
      this.baseSessionKey = null;
    }
  }
}
