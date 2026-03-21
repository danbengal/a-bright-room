'use client';

import { useGameStore } from '@/stores/gameStore';

export default function NPCPanel() {
  const activeDialogue = useGameStore((s) => s.chapterState.activeDialogue);
  const npcs = useGameStore((s) => s.chapterState.npcs);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const selectDialogueOption = useGameStore((s) => s.selectDialogueOption);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  if (!activeDialogue || !currentConfig) return null;

  // Find NPC definition for display name
  const npcDef = currentConfig.npcs.find((n) => n.id === activeDialogue.npcId);
  const npcState = npcs[activeDialogue.npcId];
  const displayName = npcDef?.name ?? activeDialogue.npcId;

  return (
    <div className="dialogue-overlay">
      <div className="dialogue-container">
        <div className="dialogue-npc-name">
          {displayName}
          {npcState && (
            <span style={{ marginLeft: '0.5rem', opacity: 0.5 }}>
              [{npcState.relationship > 0 ? '+' : ''}
              {npcState.relationship}]
            </span>
          )}
        </div>

        <div className="dialogue-text">{activeDialogue.text}</div>

        {activeDialogue.options.length > 0 && (
          <div className="dialogue-options">
            {activeDialogue.options.map((option) => (
              <button
                key={option.id}
                className="dialogue-option"
                onClick={() => selectDialogueOption(option.id)}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        <button className="dialogue-close" onClick={closeDialogue}>
          [close]
        </button>
      </div>
    </div>
  );
}
