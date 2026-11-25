import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  auditText,
  localizeText,
  lookupTerms,
  applyFix,
  applyAllFixes,
  resolveProfile,
  getSuggestionOptions
} from '../core/zh-audit-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

function loadShardsFromDisk() {
  const load = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
  return {
    profiles_and_code: load('profiles_and_code.json'),
    orthography: load('orthography_and_glyphs.json'),
    cantonese: load('cantonese.json'),
    lexicon: load('regional_lexicon.json'),
    official: load('official_translations.json')
  };
}

const shards = loadShardsFromDisk();

test('resolveProfile resolves canonical profiles and legacy aliases', () => {
  assert.equal(resolveProfile('zh-Hant-HK', shards), 'zh-Hant-HK');
  assert.equal(resolveProfile('zh_hk', shards), 'zh-Hant-HK');
  assert.equal(resolveProfile('yue', shards), 'yue-Hant-HK');
  assert.equal(resolveProfile('zh-TW', shards), 'zh-Hant-TW');
  assert.equal(resolveProfile('zh-CN', shards), 'zh-Hans-CN');
  assert.equal(resolveProfile('zh_sg', shards), 'zh-Hans-SG');
  assert.equal(resolveProfile('zh_my', shards), 'zh-Hans-MY');
});

test('Cantonese UI vs Official standard matches skill parity', () => {
  const sample = '歡迎俾啲意見我哋，唔該哂！載入中……';

  // UI standard: 俾 and 哂 accepted; …… flagged as ELLIPSIS_STYLE_UI
  const uiFindings = auditText(sample, { profile: 'yue-Hant-HK', standard: 'ui' }, shards);
  const uiCertainIds = new Set(uiFindings.filter((f) => f.confidence === 'CERTAIN').map((f) => f.rule_id));
  assert.deepEqual(uiCertainIds, new Set(['ELLIPSIS_STYLE_UI']));

  // Official standard: 俾 -> 畀 and 哂 -> 晒 flagged; …… accepted
  const offFindings = auditText(sample, { profile: 'yue-Hant-HK', standard: 'official' }, shards);
  const offMap = Object.fromEntries(
    offFindings.filter((f) => f.confidence === 'CERTAIN').map((f) => [f.found, f.suggestion])
  );
  assert.equal(offMap['俾'], '畀');
  assert.equal(offMap['哂'], '晒');
  assert.equal(offMap['……'], undefined);
});

test('HK educational/official vs UI standard matches skill parity', () => {
  const sample = '請在系統帳戶群組完成身份驗證，載入中…';

  const offFindings = auditText(sample, { profile: 'zh-Hant-HK', standard: 'educational' }, shards);
  const offMap = Object.fromEntries(
    offFindings.filter((f) => f.confidence === 'CERTAIN').map((f) => [f.found, f.suggestion])
  );
  assert.equal(offMap['帳戶'], '賬戶');
  assert.equal(offMap['群'], '羣');
  assert.equal(offMap['身份'], '身分');
  assert.equal(offMap['…'], '……');

  const uiFindings = auditText(sample, { profile: 'zh-Hant-HK', standard: 'ui' }, shards);
  const uiCertain = uiFindings.filter((f) => f.confidence === 'CERTAIN');
  assert.equal(uiCertain.length, 0);
});

test('HK statutory Hong Kong Identity Card carve-out preserved', () => {
  const sample = '請出示香港身份證以核實身分。';
  const findings = auditText(sample, { profile: 'zh-Hant-HK', standard: 'official' }, shards);
  assert.equal(findings.filter((f) => f.confidence === 'CERTAIN').length, 0);
});

test('Japanese Kanji bleed detection and carve-out preservation', () => {
  const dirty = '請確認注文確認及税込価格，點擊読込並檢查数値與黒色歩數。';
  const findings = auditText(dirty, { profile: 'zh-Hant-TW', standard: 'ui' }, shards);
  const map = Object.fromEntries(findings.map((f) => [f.found, f.suggestion]));
  assert.equal(map['注文確認'], '訂單確認');
  assert.equal(map['税込'], '含稅');
  assert.equal(map['読込'], '載入');
  assert.equal(map['値'], '值');
  assert.equal(map['黒'], '黑');
  assert.equal(map['歩'], '步');

  const clean = '芸芸眾生在公証行按「変換/無変換」鍵，前往[秋葉原ラジオ会館]辦理退税與喜悦分享。';
  const cleanFindings = auditText(clean, { profile: 'zh-Hant-HK', standard: 'ui' }, shards);
  assert.equal(cleanFindings.filter((f) => f.confidence === 'CERTAIN').length, 0);
});

test('1-to-many Hans->Hant conversion mergers and collocations', () => {
  const sample = '皇后在日歷標簽寫下：截止今日必需完成注冊，請稍後！';
  const findings = auditText(sample, { profile: 'zh-Hant-TW', standard: 'ui' }, shards);
  const map = Object.fromEntries(findings.map((f) => [f.found, f.suggestion]));
  assert.equal(map['日歷'], '日曆');
  assert.equal(map['標簽'], '標籤');
  assert.equal(map['截止今日'], '截至今日');
  assert.equal(map['必需完成'], '必須完成');
  assert.equal(map['注冊'], '註冊');
  assert.equal(map['請稍後'], '請稍候');
  assert.equal(map['皇后'], undefined);

  // Verify exact UTF-16 span offsets for every finding
  for (const f of findings) {
    assert.equal(sample.slice(f.start, f.end), f.found);
  }
});

