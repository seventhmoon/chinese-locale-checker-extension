import {
  SUPPORTED_PROFILES,
  RULE_CATEGORIES,
  loadSettings,
  saveSettings
} from '../core/settings.js';
import { GeminiNanoManager, getPromptApiProvider } from '../core/nano-client.js';

const nanoLocal = new GeminiNanoManager(globalThis);

const elEnabled = document.getElementById('toggle-enabled');
const elSiteCard = document.getElementById('site-card');
const elSiteHost = document.getElementById('site-host');
const btnToggleSite = document.getElementById('btn-toggle-site');
const elProfile = document.getElementById('select-profile');
const elRegister = document.getElementById('select-register');
const elToggleNano = document.getElementById('toggle-nano');
const elNanoBadge = document.getElementById('nano-status-badge');
const elNanoDetail = document.getElementById('nano-detail');
const elNanoProgressWrap = document.getElementById('nano-progress-wrap');
const elNanoProgressFill = document.getElementById('nano-progress-fill');
const elNanoProgressText = document.getElementById('nano-progress-text');
const btnPrepareNano = document.getElementById('btn-prepare-nano');
const btnRecheckNano = document.getElementById('btn-recheck-nano');
const elNanoModeGroup = document.getElementById('nano-mode-group');
const elUnderlines = document.getElementById('toggle-underlines');
const elAdvisories = document.getElementById('toggle-advisories');
const elCategoriesList = document.getElementById('categories-list');
const btnOpenWorkbench = document.getElementById('btn-open-workbench');

let currentSettings = null;
let activeTabHost = '';
let activeTab = null;

function populateProfiles() {
  elProfile.innerHTML = '';
  for (const p of SUPPORTED_PROFILES) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    elProfile.appendChild(opt);
  }
}

function renderCategories() {
  elCategoriesList.innerHTML = '';
  const disabled = new Set(currentSettings.disabledCategories || []);
  for (const cat of RULE_CATEGORIES) {
    const label = document.createElement('label');
    label.className = 'cat-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !disabled.has(cat.id);
    cb.addEventListener('change', async () => {
      const nextDisabled = new Set(currentSettings.disabledCategories || []);
      if (cb.checked) nextDisabled.delete(cat.id);
      else nextDisabled.add(cat.id);
      currentSettings = await saveSettings({ disabledCategories: [...nextDisabled] });
    });
    const span = document.createElement('span');
    span.textContent = cat.label;
    label.append(cb, span);
    elCategoriesList.appendChild(label);
  }
}

function renderSettingsUI() {
  elEnabled.checked = currentSettings.enabled;
  elProfile.value = currentSettings.profile;
  elRegister.value = currentSettings.register;
  elToggleNano.checked = currentSettings.useGeminiNano;
  elUnderlines.checked = currentSettings.showInlineUnderlines;
  elAdvisories.checked = currentSettings.showAdvisories;

  document.querySelectorAll('[data-standard]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.standard === currentSettings.standard);
  });

  document.querySelectorAll('[data-nano-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nanoMode === currentSettings.nanoTriggerMode);
  });
  elNanoModeGroup.style.opacity = currentSettings.useGeminiNano ? '1' : '0.5';

  if (activeTabHost) {
    elSiteCard.style.display = 'block';
    elSiteHost.textContent = activeTabHost;
    const isPaused = currentSettings.disabledHosts.includes(activeTabHost);
    btnToggleSite.textContent = isPaused ? 'Resume on site' : 'Pause on site';
  } else {
    elSiteCard.style.display = 'none';
  }

  renderCategories();
}

function renderNanoStatus(info) {
  const status = info?.status || 'unavailable';
  elNanoBadge.className = `status-badge status-${status}`;
  const labels = {
    available: 'Ready',
    downloadable: 'Downloadable',
    downloading: 'Downloading…',
    unavailable: 'Unavailable'
  };
  elNanoBadge.textContent = labels[status] || 'Unavailable';
  elNanoDetail.textContent = info?.detail || '';

  btnPrepareNano.style.display =
    status === 'downloadable' || status === 'downloading' ? 'inline-block' : 'none';
}

