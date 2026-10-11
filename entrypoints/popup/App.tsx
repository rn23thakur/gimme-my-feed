import { useEffect, useState } from 'react';
import { getApiKey, setApiKey, isEnabled, setEnabled } from '../../lib/storage';
import './App.css';

const EYE     = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z';
const EYE_OFF = 'M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.7C3.9 9.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 10a3 3 0 0 0 4.1 4.1';
const CHECK   = 'M5 12.5l4.5 4.5L19 7';
const WARN    = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v5M12 16.5h.01';
const GLOBE   = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18';

export default function App() {
  const [enabled, setEnabledState] = useState(true);
  const [apiKey, setApiKeyState]   = useState('');
  const [savedKey, setSavedKey]    = useState('');
  const [showKey, setShowKey]      = useState(false);
  const [keyNote, setKeyNote]      = useState('');

  useEffect(() => {
    (async () => {
      const [en, key] = await Promise.all([isEnabled(), getApiKey()]);
      setEnabledState(en);
      setSavedKey(key ?? '');
      setApiKeyState(key ?? '');
    })();
  }, []);

  async function handleToggle() {
    const next = !enabled;
    setEnabledState(next);
    await setEnabled(next);
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    await setApiKey(trimmed);
    setSavedKey(trimmed);
    setKeyNote(/^AIza[\w-]{30,}$/.test(trimmed) ? '' : "Saved, but that doesn't look like an AI Studio key (they start with AIza).");
  }

  const keyDirty    = apiKey.trim() !== savedKey.trim();
  const hasSavedKey = savedKey.trim().length > 0;
  const masterState = !enabled ? 'off' : hasSavedKey ? 'on' : 'nokey';
  const statusText  = masterState === 'off'   ? 'Off. Your feed is left alone.'
                    : masterState === 'on'    ? 'On. A card appears above every LinkedIn post.'
                    : 'On, but needs an API key before it can write anything.';

  return (
    <main className="pp">
      <header className="hd">
        <img className="logo" src={enabled ? '/icon/128.png' : '/icon/128-off.png'} width={40} height={40} alt="" />
        <div>
          <h1 className="nm">Gimme My Feed</h1>
          <p className="tg">Dry reality checks for LinkedIn</p>
        </div>
      </header>

      {/* Master toggle */}
      <section className="master" data-state={masterState}>
        <div className="mt">
          <p className="m-t">Reality checks</p>
          <p className="m-s">{statusText}</p>
        </div>
        <button className="sw" type="button" role="switch" aria-checked={enabled}
                data-on={String(enabled)} onClick={handleToggle}>
          <span className="sw-txt">{enabled ? 'ON' : 'OFF'}</span>
          <span className="sw-knob" />
        </button>
      </section>

      <p className="scope">
        <svg className="ic" viewBox="0 0 24 24" width={14} height={14} aria-hidden><path d={GLOBE} /></svg>
        <span>Works on linkedin.com only, for now</span>
      </p>

      {/* API key */}
      <form onSubmit={handleSaveKey} autoComplete="off">
        <div className="keyblock">
          <label className="kl" htmlFor="key">
            <span className="kt">Google AI Studio API key</span>
          </label>
          <input className="in" id="key" type={showKey ? 'text' : 'password'}
                 value={apiKey} placeholder="Paste your key" spellCheck={false}
                 onChange={e => { setKeyNote(''); setApiKeyState(e.target.value); }} />
          <button className="eye" type="button" aria-label={showKey ? 'Hide key' : 'Show key'}
                  aria-pressed={showKey} onClick={() => setShowKey(v => !v)}>
            <svg className="ic" viewBox="0 0 24 24" width={18} height={18} aria-hidden>
              <path d={showKey ? EYE_OFF : EYE} />
            </svg>
          </button>
        </div>

        <p className="kstat" data-k={keyNote ? 'warn' : hasSavedKey && !keyDirty ? 'ok' : !hasSavedKey && !apiKey ? 'warn' : 'idle'}>
          <svg className="ic" viewBox="0 0 24 24" width={14} height={14} aria-hidden>
            <path d={hasSavedKey && !keyDirty && !keyNote ? CHECK : WARN} />
          </svg>
          <span>
            {keyNote || (hasSavedKey && !keyDirty ? 'Key saved on this device' : !hasSavedKey && !apiKey ? "No key yet. It's needed to write the roasts." : '')}
          </span>
        </p>

        <button className="save" type="submit" disabled={!apiKey.trim() || (hasSavedKey && !keyDirty)}>
          {hasSavedKey && !keyDirty ? 'Saved' : 'Save key'}
        </button>
      </form>
      <a className="getkey" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Get a free key →</a>

      <button
        className="save"
        type="button"
        style={{ marginTop: 16 }}
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        Edit system prompt →
      </button>

      <p className="foot">
        Uses <b>gemma-4-26b-a4b-it</b> through Google AI Studio. Your key is stored on this device only. The text of each post is sent to Google to write its roast.
      </p>
    </main>
  );
}
