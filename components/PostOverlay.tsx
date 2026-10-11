import { useState, useEffect, useRef } from 'react';
import { RealityCheckCard, type Theme } from './RealityCheckCard';
import { filterPost } from '../lib/gemma';
import { extractPostText, extractPostImages } from '../lib/postFinder';
import type { FilterResult } from '../prompts/filter';

// Set to true to show placeholder data without making API calls.
// Flip to false once the layout looks good.
const PLACEHOLDER_MODE = false;

const PLACEHOLDER: FilterResult = {
  archetype: 'rage_bait',
  tags: ['Hot Take Opener', 'Comment Farming', 'Free Guide Plug'],
  slop_score: 7,
  rewrite: "Google changed its interview, so here's a LeetCode funeral, a hot take and a request to comment.",
  meme_key: '',
};

function detectTheme(): Theme {
  const html = document.documentElement;
  const body = document.body;
  if (
    html.classList.contains('theme--dark') ||
    body.classList.contains('theme--dark') ||
    html.getAttribute('data-color-scheme') === 'dark' ||
    body.getAttribute('data-color-scheme') === 'dark' ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) return 'dark';
  return 'light';
}

export function PostOverlay({ postElement }: { postElement: Element }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FilterResult | null>(null);
  const [theme] = useState<Theme>(detectTheme);

  const originalText = useRef(extractPostText(postElement)).current;
  const imageUrls = useRef(extractPostImages(postElement)).current;
  const textElRef = useRef<HTMLElement | null>(null);

  // Hide the LinkedIn post text while the card is shown
  useEffect(() => {
    const textEl = postElement.querySelector('[data-testid="expandable-text-box"]') as HTMLElement | null;
    if (textEl) {
      textEl.style.display = 'none';
      textElRef.current = textEl;
    }
    return () => {
      if (textElRef.current) textElRef.current.style.display = '';
    };
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      if (PLACEHOLDER_MODE) {
        await new Promise(r => setTimeout(r, 800)); // simulate load
        setResult(PLACEHOLDER);
      } else {
        const r = await filterPost(originalText, imageUrls);
        setResult(r);
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, []);

  return (
    <RealityCheckCard
      loading={loading}
      error={error}
      result={result}
      originalText={originalText}
      theme={theme}
      onRetry={run}
    />
  );
}
