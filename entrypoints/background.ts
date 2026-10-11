export default defineBackground(() => {
  function setIcon(enabled: boolean) {
    const suffix = enabled ? '' : '-off';
    browser.action.setIcon({
      path: {
        16:  `/icon/16${suffix}.png`,
        32:  `/icon/32${suffix}.png`,
        48:  `/icon/48${suffix}.png`,
        128: `/icon/128${suffix}.png`,
      },
    });
  }

  // Set icon on startup based on stored state
  chrome.storage.local.get({ enabled: true }, ({ enabled }) => setIcon(enabled));

  // React to toggle from popup
  chrome.storage.onChanged.addListener((changes) => {
    if ('enabled' in changes) setIcon(changes.enabled.newValue ?? true);
  });
});
