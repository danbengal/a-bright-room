// Quest system — triggers, progression, completion, rewards

import { ChapterState, QuestState } from '@/types/game';
import { ChapterConfig, DialogueEffect } from '@/types/chapter';
import { evaluateCondition, applyDialogueEffects } from './events';
import { createLogEntry } from './core';

// Quest step definitions — imported for auto-advance checks
let _questDefs: { id: string; steps: { step: number; description: string; completionCondition: string }[] }[] | null = null;

function getQuestDefs() {
  if (!_questDefs) {
    try {
      // Dynamic require to avoid circular imports at module level
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@/chapters/chapter01-dark-room/quests');
      _questDefs = mod.quests ?? [];
    } catch {
      _questDefs = [];
    }
  }
  return _questDefs!;
}

// ---------------------------------------------------------------------------
// Check quest triggers — activate quests and auto-advance steps
// ---------------------------------------------------------------------------

export function checkQuestTriggers(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  let s = state;

  // 1. Activate quests when their linked NPC has arrived
  for (const npcDef of config.npcs) {
    if (!npcDef.questId) continue;

    const quest = s.quests[npcDef.questId];
    if (quest && (quest.active || quest.completed)) continue;

    const npc = s.npcs[npcDef.id];
    if (!npc || !npc.met) continue;

    s = {
      ...s,
      quests: {
        ...s.quests,
        [npcDef.questId]: quest
          ? { ...quest, active: true }
          : {
              id: npcDef.questId,
              active: true,
              completed: false,
              failed: false,
              step: 0,
              flags: {},
            },
      },
    };

    const logEntry = createLogEntry(
      `New quest: ${npcDef.questId}`,
      'quest',
    );
    s = { ...s, textLog: [...s.textLog, logEntry] };
  }

  // 2. Auto-advance quest steps by checking completionConditions
  const questDefs = getQuestDefs();
  for (const def of questDefs) {
    const quest = s.quests[def.id];
    if (!quest || !quest.active || quest.completed) continue;

    const currentStepDef = def.steps.find((st) => st.step === quest.step);
    if (!currentStepDef || !currentStepDef.completionCondition) continue;

    if (evaluateCondition(currentStepDef.completionCondition, s)) {
      const nextStep = quest.step + 1;
      const nextStepDef = def.steps.find((st) => st.step === nextStep);

      if (nextStepDef) {
        // Advance to next step
        const logEntry = createLogEntry(
          `quest updated: ${def.id} — ${nextStepDef.description}`,
          'quest',
        );
        s = {
          ...s,
          quests: {
            ...s.quests,
            [def.id]: { ...quest, step: nextStep },
          },
          textLog: [...s.textLog, logEntry],
        };
      } else {
        // No more steps — quest complete
        const logEntry = createLogEntry(
          `quest complete: ${def.id}`,
          'quest',
        );
        s = {
          ...s,
          quests: {
            ...s.quests,
            [def.id]: { ...quest, active: false, completed: true },
          },
          textLog: [...s.textLog, logEntry],
        };
      }
    }
  }

  return s;
}

// ---------------------------------------------------------------------------
// Advance quest to next step
// ---------------------------------------------------------------------------

export function advanceQuest(
  state: ChapterState,
  questId: string,
  config: ChapterConfig,
): ChapterState {
  const quest = state.quests[questId];
  if (!quest || !quest.active || quest.completed) return state;

  const nextStep = quest.step + 1;

  const logEntry = createLogEntry(
    `Quest "${questId}" progressed to step ${nextStep}.`,
    'quest',
  );

  return {
    ...state,
    quests: {
      ...state.quests,
      [questId]: {
        ...quest,
        step: nextStep,
      },
    },
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Complete quest — apply rewards
// ---------------------------------------------------------------------------

export function completeQuest(
  state: ChapterState,
  questId: string,
  config: ChapterConfig,
  rewards?: DialogueEffect[],
): ChapterState {
  const quest = state.quests[questId];
  if (!quest || quest.completed) return state;

  let s: ChapterState = {
    ...state,
    quests: {
      ...state.quests,
      [questId]: {
        ...quest,
        active: false,
        completed: true,
      },
    },
  };

  // Apply rewards if provided
  if (rewards && rewards.length > 0) {
    s = applyDialogueEffects(s, rewards);
  }

  const logEntry = createLogEntry(
    `Quest "${questId}" completed!`,
    'quest',
  );
  s = { ...s, textLog: [...s.textLog, logEntry] };

  return s;
}

// ---------------------------------------------------------------------------
// Fail a quest
// ---------------------------------------------------------------------------

export function failQuest(
  state: ChapterState,
  questId: string,
): ChapterState {
  const quest = state.quests[questId];
  if (!quest) return state;

  const logEntry = createLogEntry(
    `Quest "${questId}" failed.`,
    'quest',
  );

  return {
    ...state,
    quests: {
      ...state.quests,
      [questId]: {
        ...quest,
        active: false,
        failed: true,
      },
    },
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Get active quests
// ---------------------------------------------------------------------------

export function getActiveQuests(state: ChapterState): QuestState[] {
  return Object.values(state.quests).filter((q) => q.active && !q.completed && !q.failed);
}

// ---------------------------------------------------------------------------
// Set a quest flag
// ---------------------------------------------------------------------------

export function setQuestFlag(
  state: ChapterState,
  questId: string,
  flagId: string,
  value: boolean = true,
): ChapterState {
  const quest = state.quests[questId];
  if (!quest) return state;

  return {
    ...state,
    quests: {
      ...state.quests,
      [questId]: {
        ...quest,
        flags: {
          ...quest.flags,
          [flagId]: value,
        },
      },
    },
  };
}