test('Formal SWC Cantonese tokens and syntactic calques', () => {
  const sample = '我哋走先，這次表現好過預期，請給一份報告我。';
  const findings = auditText(sample, { profile: 'zh-Hant-HK', standard: 'official' }, shards);
  const map = Object.fromEntries(findings.map((f) => [f.found, f.suggestion]));
  assert.equal(map['我哋'], '我們');
  assert.equal(map['好過預期'], '比預期好');
  assert.equal(map['給一份報告我'], '給我一份報告');
});

test('applyFix and applyAllFixes surgically repair text without corrupting offsets', () => {
  const sample = '皇后在日歷標簽寫下：截止今日必需完成注冊，請稍後！';
  const findings = auditText(sample, { profile: 'zh-Hant-TW', standard: 'ui' }, shards);

  const single = applyFix(sample, findings.find((f) => f.found === '日歷'));
  assert.ok(single.includes('皇后在日曆標簽'));

  const { text: fixed, appliedCount } = applyAllFixes(sample, findings, { certainOnly: true });
  assert.equal(appliedCount, 6);
  assert.equal(fixed, '皇后在日曆標籤寫下：截至今日必須完成註冊，請稍候！');

  // Re-auditing fixed text produces zero CERTAIN defects
  const after = auditText(fixed, { profile: 'zh-Hant-TW', standard: 'ui' }, shards);
  assert.equal(after.filter((f) => f.confidence === 'CERTAIN').length, 0);
});

test('ignoredTerms and disabledCategories filter findings cleanly', () => {
  const sample = '請更新軟體與Cookies設定。';
  const base = auditText(sample, { profile: 'zh-Hant-HK', standard: 'ui' }, shards);
  assert.ok(base.some((f) => f.found === '軟體'));
  assert.ok(base.some((f) => f.found === 'Cookies'));

  const filtered = auditText(
    sample,
    {
      profile: 'zh-Hant-HK',
      standard: 'ui',
      ignoredTerms: ['軟體'],
      disabledCategories: ['loanword_style']
    },
    shards
  );
  assert.equal(filtered.length, 0);
});

test('localizeText preserves named entities, streets, 《titles》, and culinary homographs', () => {
  const simple = localizeText(
    '请在默认设置中清理内存缓存',
    ['zh-Hant-HK', 'zh-Hant-TW', 'zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans-MY'],
    'ui',
    shards
  );
  assert.equal(simple.localizations['zh-Hant-HK'], '請在預設設定中清理記憶體快取');
  assert.equal(simple.localizations['zh-Hant-TW'], '請在預設設定中清理記憶體快取');
  assert.equal(simple.localizations['zh-Hans-CN'], '请在默认设置中清理内存缓存');

  const complexSrc =
    '請閱讀我們的私隱政策及個人資料收集聲明，或親臨香港中環荷里活道聯絡香港個人資料（私隱）專員公署，查閱《個人資料（私隱）條例》並品嚐冰糖燉雪梨。';
  const res = localizeText(complexSrc, ['zh-Hant-TW', 'zh-Hans-CN', 'zh-Hans-SG'], 'ui', shards);
  const tw = res.localizations['zh-Hant-TW'];
  const cn = res.localizations['zh-Hans-CN'];
  const sg = res.localizations['zh-Hans-SG'];

  assert.ok(tw.includes('隱私權政策'));
  assert.ok(tw.includes('中環荷里活道'));
  assert.ok(tw.includes('香港個人資料（私隱）專員公署'));
  assert.ok(tw.includes('冰糖燉雪梨'));

  assert.ok(cn.includes('隐私政策'));
  assert.ok(cn.includes('个人信息'));
  assert.ok(cn.includes('中环荷里活道'));
  assert.ok(!cn.includes('好莱坞道'));
  assert.ok(cn.includes('冰糖炖雪梨'));
  assert.ok(!cn.includes('悉尼'));

  assert.ok(sg.includes('个人资料'));
});

test('lookupTerms returns accurate statutory, org, toponym, and lexicon entries', () => {
  const privacy = lookupTerms('Privacy Policy', 'official', shards);
  assert.equal(privacy[0].translations['zh-Hant-HK'], '私隱政策');
  assert.equal(privacy[0].translations['zh-Hant-TW'], '隱私權政策');

  const asean = lookupTerms('ASEAN', 'official', shards);
  assert.equal(asean[0].translations['zh-Hans-SG'], '亚细安');

  const saudi = lookupTerms('Saudi Arabia', 'official', shards);
  assert.equal(saudi[0].translations['zh-Hant-TW'], '沙烏地阿拉伯');
  assert.equal(saudi[0].translations['zh-Hans-MY'], '沙地阿拉伯');
});

test('getSuggestionOptions splits alternative suggestions cleanly while keeping slash terms intact', () => {
  assert.deepEqual(getSuggestionOptions('請／謝謝'), ['請', '謝謝']);
  assert.deepEqual(getSuggestionOptions('國家/地區'), ['國家/地區']);
});
