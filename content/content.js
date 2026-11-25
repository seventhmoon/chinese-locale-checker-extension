/**
 * Corrector Ai — In-Page Grammar, Orthography & Locale Checker (Content Script).
 *
 * Monitors <textarea>, text <input>, and contenteditable fields.
 * - Deterministic 4-axis Chinese & Cantonese rules run instantaneously in-page.
 * - Optional Chrome Built-in AI (Gemini Nano) runs locally via extension messaging.
 * - Renders Grammarly-style colored underlines, floating status pill, and
 *   interactive 1-click fix popovers inside an isolated Shadow DOM.
 *
 * Strictly 100% local processing — zero external requests.
 */

(() => {
  if (window.__CORRECTOR_AI_LOADED__) return;
  window.__CORRECTOR_AI_LOADED__ = true;

  const SUPPORTED_INPUT_TYPES = new Set(['', 'text', 'search', 'email', 'url']);
  const PROFILE_SHORT = {
    'zh-Hant-HK': 'HK 繁體',
    'yue-Hant-HK': 'HK 粵文',
    'zh-Hant-MO': 'MO 繁體',
    'zh-Hant-TW': 'TW 繁體',
    'zh-Hans-CN': 'CN 简体',
    'zh-Hans-SG': 'SG 简体',
    'zh-Hans-MY': 'MY 简体'
  };

  let engineMod = null;
  let shards = null;
  let settings = {
    enabled: true,
    profile: 'zh-Hant-HK',
    standard: 'ui',
    register: 'auto',
    useGeminiNano: false,
    nanoTriggerMode: 'auto',
    showAdvisories: true,
    showInlineUnderlines: true,
    disabledCategories: [],
    disabledHosts: [],
    ignoredTerms: []
  };

  let activeEl = null;
  let isComposing = false;
  let ruleTimer = null;
  let nanoTimer = null;
  let nanoRunning = false;
  let nanoRequestSeq = 0;
  let currentText = '';
  let ruleFindings = [];
  let nanoFindings = [];
  let dismissedIds = new Set();

  let popoverMode = null; // null | 'card' | 'panel'
  let activeFindingId = null;
  let hoverHideTimer = null;
  let lastNanoCheckedText = '';
  let lastNanoStatusNote = '';

  // Shadow DOM UI elements
  let shadowHost = null;
  let shadowRoot = null;
  let underlineLayer = null;
  let pillBtn = null;
  let popoverEl = null;
  let mirrorEl = null;

  const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\u{20000}-\u{2ceaf}]/u;

  function isHostDisabled() {
    const host = location.hostname || '';
    return Array.isArray(settings.disabledHosts) && settings.disabledHosts.includes(host);
  }

  function isEditableElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.closest?.('#corrector-ai-shadow-host')) return false;
    if (el.getAttribute?.('data-corrector-ai-ignore') === 'true') return false;

    const tag = el.tagName;
    if (tag === 'TEXTAREA') {
      return !el.disabled && !el.readOnly;
    }
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return SUPPORTED_INPUT_TYPES.has(type) && !el.disabled && !el.readOnly;
    }
    if (el.isContentEditable) {
      // Find the root contenteditable container
      return true;
    }
    return false;
  }

  function resolveEditableRoot(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return isEditableElement(el) ? el : null;
    }
    let cur = el;
    let root = null;
    while (cur && cur.nodeType === Node.ELEMENT_NODE) {
      if (cur.isContentEditable) {
        root = cur;
        if (
          cur.getAttribute('contenteditable') === 'true' ||
          cur.getAttribute('contenteditable') === '' ||
          cur.getAttribute('contenteditable') === 'plaintext-only' ||
          cur.getAttribute('role') === 'textbox'
        ) {
          // Continue climbing only if parent is also contenteditable
          if (!cur.parentElement?.isContentEditable) {
            return cur;
          }
        }
      } else if (root) {
        break;
      }
      cur = cur.parentElement;
    }
    return root;
  }

  function isFieldLargeEnough(el) {
    const rect = el.getBoundingClientRect();
    return rect.width >= 72 && rect.height >= 18;
  }

  /**
   * Extract plain text + text-node offset map for contenteditable elements.
   */
  function extractContentEditableModel(root) {
    const segments = [];
    let fullText = '';

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'BR') return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        }
        if (node.nodeValue && node.nodeValue.length > 0) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    });

    let lastBlock = null;
    const findBlock = (node) => {
      let p = node.parentElement;
      while (p && p !== root) {
        const display = getComputedStyle(p).display;
        if (display === 'block' || display === 'list-item' || display === 'flex' || display === 'grid') {
          return p;
        }
        p = p.parentElement;
      }
      return root;
    };

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
        fullText += '\n';
        continue;
      }
      const blk = findBlock(node);
      if (lastBlock && blk !== lastBlock && fullText.length > 0 && !fullText.endsWith('\n')) {
        fullText += '\n';
      }
      lastBlock = blk;

      const start = fullText.length;
      const val = node.nodeValue;
      fullText += val;
      segments.push({ node, start, end: start + val.length });
    }

    return { text: fullText, segments };
  }

  function getFieldText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    return extractContentEditableModel(el).text;
  }

  function getCombinedFindings() {
    const merged = [...ruleFindings, ...nanoFindings].filter((f) => !dismissedIds.has(f.id));
    merged.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });
    return merged;
  }

  // ---------------------------------------------------------------------------
  // Shadow DOM Overlay UI
  // ---------------------------------------------------------------------------

  function ensureShadowUI() {
    if (shadowHost && document.documentElement.contains(shadowHost)) return;

    shadowHost = document.createElement('div');
    shadowHost.id = 'corrector-ai-shadow-host';
    shadowHost.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483645;pointer-events:none;';
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        font-family: "PingFang HK", "Noto Sans HK", "PingFang TC", "Microsoft JhengHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        line-height: 1.45;
        color: #111827;
      }
      * { box-sizing: border-box; }

      .zh-underlines {
        position: fixed;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .zh-ul {
        position: fixed;
        pointer-events: auto;
        cursor: pointer;
        border-radius: 2px;
        transition: background-color 0.12s ease;
      }
      .zh-ul-certain {
        border-bottom: 2px solid #dc2626;
        background: rgba(220, 38, 38, 0.08);
      }
      .zh-ul-certain:hover {
        background: rgba(220, 38, 38, 0.2);
      }
      .zh-ul-advisory {
        border-bottom: 2px dashed #d97706;
        background: rgba(217, 119, 6, 0.08);
      }
      .zh-ul-advisory:hover {
        background: rgba(217, 119, 6, 0.2);
      }
      .zh-ul-nano {
        border-bottom: 2px dotted #7c3aed;
        background: rgba(124, 58, 237, 0.08);
      }
      .zh-ul-nano:hover {
        background: rgba(124, 58, 237, 0.2);
      }

      .zh-pill {
        position: fixed;
        pointer-events: auto;
        display: none;
        align-items: center;
        gap: 5px;
        height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        border: 1px solid rgba(15, 23, 42, 0.14);
        background: #ffffff;
        color: #111827;
        font-size: 11.5px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.16);
        cursor: pointer;
        user-select: none;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
        z-index: 2;
      }
      .zh-pill:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
      }
      .zh-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .zh-pill-clean .zh-pill-dot { background: #16a34a; }
      .zh-pill-warn .zh-pill-dot { background: #d97706; }
      .zh-pill-error .zh-pill-dot { background: #dc2626; }
      .zh-pill-nano .zh-pill-dot {
        background: #7c3aed;
        animation: zh-pulse 1.1s infinite ease-in-out;
      }
      .zh-pill-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 700;
        color: #ffffff;
      }
      .zh-pill-error .zh-pill-count { background: #dc2626; }
      .zh-pill-warn .zh-pill-count { background: #d97706; }
      .zh-pill-nano-badge { color: #7c3aed; font-size: 11px; }

      @keyframes zh-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.82); }
      }

      .zh-popover {
        position: fixed;
        pointer-events: auto;
        display: none;
        width: 348px;
        max-width: calc(100vw - 16px);
        max-height: 410px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
        overflow: hidden;
        flex-direction: column;
        z-index: 3;
      }
      .zh-popover.open {
        display: flex;
      }

      .zh-pop-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
      }
      .zh-pop-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        font-size: 12.5px;
        color: #0f172a;
      }
      .zh-badge {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
      }
      .zh-badge-rule { background: #fee2e2; color: #b91c1c; }
      .zh-badge-advisory { background: #fef3c7; color: #b45309; }
      .zh-badge-nano { background: #ede9fe; color: #6d28d9; }
      .zh-badge-local { background: #dcfce7; color: #15803d; }

      .zh-close-btn {
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .zh-close-btn:hover { background: #e2e8f0; color: #0f172a; }

      .zh-pop-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px;
        border-bottom: 1px solid #f1f5f9;
        background: #ffffff;
      }
      .zh-select {
        font-family: inherit;
        font-size: 11.5px;
        padding: 3px 6px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
      }
      .zh-btn {
        font-family: inherit;
        font-size: 11.5px;
        font-weight: 600;
        padding: 4px 9px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #334155;
        cursor: pointer;
        transition: background 0.12s ease, border-color 0.12s ease;
      }
      .zh-btn:hover { background: #f1f5f9; }
      .zh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .zh-btn-primary {
        background: #2563eb;
        border-color: #2563eb;
        color: #ffffff;
      }
      .zh-btn-primary:hover { background: #1d4ed8; }
      .zh-btn-nano {
        background: #f5f3ff;
        border-color: #c4b5fd;
        color: #6d28d9;
      }
      .zh-btn-nano:hover { background: #ede9fe; }

      .zh-pop-body {
        padding: 10px 12px;
        overflow-y: auto;
        max-height: 290px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .zh-issue-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 9px 10px;
        background: #ffffff;
      }
      .zh-issue-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 6px;
      }
      .zh-issue-cat {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
      }
      .zh-diff-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 6px;
      }
      .zh-found {
        padding: 2px 6px;
        border-radius: 5px;
        background: #fef2f2;
        color: #b91c1c;
        text-decoration: line-through;
        font-weight: 600;
      }
      .zh-arrow { color: #94a3b8; font-weight: 700; }
      .zh-sug-chip {
        border: none;
        padding: 3px 8px;
        border-radius: 6px;
        background: #16a34a;
        color: #ffffff;
        font-family: inherit;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.12s ease;
      }
      .zh-sug-chip:hover { background: #15803d; }
      .zh-sug-chip-nano { background: #7c3aed; }
      .zh-sug-chip-nano:hover { background: #6d28d9; }

      .zh-rationale {
        font-size: 12px;
        color: #475569;
        margin: 0 0 7px 0;
      }
      .zh-issue-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .zh-link-btn {
        border: none;
        background: transparent;
        padding: 0;
        font-family: inherit;
        font-size: 11px;
        color: #64748b;
        cursor: pointer;
      }
      .zh-link-btn:hover { color: #0f172a; text-decoration: underline; }

      .zh-empty {
        text-align: center;
        padding: 18px 8px;
        color: #475569;
      }
      .zh-empty strong {
        display: block;
        color: #15803d;
        margin-bottom: 4px;
      }
      .zh-note {
        font-size: 11px;
        color: #64748b;
        padding: 6px 12px;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `;

    underlineLayer = document.createElement('div');
    underlineLayer.className = 'zh-underlines';

    pillBtn = document.createElement('button');
    pillBtn.type = 'button';
    pillBtn.className = 'zh-pill zh-pill-clean';
    pillBtn.title = 'Corrector Ai — Local Chinese & Cantonese Checker';
    pillBtn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Keep focus in the text field
    });
    pillBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (popoverMode === 'panel') {
        closePopover();
      } else {
        openPanelPopover();
      }
    });

    popoverEl = document.createElement('div');
    popoverEl.className = 'zh-popover';
    popoverEl.addEventListener('mousedown', (e) => {
      // Allow <select> interaction while preventing unwanted blur on buttons
      if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
        e.preventDefault();
      }
    });
    popoverEl.addEventListener('mouseenter', () => {
      clearTimeout(hoverHideTimer);
    });
    popoverEl.addEventListener('mouseleave', () => {
      if (popoverMode === 'card') {
        scheduleHoverClose();
      }
    });

    shadowRoot.append(style, underlineLayer, pillBtn, popoverEl);
    document.documentElement.appendChild(shadowHost);
  }

  function scheduleHoverClose() {
    clearTimeout(hoverHideTimer);
    hoverHideTimer = setTimeout(() => {
      if (popoverMode === 'card') {
        closePopover();
      }
    }, 260);
  }

  function closePopover() {
    popoverMode = null;
    activeFindingId = null;
    if (popoverEl) {
      popoverEl.classList.remove('open');
      popoverEl.innerHTML = '';
    }
  }

  function hideAllUI() {
    closePopover();
    if (underlineLayer) underlineLayer.innerHTML = '';
    if (pillBtn) pillBtn.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // Mirror-based & Range-based Underline Geometry
  // ---------------------------------------------------------------------------

  function ensureMirror() {
    if (!mirrorEl) {
      mirrorEl = document.createElement('div');
      mirrorEl.setAttribute('aria-hidden', 'true');
      mirrorEl.style.cssText =
        'position:fixed;top:-99999px;left:-99999px;visibility:hidden;pointer-events:none;overflow:hidden;';
      document.documentElement.appendChild(mirrorEl);
    }
    return mirrorEl;
  }

  function computeInputRects(el, text, findings) {
    const mirror = ensureMirror();
    const cs = getComputedStyle(el);
    const elRect = el.getBoundingClientRect();
    const isSingleLine = el.tagName === 'INPUT';

    const copyProps = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
      'letterSpacing', 'wordSpacing', 'lineHeight', 'textTransform', 'textIndent',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'boxSizing', 'direction', 'tabSize', 'wordBreak', 'overflowWrap'
    ];
    for (const p of copyProps) {
      mirror.style[p] = cs[p];
    }
    mirror.style.borderStyle = 'solid';
    mirror.style.borderColor = 'transparent';
    mirror.style.width = `${elRect.width}px`;
    mirror.style.height = isSingleLine ? `${elRect.height}px` : 'auto';
    mirror.style.whiteSpace = isSingleLine ? 'pre' : 'pre-wrap';
    mirror.style.wordWrap = isSingleLine ? 'normal' : 'break-word';

    // Build mirror DOM with <span data-fid="..."> around each finding
    mirror.innerHTML = '';
    let cursor = 0;
    const spanMap = new Map();
    for (const f of findings) {
      if (f.start < cursor || f.end > text.length) continue;
      if (f.start > cursor) {
        mirror.appendChild(document.createTextNode(text.slice(cursor, f.start)));
      }
      const mark = document.createElement('span');
      mark.textContent = text.slice(f.start, f.end);
      mirror.appendChild(mark);
      spanMap.set(f.id, mark);
      cursor = f.end;
    }
    if (cursor < text.length) {
      mirror.appendChild(document.createTextNode(text.slice(cursor)));
    }
    mirror.appendChild(document.createTextNode('\u200b'));

    const mirrorRect = mirror.getBoundingClientRect();
    const padLeft = parseFloat(cs.borderLeftWidth) || 0;
    const padTop = parseFloat(cs.borderTopWidth) || 0;
    const padRight = parseFloat(cs.borderRightWidth) || 0;
    const padBottom = parseFloat(cs.borderBottomWidth) || 0;

    const clipLeft = elRect.left + padLeft;
    const clipTop = elRect.top + padTop;
    const clipRight = elRect.right - padRight;
    const clipBottom = elRect.bottom - padBottom;

    const results = [];
    for (const f of findings) {
      const mark = spanMap.get(f.id);
      if (!mark) continue;
      const rects = mark.getClientRects();
      for (const r of rects) {
        const left = elRect.left + (r.left - mirrorRect.left) - el.scrollLeft;
        const top = elRect.top + (r.top - mirrorRect.top) - el.scrollTop;
        const right = left + r.width;
        const bottom = top + r.height;

        const cLeft = Math.max(left, clipLeft);
        const cRight = Math.min(right, clipRight);
        const cTop = Math.max(top, clipTop);
        const cBottom = Math.min(bottom, clipBottom);
        if (cRight - cLeft >= 2 && cBottom - cTop >= 4) {
          results.push({
            finding: f,
            left: cLeft,
            top: cBottom - 4,
            width: cRight - cLeft,
            height: 4,
            anchorRect: { left: cLeft, top: cTop, right: cRight, bottom: cBottom }
          });
        }
      }
    }
    return results;
  }

  function computeContentEditableRects(el, findings) {
    const { segments } = extractContentEditableModel(el);
    const elRect = el.getBoundingClientRect();
    const results = [];

    const findPos = (offset) => {
      for (const seg of segments) {
        if (offset >= seg.start && offset <= seg.end) {
          return { node: seg.node, offset: offset - seg.start };
        }
      }
      return null;
    };

    for (const f of findings) {
      const startPos = findPos(f.start);
      const endPos = findPos(f.end);
      if (!startPos || !endPos) continue;
      try {
        const range = document.createRange();
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        const rects = range.getClientRects();
        for (const r of rects) {
          const cLeft = Math.max(r.left, elRect.left);
          const cRight = Math.min(r.right, elRect.right);
          const cTop = Math.max(r.top, elRect.top);
          const cBottom = Math.min(r.bottom, elRect.bottom);
          if (cRight - cLeft >= 2 && cBottom - cTop >= 4) {
            results.push({
              finding: f,
              left: cLeft,
              top: cBottom - 4,
              width: cRight - cLeft,
              height: 4,
              anchorRect: { left: cLeft, top: cTop, right: cRight, bottom: cBottom }
            });
          }
        }
      } catch {
        // Ignore stale DOM ranges
      }
    }
    return results;
  }

  function renderOverlay() {
    if (!activeEl || !settings.enabled || isHostDisabled() || !document.contains(activeEl)) {
      hideAllUI();
      return;
    }

    const rect = activeEl.getBoundingClientRect();
    if (
      rect.width < 72 ||
      rect.height < 18 ||
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      hideAllUI();
      return;
    }

    if (!CJK_RE.test(currentText)) {
      hideAllUI();
      return;
    }

    ensureShadowUI();

    const findings = getCombinedFindings();
    const certainCount = findings.filter((f) => f.confidence === 'CERTAIN').length;
    const totalCount = findings.length;

    // 1. Render floating status pill
    pillBtn.style.display = 'inline-flex';
    const pillTop = Math.min(window.innerHeight - 30, Math.max(6, rect.bottom - 30));
    const pillLeft = Math.min(window.innerWidth - 96, Math.max(6, rect.right - 88));
    pillBtn.style.top = `${pillTop}px`;
    pillBtn.style.left = `${pillLeft}px`;

    let pillClass = 'zh-pill ';
    let pillHtml = '';
    if (nanoRunning) {
      pillClass += 'zh-pill-nano';
      pillHtml = `<span class="zh-pill-dot"></span><span class="zh-pill-nano-badge">✦ AI…</span>`;
    } else if (certainCount > 0) {
      pillClass += 'zh-pill-error';
      pillHtml = `<span class="zh-pill-dot"></span><span>正</span><span class="zh-pill-count">${totalCount}</span>`;
    } else if (totalCount > 0) {
      pillClass += 'zh-pill-warn';
      pillHtml = `<span class="zh-pill-dot"></span><span>正</span><span class="zh-pill-count">${totalCount}</span>`;
    } else {
      pillClass += 'zh-pill-clean';
      pillHtml = `<span class="zh-pill-dot"></span><span>正 ✓</span>`;
    }
    pillBtn.className = pillClass;
    pillBtn.innerHTML = pillHtml;

    // 2. Render inline underlines
    underlineLayer.innerHTML = '';
    if (settings.showInlineUnderlines && findings.length > 0) {
      const boxes =
        activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT'
          ? computeInputRects(activeEl, currentText, findings)
          : computeContentEditableRects(activeEl, findings);

      for (const box of boxes) {
        const div = document.createElement('div');
        const cls =
          box.finding.source === 'gemini-nano'
            ? 'zh-ul zh-ul-nano'
            : box.finding.confidence === 'CERTAIN'
              ? 'zh-ul zh-ul-certain'
              : 'zh-ul zh-ul-advisory';
        div.className = cls;
        div.style.left = `${box.left}px`;
        div.style.top = `${box.top}px`;
        div.style.width = `${box.width}px`;
        div.style.height = `${box.height}px`;
        div.title = `${box.finding.found} → ${box.finding.suggestion}`;

        div.addEventListener('mouseenter', () => {
          clearTimeout(hoverHideTimer);
          openFindingCard(box.finding, box.anchorRect);
        });
        div.addEventListener('mouseleave', () => {
          scheduleHoverClose();
        });
        div.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openFindingCard(box.finding, box.anchorRect);
        });

        underlineLayer.appendChild(div);
      }
    }

    // Keep panel popover refreshed if open
    if (popoverMode === 'panel') {
      renderPanelPopoverContent();
    }
  }

  function positionPopoverNear(anchorRect) {
    const popW = 348;
    const popH = Math.min(410, popoverEl.offsetHeight || 260);
    let left = anchorRect.left;
    if (left + popW > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popW - 10);
    }
    let top = anchorRect.bottom + 8;
    if (top + popH > window.innerHeight - 10) {
      top = Math.max(10, anchorRect.top - popH - 8);
    }
    popoverEl.style.left = `${Math.max(8, left)}px`;
    popoverEl.style.top = `${Math.max(8, top)}px`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSuggestionOptionsLocal(suggestion) {
    if (engineMod?.getSuggestionOptions) {
      return engineMod.getSuggestionOptions(suggestion);
    }
    const raw = String(suggestion || '').trim();
    if (raw.includes('國家/地區') || raw.includes('国家/地区')) return [raw];
    const parts = raw.split('／').map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : [raw];
  }

  function buildIssueCardElement(finding) {
    const card = document.createElement('div');
    card.className = 'zh-issue-card';

    const badgeClass =
      finding.source === 'gemini-nano'
        ? 'zh-badge zh-badge-nano'
        : finding.confidence === 'CERTAIN'
          ? 'zh-badge zh-badge-rule'
          : 'zh-badge zh-badge-advisory';
    const badgeLabel =
      finding.source === 'gemini-nano'
        ? '✦ Gemini Nano'
        : finding.confidence === 'CERTAIN'
          ? 'Certain'
          : 'Advisory';

    const opts = getSuggestionOptionsLocal(finding.suggestion);
    const chipClass = finding.source === 'gemini-nano' ? 'zh-sug-chip zh-sug-chip-nano' : 'zh-sug-chip';

    card.innerHTML = `
      <div class="zh-issue-meta">
        <span class="zh-issue-cat">${escapeHtml(finding.category.replace(/_/g, ' '))}</span>
        <span class="${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="zh-diff-row">
        <span class="zh-found">${escapeHtml(finding.found)}</span>
        <span class="zh-arrow">→</span>
        <span class="zh-chips-slot"></span>
      </div>
      <p class="zh-rationale">${escapeHtml(finding.rationale)}</p>
      <div class="zh-issue-actions">
        <button type="button" class="zh-link-btn" data-action="ignore">Ignore "${escapeHtml(finding.found)}"</button>
        <button type="button" class="zh-link-btn" data-action="dismiss">Dismiss</button>
      </div>
    `;

    const slot = card.querySelector('.zh-chips-slot');
    for (const opt of opts) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = chipClass;
      chip.textContent = opt;
      chip.title = `Replace "${finding.found}" with "${opt}"`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applySingleFindingToField(finding, opt);
      });
      slot.appendChild(chip);
    }

    card.querySelector('[data-action="ignore"]').addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await ignoreTerm(finding.found);
    });

    card.querySelector('[data-action="dismiss"]').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissedIds.add(finding.id);
      if (popoverMode === 'card') closePopover();
      renderOverlay();
    });

    return card;
  }

  function openFindingCard(finding, anchorRect) {
    popoverMode = 'card';
    activeFindingId = finding.id;
    popoverEl.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'zh-pop-header';
    header.innerHTML = `
      <span class="zh-pop-title">Corrector Ai <span class="zh-badge zh-badge-local">100% Local</span></span>
      <button type="button" class="zh-close-btn" aria-label="Close">×</button>
    `;
    header.querySelector('.zh-close-btn').addEventListener('click', () => closePopover());

    const body = document.createElement('div');
    body.className = 'zh-pop-body';
    body.appendChild(buildIssueCardElement(finding));

    popoverEl.append(header, body);
    popoverEl.classList.add('open');
    positionPopoverNear(anchorRect);
  }

  function openPanelPopover() {
    popoverMode = 'panel';
    activeFindingId = null;
    renderPanelPopoverContent();
    popoverEl.classList.add('open');
    const pillRect = pillBtn.getBoundingClientRect();
    positionPopoverNear(pillRect);
  }

  function renderPanelPopoverContent() {
    const findings = getCombinedFindings();
    const certainFindings = findings.filter((f) => f.confidence === 'CERTAIN');

    popoverEl.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'zh-pop-header';
    header.innerHTML = `
      <span class="zh-pop-title">
        Corrector Ai 正字校對
        <span class="zh-badge zh-badge-local">Local</span>
      </span>
      <button type="button" class="zh-close-btn" aria-label="Close">×</button>
    `;
    header.querySelector('.zh-close-btn').addEventListener('click', () => closePopover());

    const toolbar = document.createElement('div');
    toolbar.className = 'zh-pop-toolbar';

    const profileSel = document.createElement('select');
    profileSel.className = 'zh-select';
    for (const [pid, label] of Object.entries(PROFILE_SHORT)) {
      const opt = document.createElement('option');
      opt.value = pid;
      opt.textContent = label;
      if (pid === settings.profile) opt.selected = true;
      profileSel.appendChild(opt);
    }
    profileSel.addEventListener('change', async () => {
      await updateSettings({ profile: profileSel.value });
    });

    const stdSel = document.createElement('select');
    stdSel.className = 'zh-select';
    stdSel.innerHTML = `
      <option value="ui" ${settings.standard === 'ui' ? 'selected' : ''}>UI / Commercial</option>
      <option value="official" ${settings.standard === 'official' ? 'selected' : ''}>Official / EDB / MoE</option>
    `;
    stdSel.addEventListener('change', async () => {
      await updateSettings({ standard: stdSel.value });
    });

    toolbar.append(profileSel, stdSel);

    if (certainFindings.length > 0) {
      const fixAllBtn = document.createElement('button');
      fixAllBtn.type = 'button';
      fixAllBtn.className = 'zh-btn zh-btn-primary';
      fixAllBtn.textContent = `Fix All (${certainFindings.length})`;
      fixAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyAllCertainToField();
      });
      toolbar.appendChild(fixAllBtn);
    }

    if (settings.useGeminiNano) {
      const nanoBtn = document.createElement('button');
      nanoBtn.type = 'button';
      nanoBtn.className = 'zh-btn zh-btn-nano';
      nanoBtn.disabled = nanoRunning;
      nanoBtn.textContent = nanoRunning ? '✦ Checking…' : '✦ Gemini Nano';
      nanoBtn.title = 'Run on-device Chrome Gemini Nano grammar & context check';
      nanoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerNanoAudit(true);
      });
      toolbar.appendChild(nanoBtn);
    }

    const body = document.createElement('div');
    body.className = 'zh-pop-body';

    if (findings.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'zh-empty';
      empty.innerHTML = `
        <strong>✓ No issues found</strong>
        <span>Checked against ${escapeHtml(settings.profile)} (${settings.standard === 'ui' ? 'UI' : 'Official'}).</span>
      `;
      body.appendChild(empty);
    } else {
      for (const f of findings) {
        body.appendChild(buildIssueCardElement(f));
      }
    }

    const note = document.createElement('div');
    note.className = 'zh-note';
    note.innerHTML = `
      <span>${escapeHtml(lastNanoStatusNote || (settings.useGeminiNano ? '✦ Local Gemini Nano enabled' : 'Deterministic rules • Zero cloud egress'))}</span>
    `;

    popoverEl.append(header, toolbar, body, note);
  }

  // ---------------------------------------------------------------------------
  // Text Replacement (React / Vue / ContentEditable Safe)
  // ---------------------------------------------------------------------------

  function setNativeInputValue(el, newValue, nextCursor) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, newValue);
    } else {
      el.value = newValue;
    }
    if (typeof nextCursor === 'number') {
      try {
        el.setSelectionRange(nextCursor, nextCursor);
      } catch {
        // ignore unsupported input types
      }
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function replaceInContentEditable(el, start, end, replacement) {
    const { segments } = extractContentEditableModel(el);
    const findPos = (offset) => {
      for (const seg of segments) {
        if (offset >= seg.start && offset <= seg.end) {
          return { node: seg.node, offset: offset - seg.start };
        }
      }
      return null;
    };

    const startPos = findPos(start);
    const endPos = findPos(end);
    if (!startPos || !endPos) return false;

    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);

    el.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    let ok = false;
    try {
      ok = document.execCommand('insertText', false, replacement);
    } catch {
      ok = false;
    }
    if (!ok) {
      range.deleteContents();
      const textNode = document.createTextNode(replacement);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: replacement }));
    }
    return true;
  }

  function applySingleFindingToField(finding, chosenReplacement) {
    if (!activeEl) return;
    const replacement = chosenReplacement ?? finding.suggestion;
    const text = getFieldText(activeEl);

    // Resolve current span in case text shifted slightly
    let start = finding.start;
    let end = finding.end;
    if (text.slice(start, end) !== finding.found) {
      const idx = text.indexOf(finding.found, Math.max(0, start - 16));
      if (idx === -1) return;
      start = idx;
      end = idx + finding.found.length;
    }

    if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') {
      const next = text.slice(0, start) + replacement + text.slice(end);
      setNativeInputValue(activeEl, next, start + replacement.length);
    } else {
      replaceInContentEditable(activeEl, start, end, replacement);
    }

    if (popoverMode === 'card') closePopover();
    runRuleAuditNow();
  }

  function applyAllCertainToField() {
    if (!activeEl) return;
    const findings = getCombinedFindings().filter((f) => f.confidence === 'CERTAIN');
    if (findings.length === 0) return;

    const text = getFieldText(activeEl);
    if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') {
      const { text: updated } = engineMod.applyAllFixes(text, findings, { certainOnly: true });
      setNativeInputValue(activeEl, updated, updated.length);
    } else {
      // Apply right-to-left so earlier DOM offsets remain valid
      const sorted = [...findings].sort((a, b) => b.start - a.start);
      let lastStart = Infinity;
      for (const f of sorted) {
        if (f.end > lastStart) continue;
        const primary = engineMod ? engineMod.getPrimarySuggestion(f.suggestion) : f.suggestion;
        replaceInContentEditable(activeEl, f.start, f.end, primary);
        lastStart = f.start;
      }
    }

    runRuleAuditNow();
  }

  // ---------------------------------------------------------------------------
  // Audit Execution (Deterministic + Optional Local Gemini Nano)
  // ---------------------------------------------------------------------------

  async function ensureEngineLoaded() {
    if (engineMod && shards) return true;
    try {
      if (!engineMod) {
        engineMod = await import(chrome.runtime.getURL('core/zh-audit-engine.js'));
      }
      if (!shards) {
        const loader = await import(chrome.runtime.getURL('core/shards-loader.js'));
        shards = await loader.loadBundledShards();
      }
      return true;
    } catch {
      // Fallback: will ask background service worker via message passing
      return false;
    }
  }

  async function runRuleAuditNow() {
    if (!activeEl || !settings.enabled || isHostDisabled()) {
      hideAllUI();
      return;
    }
    const text = getFieldText(activeEl);
    currentText = text;
    if (!CJK_RE.test(text)) {
      ruleFindings = [];
      nanoFindings = [];
      hideAllUI();
      return;
    }

    const loaded = await ensureEngineLoaded();
    if (loaded && engineMod && shards) {
      ruleFindings = engineMod.auditText(text, settings, shards);
    } else {
      try {
        const resp = await chrome.runtime.sendMessage({
          type: 'AUDIT_TEXT',
          text,
          options: settings
        });
        ruleFindings = resp?.ok && Array.isArray(resp.findings) ? resp.findings : [];
      } catch {
        ruleFindings = [];
      }
    }

    // Clear stale Nano findings when text changes
    if (text !== lastNanoCheckedText) {
      nanoFindings = [];
    }

    renderOverlay();

    if (
      settings.useGeminiNano &&
      settings.nanoTriggerMode === 'auto' &&
      text.trim().length >= 4 &&
      text !== lastNanoCheckedText
    ) {
      clearTimeout(nanoTimer);
      nanoTimer = setTimeout(() => triggerNanoAudit(false), 950);
    }
  }

  async function triggerNanoAudit(force = false) {
    if (!activeEl || !settings.enabled || isHostDisabled()) return;
    if (!settings.useGeminiNano && !force) return;

    const text = getFieldText(activeEl);
    if (!text || !CJK_RE.test(text) || text.trim().length < 4) return;

    const reqId = ++nanoRequestSeq;
    nanoRunning = true;
    lastNanoStatusNote = '✦ Running local Gemini Nano…';
    renderOverlay();

    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'NANO_AUDIT',
        text,
        force,
        options: {
          profile: settings.profile,
          register: settings.register,
          standard: settings.standard
        },
        existingFindings: ruleFindings
      });

      // Discard stale response if user kept typing
      if (reqId !== nanoRequestSeq || text !== getFieldText(activeEl)) return;

      if (resp?.ok && resp.status === 'ok') {
        nanoFindings = Array.isArray(resp.findings) ? resp.findings : [];
        lastNanoCheckedText = text;
        lastNanoStatusNote =
          nanoFindings.length > 0
            ? `✦ Gemini Nano found ${nanoFindings.length} suggestion(s)`
            : '✦ Gemini Nano: looks natural';
      } else if (resp?.status && resp.status !== 'disabled') {
        nanoFindings = [];
        lastNanoStatusNote = resp.detail || `Gemini Nano: ${resp.status}`;
      }
    } catch (err) {
      if (reqId === nanoRequestSeq) {
        lastNanoStatusNote = err?.message || 'Local Gemini Nano unavailable';
      }
    } finally {
      if (reqId === nanoRequestSeq) {
        nanoRunning = false;
        renderOverlay();
      }
    }
  }

  function scheduleAudit() {
    if (isComposing) return;
    clearTimeout(ruleTimer);
    ruleTimer = setTimeout(runRuleAuditNow, 150);
  }

  async function updateSettings(partial) {
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: partial });
      if (resp?.ok && resp.settings) {
        settings = resp.settings;
      } else {
        settings = { ...settings, ...partial };
      }
    } catch {
      settings = { ...settings, ...partial };
    }
    lastNanoCheckedText = '';
    dismissedIds.clear();
    runRuleAuditNow();
  }

  async function ignoreTerm(term) {
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'ADD_IGNORED_TERM', term });
      if (resp?.ok && resp.settings) {
        settings = resp.settings;
      }
    } catch {
      settings.ignoredTerms = [...new Set([...(settings.ignoredTerms || []), term])];
    }
    if (popoverMode === 'card') closePopover();
    runRuleAuditNow();
  }

  // ---------------------------------------------------------------------------
  // Field Lifecycle & Global Event Hooks
  // ---------------------------------------------------------------------------

  function attachToField(el) {
    if (activeEl === el) return;
    detachFromField();

    if (!el || !isFieldLargeEnough(el)) return;
    activeEl = el;
    dismissedIds.clear();
    lastNanoCheckedText = '';
    lastNanoStatusNote = '';

    activeEl.addEventListener('input', handleFieldInput);
    activeEl.addEventListener('scroll', handleFieldReposition, { passive: true });
    activeEl.addEventListener('compositionstart', handleCompStart);
    activeEl.addEventListener('compositionend', handleCompEnd);

    runRuleAuditNow();
  }

  function detachFromField() {
    clearTimeout(ruleTimer);
    clearTimeout(nanoTimer);
    if (activeEl) {
      activeEl.removeEventListener('input', handleFieldInput);
      activeEl.removeEventListener('scroll', handleFieldReposition);
      activeEl.removeEventListener('compositionstart', handleCompStart);
      activeEl.removeEventListener('compositionend', handleCompEnd);
    }
    activeEl = null;
    ruleFindings = [];
    nanoFindings = [];
    currentText = '';
    hideAllUI();
  }

  function handleFieldInput() {
    scheduleAudit();
  }

  function handleCompStart() {
    isComposing = true;
  }

  function handleCompEnd() {
    isComposing = false;
    scheduleAudit();
  }

  let repositionRaf = null;
  function handleFieldReposition() {
    if (!activeEl) return;
    if (repositionRaf) cancelAnimationFrame(repositionRaf);
    repositionRaf = requestAnimationFrame(() => {
      repositionRaf = null;
      renderOverlay();
    });
  }

  document.addEventListener(
    'focusin',
    (e) => {
      if (!settings.enabled || isHostDisabled()) return;
      const root = resolveEditableRoot(e.target);
      if (root) {
        attachToField(root);
      }
    },
    true
  );

  document.addEventListener(
    'mousedown',
    (e) => {
      if (shadowHost && (e.target === shadowHost || e.composedPath().includes(shadowHost))) {
        return;
      }
      if (popoverMode) {
        closePopover();
      }
    },
    true
  );

  window.addEventListener('scroll', handleFieldReposition, true);
  window.addEventListener('resize', handleFieldReposition, { passive: true });

  // Sync settings changes live from Popup / Side Panel
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area === 'local' && changes.correctorAiSettings?.newValue) {
      settings = changes.correctorAiSettings.newValue;
      lastNanoCheckedText = '';
      dismissedIds.clear();
      if (!settings.enabled || isHostDisabled()) {
        hideAllUI();
      } else if (activeEl) {
        runRuleAuditNow();
      }
    }
  });

  // Initial settings load
  chrome.runtime
    .sendMessage({ type: 'GET_SETTINGS' })
    .then((resp) => {
      if (resp?.ok && resp.settings) {
        settings = resp.settings;
      }
      const focused = resolveEditableRoot(document.activeElement);
      if (focused && settings.enabled && !isHostDisabled()) {
        attachToField(focused);
      }
    })
    .catch(() => {});
})();
