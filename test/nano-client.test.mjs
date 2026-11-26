import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkNanoAvailability,
  parseNanoIssuesResponse,
  validateNanoFindings,
  GeminiNanoManager
} from '../core/nano-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

function loadShards() {
  const load = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
  return {
    profiles_and_code: load('profiles_and_code.json'),
    orthography: load('orthography_and_glyphs.json'),
    cantonese: load('cantonese.json'),
    lexicon: load('regional_lexicon.json'),
    official: load('official_translations.json')
  };
}

const shards = loadShards();

test('checkNanoAvailability handles absent, modern LanguageModel, and legacy ai.languageModel APIs', async () => {
  const none = await checkNanoAvailability({});
  assert.equal(none.status, 'unavailable');
  assert.equal(none.api, 'none');

  const modernReady = await checkNanoAvailability({
    LanguageModel: { availability: async () => 'available' }
  });
  assert.equal(modernReady.status, 'available');
  assert.equal(modernReady.api, 'LanguageModel');

  const modernDownloadable = await checkNanoAvailability({
    LanguageModel: { availability: async () => 'downloadable' }
  });
  assert.equal(modernDownloadable.status, 'downloadable');

  const legacyReadily = await checkNanoAvailability({
    ai: { languageModel: { capabilities: async () => ({ available: 'readily' }) } }
  });
  assert.equal(legacyReadily.status, 'available');
  assert.equal(legacyReadily.api, 'ai.languageModel');
});

test('parseNanoIssuesResponse handles raw JSON, fenced code blocks, and malformed output', () => {
  const raw = '{"issues":[{"found":"再這裏","suggestion":"在這裏","category":"typo","rationale":"Use locative 在"}]}';
  assert.equal(parseNanoIssuesResponse(raw).length, 1);

  const fenced = '```json\n{"issues":[{"found":"做的很好","suggestion":"做得很好","category":"grammar","rationale":"Complement uses 得"}]}\n```';
  assert.equal(parseNanoIssuesResponse(fenced).length, 1);

  assert.deepEqual(parseNanoIssuesResponse('not valid json'), []);
});

test('validateNanoFindings blocks hallucinations, deterministic overlaps, carve-outs, and ignored terms', () => {
  const text = '我們在荷里活道品嚐冰糖燉雪梨，真的做的很好，請使用軟體。';
  const existingRuleFindings = [
    { start: text.indexOf('軟體'), end: text.indexOf('軟體') + 2, found: '軟體' }
  ];

  const rawIssues = [
    // Valid contextual grammar fix
    { found: '做的很好', suggestion: '做得很好', category: 'grammar', rationale: 'Complement takes 得' },
    // Hallucination not in text
    { found: '不存在的詞', suggestion: '改寫', category: 'typo', rationale: 'hallucinated' },
    // Overlaps deterministic rule finding -> must be dropped
    { found: '軟體', suggestion: '軟件', category: 'word_choice', rationale: 'duplicate' },
    // Protected carve-out -> must be dropped
    { found: '荷里活道', suggestion: '好萊塢道', category: 'word_choice', rationale: 'bad rewrite' },
    // Culinary homograph carve-out -> must be dropped
    { found: '冰糖燉雪梨', suggestion: '冰糖燉悉尼', category: 'word_choice', rationale: 'bad rewrite' },
    // No-op -> must be dropped
    { found: '真的', suggestion: '真的', category: 'grammar', rationale: 'noop' }
  ];

  const valid = validateNanoFindings(
    rawIssues,
    text,
    { profile: 'zh-Hant-HK', register: 'formal_swc', standard: 'ui' },
    existingRuleFindings,
    shards
  );

  assert.equal(valid.length, 1);
  assert.equal(valid[0].found, '做的很好');
  assert.equal(valid[0].suggestion, '做得很好');
  assert.equal(valid[0].source, 'gemini-nano');
  assert.equal(text.slice(valid[0].start, valid[0].end), '做的很好');
});

test('GeminiNanoManager executes end-to-end local audit and polish with mocked LanguageModel', async () => {
  let destroyedCount = 0;
  const mockGlobal = {
    LanguageModel: {
      availability: async () => 'available',
      params: async () => ({ defaultTopK: 3, maxTopK: 64, defaultTemperature: 1, maxTemperature: 2 }),
      create: async () => ({
        clone: async () => ({
          prompt: async () =>
            JSON.stringify({
              issues: [
                {
                  found: '再辦公室',
                  suggestion: '在辦公室',
                  category: 'typo',
                  rationale: 'Locative preposition requires 在, not 再.'
                }
              ]
            }),
          destroy: () => {
            destroyedCount += 1;
          }
        }),
        prompt: async () => '我今天在辦公室工作。',
        destroy: () => {
          destroyedCount += 1;
        }
      })
    }
  };

  const manager = new GeminiNanoManager(mockGlobal);
  const res = await manager.auditText(
    '我今天再辦公室工作。',
    { profile: 'zh-Hant-HK', register: 'formal_swc', standard: 'ui' },
    [],
    shards
  );

  assert.equal(res.status, 'ok');
  assert.equal(res.findings.length, 1);
  assert.equal(res.findings[0].found, '再辦公室');
  assert.equal(res.findings[0].suggestion, '在辦公室');
  assert.ok(destroyedCount >= 1);

  const polished = await manager.polishText(
    '我今天再辦公室工作。',
    { profile: 'zh-Hant-HK', register: 'formal_swc', standard: 'ui' },
    shards
  );
  assert.equal(polished.status, 'ok');
  assert.equal(polished.text, '我今天在辦公室工作。');

  manager.destroy();
});

test('validateNanoFindings blocks AI edits inside placeholders, URLs, and inline code spans', () => {
  const text = '請打開 `軟體設定` 並瀏覽 https://example.com/軟體 查看 {user_name} 的檔案。';
  const rawIssues = [
    { found: '軟體設定', suggestion: '軟件設定', category: 'word_choice', rationale: 'inside code' },
    { found: '軟體', suggestion: '軟件', category: 'word_choice', rationale: 'inside URL' },
    { found: 'user_name', suggestion: 'username', category: 'typo', rationale: 'inside placeholder' }
  ];
  const valid = validateNanoFindings(
    rawIssues,
    text,
    { profile: 'zh-Hant-HK', register: 'formal_swc', standard: 'ui' },
    [],
    shards
  );
  assert.equal(valid.length, 0);
});

test('GeminiNanoManager destroys single-use sessions when clone() is unavailable to prevent context overflow', async () => {
  let createdCount = 0;
  let destroyedCount = 0;
  const mockNoClone = {
    LanguageModel: {
      availability: async () => 'available',
      create: async () => {
        createdCount += 1;
        return {
          prompt: async () => '{"issues":[]}',
          destroy: () => {
            destroyedCount += 1;
          }
        };
      }
    }
  };
  const mgr = new GeminiNanoManager(mockNoClone);
  await mgr.auditText('測試第一句中文內容', { profile: 'zh-Hant-HK', register: 'formal_swc', standard: 'ui' }, [], shards);
  await mgr.auditText('測試第二句中文內容', { profile: 'zh-Hant-HK', register: 'formal_swc', standard: 'ui' }, [], shards);
  assert.equal(createdCount, 2);
  assert.equal(destroyedCount, 2);
});

