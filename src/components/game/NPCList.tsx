'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { evaluateCondition } from '@/engine/events';

interface GiftOption {
  resource: string;
  amount: number;
  relationship: number;
}

// Each NPC values different gifts
const NPC_GIFTS: Record<string, GiftOption[]> = {
  stranger: [
    { resource: 'wood', amount: 10, relationship: 1 },
    { resource: 'fur', amount: 5, relationship: 2 },
    { resource: 'meat', amount: 5, relationship: 1 },
    { resource: 'herb', amount: 3, relationship: 3 },
  ],
  builder: [
    { resource: 'wood', amount: 20, relationship: 1 },
    { resource: 'iron', amount: 5, relationship: 3 },
    { resource: 'steel', amount: 3, relationship: 4 },
    { resource: 'leather', amount: 5, relationship: 1 },
  ],
  cartographer: [
    { resource: 'cloth', amount: 5, relationship: 2 },
    { resource: 'leather', amount: 5, relationship: 2 },
    { resource: 'curedMeat', amount: 10, relationship: 3 },
    { resource: 'water', amount: 10, relationship: 1 },
  ],
  hermit: [
    { resource: 'herb', amount: 3, relationship: 3 },
    { resource: 'meat', amount: 5, relationship: 1 },
    { resource: 'fur', amount: 5, relationship: 2 },
    { resource: 'wood', amount: 10, relationship: 1 },
  ],
  scout: [
    { resource: 'bone', amount: 5, relationship: 1 },
    { resource: 'leather', amount: 5, relationship: 2 },
    { resource: 'iron', amount: 5, relationship: 3 },
    { resource: 'curedMeat', amount: 5, relationship: 2 },
  ],
};

// Fallback gifts
const DEFAULT_GIFTS: GiftOption[] = [
  { resource: 'fur', amount: 5, relationship: 1 },
  { resource: 'meat', amount: 10, relationship: 1 },
];

export default function NPCList() {
  const npcs = useGameStore((s) => s.chapterState.npcs);
  const resources = useGameStore((s) => s.chapterState.resources);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const chapterState = useGameStore((s) => s.chapterState);
  const talkTo = useGameStore((s) => s.talkTo);
  const activeDialogue = useGameStore((s) => s.chapterState.activeDialogue);

  const [giftOpen, setGiftOpen] = useState<string | null>(null);

  if (!currentConfig) return null;

  const metNPCs = currentConfig.npcs.filter((npcDef) => {
    const npc = npcs[npcDef.id];
    return npc && npc.met && npc.alive;
  });

  if (metNPCs.length === 0) return null;

  const hasNewDialogue = (npcId: string): boolean => {
    const npcDef = currentConfig.npcs.find((n) => n.id === npcId);
    if (!npcDef) return false;
    const npc = npcs[npcId];
    if (!npc) return false;

    // Check ALL nodes whose conditions are currently met — if any are unseen, there's new dialogue
    for (const node of npcDef.dialogueTree) {
      if (!node.condition || evaluateCondition(node.condition, chapterState)) {
        const seenFlag = `_seen_${node.id}`;
        if (!npc.dialogueFlags[seenFlag]) return true;
      }
    }
    return false;
  };

  const giveGift = (npcId: string, resource: string, amount: number, relGain: number) => {
    const state = useGameStore.getState();
    const current = state.chapterState.resources[resource] ?? 0;
    if (current < amount) return;

    const npc = state.chapterState.npcs[npcId];
    if (!npc) return;

    useGameStore.setState({
      chapterState: {
        ...state.chapterState,
        resources: {
          ...state.chapterState.resources,
          [resource]: current - amount,
        },
        npcs: {
          ...state.chapterState.npcs,
          [npcId]: {
            ...npc,
            relationship: npc.relationship + relGain,
          },
        },
      },
    });

    state.addNotification(`gave ${amount} ${resource}. +${relGain} rep.`, 2000);
    setGiftOpen(null);
  };

  return (
    <div className="panel">
      <div className="panel-header">people</div>
      <div className="panel-list">
        {metNPCs.map((npcDef) => {
          const npc = npcs[npcDef.id];
          const isNew = hasNewDialogue(npcDef.id);
          const gifts = NPC_GIFTS[npcDef.id] ?? DEFAULT_GIFTS;

          return (
            <div key={npcDef.id} className="panel-item-wrapper">
              <div className="panel-item">
                <span className="panel-item-name">{npcDef.name}</span>
                <span className="npc-relationship">
                  rep: {npc.relationship}
                </span>
                <button
                  className={`panel-item-btn ${isNew ? 'panel-item-btn--new' : 'panel-item-btn--seen'}`}
                  onClick={() => talkTo(npcDef.id)}
                  disabled={!!activeDialogue}
                >
                  talk
                </button>
                <button
                  className="panel-item-btn"
                  onClick={() => setGiftOpen(giftOpen === npcDef.id ? null : npcDef.id)}
                >
                  gift
                </button>
              </div>
              {giftOpen === npcDef.id && (
                <div className="gift-menu">
                  {gifts.map((g) => {
                    const has = (resources[g.resource] ?? 0) >= g.amount;
                    return (
                      <button
                        key={g.resource}
                        className={`gift-option ${!has ? 'gift-option--cant' : ''}`}
                        disabled={!has}
                        onClick={() => giveGift(npcDef.id, g.resource, g.amount, g.relationship)}
                      >
                        {g.amount} {g.resource} (+{g.relationship})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
