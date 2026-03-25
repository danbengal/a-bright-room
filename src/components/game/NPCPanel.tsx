'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function NPCPanel() {
  const activeDialogue = useGameStore((s) => s.chapterState.activeDialogue);
  const npcs = useGameStore((s) => s.chapterState.npcs);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const selectDialogueOption = useGameStore((s) => s.selectDialogueOption);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  // Escape key closes dialogue
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialogue();
      }
    },
    [closeDialogue],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!activeDialogue || !currentConfig) return null;

  const npcDef = currentConfig.npcs.find((n) => n.id === activeDialogue.npcId);
  const npcState = npcs[activeDialogue.npcId];
  const displayName = npcDef?.name ?? activeDialogue.npcId;

  return (
    <div className="dialogue-overlay">
      <div className="dialogue-container">
        <div className="dialogue-header">
          <span className="dialogue-npc-name">
            {displayName}
            {npcState && (
              <span className="dialogue-rel">
                rep: {npcState.relationship}
              </span>
            )}
          </span>
          <button className="dialogue-close" onClick={closeDialogue}>
            [close · esc]
          </button>
        </div>

        <div className="dialogue-text">{activeDialogue.text}</div>

        <div className="dialogue-options">
          {activeDialogue.options.map((option) => (
            <button
              key={option.id}
              className="dialogue-option"
              onClick={() => selectDialogueOption(option.id)}
            >
              &gt; {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
