// Popup logic. Two things live in chrome.storage.local:
//   enabled: boolean  (the on/off switch)
//   apiKey:  string   (Google AI Studio key)
// background.js watches `enabled` and swaps the toolbar icon; content.js
// watches it too and adds or removes the cards live, no page reload.

const $ = (id) => document.getElementById(id);
const el = {
  master: $('master'), sw: $('sw'), swTxt: $('sw-txt'), status: $('status'), logo: $('logo'),
  site: $('site'), form: $('keyform'), key: $('key'), eye: $('eye'), eyePath: $('eye-path'),
  kstat: $('kstat'), kstatPath: $('kstat-path'), kstatText: $('kstat-t'), save: $('save'),
};

const EYE = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z';
const EYE_OFF = 'M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.7C3.9 9.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 10a3 3 0 0 0 4.1 4.1';
const CHECK = 'M5 12.5l4.5 4.5L19 7';
const WARN = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v5M12 16.5h.01';

const state = { enabled: true, apiKey: '', onLinkedIn: true, note: '' };

async function activeTabIsLinkedIn() {
  // tab.url is only filled in for hosts in host_permissions, so a non-LinkedIn
  // tab comes back with no url and we treat it as "not LinkedIn". No "tabs" permission needed.
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new URL(tab.url).hostname.endsWith('linkedin.com');
  } catch (e) {
    return false;
  }
}

function render() {
  const saved = state.apiKey.trim().length > 0;
  const typed = el.key.value.trim();
  const dirty = typed !== state.apiKey.trim();

  // switch, status line, icon
  const mode = !state.enabled ? 'off' : saved ? 'on' : 'nokey';
  el.master.dataset.state = mode;
  el.sw.dataset.on = String(state.enabled);
  el.sw.setAttribute('aria-checked', String(state.enabled));
  el.swTxt.textContent = state.enabled ? 'ON' : 'OFF';
  el.status.textContent =
    mode === 'off' ? 'Off. Your feed is left alone.'
    : mode === 'on' ? 'On. A card appears above every LinkedIn post.'
    : 'On, but it needs an API key before it can write anything.';
  el.logo.src = state.enabled ? 'icons/icon128.png' : 'icons/icon128-off.png';
  el.site.hidden = state.onLinkedIn;

  // key status and save button
  if (state.note) {
    el.kstat.dataset.k = 'none'; el.kstatPath.setAttribute('d', WARN); el.kstatText.textContent = state.note;
  } else if (saved && !dirty) {
    el.kstat.dataset.k = 'ok'; el.kstatPath.setAttribute('d', CHECK); el.kstatText.textContent = 'Key saved on this device';
  } else if (!saved && !typed) {
    el.kstat.dataset.k = 'none'; el.kstatPath.setAttribute('d', WARN); el.kstatText.textContent = "No key yet. It's needed to write the roasts.";
  } else {
    el.kstat.dataset.k = 'idle';
  }
  el.save.disabled = !typed || (saved && !dirty);
  el.save.textContent = saved && !dirty ? 'Saved' : 'Save key';
}

el.sw.addEventListener('click', async () => {
  state.enabled = !state.enabled;
  await chrome.storage.local.set({ enabled: state.enabled });
  render();
});

el.key.addEventListener('input', () => { state.note = ''; render(); });

el.eye.addEventListener('click', () => {
  const show = el.key.type === 'password';
  el.key.type = show ? 'text' : 'password';
  el.eye.setAttribute('aria-pressed', String(show));
  el.eye.setAttribute('aria-label', show ? 'Hide key' : 'Show key');
  el.eyePath.setAttribute('d', show ? EYE_OFF : EYE);
});

el.form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Enter in the field saves too
  const key = el.key.value.trim();
  if (!key) return;
  await chrome.storage.local.set({ apiKey: key });
  state.apiKey = key;
  el.key.value = key;
  // Soft check only: AI Studio keys start with "AIza". Save either way.
  state.note = /^AIza[\w-]{30,}$/.test(key) ? '' : "Saved, but that doesn't look like an AI Studio key (they start with AIza).";
  render();
});

(async function init() {
  const v = await chrome.storage.local.get({ enabled: true, apiKey: '' });
  state.enabled = v.enabled;
  state.apiKey = v.apiKey;
  el.key.value = v.apiKey;
  state.onLinkedIn = await activeTabIsLinkedIn();
  render();
})();
