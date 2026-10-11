# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Gimme My Feed** — a Chrome (MV3) browser extension that injects a "Reality Check" card above every LinkedIn feed post. It calls the Google Gemini API (using the `gemma-4-26b-a4b-it` model) to classify and rewrite the post with a sarcastic one-liner, a slop score, archetype label, and trick tags.

Built with [WXT](https://wxt.dev/) (a Vite-based extension framework), React 19, and Tailwind CSS v4.

## Commands

```bash
npm run dev           # Dev mode with HMR (Chrome)
npm run dev:firefox   # Dev mode for Firefox
npm run build         # Production build → .output/chrome-mv3/
npm run build:firefox
npm run zip           # Build + zip for store submission
npm run compile       # TypeScript type-check only (no emit)
```

Load the unpacked extension in Chrome from `.output/chrome-mv3/` after building.

## Architecture

```
entrypoints/
  content.ts      # Content script — runs on linkedin.com, finds post containers
                  # via MutationObserver, mounts a shadow DOM React UI per post
  background.ts   # Minimal background service worker (stub)

components/
  PostOverlay.tsx    # Per-post React component: calls filterPost(), manages
                     # loading/error/result state, hides original LinkedIn text
  RealityCheckCard.tsx  # Pure UI: Skeleton, ErrorCard, LoadedCard sub-components;
                          # renders archetype chip, slop meter, rewrite, tags, thumbs
  RealityCheckCard.css   # All card styles (not Tailwind — scoped CSS)

lib/
  gemma.ts        # filterPost(): streams SSE from Gemini, parses JSON FilterResult.
                  # warmUp(): fires a 1-token request on load to warm the connection.
                  # buildPrompt(): injects random tone variant + recent-rewrite dedup.
  storage.ts      # chrome.storage.local helpers: apiKey, enabled, systemPrompt,
                  # recentRewrites (last 8 rewrites, used to avoid repetition)
  postFinder.ts   # findPostContainers(), extractPostText(), extractPostImages(),
                  # hidePromotedPosts() — all LinkedIn DOM selectors live here

prompts/
  filter.ts       # SYSTEM_PROMPT constant + FilterResult / Archetype TypeScript types

assets/
  tailwind.css    # Tailwind v4 entry point imported by the content script

tests/
  prompt-tester.html    # Standalone HTML page for testing prompt output locally
  reality-check-card.html  # Standalone HTML page for visual card testing
  posts.json / rewrites.json  # Test fixtures
```

### Key design points

- **Shadow DOM isolation**: WXT's `createShadowRootUi` mounts each React tree inside a shadow root so styles don't leak into LinkedIn's page. `RealityCheckCard.css` is scoped to the shadow root; Tailwind is used only for utility classes in the content script.
- **Deduplication**: `data-grindset-injected` is stamped on processed posts to avoid double-mounting. `postFinder.ts` also filters to innermost containers to handle nested DOM.
- **Promoted post hiding**: `hidePromotedPosts()` in `postFinder.ts` hides any post with a `Promoted` span before injection runs.
- **API key flow**: Stored in `chrome.storage.local` under `apiKey`. Without it, `gemma.ts` throws and `PostOverlay` surfaces the error inline. The key can be set via the browser DevTools console (`chrome.storage.local.set({apiKey: "..."})`) or through the extension popup.
- **Original text toggle**: `PostOverlay` hides the LinkedIn `[data-testid="expandable-text-box"]` element while the card is shown. `RealityCheckCard` has a "Show original / Hide original" toggle that reveals the stashed `originalText` prop inline.
- **Output variation**: `gemma.ts` randomly selects a tone modifier from `TONE_VARIANTS` and appends recent rewrite history so the model avoids repetitive sentence starters across calls.
- **PLACEHOLDER_MODE**: `PostOverlay.tsx` has a `PLACEHOLDER_MODE` constant (default `false`) — flip to `true` for UI layout work without making API calls.

### FilterResult schema

Defined in `prompts/filter.ts`. The model must return valid JSON only:

```ts
{ archetype: Archetype; tags: string[]; slop_score: number; rewrite: string; meme_key: string }
```

`slop_score` is 1–10. `archetype` is one of the 11 values in the `Archetype` union. If JSON parsing fails, `gemma.ts` falls back to a default object with `slop_score: 5`.

## Model constraint

**Hackathon rule**: the model must be `gemma-4-26b-a4b-it`. Do not swap to Gemini Flash or any other model, even for latency. The `gemma-4-31b-it` variant is also allowed as an alternative. Use `apiVersion: 'v1beta'` for all calls (already set in `API_BASE`).

## Dependencies to know

- `@google/generative-ai` — Google Generative AI SDK; direct REST calls to `https://generativelanguage.googleapis.com/v1beta` via SSE (`streamGenerateContent?alt=sse`)
- `@wxt-dev/module-react` — WXT React module; provides `defineContentScript`, `createShadowRootUi`, auto-imports
- `@tailwindcss/vite` — Tailwind v4 Vite plugin (no `tailwind.config.js` needed)
