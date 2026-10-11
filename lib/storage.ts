export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get('apiKey');
  return result.apiKey ?? null;
}

export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ apiKey: key });
}

export async function isEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get('enabled');
  return result.enabled ?? true;
}

export async function setEnabled(value: boolean): Promise<void> {
  await chrome.storage.local.set({ enabled: value });
}

export async function getSystemPrompt(): Promise<string | null> {
  const result = await chrome.storage.local.get('systemPrompt');
  return result.systemPrompt ?? null;
}

export async function setSystemPrompt(prompt: string): Promise<void> {
  await chrome.storage.local.set({ systemPrompt: prompt });
}

export async function clearSystemPrompt(): Promise<void> {
  await chrome.storage.local.remove('systemPrompt');
}

export async function getRecentRewrites(): Promise<string[]> {
  const result = await chrome.storage.local.get('recentRewrites');
  return result.recentRewrites ?? [];
}

export async function addRecentRewrite(text: string): Promise<void> {
  const recent = await getRecentRewrites();
  await chrome.storage.local.set({ recentRewrites: [text, ...recent].slice(0, 8) });
}
