import { getApiKey, getRecentRewrites, addRecentRewrite, getSystemPrompt } from './storage';
import { SYSTEM_PROMPT as DEFAULT_SYSTEM_PROMPT, type FilterResult } from '../prompts/filter';

const MODEL_ID = 'gemma-4-26b-a4b-it';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Tone modifiers injected randomly per call to vary output style
const TONE_VARIANTS = [
  '', // default — no extra nudge (weighted higher)
  '',
  '',
  'Be generous this time. If there is anything real, funny, or genuinely well-made in the post, lead with that before landing the point. Score 1-5.',
  'Be extra dry and clinical. No warmth at all. Just state the mechanic they used, once, plainly.',
  'Be briefly amused rather than mean. Write like you find the hustle funny more than annoying.',
  'Be very short this time. One tight sentence, nothing more.',
  'Tone it down this call. The post probably has some real content. Give credit where it exists, then note the packaging.',
];

function buildPrompt(base: string, recentRewrites: string[]): string {
  const tone = TONE_VARIANTS[Math.floor(Math.random() * TONE_VARIANTS.length)];
  let extra = '';
  if (tone) extra += `\n\n# This call\n${tone}`;
  if (recentRewrites.length >= 3) {
    extra += `\n\n# Vary your output — avoid reusing the sentence starters, verbs, or structures from these recent rewrites:\n${recentRewrites.slice(0, 6).map(r => `- "${r}"`).join('\n')}`;
  }
  return base + extra;
}

export async function warmUp(): Promise<void> {
  try {
    const key = await getApiKey();
    if (!key) return;
    await fetch(`${API_BASE}/models/${MODEL_ID}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
  } catch { /* best-effort */ }
}

export async function filterPost(text: string, imageUrls: string[] = []): Promise<FilterResult> {
  const [key, recentRewrites, storedPrompt] = await Promise.all([getApiKey(), getRecentRewrites(), getSystemPrompt()]);
  if (!key) throw new Error('No API key configured. Open the extension popup to add one.');

  const systemPrompt = buildPrompt(storedPrompt ?? DEFAULT_SYSTEM_PROMPT, recentRewrites);
  const userParts: any[] = [{ text: JSON.stringify({ text, image_text: '' }) }];
  imageUrls.forEach(url => userParts.push({ fileData: { mimeType: 'image/jpeg', fileUri: url } }));

  const res = await fetch(
    `${API_BASE}/models/${MODEL_ID}:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: userParts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `API error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      let chunk: any;
      try { chunk = JSON.parse(jsonStr); } catch { continue; }

      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if (!part.thought && part.text) {
          accumulated += part.text;
        }
      }
    }
  }

  console.log('[grindset] filterPost raw:', accumulated);

  const cleaned = accumulated.replace(/^```json?\n?/, '').replace(/```$/, '').trim();
  try {
    const result: FilterResult = JSON.parse(cleaned);
    if (result.rewrite) addRecentRewrite(result.rewrite); // fire-and-forget
    return result;
  } catch {
    return { rewrite: cleaned || 'Unable to filter post.', slop_score: 5, archetype: 'genuine', tags: [], meme_key: '' };
  }
}
