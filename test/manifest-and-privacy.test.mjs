import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function walkFiles(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'test') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

test('manifest.json is valid MV3, references existing assets, and enforces local-only privacy', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf8'));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.host_permissions, undefined, 'Must not declare external host_permissions');

  const csp = manifest.content_security_policy?.extension_pages || '';
  assert.ok(csp.includes("connect-src 'self'"), 'CSP must restrict connect-src to self');

  // Verify icons, popup, sidepanel, service worker, content scripts, and web accessible resources exist
  for (const iconPath of Object.values(manifest.icons || {})) {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, iconPath)), `Missing icon: ${iconPath}`);
  }
  assert.ok(fs.existsSync(path.join(REPO_ROOT, manifest.action.default_popup)));
  assert.ok(fs.existsSync(path.join(REPO_ROOT, manifest.side_panel.default_path)));
  assert.ok(fs.existsSync(path.join(REPO_ROOT, manifest.background.service_worker)));

  for (const cs of manifest.content_scripts || []) {
    for (const jsPath of cs.js || []) {
      assert.ok(fs.existsSync(path.join(REPO_ROOT, jsPath)), `Missing content script: ${jsPath}`);
    }
  }
  for (const war of manifest.web_accessible_resources || []) {
    for (const resPath of war.resources || []) {
      assert.ok(fs.existsSync(path.join(REPO_ROOT, resPath)), `Missing web_accessible_resource: ${resPath}`);
    }
  }

  // Validate Chrome Web Store _locales and character limits
  assert.equal(manifest.default_locale, 'en');
  for (const locale of ['en', 'zh_TW', 'zh_CN']) {
    const msgPath = path.join(REPO_ROOT, '_locales', locale, 'messages.json');
    assert.ok(fs.existsSync(msgPath), `Missing locale file: ${msgPath}`);
    const msgs = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
    assert.ok(msgs.extName?.message.length > 0 && msgs.extName.message.length <= 45, `${locale} extName must be <= 45 chars`);
    assert.ok(msgs.extDescription?.message.length > 0 && msgs.extDescription.message.length <= 132, `${locale} extDescription must be <= 132 chars`);
  }
});

test('extension source code makes zero outbound external network calls', () => {
  const jsFiles = walkFiles(REPO_ROOT, ['.js', '.mjs']);
  const forbiddenPatterns = [
    /fetch\s*\(\s*['"`]https?:\/\//i,
    /new\s+WebSocket\s*\(/i,
    /new\s+XMLHttpRequest\s*\(/i,
    /navigator\.sendBeacon\s*\(/i,
    /generativelanguage\.googleapis\.com/i,
    /api\.openai\.com/i
  ];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pat of forbiddenPatterns) {
      assert.equal(
        pat.test(content),
        false,
        `Forbidden external network call pattern ${pat} found in ${path.relative(REPO_ROOT, file)}`
      );
    }
  }
});

test('extension HTML and CSS adhere to Chinese BCP-47 and CJK font-stack rules from the skill', () => {
  const htmlFiles = walkFiles(REPO_ROOT, ['.html']);
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(
      /\blang\s*=\s*['"]zh['"]/i.test(content),
      false,
      `Bare lang="zh" anti-pattern found in ${path.relative(REPO_ROOT, file)}`
    );
  }

  const cssFiles = walkFiles(REPO_ROOT, ['.css']);
  const jpBeforeCnRe = /font-family\s*:[^;\n{}]*(?:Hiragino\s+(?:Kaku\s+Gothic|Sans)|Yu\s*Gothic|Meiryo)[^;\n{}]*(?:PingFang|Noto\s+Sans\s+(?:CJK\s+)?(?:HK|TC|SC)|Microsoft\s+(?:JhengHei|YaHei))/i;
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(
      jpBeforeCnRe.test(content),
      false,
      `Japanese-first CJK font stack found in ${path.relative(REPO_ROOT, file)}`
    );
  }
});

function readPngHeader(filePath) {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${filePath} must be a valid PNG`);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf.readUInt8(24),
    colorType: buf.readUInt8(25) // 2 = RGB (no alpha), 6 = RGBA
  };
}

test('icons and Chrome Web Store promo assets match exact dimensions and RGB color specs', () => {
  for (const size of [16, 32, 48, 128]) {
    const hdr = readPngHeader(path.join(REPO_ROOT, `icons/icon${size}.png`));
    assert.equal(hdr.width, size);
    assert.equal(hdr.height, size);
  }

  const expectedPromos = [
    ['promo/promo-small.png', 440, 280],
    ['promo/promo-marquee.png', 1400, 560],
    ['promo/screenshot-1-inline-checker.png', 1280, 800],
    ['promo/screenshot-2-popup-gemini-nano.png', 1280, 800],
    ['promo/screenshot-3-sidepanel-workbench.png', 1280, 800]
  ];
  for (const [relPath, w, h] of expectedPromos) {
    const hdr = readPngHeader(path.join(REPO_ROOT, relPath));
    assert.equal(hdr.width, w, `${relPath} width must be ${w}`);
    assert.equal(hdr.height, h, `${relPath} height must be ${h}`);
    assert.equal(hdr.colorType, 2, `${relPath} must be 24-bit RGB without alpha channel (colorType=2)`);
  }
});

