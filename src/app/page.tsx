'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SAVE_KEYS } from '@/persistence/save';

export default function TitleScreen() {
  const router = useRouter();
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    try {
      const autosave = localStorage.getItem(SAVE_KEYS.autosave);
      setHasSave(autosave !== null);
    } catch {
      setHasSave(false);
    }
  }, []);

  const handleNewGame = () => {
    router.push('/play');
  };

  const handleContinue = () => {
    router.push('/play?continue=1');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <div className="title-screen">
      <h1 className="title-text">a bright room</h1>
      <nav className="title-menu">
        <button onClick={handleNewGame}>new game</button>
        <button onClick={handleContinue} disabled={!hasSave}>
          continue
        </button>
        <button onClick={handleSettings}>settings</button>
      </nav>
    </div>
  );
}
