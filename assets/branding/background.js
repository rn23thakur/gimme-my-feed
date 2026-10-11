// Keeps the toolbar icon in step with the on/off switch.
// The popup only writes `enabled` to storage; everything else reacts to that.

const SIZES = [16, 32, 48, 128];
const iconPaths = (suffix) =>
  Object.fromEntries(SIZES.map((s) => [s, `icons/icon${s}${suffix}.png`]));

async function syncIcon() {
  const { enabled = true } = await chrome.storage.local.get('enabled');
  await chrome.action.setIcon({ path: iconPaths(enabled ? '' : '-off') });
  await chrome.action.setTitle({
    title: enabled ? 'Gimme My Feed: on' : 'Gimme My Feed: off',
  });
}

chrome.runtime.onInstalled.addListener(syncIcon);
chrome.runtime.onStartup.addListener(syncIcon);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.enabled) syncIcon();
});

// Call the model from here, not from the content script, so the API key
// never sits in a page-facing context. Content script sends
// { type: 'roast', text } and gets the result back.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'roast') {
    roast(msg.text).then(sendResponse, (e) => sendResponse({ error: String(e) }));
    return true; // keep the channel open for the async reply
  }
});

async function roast(text) {
  const { enabled = true, apiKey = '' } = await chrome.storage.local.get(['enabled', 'apiKey']);
  if (!enabled) return { error: 'off' };
  if (!apiKey) return { error: 'no_key' };
  // TODO: POST to https://generativelanguage.googleapis.com/ with the key in the
  // x-goog-api-key header and your prompt; return { state, archetype, score, rewrite, tags }.
  return { error: 'not_implemented', length: text.length };
}
