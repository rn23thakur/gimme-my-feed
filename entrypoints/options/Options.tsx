import { useEffect, useState } from 'react';
import { getSystemPrompt, setSystemPrompt, clearSystemPrompt } from '../../lib/storage';
import { SYSTEM_PROMPT as DEFAULT_PROMPT } from '../../prompts/filter';

const CHECK = 'M5 12.5l4.5 4.5L19 7';

export default function Options() {
  const [prompt, setPrompt]           = useState('');
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);
  const [flash, setFlash]             = useState(false);

  useEffect(() => {
    getSystemPrompt().then(sp => {
      setSavedPrompt(sp);
      setPrompt(sp ?? DEFAULT_PROMPT);
    });
  }, []);

  async function handleSave() {
    await setSystemPrompt(prompt);
    setSavedPrompt(prompt);
    setFlash(true);
    setTimeout(() => setFlash(false), 1800);
  }

  async function handleReset() {
    await clearSystemPrompt();
    setSavedPrompt(null);
    setPrompt(DEFAULT_PROMPT);
  }

  const isCustom  = savedPrompt !== null;
  const isDirty   = prompt !== (savedPrompt ?? DEFAULT_PROMPT);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.4,
    }}>
      <style>{`
        :root {
          --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --bg: #FBF5E6; --ink: #231C14; --ink-2: #5B4F3F; --edge: #2A2118; --rule: #CFC2A2;
          --hover: #EFE5CC; --field: #FFFDF7; --focus: #1D4ED8;
          --ok: #0B6E63; --warn: #8A5300; --lift: #D6451B;
          --btn: #231C14; --btn-fg: #FBF5E6;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #2B2824; --ink: #F3ECDD; --ink-2: #C4B9A6; --edge: #A89D88; --rule: #5A544A;
            --hover: #37332D; --field: #221F1B; --focus: #8AB4FF;
            --ok: #5CD6BF; --warn: #F2B63C; --lift: #FF8B5E;
            --btn: #F3ECDD; --btn-fg: #231C14;
          }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <img src="/icon/128.png" width={36} height={36} alt="" style={{ display: 'block', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.015em' }}>Gimme My Feed</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1 }}>System prompt</div>
          </div>
        </div>

        {/* Prompt editor */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            System prompt
            {isCustom && <span style={{ marginLeft: 8, color: 'var(--warn)', fontSize: 12, fontWeight: 600 }}>· custom</span>}
          </div>
          {isCustom && (
            <button onClick={handleReset} style={{
              padding: '3px 10px', border: '1px solid var(--rule)', borderRadius: 7,
              background: 'transparent', color: 'var(--ink-2)', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Reset to default</button>
          )}
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          spellCheck={false}
          style={{
            display: 'block', width: '100%', height: 480, padding: '12px 14px',
            border: '1.5px solid var(--edge)', borderRadius: 12,
            background: 'var(--field)', color: 'var(--ink)',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 12.5,
            lineHeight: 1.55, resize: 'vertical', outline: 'none',
          }}
        />

        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-2)' }}>
          Changes apply to the next post analysed. Reload LinkedIn after saving.
        </p>

        {/* Save bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              height: 44, padding: '0 28px', border: 0, borderRadius: 10,
              background: isDirty ? 'var(--btn)' : 'transparent',
              border: isDirty ? 'none' : '1.5px solid var(--rule)',
              color: isDirty ? 'var(--btn-fg)' : 'var(--ink-2)',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: isDirty ? 'pointer' : 'default',
            }}
          >
            {isDirty ? 'Save prompt' : 'Saved'}
          </button>

          {flash && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--ok)' }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d={CHECK} />
              </svg>
              Saved
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
