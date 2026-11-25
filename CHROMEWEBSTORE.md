# Chrome Web Store Submission Kit — Corrector Ai

Everything required to publish **Corrector Ai — Chinese & Cantonese Checker** on the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## 1. Store Listing Details

### Extension Name (max 45 chars)
- **English (`en`)**: `Corrector Ai — Chinese & Cantonese Checker` *(42 chars)*
- **Traditional Chinese (`zh_TW`)**: `Corrector Ai — 本地中文及粵文正字校對`
- **Simplified Chinese (`zh_CN`)**: `Corrector Ai — 本地中文及粤文正字校对`

### Short Description / Summary (max 132 chars)
- **English (`en`)**: `100% local Chinese & Cantonese orthography, regional lexicon & grammar checker for text fields with on-device Gemini Nano AI.` *(125 chars)*
- **Traditional Chinese (`zh_TW`)**: `100% 本地運行的繁簡中文及粵文正字、地區詞彙與語法校對擴充功能，支援網頁文字框即時標記與本機 Gemini Nano AI。`
- **Simplified Chinese (`zh_CN`)**: `100% 本地运行的简繁中文及粤文正字、地区词汇与语法校对扩展程序，支持网页文本框即时标记与本机 Gemini Nano AI。`

### Category & Language
- **Category**: `Productivity` (or `Communication` / `Workflow & Planning`)
- **Primary Language**: `English` (localized via `_locales/en`, `_locales/zh_TW`, `_locales/zh_CN`)

### Detailed Description (English — Ready to Paste)

```text
Corrector Ai is a 100% local, privacy-first Chinese & Cantonese orthography, regional lexicon, and grammar checker for web text fields — with optional on-device Gemini Nano AI built into Chrome.

Unlike generic spell checkers that treat Chinese as a simple zh-CN vs. zh-TW toggle, Corrector Ai checks your writing across four independent linguistic axes:
• 7 Regional BCP-47 Profiles: Hong Kong Traditional (zh-Hant-HK), Hong Kong Written Cantonese (yue-Hant-HK), Macau Traditional (zh-Hant-MO), Taiwan Traditional (zh-Hant-TW), Mainland China Simplified (zh-Hans-CN), Singapore Simplified (zh-Hans-SG), and Malaysia Simplified (zh-Hans-MY).
• Normative Standards: Switch between Commercial UI Style Guides (single ellipsis …, HK commercial 帳戶/群組/身份驗證, conventional Cantonese 俾/哂) and Official / Educational Authorities (HK EDB 賬戶/羣組/身分/着 vs 著, TW MoE 計畫/澈底, LSHK Jyutping 正字 畀/晒/下/而家/噉樣, W3C clreq ……).
• Written Registers: Standard Written Chinese (書面語) vs. Written Cantonese (粵文), including Cantonese leak and syntactic calque detection (走先, 好過預期, 給一份報告我).

WHAT IT CATCHES INSTANTLY (OFFLINE):
• Japanese Kanji / Shinjitai / Kokuji bleed (値/歩/黒/税込/読込/注文確認/の)
• One-to-many Simplified-to-Traditional conversion traps (發/髮, 後/后, 乾/幹/干, 復/複, 歷/曆, 範/范, 係/系/繫, 註/注, 籤/簽, 請稍候)
• High-frequency collocations & typos (迫不及待, 截至/截止, 必須/必需, 國籍/藉此, 登入/登陸, 您們, mixed 你/您)
• Regional software, everyday & statutory vocabulary mismatches (軟件/軟體, 記憶體/内存, 快取/缓存, 私隱政策/隱私權政策, 東盟/東協/亚细安, 的士/計程車/德士)
• Smart Carve-Out Protection: Automatically preserves domestic agencies (香港個人資料（私隱）專員公署), local streets (中環荷里活道), statutory names (香港身份證), book/statute titles (《…》), and culinary homographs (冰糖燉雪梨).

OPTIONAL ON-DEVICE GEMINI NANO AI:
Enable "Use Local Gemini Nano" in the popup to layer contextual grammar, homophone (在/再, 的/得/地), and phrasing suggestions powered by Chrome's built-in on-device Prompt API (Chrome 138+ desktop). No API keys, no servers, no cloud uploads.

BUILT-IN SIDE PANEL WORKBENCH:
• Checker Playground with 1-click Fix All & local Gemini Nano Check / Polish
• Multi-Locale Localizer (convert copy across HK, MO, TW, CN, SG, MY while preserving carve-outs)
• Offline Statutory & Regional Glossary Lookup
• Personal Ignored Words Dictionary

STRICTLY 100% LOCAL & PRIVATE:
• Zero external network requests (enforced by Manifest V3 CSP connect-src 'self')
• Zero telemetry, analytics, or third-party servers
• Works completely offline in <input>, <textarea>, and rich contenteditable editors with full IME composition safety.
```

---

## 2. Visual Assets Checklist

All assets in `promo/` are rendered as 24-bit RGB PNG (no alpha channel) at exact Chrome Web Store dimensions:

