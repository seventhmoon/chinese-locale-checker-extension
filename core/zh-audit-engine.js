/**
 * ZhOrtho Deterministic Chinese & Cantonese Audit, Localization & Glossary Engine.
 *
 * Faithful zero-dependency JavaScript port of the `chinese-locale-and-orthography`
 * Agent Skill (`scripts/zh_audit_cli.py`) and its five modular JSON reference shards.
 *
 * Runs 100% locally in-browser (content script, popup, side panel, service worker)
 * and in Node.js for unit testing.
 */

export const ONE_TO_ONE_HANS_HANT = [
  ['请', '請'], ['在', '在'], ['默', '默'], ['认', '認'], ['设', '設'], ['置', '置'],
  ['清', '清'], ['理', '理'], ['内', '內'], ['存', '存'], ['缓', '緩'], ['记', '記'],
  ['忆', '憶'], ['体', '體'], ['快', '快'], ['取', '取'], ['预', '預'], ['定', '定'],
  ['欢', '歡'], ['迎', '迎'], ['意', '意'], ['见', '見'], ['我', '我'], ['们', '們'],
  ['你', '你'], ['您', '您'], ['他', '他'], ['她', '她'], ['它', '它'], ['这', '這'],
  ['那', '那'], ['哪', '哪'], ['谁', '誰'], ['什', '甚'], ['么', '麼'], ['为', '為'],
  ['与', '與'], ['及', '及'], ['或', '或'], ['并', '並'], ['从', '從'], ['对', '對'],
  ['关于', '關於'], ['关', '關'], ['联', '聯'], ['网', '網'], ['络', '絡'], ['路', '路'],
  ['软', '軟'], ['硬', '硬'], ['件', '件'], ['固', '固'], ['韧', '韌'], ['资', '資'],
  ['讯', '訊'], ['息', '息'], ['数', '數'], ['据', '據'], ['库', '庫'], ['服', '服'],
  ['务', '務'], ['器', '器'], ['档', '檔'], ['案', '案'], ['文', '文'], ['夹', '夾'],
  ['视', '視'], ['频', '頻'], ['影', '影'], ['音', '音'], ['载', '載'], ['入', '入'],
  ['加', '加'], ['上', '上'], ['传', '傳'], ['下', '下'], ['链', '鏈'], ['连', '連'],
  ['结', '結'], ['点', '點'], ['击', '擊'], ['轻', '輕'], ['触', '觸'], ['选', '選'],
  ['择', '擇'], ['贴', '貼'], ['粘', '粘'], ['剪', '剪'], ['刷', '刷'], ['重', '重'],
  ['新', '新'], ['整', '整'], ['登', '登'], ['录', '錄'], ['陆', '陸'], ['退', '退'],
  ['出', '出'], ['账', '賬'], ['帐', '帳'], ['户', '戶'], ['号', '號'], ['用', '用'],
  ['使', '使'], ['者', '者'], ['验', '驗'], ['证', '證'], ['双', '雙'], ['完', '完'],
  ['成', '成'], ['组', '組'], ['隐', '隱'], ['私', '私'], ['权', '權'], ['政', '政'],
  ['策', '策'], ['个', '個'], ['人', '人'], ['护', '護'], ['条', '條'], ['款', '款'],
  ['例', '例'], ['法', '法'], ['规', '規'], ['则', '則'], ['知', '知'], ['识', '識'],
  ['产', '產'], ['智', '智'], ['慧', '慧'], ['财', '財'], ['版', '版'], ['专', '專'],
  ['利', '利'], ['商', '商'], ['标', '標'], ['东', '東'], ['盟', '盟'], ['协', '協'],
  ['亚', '亞'], ['细', '細'], ['安', '安'], ['国', '國'], ['家', '家'], ['地', '地'],
  ['区', '區'], ['联', '聯'], ['合', '合'], ['世', '世'], ['界', '界'], ['生', '生'],
  ['组', '組'], ['织', '織'], ['欧', '歐'], ['洲', '洲'], ['太', '太'], ['经', '經'],
  ['济', '濟'], ['会', '會'], ['议', '議'], ['沙', '沙'], ['特', '特'], ['乌', '烏'],
  ['阿', '阿'], ['拉', '拉'], ['伯', '伯'], ['西', '西'], ['兰', '蘭'], ['纽', '紐'],
  ['澳', '澳'], ['大', '大'], ['悉', '悉'], ['尼', '尼'], ['雪', '雪'], ['梨', '梨'],
  ['义', '義'], ['卡', '卡'], ['塔', '塔'], ['尔', '爾'], ['达', '達'], ['酋', '酋'],
  ['长', '長'], ['格', '格'], ['鲁', '魯'], ['吉', '吉'], ['乔', '喬'], ['治', '治'],
  ['州', '州'], ['马', '馬'], ['代', '代'], ['夫', '夫'], ['哥', '哥'], ['斯', '斯'],
  ['黎', '黎'], ['好', '好'], ['莱', '萊'], ['坞', '塢'], ['环', '環'], ['道', '道'],
  ['广', '廣'], ['场', '場'], ['炖', '燉'], ['川', '川'], ['贝', '貝'], ['众', '眾'],
  ['邮', '郵'], ['递', '遞'], ['编', '編'], ['码', '碼'], ['手', '手'], ['机', '機'],
  ['电', '電'], ['话', '話'], ['脑', '腦'], ['计', '計'], ['程', '程'], ['车', '車'],
  ['租', '租'], ['德', '德'], ['士', '士'], ['巴', '巴'], ['铁', '鐵'], ['捷', '捷'],
  ['运', '運'], ['滑', '滑'], ['鼠', '鼠'], ['印', '印'], ['刷', '刷'], ['显', '顯'],
  ['示', '示'], ['屏', '屏'], ['幕', '幕'], ['荧', '熒'], ['莹', '瑩'], ['萤', '螢'],
  ['错', '錯'], ['误', '誤'], ['警', '警'], ['告', '告'], ['提', '提'], ['确', '確'],
  ['认', '認'], ['取', '取'], ['消', '消'], ['保', '保'], ['储', '儲'], ['删', '刪'],
  ['除', '除'], ['编', '編'], ['辑', '輯'], ['搜', '搜'], ['索', '索'], ['寻', '尋'],
  ['查', '查'], ['找', '找'], ['阅', '閱'], ['读', '讀'], ['写', '寫'], ['输', '輸'],
  ['密', '密'], ['钥', '鑰'], ['权', '權'], ['限', '限'], ['管', '管'], ['员', '員'],
  ['设', '設'], ['备', '備'], ['装', '裝'], ['更', '更'], ['升', '升'], ['级', '級'],
  ['版', '版'], ['本', '本'], ['语', '語'], ['言', '言'], ['简', '簡'], ['繁', '繁'],
  ['传', '傳'], ['统', '統'], ['粤', '粵'], ['华', '華'], ['汉', '漢'], ['字', '字'],
  ['词', '詞'], ['汇', '匯'], ['无', '無'], ['没', '沒'], ['有', '有'], ['是', '是'],
  ['个', '個'], ['们', '們'], ['吗', '嗎'], ['呢', '呢'], ['吧', '吧'], ['啊', '啊'],
  ['让', '讓'], ['给', '給'], ['把', '把'], ['被', '被'], ['将', '將'], ['已', '已'],
  ['经', '經'], ['正', '正'], ['现', '現'], ['时', '時'], ['间', '間'], ['日', '日'],
  ['期', '期'], ['年', '年'], ['月', '月'], ['周', '週'], ['星', '星'], ['今', '今'],
  ['明', '明'], ['昨', '昨'], ['刚', '剛'], ['才', '才'], ['还', '還'], ['再', '再'],
  ['试', '試'], ['请', '請'], ['稍', '稍'], ['候', '候'], ['等', '等'], ['待', '待'],
  ['开', '開'], ['启', '啟'], ['闭', '閉'], ['停', '停'], ['止', '止'], ['暂', '暫'],
  ['继', '繼'], ['续', '續'], ['返', '返'], ['回', '回'], ['页', '頁'], ['面', '面'],
  ['网', '網'], ['站', '站'], ['浏', '瀏'], ['览', '覽'], ['器', '器'], ['应', '應'],
  ['序', '序'], ['安', '安'], ['装', '裝'], ['卸', '卸'], ['购', '購'], ['买', '買'],
  ['卖', '賣'], ['订', '訂'], ['单', '單'], ['付', '付'], ['费', '費'], ['免', '免'],
  ['折', '折'], ['扣', '扣'], ['优', '優'], ['惠', '惠'], ['税', '稅'], ['含', '含'],
  ['价', '價'], ['格', '格'], ['金', '金'], ['额', '額'], ['银', '銀'], ['行', '行'],
  ['信', '信'], ['贷', '貸'], ['转', '轉'], ['结', '結'], ['对', '對'], ['收', '收'],
  ['发', '發'], ['送', '送'], ['接', '接'], ['通', '通'], ['知', '知'], ['消', '消'],
  ['邮', '郵'], ['箱', '箱'], ['电', '電'], ['子', '子'], ['附', '附'], ['图', '圖'],
  ['片', '片'], ['相', '相'], ['册', '冊'], ['拍', '拍'], ['摄', '攝'], ['录', '錄'],
  ['放', '放'], ['播', '播'], ['静', '靜'], ['音', '音'], ['声', '聲'], ['量', '量'],
  ['调', '調'], ['节', '節'], ['亮', '亮'], ['度', '度'], ['颜', '顏'], ['色', '色'],
  ['深', '深'], ['浅', '淺'], ['模', '模'], ['式', '式'], ['自', '自'], ['动', '動'],
  ['手', '手'], ['同', '同'], ['步', '步'], ['备', '備'], ['份', '份'], ['还', '還'],
  ['原', '原'], ['导', '導'], ['汇', '匯'], ['共', '共'], ['享', '享'], ['分', '分'],
  ['权', '權'], ['允', '允'], ['许', '許'], ['拒', '拒'], ['绝', '絕'], ['必', '必'],
  ['须', '須'], ['需', '需'], ['迫', '迫'], ['逼', '逼'], ['截', '截'], ['至', '至'],
  ['籍', '籍'], ['书', '書'], ['狼', '狼'], ['劳', '勞'], ['艺', '藝'], ['术', '術'],
  ['认', '認'], ['检', '檢'], ['观', '觀'], ['译', '譯'], ['晒', '曬'], ['揾', '搵'],
  ['𠝹', '𠝹'], ['揿', '撳'], ['拣', '揀'], ['嘢', '嘢'], ['噏', '噏'], ['乱', '亂'],
  ['瞓', '瞓'], ['觉', '覺'], ['唞', '唞'], ['嘥', '嘥'], ['呃', '呃'], ['钱', '錢'],
  ['嚟', '嚟'], ['咗', '咗'], ['喺', '喺'], ['冇', '冇'], ['唔', '唔'], ['该', '該'],
  ['啲', '啲'], ['哋', '哋'], ['㗎', '㗎'], ['啩', '啩'], ['啰', '囉'], ['喎', '喎']
];

