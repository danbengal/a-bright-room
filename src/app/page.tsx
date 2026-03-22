'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SAVE_KEYS, loadFromLocalStorage, importFromJSON } from '@/persistence/save';

export default function TitleScreen() {
  const router = useRouter();
  const [hasSave, setHasSave] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    try {
      const autosave = localStorage.getItem(SAVE_KEYS.autosave);
      setHasSave(autosave !== null);
    } catch {
      setHasSave(false);
    }
  }, []);

  const handleNewGame = () => {
    // Clear any existing autosave so we start fresh
    try { localStorage.removeItem(SAVE_KEYS.autosave); } catch {}
    router.push('/play');
  };

  const handleContinue = () => {
    const save = loadFromLocalStorage(SAVE_KEYS.autosave);
    if (save) {
      router.push('/play?continue=1');
    }
  };

  const handleImportSubmit = () => {
    setImportError('');
    try {
      // Decode from base64
      const json = atob(importCode.trim());
      const save = importFromJSON(json);
      if (!save) {
        setImportError('invalid save code. check and try again.');
        return;
      }
      // Store to autosave slot
      localStorage.setItem(SAVE_KEYS.autosave, JSON.stringify(save));
      router.push('/play?continue=1');
    } catch {
      setImportError('invalid save code. check and try again.');
    }
  };

  return (
    <div className="title-screen">
      <h1 className="title-text">a bright room</h1>
      <nav className="title-menu">
        <button onClick={handleNewGame}>new game</button>
        <button onClick={handleContinue} disabled={!hasSave}>
          continue
        </button>
        <button onClick={() => setShowImport(!showImport)}>
          load save
        </button>
      </nav>

      {showImport && (
        <div className="import-panel">
          <p className="import-label">paste your save code below:</p>
          <textarea
            className="import-textarea"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="paste save code here..."
            rows={4}
          />
          {importError && <p className="import-error">{importError}</p>}
          <button className="import-btn" onClick={handleImportSubmit} disabled={!importCode.trim()}>
            load
          </button>
        </div>
      )}
    </div>
  );
}
