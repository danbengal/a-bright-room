// Game loop hook — runs the tick engine, speed-adjustable

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';

export interface UseGameLoopReturn {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
}

export function useGameLoop(): UseGameLoopReturn {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const initialized = useGameStore((s) => s.initialized);
  const paused = useGameStore((s) => s.paused);
  const gameSpeed = useGameStore((s) => s.gameSpeed);

  const clearLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startLoop = useCallback(() => {
    clearLoop();
    const intervalMs = Math.round(1000 / gameSpeed);
    intervalRef.current = setInterval(() => {
      // Always grab tick from current state to avoid stale closures
      useGameStore.getState().tick();
    }, intervalMs);
    setIsRunning(true);
  }, [gameSpeed, clearLoop]);

  useEffect(() => {
    if (initialized && !paused) {
      startLoop();
    } else {
      clearLoop();
    }

    return () => {
      clearLoop();
    };
  }, [initialized, paused, startLoop, clearLoop]);

  return { start: startLoop, stop: clearLoop, isRunning };
}
