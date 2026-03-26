'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function ChapterComplete() {
  const departing = useGameStore((s) => s.chapterState.departing);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const ticks = useGameStore((s) => s.chapterState.ticks);
  const deathCount = useGameStore((s) => s.chapterState.deathCount);
  const exploredCount = useGameStore((s) => s.chapterState.map.exploredCount);
  const mapSize = useGameStore((s) => s.chapterState.map.width * s.chapterState.map.height);

  const [lineIndex, setLineIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const narrative = currentConfig?.departure.standardNarrative ?? [];

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
        setLineIndex(narrative.length); // skip to end
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

  const handleReturnToTitle = () => {
    // Save and return to title
    useGameStore.getState().autoSave();
    window.location.href = '/';
  };

  return (
    <div className="chapter-complete-overlay">
      <div className="chapter-complete">
        <div className="chapter-complete-narrative">
          {narrative.slice(0, lineIndex).map((line, i) => (
            <p key={i} className="chapter-complete-line">{line}</p>
          ))}
        </div>

        {showStats && (
          <div className="chapter-complete-stats">
            <h3 className="chapter-complete-title">chapter 1 complete</h3>
            <div className="chapter-complete-stat-list">
              <div>time: {playMinutes} minutes</div>
              <div>deaths: {deathCount}</div>
              <div>map explored: {exploredPct}%</div>
            </div>
            <p className="chapter-complete-end">
              the story continues... but not yet. chapter 2 is coming.
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
