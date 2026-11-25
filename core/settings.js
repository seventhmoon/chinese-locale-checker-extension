/**
 * Default extension settings and storage helpers.
 * All configuration is stored locally in chrome.storage.local — zero cloud sync or external calls.
 */

export const SUPPORTED_PROFILES = [
  {
    id: 'zh-Hant-HK',
    label: '香港繁體 (zh-Hant-HK)',
    shortLabel: 'HK 繁體',
    description: 'Hong Kong Standard Written Chinese (HK EDB / UI)'
  },
  {
    id: 'yue-Hant-HK',
    label: '香港粵文 (yue-Hant-HK)',
    shortLabel: 'HK 粵文',
    description: 'Hong Kong Written Cantonese (LSHK / UI)'
  },
  {
    id: 'zh-Hant-MO',
    label: '澳門繁體 (zh-Hant-MO)',
    shortLabel: 'MO 繁體',
    description: 'Macau Standard Written Chinese (HK EDB / UI)'
  },
  {
    id: 'zh-Hant-TW',
    label: '台灣繁體 (zh-Hant-TW)',
    shortLabel: 'TW 繁體',
    description: 'Taiwan Traditional Chinese (TW MoE / UI)'
  },
  {
    id: 'zh-Hans-CN',
    label: '中国大陆简体 (zh-Hans-CN)',
    shortLabel: 'CN 简体',
    description: 'Mainland China Simplified Chinese (CN TGH)'
  },
  {
    id: 'zh-Hans-SG',
    label: '新加坡简体 (zh-Hans-SG)',
    shortLabel: 'SG 简体',
    description: 'Singapore Simplified Chinese (华语)'
  },
  {
    id: 'zh-Hans-MY',
    label: '马来西亚简体 (zh-Hans-MY)',
    shortLabel: 'MY 简体',
    description: 'Malaysia Simplified Chinese (华语)'
  }
];

export const RULE_CATEGORIES = [
  { id: 'kanji_bleed', label: 'Japanese Kanji / Shinjitai Bleed (日本漢字混入)' },
  { id: 'one_to_many_merger', label: '1-to-Many Conversion Traps (簡轉繁一對多)' },
  { id: 'collocation', label: 'Collocations & Typos (詞語搭配與錯別字)' },
  { id: 'regional_orthography', label: 'Regional Word Forms (地區規範字形)' },
  { id: 'glyph_standard', label: 'HK EDB / TW MoE Glyphs (港台異體字形)' },
  { id: 'official_terminology', label: 'Official & Statutory Terms (法定及官方譯名)' },
  { id: 'regional_lexicon', label: 'Regional Vocabulary (地區慣用詞彙)' },
  { id: 'register', label: 'Register & Cantonese Leaks (書面語/粵語語體)' },
  { id: 'cantonese_orthography', label: 'Written Cantonese Orthography (粵文正字)' },
  { id: 'script_mismatch', label: 'Script Bleed (繁簡混用)' },
  { id: 'punctuation', label: 'Punctuation & Ellipsis (標點與省略號)' },
  { id: 'formality', label: 'Formality Consistency (你/您一致性)' },
  { id: 'loanword_style', label: 'Loanword Plurals (外來詞複數)' }
];

export const DEFAULT_SETTINGS = {
  enabled: true,
  profile: 'zh-Hant-HK',
  standard: 'ui', // 'ui' (commercial) | 'official' (educational)
  register: 'auto', // 'auto' | 'formal_swc' | 'colloquial_yue'
  useGeminiNano: false, // Opt-in local on-device Gemini Nano Prompt API
  nanoTriggerMode: 'auto', // 'auto' (after pause) | 'manual' (button click)
  showAdvisories: true,
  showInlineUnderlines: true,
  disabledCategories: [],
  disabledHosts: [],
  ignoredTerms: []
};

export function mergeSettings(stored = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    disabledCategories: Array.isArray(stored.disabledCategories) ? stored.disabledCategories : [],
    disabledHosts: Array.isArray(stored.disabledHosts) ? stored.disabledHosts : [],
    ignoredTerms: Array.isArray(stored.ignoredTerms) ? stored.ignoredTerms : []
  };
}

export const SETTINGS_STORAGE_KEY = 'correctorAiSettings';

export async function loadSettings() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return { ...DEFAULT_SETTINGS };
  }
  const res = await chrome.storage.local.get([SETTINGS_STORAGE_KEY, 'zhorthoSettings']);
  return mergeSettings(res[SETTINGS_STORAGE_KEY] || res.zhorthoSettings || {});
}

export async function saveSettings(partial) {
  const current = await loadSettings();
  const next = mergeSettings({ ...current, ...partial });
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: next });
  }
  return next;
}
