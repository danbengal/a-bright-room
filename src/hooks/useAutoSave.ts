// Auto-save hook — saves every 30 seconds while the game is running

'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';

const AUTOSAVE_INTERVAL_MS = 30_000; // 30 seconds

export function useAutoSave(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialized = useGameStore((s) => s.initialized);
  const paused = useGameStore((s) => s.paused);
  const autoSave = useGameStore((s) => s.autoSave);

  useEffect(() => {
    // Only auto-save when initialized and not paused
    if (!initialized || paused) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      autoSave();
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialized, paused, autoSave]);
}
