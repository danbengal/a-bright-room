'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function ChapterComplete() {
  const departing = useGameStore((s) => s.chapterState.departing);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const ticks = useGameStore((s) => s.chapterState.ticks);
  const deathCount = useGameStore((s) => s.chapterState.deathCount);
  const exploredCount = useGameStore((s) => s.chapterState.map.exploredCount);
  const mapSize = useGameStore((s) => s.chapterState.map.width * s.chapterState.map.height);
  const flags = useGameStore((s) => s.chapterState.flags);
  const quests = useGameStore((s) => s.chapterState.quests);

  const [lineIndex, setLineIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const isHidden = flags.exitHidden === true;

  const narrative = useMemo(() => {
    if (!currentConfig) return [];
    return isHidden
      ? currentConfig.departure.hiddenNarrative
      : currentConfig.departure.standardNarrative;
  }, [currentConfig, isHidden]);

  // Advance narrative lines one at a time
  useEffect(() => {
    if (!departing || lineIndex >= narrative.length) return;
    const timer = setTimeout(() => {
      setLineIndex((i) => i + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [departing, lineIndex, narrative.length]);

  // Show stats after narrative finishes
  useEffect(() => {
    if (lineIndex >= narrative.length && narrative.length > 0) {
      const timer = setTimeout(() => setShowStats(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [lineIndex, narrative.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (lineIndex < narrative.length) {
        setLineIndex(narrative.length);
      }
    }
  }, [lineIndex, narrative.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!departing) return null;

  const playMinutes = Math.floor(ticks / 60);
  const exploredPct = mapSize > 0 ? Math.round((exploredCount / mapSize) * 100) : 0;

  const questsCompleted = Object.values(quests).filter((q) => q.completed).length;
  const questsTotal = Object.values(quests).length;

  const handleReturnToTitle = () => {
    // Record exit type in global state for future chapters
    const state = useGameStore.getState();
    useGameStore.setState({
      globalState: {
        ...state.globalState,
        chaptersCompleted: [...state.globalState.chaptersCompleted, 'chapter01-dark-room'],
        exitsTaken: { ...state.globalState.exitsTaken, 'chapter01-dark-room': isHidden ? 'hidden' : 'standard' },
        totalDeaths: state.globalState.totalDeaths + deathCount,
        totalPlaytime: state.globalState.totalPlaytime + ticks,
        parallaxShards: isHidden
          ? [...state.globalState.parallaxShards, 'shard_chapter01']
          : state.globalState.parallaxShards,
      },
    });
    state.autoSave();
    window.location.href = '/';
  };

  return (
    <div className={`chapter-complete-overlay ${isHidden ? 'chapter-complete--hidden' : ''}`}>
      <div className="chapter-complete">
        <div className="chapter-complete-narrative">
          {narrative.slice(0, lineIndex).map((line, i) => (
            <p key={i} className="chapter-complete-line">{line}</p>
          ))}
        </div>

        {showStats && (
          <div className="chapter-complete-stats">
            <h3 className="chapter-complete-title">
              {isHidden ? 'chapter 1 — the hidden path' : 'chapter 1 complete'}
            </h3>
            <div className="chapter-complete-stat-list">
              <div>time: {playMinutes} minutes</div>
              <div>deaths: {deathCount}</div>
              <div>map explored: {exploredPct}%</div>
              <div>quests: {questsCompleted}/{questsTotal}</div>
              <div>exit: {isHidden ? 'the hermit\'s passage' : 'the vessel'}</div>
            </div>

            {isHidden && (
              <p className="chapter-complete-shard">
                parallax shard acquired. the hermit showed you a door that shouldn&apos;t exist. this will matter later.
              </p>
            )}

            <p className="chapter-complete-end">
              {isHidden
                ? 'you chose the path less seen. the parallax remembers.'
                : 'the story continues... but not yet. chapter 2 is coming.'}
            </p>
            <button className="departure-btn" onClick={handleReturnToTitle}>
              return to title
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
