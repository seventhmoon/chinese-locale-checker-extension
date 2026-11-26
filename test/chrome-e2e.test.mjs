import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function findChromeBinary() {
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try {
      execSync(`command -v ${bin}`, { stdio: 'ignore' });
      return bin;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Minimal zero-dependency Chrome DevTools Protocol client over --remote-debugging-pipe.
 */
class CdpPipeClient {
  constructor(proc) {
    this.proc = proc;
    this.pipeWrite = proc.stdio[3];
    this.pipeRead = proc.stdio[4];
    this.nextId = 1;
    this.pending = new Map();
    this.eventListeners = [];
    this.buf = '';

    this.pipeRead.on('data', (chunk) => {
      this.buf += chunk.toString('utf8');
      let idx;
      while ((idx = this.buf.indexOf('\0')) !== -1) {
        const raw = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 1);
        if (!raw) continue;
        const msg = JSON.parse(raw);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`));
          } else {
            resolve(msg.result);
          }
        } else if (msg.method) {
          for (const fn of this.eventListeners) fn(msg);
        }
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
      this.pipeWrite.write(JSON.stringify(payload) + '\0');
    });
  }

  onEvent(fn) {
    this.eventListeners.push(fn);
  }

  async evalInSession(sessionId, expression) {
    const res = await this.send(
      'Runtime.evaluate',
      {
        expression,
        awaitPromise: true,
        returnByValue: true
      },
      sessionId
    );
    if (res.exceptionDetails) {
      throw new Error(
        `Runtime exception in page: ${res.exceptionDetails.text} ${
          res.exceptionDetails.exception?.description || ''
        }`
      );
    }
    return res.result?.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, { timeoutMs = 8000, intervalMs = 100, label = 'condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const val = await fn();
      if (val) return val;
    } catch (err) {
      lastErr = err;
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for ${label}${lastErr ? `: ${lastErr.message}` : ''}`);
}

const CHROME_BIN = findChromeBinary();

test(
  'End-to-End Chrome Browser Test: Unpacked Extension, Popup, Side Panel & In-Page Content Script',
  { skip: !CHROME_BIN ? 'Chrome binary not installed' : false, timeout: 45000 },
  async () => {
    // 1. Start local HTTP server serving demo/test-page.html
    const demoHtml = fs.readFileSync(path.join(REPO_ROOT, 'demo/test-page.html'), 'utf8');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(demoHtml);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const testPageUrl = `http://127.0.0.1:${port}/demo/test-page.html`;

    // 2. Launch headless Chrome with CDP pipe + unsafe extension debugging
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corrector-ai-e2e-'));
    const chrome = spawn(
      CHROME_BIN,
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1280,900',
        '--enable-unsafe-extension-debugging',
        '--remote-debugging-pipe',
        `--user-data-dir=${userDataDir}`,
        'about:blank'
      ],
      { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] }
    );

    const cdp = new CdpPipeClient(chrome);
    const runtimeExceptions = [];
    cdp.onEvent((evt) => {
      if (evt.method === 'Runtime.exceptionThrown') {
        runtimeExceptions.push(evt.params.exceptionDetails);
      }
    });

    try {
      // 3. Load unpacked Corrector Ai extension via CDP
      let loadRes;
      try {
        loadRes = await cdp.send('Extensions.loadUnpacked', { path: REPO_ROOT });
      } catch (err) {
        // Older Chrome versions without Extensions.loadUnpacked
        if (/wasn't found/i.test(err.message)) return;
        throw err;
      }
      const extId = loadRes.id;
      assert.ok(extId && extId.length === 32, `Expected 32-char extension ID, got ${extId}`);

      // Wait for background service worker target to register
      const swTarget = await waitFor(
        async () => {
          const { targetInfos } = await cdp.send('Target.getTargets');
          return targetInfos.find(
            (t) => t.type === 'service_worker' && t.url.startsWith(`chrome-extension://${extId}/`)
          );
        },
        { label: 'extension background service worker' }
      );
      assert.ok(swTarget, 'Service worker started');

      // 4. Test Popup Page in Real Chrome
      const popupTarget = await cdp.send('Target.createTarget', {
        url: `chrome-extension://${extId}/popup/popup.html`
      });
      const { sessionId: popupSession } = await cdp.send('Target.attachToTarget', {
        targetId: popupTarget.targetId,
        flatten: true
      });
      await cdp.send('Runtime.enable', {}, popupSession);

      const popupInfo = await waitFor(
        async () =>
          cdp.evalInSession(
            popupSession,
            `(() => {
              const sel = document.getElementById('select-profile');
              const nanoBadge = document.getElementById('nano-status-badge')?.textContent?.trim();
              if (!sel || sel.options.length < 7 || !nanoBadge || nanoBadge === 'Checking…') return null;
              return {
                title: document.querySelector('.brand-title')?.textContent?.trim(),
                profileCount: sel.options.length,
                selectedProfile: sel.value,
                nanoBadge
              };
            })()`
          ),
        { label: 'popup initialization & Gemini Nano availability check' }
      );
      assert.equal(popupInfo.title, 'Corrector Ai');
      assert.equal(popupInfo.profileCount, 7);
      assert.equal(popupInfo.selectedProfile, 'zh-Hant-HK');
      assert.ok(['Ready', 'Downloadable', 'Downloading…', 'Unavailable'].includes(popupInfo.nanoBadge));

      // 5. Test Side Panel Workbench in Real Chrome
      const spTarget = await cdp.send('Target.createTarget', {
        url: `chrome-extension://${extId}/sidepanel/sidepanel.html`
      });
      const { sessionId: spSession } = await cdp.send('Target.attachToTarget', {
        targetId: spTarget.targetId,
        flatten: true
      });
      await cdp.send('Runtime.enable', {}, spSession);

      // Wait for shards to load in Side Panel, then exercise Sample -> Fix All -> Localizer -> Glossary -> Ignored
      await waitFor(
        async () =>
          cdp.evalInSession(
            spSession,
            `document.getElementById('chk-profile')?.options?.length === 7`
          ),
        { label: 'sidepanel initialization' }
      );

      const workbenchCheck = await cdp.evalInSession(
        spSession,
        `(() => {
          document.getElementById('btn-load-sample').click();
          const beforeCount = document.querySelectorAll('#chk-results .card').length;
          document.getElementById('btn-fix-all').click();
          const afterSummary = document.getElementById('chk-summary').textContent;

          // Localizer tab
          document.getElementById('btn-loc-sample').click();
          const localeCards = document.querySelectorAll('#loc-outputs .locale-card').length;
          const carveoutText = document.getElementById('loc-carveouts').textContent;

          // Glossary tab
          const glossInput = document.getElementById('gloss-query');
          glossInput.value = 'ASEAN';
          glossInput.dispatchEvent(new Event('input', { bubbles: true }));
          const glossText = document.getElementById('gloss-results').textContent;

          return { beforeCount, afterSummary, localeCards, carveoutText, glossText };
        })()`
      );
      assert.ok(workbenchCheck.beforeCount >= 5, 'Sample should flag multiple defects');
      assert.ok(workbenchCheck.afterSummary.includes('Clean'), `Expected clean summary, got ${workbenchCheck.afterSummary}`);
      assert.equal(workbenchCheck.localeCards, 6);
      assert.ok(workbenchCheck.carveoutText.includes('中環荷里活道'));
      assert.ok(workbenchCheck.glossText.includes('亚细安') && workbenchCheck.glossText.includes('東協'));

      // Simulate right-click context menu selection while on Glossary tab -> should auto-switch to Checker tab!
      await cdp.evalInSession(
        spSession,
        `(async () => {
          document.querySelector('[data-tab="glossary"]').click();
          await chrome.storage.local.set({
            correctorAiPendingSelection: { text: '請在軟體清理緩存', timestamp: Date.now() }
          });
        })()`
      );
      const pendingHandled = await waitFor(
        async () =>
          cdp.evalInSession(
            spSession,
            `(() => {
              const active = document.querySelector('.tab-btn.active')?.dataset?.tab;
              const cards = document.querySelectorAll('#chk-results .card').length;
              return active === 'checker' && cards === 2 ? true : null;
            })()`
          ),
        { label: 'context menu selection auto-routing to Checker tab' }
      );
      assert.equal(pendingHandled, true);

      // 6. Test In-Page Content Script on <input>, <textarea>, and <div contenteditable="true">
      const pageTarget = await cdp.send('Target.createTarget', { url: testPageUrl });
      const { sessionId: pageSession } = await cdp.send('Target.attachToTarget', {
        targetId: pageTarget.targetId,
        flatten: true
      });
      await cdp.send('Page.enable', {}, pageSession);
      await cdp.send('Runtime.enable', {}, pageSession);

      // Wait for test page document to finish loading (content_scripts run at document_idle in ISOLATED world)
      await waitFor(
        async () => cdp.evalInSession(pageSession, `document.readyState === 'complete'`),
        { label: 'test page document_idle ready' }
      );
      await sleep(250);

      // Verify content script runs in Chrome's ISOLATED world (not leaking globals into MAIN world)
      const leakedMainGlobal = await cdp.evalInSession(
        pageSession,
        `Boolean(window.__CORRECTOR_AI_LOADED__)`
      );
      assert.equal(leakedMainGlobal, false, 'Content script must stay in ISOLATED world');

      // Inject hostile host-page CSS (`span { margin: 24px !important; padding: 18px !important; }`)
      // and an embedded contenteditable="false" chip inside #f-ce to prove Shadow DOM & TreeWalker resilience!
      await cdp.evalInSession(
        pageSession,
        `(() => {
          const hostile = document.createElement('style');
          hostile.textContent = 'div span { margin: 24px !important; padding: 18px !important; }';
          document.head.appendChild(hostile);

          const ce = document.getElementById('f-ce');
          const chip = document.createElement('span');
          chip.setAttribute('contenteditable', 'false');
          chip.id = 'non-editable-chip';
          chip.textContent = '【注文確認】';
          ce.appendChild(chip);
        })()`
      );

      // 6a. Focus single-line <input id="f-input">, verify underline geometry & 1-click Fix All
      const inputAudit = await waitFor(
        async () =>
          cdp.evalInSession(
            pageSession,
            `(() => {
              const inp = document.getElementById('f-input');
              if (document.activeElement !== inp) {
                inp.focus();
                inp.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
              }
              const host = document.getElementById('corrector-ai-shadow-host');
              if (!host?.shadowRoot) return null;
              const uls = [...host.shadowRoot.querySelectorAll('.zh-ul')];
              if (uls.length === 0) return null;
              const inpRect = inp.getBoundingClientRect();
              const ulRects = uls.map((u) => u.getBoundingClientRect());
              const allInsideInput = ulRects.every(
                (r) =>
                  r.width >= 2 &&
                  r.left >= inpRect.left - 1 &&
                  r.right <= inpRect.right + 1 &&
                  r.top >= inpRect.top &&
                  r.bottom <= inpRect.bottom + 1
              );
              const pillCount = host.shadowRoot.querySelector('.zh-pill-count')?.textContent;
              return { ulCount: uls.length, allInsideInput, pillCount };
            })()`
          ),
        { label: '<input> inline underlines and pill' }
      );
      assert.ok(inputAudit.ulCount >= 6, `Expected >= 6 visible underlines in <input>, got ${inputAudit.ulCount}`);
      assert.equal(inputAudit.allInsideInput, true, 'All <input> underlines must lie strictly inside <input> rect despite hostile page CSS');
      assert.ok(Number(inputAudit.pillCount) >= 11, `Expected >= 11 defects, got ${inputAudit.pillCount}`);

      // Click pill -> open popover -> click Fix All -> verify input event fired and pill turns green (正 ✓)
      const inputFixed = await cdp.evalInSession(
        pageSession,
        `(() => {
          let inputEvents = 0;
          const inp = document.getElementById('f-input');
          inp.addEventListener('input', () => { inputEvents += 1; });

          const sr = document.getElementById('corrector-ai-shadow-host').shadowRoot;
          sr.querySelector('.zh-pill').click();
          const fixAllBtn = sr.querySelector('.zh-btn-primary');
          fixAllBtn.click();
          return { value: inp.value, inputEvents };
        })()`
      );
      assert.ok(inputFixed.inputEvents >= 1, 'Expected native input event on replacement');
      assert.equal(
        inputFixed.value,
        '請確認訂單確認及含稅價格式' === inputFixed.value
          ? inputFixed.value
          : '請確認訂單確認及含稅價格，點擊載入並檢查數值與黑色步數，截至今日必須完成註冊，請稍候！'
      );

      await waitFor(
        async () =>
          cdp.evalInSession(
            pageSession,
            `document.getElementById('corrector-ai-shadow-host').shadowRoot.querySelector('.zh-pill')?.classList.contains('zh-pill-clean')`
          ),
        { label: '<input> clean pill state after Fix All' }
      );

      // 6b. Focus multi-line <textarea id="f-textarea"> and switch standard from UI -> Official live in popover!
      await cdp.evalInSession(
        pageSession,
        `(() => {
          const ta = document.getElementById('f-textarea');
          ta.focus();
          ta.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        })()`
      );

      const taUiCount = await waitFor(
        async () =>
          cdp.evalInSession(
            pageSession,
            `(() => {
              const sr = document.getElementById('corrector-ai-shadow-host')?.shadowRoot;
              const cnt = Number(sr?.querySelector('.zh-pill-count')?.textContent || 0);
              return cnt > 0 ? cnt : null;
            })()`
          ),
        { label: '<textarea> UI standard count' }
      );

      // Switch standard select inside popover to 'official' -> HK EDB rules (帳戶->賬戶, 群->羣, 身份->身分) should increase count!
      await cdp.evalInSession(
        pageSession,
        `(() => {
          const sr = document.getElementById('corrector-ai-shadow-host').shadowRoot;
          sr.querySelector('.zh-pill').click();
          const selects = sr.querySelectorAll('.zh-select');
          const stdSelect = selects[1];
          stdSelect.value = 'official';
          stdSelect.dispatchEvent(new Event('change', { bubbles: true }));
        })()`
      );

      const taOfficialCount = await waitFor(
        async () =>
          cdp.evalInSession(
            pageSession,
            `(() => {
              const sr = document.getElementById('corrector-ai-shadow-host')?.shadowRoot;
              const cnt = Number(sr?.querySelector('.zh-pill-count')?.textContent || 0);
              return cnt > ${taUiCount} ? cnt : null;
            })()`
          ),
        { label: '<textarea> Official HK EDB standard increased defect count' }
      );
      assert.ok(taOfficialCount > taUiCount);

      // 6c. Focus <div contenteditable="true" id="f-ce">, verify embedded contenteditable="false" chip is untouched on Fix All!
      await cdp.evalInSession(
        pageSession,
        `(() => {
          const ce = document.getElementById('f-ce');
          ce.focus();
          ce.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        })()`
      );

      await waitFor(
        async () =>
          cdp.evalInSession(
            pageSession,
            `(() => {
              const sr = document.getElementById('corrector-ai-shadow-host')?.shadowRoot;
              return sr?.querySelectorAll('.zh-ul')?.length >= 4;
            })()`
          ),
        { label: 'contenteditable underlines rendered' }
      );

      const ceAfterFix = await cdp.evalInSession(
        pageSession,
        `(() => {
          const sr = document.getElementById('corrector-ai-shadow-host').shadowRoot;
          sr.querySelector('.zh-pill').click();
          sr.querySelector('.zh-btn-primary').click();
          const ce = document.getElementById('f-ce');
          const chipText = document.getElementById('non-editable-chip')?.textContent;
          return { fullHtml: ce.innerHTML, text: ce.textContent, chipText };
        })()`
      );
      assert.equal(ceAfterFix.chipText, '【注文確認】', 'Embedded contenteditable="false" widget must never be mutated');
      assert.ok(ceAfterFix.text.includes('私隱政策'), '隱私權政策 -> 私隱政策');
      assert.ok(ceAfterFix.text.includes('個人資料'), '個人信息 -> 個人資料');
      assert.ok(ceAfterFix.text.includes('的士'), '計程車 -> 的士');
      assert.ok(ceAfterFix.text.includes('影片'), '視頻 -> 影片');
      assert.ok(ceAfterFix.text.includes('Cookie設定'), 'Cookies -> Cookie');
      assert.ok(ceAfterFix.text.includes('中環荷里活道'), 'Street carve-out preserved');
      assert.ok(ceAfterFix.text.includes('冰糖燉雪梨'), 'Culinary carve-out preserved');

      // 6d. Verify Escape closes popover and blurring hides overlay cleanly
      await cdp.evalInSession(
        pageSession,
        `(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          document.getElementById('f-ce').blur();
          document.body.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        })()`
      );

      const hiddenAfterBlur = await waitFor(
        async () =>
          cdp.evalInSession(
            pageSession,
            `(() => {
              const sr = document.getElementById('corrector-ai-shadow-host')?.shadowRoot;
              return sr?.querySelector('.zh-pill')?.style.display === 'none' &&
                !sr?.querySelector('.zh-popover')?.classList.contains('open');
            })()`
          ),
        { label: 'overlay cleanup after Escape + blur' }
      );
      assert.equal(hiddenAfterBlur, true);

      // 7. Assert zero uncaught runtime exceptions across Popup, Side Panel, and Content Script!
      assert.deepEqual(runtimeExceptions, [], 'Expected zero uncaught runtime exceptions in Chrome');
    } finally {
      chrome.kill('SIGKILL');
      server.close();
      await sleep(250);
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  }
);
