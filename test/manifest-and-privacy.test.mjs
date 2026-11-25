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
