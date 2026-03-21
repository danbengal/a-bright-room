'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';

const MAX_VISIBLE_ENTRIES = 50;

export default function TextLog() {
  const textLog = useGameStore((s) => s.chapterState.textLog);
  const bottomRef = useRef<HTMLDivElement>(null);

  const visibleEntries = useMemo(() => {
    return textLog.slice(-MAX_VISIBLE_ENTRIES);
  }, [textLog]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleEntries.length]);

  return (
    <div className="text-log">
      {visibleEntries.map((entry) => (
        <div
          key={entry.id}
          className={`text-log-entry text-log-entry--${entry.type}`}
        >
          {entry.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
