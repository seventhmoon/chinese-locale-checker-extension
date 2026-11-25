# ZhOrtho — Local Chinese & Cantonese Checker (Chrome Extension)

[![CI](https://github.com/seventhmoon/chinese-locale-checker-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/seventhmoon/chinese-locale-checker-extension/actions/workflows/ci.yml)

A **100% local, zero-cloud** Manifest V3 Chrome extension for real-time **Chinese (`zh-*`)** and **Written Cantonese (`yue-Hant-HK`)** orthography, regional lexicon, and grammar checking inside web text fields (`<input>`, `<textarea>`, and `contenteditable`), built directly on the rule shards of [`seventhmoon/chinese-locale-and-orthography`](https://github.com/seventhmoon/chinese-locale-and-orthography) with an **optional on-device Chrome Gemini Nano AI** layer.

## Key Features

- **Grammarly / LanguageTool-Style In-Page Checking**:
  - Works on `<textarea>`, text `<input>`, and rich `contenteditable` editors (Gmail, Notion, GitHub, Reddit, X, Threads, LinkedIn, etc.).
  - Renders non-destructive colored inline underlines inside an isolated **Shadow DOM** overlay (**red** = certain orthography/lexicon defect, **amber** = context-dependent advisory, **violet dotted** = on-device Gemini Nano contextual suggestion).
  - Floating corner status pill (`正 ✓` / issue count) with 1-click **Fix All (Certain)**, profile/standard quick-switcher, and hover/click suggestion cards.
  - **IME-safe**: pauses checks during active Cangjie / Quick / Pinyin / Zhuyin / Jyutping composition (`compositionstart`/`compositionend`).
- **4-Axis Chinese & Cantonese Rule Engine (Instant, Offline)**:
  - **7 BCP-47 Profiles**: `zh-Hant-HK`, `yue-Hant-HK`, `zh-Hant-MO`, `zh-Hant-TW`, `zh-Hans-CN`, `zh-Hans-SG`, `zh-Hans-MY`.
  - **Normative Standards**: Switch between **UI / Commercial** (`…`, HK commercial `帳戶`/`群組`/`身份驗證`, conventional Cantonese `俾`/`哂`/`試吓`) and **Official / Educational** (`……`, HK EDB `賬戶`/`羣組`/`身分`/`着` vs `著`, TW MoE `計畫`/`澈底`, strict LSHK Jyutping `正字` `畀`/`晒`/`下`/`而家`/`噉樣`).
  - **Checks Included**: Japanese Kanji / Shinjitai / Kokuji bleed (`値`/`歩`/`黒`/`税込`/`読込`/`注文確認`/`の`), 1-to-many `Hans → Hant` conversion traps (`發`/`髮`, `後`/`后`, `乾`/`幹`/`干`, `復`/`複`, `歷`/`曆`, `請稍候`), collocations (`迫`/`逼`, `截至`/`截止`, `必須`/`必需`, `登入`/`登陸`, `您們`), regional vocabulary (`軟件`/`軟體`, `記憶體`/`内存`, `快取`/`缓存`, `的士`/`計程車`), official statutory/toponym translations (`私隱政策`/`隱私權政策`, `東盟`/`東協`/`亚细安`), and formal SWC Cantonese leaks & syntactic calques (`走先`, `好過預期`, `給一份報告我`).
  - **Protected Carve-Outs**: Automatically protects domestic agency titles (`香港個人資料（私隱）專員公署`), local streets (`中環荷里活道`), statutory names (`香港身份證`), book/statute titles (`《…》`), culinary homographs (`冰糖燉雪梨`), Kana/Hangul spans, and placeholders (`%1$s`, `{var}`).
- **Optional On-Device Gemini Nano AI (Chrome Built-in AI)**:
  - Toggle **Use Local Gemini Nano** in the extension popup to layer contextual grammar, homophone (`在`/`再`, `的`/`得`/`地`), and phrasing checks using Chrome's built-in `LanguageModel` Prompt API (Gemini Nano).
  - Supports **Auto (after typing pause)** or **Manual (`✦ Gemini Nano` button)** trigger modes, live model download progress, and automatic Offscreen Document fallback when a Document context is required.
  - Deterministic rules remain authoritative for exact codepoints (`裏`/`裡`, `温`/`溫`, `値`/`值`), and Gemini Nano suggestions are strictly validated against the source text and protected carve-outs.
- **Built-in Side Panel Workbench**:
  - **Checker Playground** (with 1-click Fix All, local Gemini Nano Check, and local Gemini Nano Polish)
  - **Multi-Locale Localizer** (convert copy across HK / MO / TW / CN / SG / MY simultaneously while preserving carve-outs)
  - **Offline Glossary & Statutory Term Lookup** (`Privacy Policy`, `ASEAN`, `Saudi Arabia`, `software`, `taxi`, etc.)
  - **Personal Ignored Words Manager**

## 100% Local-Only Privacy Guarantee

- **Zero external network requests**: `manifest.json` declares **no external `host_permissions`** and enforces `content_security_policy.extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self';"`.
- All deterministic rules and JSON shards are bundled inside the extension package.
- When enabled, Gemini Nano executes strictly on-device via Chrome's browser-managed `LanguageModel` API.
- Automated privacy tests (`test/manifest-and-privacy.test.mjs`) verify zero outbound network calls on every CI run. See [PRIVACY.md](PRIVACY.md).

## Installation (Load Unpacked — Zero Build Step)

1. Clone this repository:
   ```bash
   git clone https://github.com/seventhmoon/chinese-locale-checker-extension.git
   ```
2. Open Chrome (`chrome://extensions`).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the cloned `chinese-locale-checker-extension` folder.
5. Open [`demo/test-page.html`](demo/test-page.html) (enable *"Allow access to file URLs"* in extension details, or serve locally via `python3 -m http.server`) and click into any text field to try inline underlines and popovers immediately.

## Enabling Local Gemini Nano (Optional)

Chrome's built-in Prompt API (`LanguageModel`) runs Gemini Nano locally on **Chrome 138+ Desktop** (Windows 10/11, macOS 13+, Linux, or Chromebook Plus with ≥ 4 GB VRAM or ≥ 16 GB RAM & 4+ CPU cores, and ≥ 22 GB free disk space):

1. Open `chrome://flags/#prompt-api-for-gemini-nano` and set it to **Enabled** (if not already enabled by default in your Chrome version).
2. Open `chrome://flags/#optimization-guide-on-device-model` and set it to **Enabled BypassPerfRequirement** (if needed) and restart Chrome.
3. Click the **ZhOrtho** toolbar icon, toggle **Use Local Gemini Nano**, and click **Download / Prepare Model** if the status shows `Downloadable`.
4. You can inspect Chrome's local model state anytime at `chrome://on-device-internals`.

## Repository Layout

```text
chinese-locale-checker-extension/
├── manifest.json                   # MV3 manifest (connect-src 'self', zero external hosts)
├── core/
│   ├── zh-audit-engine.js          # Zero-dependency JS port of chinese-locale-and-orthography
│   ├── nano-client.js              # On-device Chrome Built-in AI (Gemini Nano) client
│   ├── settings.js                 # Local storage preferences & 4-axis profile metadata
│   └── shards-loader.js            # Local bundled JSON shard loader
├── data/                           # Modular JSON rule shards synced from the skill
│   ├── profiles_and_code.json
│   ├── orthography_and_glyphs.json
│   ├── cantonese.json
│   ├── regional_lexicon.json
│   └── official_translations.json
├── content/
│   └── content.js                  # Shadow DOM underlines, floating pill & popover UI
├── background/
│   └── service-worker.js           # Settings, context menus & local Gemini Nano routing
├── offscreen/
│   ├── offscreen.html              # Offscreen document fallback host for Gemini Nano
│   └── offscreen.js
├── popup/                          # Toolbar settings & Gemini Nano status/download UI
├── sidepanel/                      # Workbench (Checker, Multi-Locale Localizer, Glossary, Ignored)
├── demo/
│   └── test-page.html              # Interactive local test page (<input>, <textarea>, contenteditable)
├── scripts/
│   ├── sync-skill-data.sh          # Sync updated JSON shards from chinese-locale-and-orthography
│   └── package.sh                  # Package Chrome Web Store zip archive
└── test/                           # Node 22 unit, skill-parity, Nano mock & privacy tests
```

## Syncing Rule Shards from the Skill

Whenever [`seventhmoon/chinese-locale-and-orthography`](https://github.com/seventhmoon/chinese-locale-and-orthography) updates its JSON shards:

```bash
bash scripts/sync-skill-data.sh /path/to/chinese-locale-and-orthography
npm test
```

## Running Tests & Packaging

```bash
# Run full unit, parity, Gemini Nano mock & local-only privacy test suite (Node 22+)
npm test

# Build Chrome Web Store zip package into dist/
npm run package
```

## License

[MIT](LICENSE)