| Asset | Dimensions | Status | File Path |
| :--- | :--- | :--- | :--- |
| Store Icon [REQUIRED] | `128×128` PNG | ✅ Ready | `icons/icon128.png` |
| Screenshot 1 [REQUIRED] | `1280×800` PNG (RGB) | ✅ Ready | `promo/screenshot-1-inline-checker.png` |
| Screenshot 2 [RECOMMENDED] | `1280×800` PNG (RGB) | ✅ Ready | `promo/screenshot-2-popup-gemini-nano.png` |
| Screenshot 3 [RECOMMENDED] | `1280×800` PNG (RGB) | ✅ Ready | `promo/screenshot-3-sidepanel-workbench.png` |
| Small Promo Tile [RECOMMENDED] | `440×280` PNG (RGB) | ✅ Ready | `promo/promo-small.png` |
| Marquee Promo Tile [OPTIONAL] | `1400×560` PNG (RGB) | ✅ Ready | `promo/promo-marquee.png` |

---

## 3. Single Purpose & Permissions Justification (Privacy Practices Tab)

### Single Purpose Statement [REQUIRED]
> Corrector Ai performs 100% local, offline-capable Chinese and Cantonese orthography, regional lexicon, and grammar proofreading inside editable web text fields and its companion side-panel workbench, with optional on-device Chrome Gemini Nano AI assistance.

### Permissions Justification Table [REQUIRED]

| Permission | Type | Exact Justification for Chrome Web Store Reviewers |
| :--- | :--- | :--- |
| `storage` | `permissions` | Stores user preferences (selected BCP-47 profile, UI vs. Official standard, Gemini Nano opt-in toggle, per-site paused hostnames, and personal ignored words) strictly locally in `chrome.storage.local`. |
| `activeTab` | `permissions` | Reads only the hostname of the currently active tab when the user clicks the extension toolbar icon, enabling the per-site "Pause / Resume on site" toggle without requesting broad `tabs` permission. |
| `contextMenus` | `permissions` | Adds right-click context menu items ("Check Chinese / Cantonese with Corrector Ai" and "Open Corrector Ai Workbench") on selected or editable text so users can inspect highlighted text in the Side Panel. |
| `sidePanel` | `permissions` | Provides the docked Corrector Ai Workbench (Checker Playground, Multi-Locale Localizer, Offline Glossary, and Ignored Words manager) alongside web pages. |
| `offscreen` | `permissions` | Used solely as a local fallback DOM document host for Chrome's built-in on-device Prompt API (`LanguageModel` / Gemini Nano) on Chrome builds where the Prompt API requires a Document context rather than a Service Worker context. |
| `https://*/*`, `http://*/*` | `content_scripts` / `web_accessible_resources` | Enables real-time in-page checking inside `<input>`, `<textarea>`, and `contenteditable` fields on any website where the user types Chinese or Cantonese text. Runs entirely locally; dormant until the user focuses an editable field containing CJK characters. |

### Host Permissions
- **None** (`host_permissions` is omitted). All rules are bundled locally and CSP restricts `connect-src 'self'`.

### Are you using remote code?
- **No** — No remote scripts, remote `eval`, or external network calls exist anywhere in the extension.

---

## 4. Privacy & Data Use Disclosure

**Does this extension collect or transmit user data?** **No.**

| Data Type | Collected? | Transmitted Off-Device? |
| :--- | :--- | :--- |
| Personally identifiable information | No | No |
| Health information | No | No |
| Financial and payment information | No | No |
| Authentication information | No | No |
| Personal communications | No | No |
| Location | No | No |
| Web history | No | No |
| User activity | No | No |
| Website content | No | No |

### Data Use Certifications
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy Policy URL [REQUIRED]
`https://github.com/seventhmoon/chinese-locale-checker-extension/blob/main/PRIVACY.md`

---

## 5. Distribution & Developer Info

- **Visibility**: Public
- **Regions**: All regions
- **Pricing**: Free
- **Publisher Name**: Fung Lam
- **Contact Email**: `fung@androidfung.com`
- **Homepage URL**: `https://github.com/seventhmoon/chinese-locale-checker-extension`
- **Support URL**: `https://github.com/seventhmoon/chinese-locale-checker-extension/issues`

---

## 6. Step-by-Step Publishing Guide

1. **Build & Verify Upload Archive**:
   ```bash
   npm test
   npm run package
   ```
   This produces `dist/corrector-ai-v1.0.0.zip` containing only production extension files (excluding `test/`, `demo/`, `promo/`, and `scripts/`).
2. **Open Chrome Web Store Developer Dashboard**:
   Visit `https://chrome.google.com/webstore/devconsole` and click **New Item**.
3. **Upload Package**:
   Upload `dist/corrector-ai-v1.0.0.zip`.
4. **Fill Store Listing Tab**:
   - Paste the Detailed Description above.
   - Upload `promo/screenshot-1-inline-checker.png`, `promo/screenshot-2-popup-gemini-nano.png`, `promo/screenshot-3-sidepanel-workbench.png`.
   - Upload `promo/promo-small.png` (`440×280`) and `promo/promo-marquee.png` (`1400×560`).
   - Add Homepage URL and Support URL.
5. **Fill Privacy Practices Tab**:
   - Paste the **Single Purpose Statement** and **Permissions Justifications** from Section 3.
   - Select **No** for remote code and **No** for all data collection checkboxes.
   - Enter the Privacy Policy URL from Section 4.
6. **Submit for Review**:
   Click **Save Draft**, review all tabs for green checkmarks, then click **Submit for Review**.