export const HANS_TO_HANT_MAP = Object.create(null);
export const HANT_TO_HANS_MAP = Object.create(null);

for (const [s, t] of ONE_TO_ONE_HANS_HANT) {
  if (s.length === 1 && t.length === 1 && s !== t) {
    HANS_TO_HANT_MAP[s] = t;
    HANT_TO_HANS_MAP[t] = s;
  }
}

Object.assign(HANT_TO_HANS_MAP, {
  '裏': '里', '裡': '里', '溫': '温', '衞': '卫', '衛': '卫',
  '枱': '台', '檯': '台', '臺': '台', '麪': '面', '麵': '面',
  '羣': '群', '賬': '账', '帳': '帐', '着': '着', '著': '著',
  '畫': '画', '劃': '划', '澈': '彻', '徹': '彻', '脫': '脱',
  '悅': '悦', '髮': '发', '後': '后', '乾': '干', '幹': '干',
  '複': '复', '復': '复', '曆': '历', '歷': '历', '範': '范',
  '藉': '借', '係': '系', '繫': '系', '錶': '表', '製': '制',
  '隻': '只', '準': '准', '徵': '征', '註': '注', '籤': '签',
  '彙': '汇', '麼': '么', '甚': '什'
});

export const HK_EDB_SHARED_WITH_HANS = new Set([
  '温', '脱', '税', '悦', '着', '線', '匯', '峰', '群', '啟', '研', '污', '才'
]);