async function refreshNanoStatus() {
  elNanoBadge.textContent = 'Checking…';
  // Prefer direct check in popup document context (most accurate for Chrome Built-in AI)
  const provider = getPromptApiProvider(globalThis);
  if (provider.kind !== 'none') {
    const status = await nanoLocal.checkAvailability();
    renderNanoStatus(status);
    return status;
  }
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'NANO_STATUS' });
    renderNanoStatus(resp);
    return resp;
  } catch {
    renderNanoStatus({
      status: 'unavailable',
      detail: 'Chrome Built-in AI (LanguageModel) not detected. Requires Chrome 138+ desktop.'
    });
    return { status: 'unavailable' };
  }
}

async function init() {
  populateProfiles();
  currentSettings = await loadSettings();

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0] || null;
    if (activeTab?.url && /^https?:/.test(activeTab.url)) {
      activeTabHost = new URL(activeTab.url).hostname;
    }
  } catch {
    activeTabHost = '';
  }

  renderSettingsUI();

  elEnabled.addEventListener('change', async () => {
    currentSettings = await saveSettings({ enabled: elEnabled.checked });
    renderSettingsUI();
  });

  btnToggleSite.addEventListener('click', async () => {
    if (!activeTabHost) return;
    const set = new Set(currentSettings.disabledHosts);
    if (set.has(activeTabHost)) set.delete(activeTabHost);
    else set.add(activeTabHost);
    currentSettings = await saveSettings({ disabledHosts: [...set] });
    renderSettingsUI();
  });

  elProfile.addEventListener('change', async () => {
    currentSettings = await saveSettings({ profile: elProfile.value });
  });

  elRegister.addEventListener('change', async () => {
    currentSettings = await saveSettings({ register: elRegister.value });
  });

  document.querySelectorAll('[data-standard]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      currentSettings = await saveSettings({ standard: btn.dataset.standard });
      renderSettingsUI();
    });
  });

  document.querySelectorAll('[data-nano-mode]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      currentSettings = await saveSettings({ nanoTriggerMode: btn.dataset.nanoMode });
      renderSettingsUI();
    });
  });

  elToggleNano.addEventListener('change', async () => {
    currentSettings = await saveSettings({ useGeminiNano: elToggleNano.checked });
    renderSettingsUI();
  });

  elUnderlines.addEventListener('change', async () => {
    currentSettings = await saveSettings({ showInlineUnderlines: elUnderlines.checked });
  });

  elAdvisories.addEventListener('change', async () => {
    currentSettings = await saveSettings({ showAdvisories: elAdvisories.checked });
  });

  btnRecheckNano.addEventListener('click', () => refreshNanoStatus());

  btnPrepareNano.addEventListener('click', async () => {
    btnPrepareNano.disabled = true;
    elNanoProgressWrap.classList.add('visible');
    elNanoProgressFill.style.width = '0%';
    elNanoProgressText.textContent = 'Starting on-device Gemini Nano download…';

    try {
      const res = await nanoLocal.prepareModel((pct) => {
        elNanoProgressFill.style.width = `${pct}%`;
        elNanoProgressText.textContent = `Downloading Gemini Nano locally: ${pct}%`;
      });
      renderNanoStatus(res);
      if (res.ok) {
        elNanoProgressFill.style.width = '100%';
        elNanoProgressText.textContent = 'Gemini Nano ready on-device!';
      } else {
        elNanoProgressText.textContent = res.detail || 'Model preparation incomplete.';
      }
    } catch (err) {
      elNanoProgressText.textContent = err?.message || 'Unable to download model.';
    } finally {
      btnPrepareNano.disabled = false;
    }
  });

  btnOpenWorkbench.addEventListener('click', async () => {
    try {
      if (chrome.sidePanel?.open && activeTab?.windowId) {
        await chrome.sidePanel.open({ windowId: activeTab.windowId });
        window.close();
      } else {
        await chrome.runtime.sendMessage({
          type: 'OPEN_SIDEPANEL',
          tabId: activeTab?.id,
          windowId: activeTab?.windowId
        });
        window.close();
      }
    } catch {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel/sidepanel.html') });
    }
  });

  await refreshNanoStatus();
}

init();
