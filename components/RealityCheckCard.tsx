import { useState, type ReactElement } from 'react';
import './RealityCheckCard.css';
import type { FilterResult, Archetype } from '../prompts/filter';

export type Theme = 'light' | 'dark';
type Tone = 'calm' | 'mild' | 'hot' | 'max' | 'neutral';

function scoreToTone(score: number): Tone {
  if (score <= 3) return 'calm';
  if (score <= 6) return 'mild';
  if (score <= 8) return 'hot';
  return 'max';
}

const TONE_LABEL: Record<Tone, string> = {
  calm: 'Honest', mild: 'Some fluff', hot: 'Heavy slop', max: 'Pure bait', neutral: 'Neutral',
};

const ARCHETYPE_META: Record<Archetype, { label: string; icon: ReactElement }> = {
  rage_bait:      { label: 'Rage Bait',      icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.2 2 2.5C11 8.5 11 5.5 12 3Z" /></svg> },
  karma_bait:     { label: 'Karma Bait',     icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><polyline points="18 15 12 9 6 15" /></svg> },
  humble_brag:    { label: 'Humble Brag',    icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
  thought_leader: { label: 'Thought Leader', icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /></svg> },
  story_arc:      { label: 'Story Arc',      icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg> },
  job_fishing:    { label: 'Job Fishing',    icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg> },
  tech_explainer: { label: 'Tech Explainer', icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
  milestone_flex: { label: 'Milestone Flex', icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg> },
  product_plug:   { label: 'Product Plug',   icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg> },
  comment:        { label: 'Comment',        icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
  genuine:        { label: 'Honest Post',    icon: <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M17 8C8 10 5.9 16.17 3.82 20.31" /><path d="M3.82 20.31C5.6 18.94 8 17 12 17c5 0 8-1.5 8-8" /></svg> },
};

const SEGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// ── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ theme }: { theme: Theme }) {
  return (
    <div className="rc" data-theme={theme} data-tone="neutral">
      <div className="skel shell">
        <div className="top">
          <span className="gh chg" />
          <div className="meter">
            {SEGS.map(n => <span key={n} className={`seg s${n}`} data-on="false" />)}
          </div>
          <span className="gh ng" />
        </div>
        <div className="skel-rw">
          <span className="gh l1" /><span className="gh l2" /><span className="gh l3" />
        </div>
        <div className="foot">
          <span className="gh tg" /><span className="gh tg2" />
        </div>
      </div>
    </div>
  );
}

// ── Error ────────────────────────────────────────────────────────────────────

function ErrorCard({ theme, onRetry }: { theme: Theme; onRetry: () => void }) {
  return (
    <div className="rc" data-theme={theme} data-tone="neutral">
      <div className="errline">
        <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Couldn't check this post. You may be offline.</span>
        <button className="btn" type="button" onClick={onRetry}>
          <svg className="ic" viewBox="0 0 24 24" width={14} height={14} aria-hidden><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3" /></svg>
          Retry
        </button>
      </div>
    </div>
  );
}

// ── Loaded card ──────────────────────────────────────────────────────────────

function LoadedCard({ result, originalText, theme }: { result: FilterResult; originalText: string; theme: Theme }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [thumbed, setThumbed] = useState<'up' | 'down' | null>(null);

  const tone = scoreToTone(result.slop_score);
  const toneLabel = TONE_LABEL[tone];
  const meta = ARCHETYPE_META[result.archetype] ?? ARCHETYPE_META.genuine;

  return (
    <div className="rc" data-theme={theme} data-tone={tone}>
      <section className="shell" aria-label="Reality check">
        <div className="top">
          <span className="chip">
            {meta.icon}
            <span>{meta.label}</span>
          </span>
          <div className="meter" role="meter" aria-label="Slop score" aria-valuemin={1} aria-valuemax={10} aria-valuenow={result.slop_score} aria-valuetext={`Slop ${result.slop_score} out of 10, ${toneLabel}`}>
            {SEGS.map(n => <span key={n} className={`seg s${n}`} data-on={n <= result.slop_score ? 'true' : 'false'} />)}
          </div>
          <div className="score" aria-hidden="true">
            <span className="num">{result.slop_score}</span>
            <span className="of"><span>/10</span><span>{toneLabel}</span></span>
          </div>
        </div>

        <p className="rw"><q>{result.rewrite}</q></p>

        <div className="foot">
          <ul className="tags" aria-label="Tags">
            {result.tags.map(tag => <li key={tag} className="tag">{tag}</li>)}
          </ul>
          <div className="acts">
            <button className="btn" type="button" aria-expanded={showOriginal} onClick={() => setShowOriginal(v => !v)}>
              <span>{showOriginal ? 'Hide original' : 'Show original'}</span>
              <svg className="ic chev" viewBox="0 0 24 24" width={14} height={14} aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <span className="sep" aria-hidden="true" />
            <button className="ib" type="button" aria-label="Good roast" aria-pressed={thumbed === 'up'} onClick={() => setThumbed(v => v === 'up' ? null : 'up')}>
              <svg className="ic" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
            </button>
            <button className="ib" type="button" aria-label="Bad roast" aria-pressed={thumbed === 'down'} onClick={() => setThumbed(v => v === 'down' ? null : 'down')}>
              <svg className="ic flip" viewBox="0 0 24 24" width={16} height={16} aria-hidden><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
            </button>
          </div>
        </div>

        {showOriginal && (
          <div className="orig" tabIndex={0}>
            <span className="orig-h">Original Post</span>
            <p>{originalText}</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export interface RealityCheckCardProps {
  loading: boolean;
  error: string | null;
  result: FilterResult | null;
  originalText: string;
  theme: Theme;
  onRetry: () => void;
}

export function RealityCheckCard({ loading, error, result, originalText, theme, onRetry }: RealityCheckCardProps) {
  if (loading) return <Skeleton theme={theme} />;
  if (error) return <ErrorCard theme={theme} onRetry={onRetry} />;
  if (!result) return null;
  return <LoadedCard result={result} originalText={originalText} theme={theme} />;
}