const PLACEHOLDER_PATTERNS = [
  /<xliff:g\b[^>]*>[\s\S]*?<\/xliff:g>/g,
  /<ph\b[^>]*>[\s\S]*?<\/ph>/g,
  /<[^>]+>/g,
  /%(?:\d+\$)?[-+#0 ]*\d*(?:\.\d+)?[sdifFeEgGxXoOcpaA%]/g,
  /\{\{[^{}\n]+\}\}/g,
  /\{[A-Za-z0-9_., :#/-]+\}/g,
  /https?:\/\/\S+/g,
  /\\[nrt"'\\]/g
];

const KANA_HANGUL_SPAN_PATTERNS = [
  /\[[^\]]*[\u3040-\u30ff\uac00-\ud7af][^\]]*\]/g,
  /「[^」]*[\u3040-\u30ff\uac00-\ud7af][^」]*」/g,
  /『[^』]*[\u3040-\u30ff\uac00-\ud7af][^』]*』/g,
  /[\u3040-\u30ff\u4e00-\u9fff]*[\u3040-\u30ff\uac00-\ud7af][\u3040-\u30ff\uac00-\ud7af\u4e00-\u9fff]*/g
];

export const CJK_CHAR_RE = /[\u3400-\u4dbf\u4e00-\u9fff\u{20000}-\u{2ceaf}]/u;

export function hasCJK(text) {
  return typeof text === 'string' && CJK_CHAR_RE.test(text);
}

export function normalizeStandard(raw = 'ui', isCatalog = false) {
  const val = String(raw || 'auto').trim().toLowerCase();
  if (val === 'ui' || val === 'commercial' || val === 'platform') return 'ui';
  if (val === 'official' || val === 'educational' || val === 'academic' || val === 'edb' || val === 'moe') {
    return 'official';
  }
  if (val === 'auto') return isCatalog ? 'ui' : 'official';
  throw new Error(`Unsupported standard value: ${raw}`);
}

export function resolveStyleMode(raw = 'auto', std = 'ui') {
  const val = String(raw || 'auto').trim().toLowerCase();
  if (val === 'auto') return std === 'ui' ? 'ui' : 'clreq';
  if (val === 'ui' || val === 'commercial' || val === 'platform-ui') return 'ui';
  if (val === 'clreq') return 'clreq';
  throw new Error(`Unsupported styleMode value: ${raw}`);
}

export function resolveCantoneseMode(raw = 'auto', std = 'ui') {
  const val = String(raw || 'auto').trim().toLowerCase();
  if (val === 'auto') return std === 'ui' ? 'ui-yue' : 'lshk';
  if (val === 'ui-yue' || val === 'commercial-yue' || val === 'conventional') return 'ui-yue';
  if (val === 'lshk') return 'lshk';
  throw new Error(`Unsupported cantoneseMode value: ${raw}`);
}

export function resolveProfile(raw, shards) {
  const profiles = shards.profiles_and_code.profiles;
  const aliases = shards.profiles_and_code.aliases;

  if (raw && String(raw).toLowerCase() !== 'auto') {
    if (profiles[raw]) return raw;
    const key = String(raw).trim().toLowerCase().replace(/_/g, '-');
    if (aliases[key]) return aliases[key];
    const keyUs = String(raw).trim().toLowerCase();
    if (aliases[keyUs]) return aliases[keyUs];
    for (const canonical of Object.keys(profiles)) {
      if (canonical.toLowerCase() === key) return canonical;
    }
    throw new Error(`Unknown BCP-47 profile: ${raw}`);
  }
  return 'zh-Hant-HK';
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskSpans(text, patterns) {
  const chars = Array.from({ length: text.length }, (_, i) => text[i]);
  for (const pat of patterns) {
    const re = new RegExp(pat.source, pat.flags.includes('g') ? pat.flags : pat.flags + 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      for (let i = m.index; i < m.index + m[0].length; i++) {
        if (chars[i] !== '\n') chars[i] = '\x00';
      }
    }
  }
  return chars.join('');
}

function maskLiterals(text, literals) {
  if (!literals || literals.length === 0) return text;
  const chars = Array.from({ length: text.length }, (_, i) => text[i]);
  const sorted = [...new Set(literals)].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const lit of sorted) {
    let start = 0;
    while (true) {
      const idx = text.indexOf(lit, start);
      if (idx === -1) break;
      for (let pos = idx; pos < idx + lit.length; pos++) {
        if (chars[pos] !== '\n') chars[pos] = '\x00';
      }
      start = idx + lit.length;
    }
  }
  return chars.join('');
}

export function offsetToLineCol(text, offset, baseLine = 1, baseCol = 1) {
  let line = baseLine;
  let lastNl = -1;
  for (let i = 0; i < offset; i++) {
    if (text[i] === '\n') {
      line += 1;
      lastNl = i;
    }
  }
  if (lastNl === -1) {
    const colPoints = Array.from(text.slice(0, offset)).length;
    return { line, column: baseCol + colPoints };
  }
  const colPoints = Array.from(text.slice(lastNl + 1, offset)).length;
  return { line, column: 1 + colPoints };
}

export function sortFindings(findings) {
  const confRank = { CERTAIN: 0, CONTEXT_DEPENDENT: 1 };
  const sevRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return [...findings].sort((a, b) => {
    const cDiff = (confRank[a.confidence] ?? 9) - (confRank[b.confidence] ?? 9);
    if (cDiff !== 0) return cDiff;
    const sDiff = (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9);
    if (sDiff !== 0) return sDiff;
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });
}

/**
 * Audit a text string using the 4-axis Chinese & Cantonese deterministic rules.
 *
 * @param {string} text
 * @param {object} options
 * @param {object} shards - { profiles_and_code, orthography, cantonese, lexicon, official }
 * @returns {Array<object>} sorted list of findings with exact UTF-16 start/end offsets
 */
export function auditText(text, options = {}, shards) {
  if (!text || !hasCJK(text)) {
    return [];
  }

  const profileId = resolveProfile(options.profile || 'zh-Hant-HK', shards);
  const profile = shards.profiles_and_code.profiles[profileId];
  const register =
    !options.register || options.register === 'auto'
      ? profile.default_register
      : options.register;
  const standard = normalizeStandard(options.standard || 'ui', Boolean(options.isCatalog));
  const styleMode = resolveStyleMode(options.styleMode || 'auto', standard);
  const cantoneseMode = resolveCantoneseMode(options.cantoneseMode || 'auto', standard);
  const includeCodeFences = Boolean(options.includeCodeFences);
  const disabledCategories = new Set(options.disabledCategories || []);
  const ignoredTerms = new Set(options.ignoredTerms || []);
  const showAdvisories = options.showAdvisories !== false;

  const script = profile.script; // 'Hant' | 'Hans'
  const glyphStd = profile.glyph_standard; // 'HK_EDB' | 'TW_MOE' | 'CN_TGH'

  let work = text;
  if (!options.isCatalog && !includeCodeFences) {
    work = maskSpans(work, [/```[\s\S]*?```/g, /`[^`\n]+`/g]);
  }
  work = maskSpans(work, PLACEHOLDER_PATTERNS);
  work = maskSpans(work, KANA_HANGUL_SPAN_PATTERNS);

  // Carve-outs preserved across orthography/lexicon checks
  const carveoutLiterals = [];
  for (const item of shards.official.preserved_carveouts) {
    carveoutLiterals.push(item.span_hant, item.span_hans);
  }
  carveoutLiterals.push(...shards.orthography.japanese_kanji_bleed.carveouts);
  const workCarved = maskLiterals(work, carveoutLiterals);
  const workNoTitles = maskSpans(workCarved, [/《[^》]+》/g]);

  const claimed = new Uint8Array(text.length);
  const findings = [];

  function claimAndRecord(start, end, ruleId, confidence, severity, category, found, suggestion, rationale) {
    if (start < 0 || end > text.length || start >= end) return;
    if (disabledCategories.has(category)) return;
    if (!showAdvisories && confidence !== 'CERTAIN') return;
    if (ignoredTerms.has(found)) return;
    for (let i = start; i < end; i++) {
      if (claimed[i]) return;
    }
    for (let i = start; i < end; i++) {
      claimed[i] = 1;
    }
    const { line, column } = offsetToLineCol(text, start);
    findings.push({
      id: `${ruleId}:${start}:${end}`,
      start,
      end,
      line,
      column,
      rule_id: ruleId,
      confidence,
      severity,
      category,
      found,
      suggestion,
      rationale,
      source: 'rules',
      profile: profileId,
      register,
      standard
    });
  }

  function scanLiteral(buf, wrong, right, ruleId, confidence, severity, category, rationale) {
    if (!wrong || wrong === right) return;
    let pos = 0;
    while (true) {
      const idx = buf.indexOf(wrong, pos);
      if (idx === -1) break;
      claimAndRecord(
        idx,
        idx + wrong.length,
        ruleId,
        confidence,
        severity,
        category,
        text.slice(idx, idx + wrong.length),
        right,
        rationale
      );
      pos = idx + wrong.length;
    }
  }

  function scanRegex(buf, patternStr, buildSuggestion, ruleId, confidence, severity, category, rationale) {
    const re = new RegExp(patternStr, 'g');
    let m;
    while ((m = re.exec(buf)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const start = m.index;
      const end = start + m[0].length;
      const sug = typeof buildSuggestion === 'function' ? buildSuggestion(m) : buildSuggestion;
      claimAndRecord(
        start,
        end,
        ruleId,
        confidence,
        severity,
        category,
        text.slice(start, end),
        sug,
        rationale
      );
    }
  }

  // 1. Japanese Kanji / Shinjitai / Kokuji compounds & codepoints
  const kanjiCfg = shards.orthography.japanese_kanji_bleed;
  for (const comp of kanjiCfg.compounds) {
    if (comp.hant_only && script !== 'Hant') continue;
    const target = script === 'Hant' ? comp.hant : comp.hans;
    scanLiteral(
      workCarved,
      comp.wrong,
      target,
      'JAPANESE_KANJI_COMPOUND',
      'CERTAIN',
      'HIGH',
      'kanji_bleed',
      comp.rationale
    );
  }

  for (const cp of kanjiCfg.codepoints) {
    const target = script === 'Hant' ? cp.hant : cp.hans;
    scanLiteral(
      workCarved,
      cp.kanji,
      target,
      'JAPANESE_KANJI_CODEPOINT',
      'CERTAIN',
      'HIGH',
      'kanji_bleed',
      cp.rationale
    );
  }

  // Unquoted Japanese possessive の between Han characters
  {
    const sug = register === 'colloquial_yue' ? '嘅' : '的';
    scanRegex(
      workCarved,
      '(?<=[\\u4e00-\\u9fff])の(?=[\\u4e00-\\u9fff])',
      sug,
      'JAPANESE_NO_PARTICLE',
      'CERTAIN',
      'HIGH',
      'kanji_bleed',
      `Unassimilated Japanese particle 'の' in Chinese prose; use '${sug}'.`
    );
  }

  // 2. One-to-many Hans -> Hant conversion traps (on Hant profiles)
  if (script === 'Hant') {
    for (const rule of shards.orthography.hant_one_to_many_mergers) {
      if (rule.wrong_regex) {
        scanRegex(
          workCarved,
          rule.wrong_regex,
          rule.right,
          'HANT_ONE_TO_MANY_MERGER',
          'CERTAIN',
          'HIGH',
          'one_to_many_merger',
          rule.rationale
        );
      } else {
        scanLiteral(
          workCarved,
          rule.wrong,
          rule.right,
          'HANT_ONE_TO_MANY_MERGER',
          'CERTAIN',
          'HIGH',
          'one_to_many_merger',
          rule.rationale
        );
      }
    }
  }

  // 3. Collocation, formality & loanword rules
  for (const rule of shards.orthography.collocation_and_typo_rules) {
    if (rule.wrong_regex) {
      const tmpl = script === 'Hant' ? rule.hant_template : rule.hans_template;
      scanRegex(
        workCarved,
        rule.wrong_regex,
        (m) => {
          let sug = tmpl;
          for (let gi = 1; gi < m.length; gi++) {
            sug = sug.replaceAll(`{${gi}}`, m[gi] || '');
          }
          return sug;
        },
        'COLLOCATION_OR_TYPO',
        'CERTAIN',
        'HIGH',
        'collocation',
        rule.rationale
      );
    } else {
      const target = script === 'Hant' ? rule.hant : rule.hans;
      scanLiteral(
        workCarved,
        rule.wrong,
        target,
        'COLLOCATION_OR_TYPO',
        'CERTAIN',
        'HIGH',
        'collocation',
        rule.rationale
      );
    }
  }

  // Mixed 你 and 您 in the same unquoted flow
  {
    const unquoted = maskSpans(workCarved, [/「[^」]*」/g, /“[^”]*”/g]);
    if (unquoted.includes('你') && unquoted.includes('您')) {
      let searchPos = 0;
      while (true) {
        const idx = unquoted.indexOf('您', searchPos);
        if (idx === -1) break;
        if (!claimed[idx]) {
          claimAndRecord(
            idx,
            idx + 1,
            'MIXED_PRONOUN_FORMALITY',
            'CONTEXT_DEPENDENT',
            'MEDIUM',
            'formality',
            '您',
            '你／您',
            "Avoid mixing casual '你' and honorific '您' within the same UI string or prose flow."
          );
          break;
        }
        searchPos = idx + 1;
      }
    }
  }

  // Loanword plural -s adjacent to CJK characters
  for (const lw of shards.orthography.loanword_plural_strip) {
    const esc = escapeRegExp(lw);
    const pat = `(?:(?<=[\\u4e00-\\u9fff\\s])${esc}s(?=[\\u4e00-\\u9fff\\s，。！？、；：])|(?<=[\\u4e00-\\u9fff])${esc}s\\b|\\b${esc}s(?=[\\u4e00-\\u9fff]))`;
    scanRegex(
      workCarved,
      pat,
      lw,
      'LOANWORD_PLURAL_S',
      'CERTAIN',
      'MEDIUM',
      'loanword_style',
      `Strip English plural '-s' on loanword '${lw}' in Chinese sentences.`
    );
  }

  // 4. Standard-sensitive HK/TW/CN word forms & glyph variants
  for (const rule of shards.orthography.standard_sensitive_hk_tw_forms) {
    if (!rule.profiles.includes(profileId)) continue;
    const ruleBuf = maskLiterals(workCarved, rule.carveouts || []);

    for (const pair of rule.always_flag || []) {
      if (pair.noop) continue;
      scanLiteral(
        ruleBuf,
        pair.wrong,
        pair.right,
        rule.id,
        'CERTAIN',
        'HIGH',
        'regional_orthography',
        rule.rationale
      );
    }

    for (const pair of rule.literary_zhu_must_keep || []) {
      scanLiteral(
        ruleBuf,
        pair.wrong,
        pair.right,
        rule.id,
        'CERTAIN',
        'HIGH',
        'regional_orthography',
        rule.rationale
      );
    }

    if (rule.always_flag_regex) {
      scanRegex(
        ruleBuf,
        rule.always_flag_regex,
        (m) => rule.replacement_template.replaceAll('{1}', m[1] || ''),
        rule.id,
        'CERTAIN',
        'HIGH',
        'regional_orthography',
        rule.rationale
      );
    }

    if (standard === 'official') {
      if (rule.flag_in_official) {
        scanLiteral(
          ruleBuf,
          rule.flag_in_official.wrong,
          rule.flag_in_official.right,
          rule.id,
          'CERTAIN',
          'HIGH',
          'regional_orthography',
          rule.rationale
        );
      }
      if (rule.flag_in_official_regex) {
        scanRegex(
          ruleBuf,
          rule.flag_in_official_regex,
          (m) => rule.official_replacement_template.replaceAll('{1}', m[1] || ''),
          rule.id,
          'CERTAIN',
          'HIGH',
          'regional_orthography',
          rule.rationale
        );
      }
      for (const pair of rule.flag_in_official_words || []) {
        scanLiteral(
          ruleBuf,
          pair.wrong,
          pair.right,
          rule.id,
          'CERTAIN',
          'HIGH',
          'regional_orthography',
          rule.rationale
        );
      }
      for (const pair of rule.flag_in_official_advisory || []) {
        scanLiteral(
          ruleBuf,
          pair.wrong,
          pair.right,
          rule.id,
          'CONTEXT_DEPENDENT',
          'LOW',
          'regional_orthography',
          rule.rationale
        );
      }
    }
  }

  // Character-level HK_EDB vs TW_MOE glyph checks
  if (script === 'Hant') {
    for (const gv of shards.orthography.glyph_variants) {
      const gvBuf = maskLiterals(workCarved, gv.carveouts || []);
      if (glyphStd === 'HK_EDB') {
        const expected =
          standard === 'official' && gv.HK_EDB_official
            ? gv.HK_EDB_official
            : gv.HK_EDB_ui || gv.HK_EDB;
        const acceptedUi = new Set(gv.HK_EDB_accept_in_ui || []);
        const twChar = gv.TW_MOE;
        const hkOffChar = gv.HK_EDB_official || gv.HK_EDB;

        if (
          standard === 'ui' &&
          hkOffChar &&
          expected &&
          hkOffChar !== expected &&
          !acceptedUi.has(hkOffChar)
        ) {
          scanLiteral(
            gvBuf,
            hkOffChar,
            expected,
            'GLYPH_VARIANT_HK_UI',
            'CONTEXT_DEPENDENT',
            'MEDIUM',
            'glyph_standard',
            gv.rationale
          );
        }
        if (twChar !== expected && !(standard === 'ui' && acceptedUi.has(twChar))) {
          scanLiteral(
            gvBuf,
            twChar,
            expected,
            'GLYPH_VARIANT_HK_EDB',
            'CERTAIN',
            'HIGH',
            'glyph_standard',
            gv.rationale
          );
        }
        if (gv.CN_TGH === '里') {
          for (const word of gv.hant_context_words || []) {
            const hansWord = word.replaceAll('裏', '里').replaceAll('裡', '里');
            if (hansWord !== word) {
              scanLiteral(
                gvBuf,
                hansWord,
                word.replaceAll('裡', expected).replaceAll('裏', expected),
                'HANT_LOCATIVE_LI',
                'CERTAIN',
                'HIGH',
                'glyph_standard',
                gv.rationale
              );
            }
          }
        }
      } else if (glyphStd === 'TW_MOE') {
        const expected = gv.TW_MOE;
        for (const otherKey of ['HK_EDB', 'HK_EDB_official', 'HK_EDB_ui']) {
          const other = gv[otherKey];
          if (other && other !== expected) {
            scanLiteral(
              gvBuf,
              other,
              expected,
              'GLYPH_VARIANT_TW_MOE',
              'CERTAIN',
              'HIGH',
              'glyph_standard',
              gv.rationale
            );
          }
        }
        if (gv.CN_TGH === '里') {
          for (const word of gv.hant_context_words || []) {
            const hansWord = word.replaceAll('裏', '里').replaceAll('裡', '里');
            if (hansWord !== word) {
              scanLiteral(
                gvBuf,
                hansWord,
                word.replaceAll('裏', expected).replaceAll('裡', expected),
                'HANT_LOCATIVE_LI',
                'CERTAIN',
                'HIGH',
                'glyph_standard',
                gv.rationale
              );
            }
          }
        }
      }
    }
  }

  // 5. Regional lexicon & official statutory mismatches
  for (const entry of shards.official.terms) {
    const forbidList = (entry.forbidden_by_profile || {})[profileId] || [];
    let expected = (entry.translations || {})[profileId] || '';
    if (standard === 'ui' && entry.ui_overrides && entry.ui_overrides[profileId]) {
      expected = entry.ui_overrides[profileId];
    }
    for (const wrong of forbidList) {
      scanLiteral(
        workNoTitles,
        wrong,
        expected,
        `OFFICIAL_TERM_${entry.id.toUpperCase()}`,
        'CERTAIN',
        'HIGH',
        'official_terminology',
        `Regional statutory/official term mismatch for '${entry.english}' in ${profileId}. ${entry.notes || ''}`.trim()
      );
    }
  }

  for (const entry of shards.lexicon.entries) {
    const forbidList = (entry.forbidden_by_profile || {})[profileId] || [];
    const expected = (entry.variants || {})[profileId] || '';
    for (const wrong of forbidList) {
      scanLiteral(
        workNoTitles,
        wrong,
        expected,
        `REGIONAL_LEXICON_${entry.id.toUpperCase()}`,
        'CERTAIN',
        'HIGH',
        'regional_lexicon',
        `Regional vocabulary mismatch for '${entry.english}': ${profileId} uses '${expected}' rather than '${wrong}'.`
      );
    }
  }

  // 6. Register & Cantonese orthography rules
  const yueCfg = shards.cantonese;
  if (register === 'formal_swc') {
    const unquotedSwc = maskSpans(workNoTitles, [/「[^」]*」/g, /『[^』]*』/g, /“[^”]*”/g]);
    for (const item of yueCfg.formal_swc_cantonese_leaks.b2c_hk_consumer_relaxations) {
      const conf =
        standard === 'ui' && (profile.region === 'HK' || profile.region === 'MO')
          ? 'CONTEXT_DEPENDENT'
          : 'CERTAIN';
      const sev = conf === 'CONTEXT_DEPENDENT' ? 'LOW' : 'HIGH';
      scanLiteral(
        unquotedSwc,
        item.token,
        item.formal_replacement,
        conf === 'CONTEXT_DEPENDENT' ? 'CANTONESE_B2C_RELAXATION' : 'CANTONESE_IN_FORMAL_SWC',
        conf,
        sev,
        'register',
        item.rationale
      );
    }

    for (const item of yueCfg.formal_swc_cantonese_leaks.strict_tokens) {
      const sug = script === 'Hant' ? item.suggestion_hant : item.suggestion_hans;
      scanLiteral(
        unquotedSwc,
        item.token,
        sug,
        'CANTONESE_IN_FORMAL_SWC',
        'CERTAIN',
        'HIGH',
        'register',
        item.rationale
      );
    }

    for (const calque of yueCfg.formal_swc_cantonese_leaks.syntactic_calques) {
      scanRegex(
        unquotedSwc,
        calque.regex,
        (m) => {
          let sug = calque.suggestion_template;
          for (let gi = 1; gi < m.length; gi++) {
            sug = sug.replaceAll(`{${gi}}`, m[gi] || '');
          }
          return sug;
        },
        calque.id,
        'CERTAIN',
        'HIGH',
        'register',
        calque.rationale
      );
    }
  } else if (register === 'colloquial_yue') {
    for (const rule of yueCfg.colloquial_yue_orthography.universal_rules) {
      scanLiteral(
        workCarved,
        rule.wrong,
        rule.right,
        'CANTONESE_ORTHOGRAPHY',
        'CERTAIN',
        'HIGH',
        'cantonese_orthography',
        `${rule.rationale} (Jyutping: ${rule.jyutping})`
      );
    }
    if (cantoneseMode === 'lshk') {
      for (const rule of yueCfg.colloquial_yue_orthography.lshk_strict_rules) {
        const ruleBuf = maskLiterals(workCarved, rule.carveouts || []);
        if (rule.wrong_regex) {
          scanRegex(
            ruleBuf,
            rule.wrong_regex,
            (m) => rule.right_template.replaceAll('{1}', m[1] || ''),
            'CANTONESE_LSHK_ORTHOGRAPHY',
            'CERTAIN',
            'HIGH',
            'cantonese_orthography',
            `${rule.rationale} (Jyutping: ${rule.jyutping})`
          );
        } else {
          scanLiteral(
            ruleBuf,
            rule.wrong,
            rule.right,
            'CANTONESE_LSHK_ORTHOGRAPHY',
            'CERTAIN',
            'HIGH',
            'cantonese_orthography',
            `${rule.rationale} (Jyutping: ${rule.jyutping})`
          );
        }
      }
    }
  }

  // 7. Script character bleed (Simplified char in Hant or Traditional char in Hans)
  if (script === 'Hant') {
    for (let idx = 0; idx < workCarved.length; idx++) {
      const ch = workCarved[idx];
      if (claimed[idx] || ch === '\x00') continue;
      if (glyphStd === 'HK_EDB' && HK_EDB_SHARED_WITH_HANS.has(ch)) continue;
      if (register === 'colloquial_yue' && ch === '晒') continue;
      if (HANS_TO_HANT_MAP[ch]) {
        const sug = HANS_TO_HANT_MAP[ch];
        claimAndRecord(
          idx,
          idx + 1,
          'SIMPLIFIED_CHAR_IN_HANT',
          'CERTAIN',
          'HIGH',
          'script_mismatch',
          ch,
          sug,
          `Simplified character '${ch}' found in ${profileId} (Traditional); use '${sug}'.`
        );
      }
    }
  } else {
    const hansExempt = new Set(['着', '著', '乾', '幹']);
    for (let idx = 0; idx < workCarved.length; idx++) {
      const ch = workCarved[idx];
      if (claimed[idx] || ch === '\x00') continue;
      if (HANT_TO_HANS_MAP[ch] && !hansExempt.has(ch)) {
        const sug = HANT_TO_HANS_MAP[ch];
        if (sug !== ch) {
          claimAndRecord(
            idx,
            idx + 1,
            'TRADITIONAL_CHAR_IN_HANS',
            'CERTAIN',
            'HIGH',
            'script_mismatch',
            ch,
            sug,
            `Traditional character '${ch}' found in ${profileId} (Simplified); use '${sug}'.`
          );
        }
      }
    }
  }

  // 8. Surface punctuation: ellipsis, quotes, and halfwidth CJK punctuation
  if (styleMode === 'ui') {
    scanRegex(
      workCarved,
      '……|(?<=[\\u4e00-\\u9fff])\\.\\.\\.',
      '…',
      'ELLIPSIS_STYLE_UI',
      'CERTAIN',
      'MEDIUM',
      'punctuation',
      "Commercial UI style (--standard ui) uses a single horizontal ellipsis '…' (U+2026) rather than '……' or '...'."
    );
  } else if (styleMode === 'clreq') {
    if (CJK_CHAR_RE.test(workCarved)) {
      scanRegex(
        workCarved,
        '(?<!…)…(?!…)|(?<=[\\u4e00-\\u9fff])\\.\\.\\.',
        '……',
        'ELLIPSIS_STYLE_CLREQ',
        'CERTAIN',
        'MEDIUM',
        'punctuation',
        "Official / W3C clreq Chinese prose (--standard official) prescribes the two-character ellipsis '……' (U+2026 U+2026)."
      );
    }
  }

  if (script === 'Hant') {
    if (CJK_CHAR_RE.test(workCarved)) {
      scanRegex(
        workCarved,
        '[“”]',
        (m) => (m[0] === '“' ? '「' : '」'),
        'QUOTE_STYLE_HANT',
        'CONTEXT_DEPENDENT',
        'MEDIUM',
        'punctuation',
        `Traditional Chinese (${profileId}) uses corner brackets '「…」' rather than curly quotes.`
      );
    }
  } else {
    if (CJK_CHAR_RE.test(workCarved)) {
      scanRegex(
        workCarved,
        '[「」]',
        (m) => (m[0] === '「' ? '“' : '”'),
        'QUOTE_STYLE_HANS',
        'CONTEXT_DEPENDENT',
        'MEDIUM',
        'punctuation',
        `Simplified Chinese (${profileId}) uses double curly quotes '“…”' rather than corner brackets.`
      );
    }
  }

  const halfwidthMap = { ',': '，', ';': '；', ':': '：', '?': '？', '!': '！' };
  scanRegex(
    workCarved,
    '(?<=[\\u4e00-\\u9fff])([,;?!:])(?=[\\u4e00-\\u9fff])',
    (m) => halfwidthMap[m[1]],
    'HALFWIDTH_CJK_PUNCTUATION',
    'CERTAIN',
    'MEDIUM',
    'punctuation',
    'Use fullwidth Chinese punctuation between CJK characters.'
  );

  return sortFindings(findings);
}

/**
 * Convert characters between Simplified and Traditional scripts only.
 */
export function convertScriptOnly(text, targetScript, glyphStd) {
  if (targetScript === 'Hans') {
    let out = '';
    for (const ch of text) {
      out += HANT_TO_HANS_MAP[ch] || ch;
    }
    return out;
  }
  let out = '';
  for (const ch of text) {
    let mapped = HANS_TO_HANT_MAP[ch] || ch;
    if (glyphStd === 'HK_EDB' && HK_EDB_SHARED_WITH_HANS.has(ch)) {
      mapped = ch;
    }
    out += mapped;
  }
  if (glyphStd === 'HK_EDB') {
    out = out.replaceAll('裡', '裏').replaceAll('溫', '温');
  } else if (glyphStd === 'TW_MOE') {
    out = out.replaceAll('裏', '裡').replaceAll('温', '溫').replaceAll('衞', '衛').replaceAll('羣', '群');
  }
  return out;
}

/**
 * Localize Chinese copy across regional BCP-47 profiles while preserving carve-outs.
 */
export function localizeText(sourceText, targetProfiles, standardArg = 'ui', shards) {
  const isUiArg = ['ui', 'commercial', 'platform', 'auto'].includes(String(standardArg).toLowerCase());
  const standard = isUiArg ? 'ui' : normalizeStandard(standardArg, false);

  const protectedSpans = [];
  let working = sourceText;

  function protectSpan(spanStr, spanType, hantForm, hansForm) {
    if (!working.includes(spanStr)) return;
    const token = `__ZH_CARVEOUT_${protectedSpans.length}__`;
    working = working.replaceAll(spanStr, token);
    protectedSpans.push({
      token,
      original: spanStr,
      type: spanType,
      hant: hantForm,
      hans: hansForm
    });
  }

  for (const pat of PLACEHOLDER_PATTERNS) {
    const re = new RegExp(pat.source, pat.flags);
    const matches = [...working.matchAll(re)];
    for (const m of matches) {
      protectSpan(m[0], 'placeholder', m[0], m[0]);
    }
  }

  for (const m of [...working.matchAll(/《[^》]+》/g)]) {
    const lit = m[0];
    protectSpan(
      lit,
      'work_or_statute_title',
      convertScriptOnly(lit, 'Hant', 'HK_EDB'),
      convertScriptOnly(lit, 'Hans', 'CN_TGH')
    );
  }

  const sortedCarveouts = [...shards.official.preserved_carveouts].sort(
    (a, b) => Math.max(b.span_hant.length, b.span_hans.length) - Math.max(a.span_hant.length, a.span_hans.length)
  );
  for (const item of sortedCarveouts) {
    for (const cand of [item.span_hant, item.span_hans]) {
      if (working.includes(cand)) {
        protectSpan(cand, item.type, item.span_hant, item.span_hans);
      }
    }
  }

  const phraseRules = [];
  for (const entry of shards.official.terms) {
    const trans = { ...entry.translations };
    if (standard === 'ui' && entry.ui_overrides) {
      Object.assign(trans, entry.ui_overrides);
    }
    const allForms = new Set([
      ...Object.values(entry.translations || {}),
      ...Object.values(entry.ui_overrides || {})
    ]);
    for (const forbVals of Object.values(entry.forbidden_by_profile || {})) {
      for (const fv of forbVals) allForms.add(fv);
    }
    for (const srcForm of allForms) {
      if (srcForm.length >= 2) {
        phraseRules.push([srcForm, trans]);
      }
    }
  }

  for (const entry of shards.lexicon.entries) {
    const trans = { ...entry.variants };
    const allForms = new Set(Object.values(trans));
    for (const forbVals of Object.values(entry.forbidden_by_profile || {})) {
      for (const fv of forbVals) allForms.add(fv);
    }
    for (const srcForm of allForms) {
      if (srcForm.length >= 2) {
        phraseRules.push([srcForm, trans]);
      }
    }
  }

  const disambigCommon = [
    ['头发', { Hant: '頭髮', Hans: '头发' }],
    ['理发', { Hant: '理髮', Hans: '理发' }],
    ['以后', { Hant: '以後', Hans: '以后' }],
    ['之后', { Hant: '之後', Hans: '之后' }],
    ['最后', { Hant: '最後', Hans: '最后' }],
    ['稍后', { Hant: '稍後', Hans: '稍后' }],
    ['请稍候', { Hant: '請稍候', Hans: '请稍候' }],
    ['复杂', { Hant: '複雜', Hans: '复杂' }],
    ['复制', { Hant: '複製', Hans: '复制' }],
    ['重复', { Hant: '重複', Hans: '重复' }],
    ['恢复', { Hant: '恢復', Hans: '恢复' }],
    ['日历', { Hant: '日曆', Hans: '日历' }],
    ['历史', { Hant: '歷史', Hans: '历史' }],
    ['范围', { Hant: '範圍', Hans: '范围' }],
    ['规范', { Hant: '規範', Hans: '规范' }],
    ['联系', { Hant: '聯繫', Hans: '联系' }],
    ['关系', { Hant: '關係', Hans: '关系' }],
    ['系统', { Hant: '系統', Hans: '系统' }],
    ['准备', { Hant: '準備', Hans: '准备' }],
    ['标准', { Hant: '標準', Hans: '标准' }],
    ['准确', { Hant: '準確', Hans: '准确' }],
    ['注册', { Hant: '註冊', Hans: '注册' }],
    ['标签', { Hant: '標籤', Hans: '标签' }],
    ['书签', { Hant: '書籤', Hans: '书签' }],
    ['制造', { Hant: '製造', Hans: '制造' }],
    ['制作', { Hant: '製作', Hans: '制作' }],
    ['了解', { Hant: '了解', Hans: '了解' }]
  ];

  phraseRules.sort((a, b) => b[0].length - a[0].length);

  const outputs = {};
  for (const rawProf of targetProfiles) {
    const profId = resolveProfile(rawProf, shards);
    const prof = shards.profiles_and_code.profiles[profId];
    const script = prof.script;
    const glyphStd = prof.glyph_standard;

    let stage = working;
    const phraseTokens = [];
    for (const [srcPhrase, targetMap] of phraseRules) {
      if (stage.includes(srcPhrase) && targetMap[profId]) {
        const ptok = `__ZH_PHRASE_${phraseTokens.length}__`;
        stage = stage.replaceAll(srcPhrase, ptok);
        phraseTokens.push([ptok, targetMap[profId]]);
      }
    }

    for (const [srcPhrase, scriptMap] of disambigCommon) {
      if (stage.includes(srcPhrase)) {
        const ptok = `__ZH_PHRASE_${phraseTokens.length}__`;
        stage = stage.replaceAll(srcPhrase, ptok);
        phraseTokens.push([ptok, scriptMap[script]]);
      }
    }

    stage = convertScriptOnly(stage, script, glyphStd);

    for (const [ptok, replacement] of phraseTokens) {
      stage = stage.replaceAll(ptok, replacement);
    }

    if (profId === 'zh-Hant-HK' || profId === 'zh-Hant-MO' || profId === 'yue-Hant-HK') {
      if (standard === 'official') {
        stage = stage
          .replaceAll('帳戶', '賬戶')
          .replaceAll('群組', '羣組')
          .replaceAll('身份驗證', '身分驗證');
      } else {
        stage = stage.replaceAll('羣組', '群組');
      }
    } else if (profId === 'zh-Hant-TW') {
      stage = stage.replaceAll('賬戶', '帳戶').replaceAll('身份驗證', '身分驗證');
    }

    if (standard === 'ui') {
      stage = stage.replaceAll('……', '…');
    } else {
      stage = stage.replace(/(?<!…)…(?!…)/g, '……');
    }

    if (script === 'Hant') {
      stage = stage.replaceAll('“', '「').replaceAll('”', '」');
    } else {
      stage = stage.replaceAll('「', '“').replaceAll('」', '”');
    }

    for (const item of protectedSpans) {
      let val;
      if (item.type === 'placeholder') {
        val = item.original;
      } else if (item.type === 'work_or_statute_title') {
        val = convertScriptOnly(item.original, script, glyphStd);
      } else {
        val = script === 'Hant' ? item.hant : item.hans;
        if (glyphStd === 'TW_MOE' && item.type === 'us_state_homograph') {
          val = '喬治亞州';
        }
      }
      stage = stage.replaceAll(item.token, val);
    }

    outputs[profId] = stage;
  }

  return {
    source: sourceText,
    standard,
    preserved_carveouts: protectedSpans
      .filter((p) => p.type !== 'placeholder')
      .map((p) => ({ span: p.original, type: p.type })),
    localizations: outputs
  };
}

/**
 * Look up official statutory, org, toponym, and regional lexicon terms offline.
 * Supports both exact and partial substring search for interactive UI lookup.
 */
export function lookupTerms(query, standardArg = 'official', shards) {
  const standard = ['ui', 'commercial', 'platform'].includes(String(standardArg).toLowerCase())
    ? 'ui'
    : 'official';
  const qNorm = String(query || '').trim().toLowerCase();
  if (!qNorm) return [];

  const exact = [];
  const partial = [];

  for (const entry of shards.official.terms) {
    const names = [
      entry.english.toLowerCase(),
      entry.id.toLowerCase(),
      ...(entry.aliases || []).map((a) => a.toLowerCase()),
      ...Object.values(entry.translations || {}).map((v) => v.toLowerCase())
    ];
    const trans = { ...entry.translations };
    if (standard === 'ui' && entry.ui_overrides) {
      Object.assign(trans, entry.ui_overrides);
    }
    const item = {
      matched_id: entry.id,
      english: entry.english,
      category: entry.category,
      standard,
      translations: trans,
      alternates: entry.alternates || {},
      notes: entry.notes || ''
    };
    if (names.includes(qNorm)) {
      exact.push(item);
    } else if (names.some((n) => n.includes(qNorm))) {
      partial.push(item);
    }
  }

  for (const entry of shards.lexicon.entries) {
    const names = [
      entry.english.toLowerCase(),
      entry.id.toLowerCase(),
      ...Object.values(entry.variants || {}).map((v) => v.toLowerCase())
    ];
    const item = {
      matched_id: entry.id,
      english: entry.english,
      category: entry.category,
      standard,
      translations: { ...entry.variants },
      alternates: {},
      notes: entry.notes || ''
    };
    if (names.includes(qNorm)) {
      exact.push(item);
    } else if (names.some((n) => n.includes(qNorm))) {
      partial.push(item);
    }
  }

  return [...exact, ...partial];
}

/**
 * Extract the primary actionable replacement when a suggestion lists alternatives like "他／她／它".
 */
export function getPrimarySuggestion(suggestion) {
  if (!suggestion) return '';
  const parts = String(suggestion).split(/[／/]/).map((s) => s.trim()).filter(Boolean);
  return parts[0] || suggestion;
}

/**
 * Get all candidate replacement chips from a suggestion string (e.g. "請／謝謝" -> ["請", "謝謝"]).
 */
export function getSuggestionOptions(suggestion) {
  if (!suggestion) return [];
  const raw = String(suggestion).trim();
  // Don't split terms that intentionally contain '/' such as '國家/地區'
  if (raw.includes('國家/地區') || raw.includes('国家/地区')) {
    return [raw];
  }
  const parts = raw.split('／').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [raw];
}

/**
 * Apply a single finding replacement safely at its exact span.
 */
export function applyFix(text, finding, chosenReplacement = null) {
  const replacement = chosenReplacement ?? getPrimarySuggestion(finding.suggestion);
  if (
    typeof finding.start !== 'number' ||
    typeof finding.end !== 'number' ||
    finding.start < 0 ||
    finding.end > text.length
  ) {
    return text;
  }
  if (text.slice(finding.start, finding.end) !== finding.found) {
    // Text drifted; fallback to first occurrence near start
    const nearby = text.indexOf(finding.found, Math.max(0, finding.start - 16));
    if (nearby === -1) return text;
    return text.slice(0, nearby) + replacement + text.slice(nearby + finding.found.length);
  }
  return text.slice(0, finding.start) + replacement + text.slice(finding.end);
}

/**
 * Apply all non-overlapping fixes (by default CERTAIN rule defects only) from right to left.
 */
export function applyAllFixes(text, findings, { certainOnly = true } = {}) {
  const eligible = findings
    .filter((f) => (!certainOnly || f.confidence === 'CERTAIN') && f.suggestion && f.found !== f.suggestion)
    .sort((a, b) => b.start - a.start);

  let updated = text;
  let lastStart = Infinity;
  let appliedCount = 0;

  for (const f of eligible) {
    if (f.end > lastStart) continue; // skip overlapping spans
    if (updated.slice(f.start, f.end) !== f.found) continue;
    const replacement = getPrimarySuggestion(f.suggestion);
    updated = updated.slice(0, f.start) + replacement + updated.slice(f.end);
    lastStart = f.start;
    appliedCount += 1;
  }

  return { text: updated, appliedCount };
}
