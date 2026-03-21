// NPC system — arrivals, dialogue, relationships

import { ChapterState, DialogueState, NPCState } from '@/types/game';
import { ChapterConfig, NPCDef, DialogueNode, DialogueOption } from '@/types/chapter';
import { isUnlockConditionMet } from './resources';
import { evaluateCondition, applyDialogueEffects } from './events';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Check NPC arrivals
// ---------------------------------------------------------------------------

export function checkArrivals(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  let s = state;

  for (const npcDef of config.npcs) {
    // Skip NPCs that have already arrived
    const existing = s.npcs[npcDef.id];
    if (existing && existing.met) continue;

    // Check arrival condition
    if (isUnlockConditionMet(npcDef.arrivalCondition, s)) {
      s = arriveNPC(s, npcDef.id, config);
    }
  }

  return s;
}

// ---------------------------------------------------------------------------
// NPC arrives
// ---------------------------------------------------------------------------

export function arriveNPC(
  state: ChapterState,
  npcId: string,
  config: ChapterConfig,
): ChapterState {
  const npcDef = config.npcs.find((n) => n.id === npcId);
  if (!npcDef) return state;

  // Create or update NPC state
  const npcState: NPCState = state.npcs[npcId]
    ? { ...state.npcs[npcId], met: true }
    : {
        id: npcId,
        relationship: 0,
        met: true,
        questStep: 0,
        alive: true,
        dialogueFlags: {},
      };

  // Add as a worker if they have a worker role
  let workers = { ...state.workers };
  if (npcDef.workerRole) {
    workers = {
      ...workers,
      total: workers.total + 1,
      free: workers.free + 1,
    };
  }

  // Add narrative log
  const logEntry = createLogEntry(
    `${npcDef.name} has arrived. ${npcDef.description}`,
    'narrative',
  );

  return {
    ...state,
    npcs: { ...state.npcs, [npcId]: npcState },
    workers,
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Start dialogue
// ---------------------------------------------------------------------------

export function startDialogue(
  state: ChapterState,
  npcId: string,
  config: ChapterConfig,
): ChapterState {
  const npcDef = config.npcs.find((n) => n.id === npcId);
  if (!npcDef) return state;

  const npc = state.npcs[npcId];
  if (!npc || !npc.met) return state;

  // Find the first dialogue node whose condition is met (or has no condition)
  const node = findAvailableDialogueNode(npcDef.dialogueTree, state);
  if (!node) return state;

  // Filter options whose conditions are met
  const availableOptions = getAvailableOptions(node.options, state);

  const dialogueState: DialogueState = {
    npcId,
    nodeId: node.id,
    text: node.text,
    options: availableOptions.map((opt) => ({
      id: opt.id,
      text: opt.text,
      condition: opt.condition,
    })),
  };

  // Mark this root dialogue node as seen
  const seenFlag = `_seen_${node.id}`;
  const updatedNpc = {
    ...npc,
    dialogueFlags: { ...npc.dialogueFlags, [seenFlag]: true },
  };

  // Apply any node-level effects
  let s: ChapterState = {
    ...state,
    activeDialogue: dialogueState,
    npcs: { ...state.npcs, [npcId]: updatedNpc },
  };
  if (node.effects) {
    s = applyDialogueEffects(s, node.effects);
  }

  // Add dialogue text to log
  const logEntry = createLogEntry(node.text, 'dialogue');
  s = { ...s, textLog: [...s.textLog, logEntry] };

  return s;
}

// ---------------------------------------------------------------------------
// Select a dialogue option
// ---------------------------------------------------------------------------

export function selectOption(
  state: ChapterState,
  optionId: string,
  config: ChapterConfig,
): ChapterState {
  if (!state.activeDialogue) return state;

  const npcId = state.activeDialogue.npcId;
  const npcDef = config.npcs.find((n) => n.id === npcId);
  if (!npcDef) return state;

  // Find the current node
  const currentNode = npcDef.dialogueTree.find(
    (n) => n.id === state.activeDialogue?.nodeId,
  );
  if (!currentNode) return state;

  // Find the selected option
  const option = currentNode.options.find((o) => o.id === optionId);
  if (!option) return state;

  let s = { ...state };

  // Apply option effects
  if (option.effects) {
    s = applyDialogueEffects(s, option.effects);
  }

  // Log the player's choice
  const choiceLog = createLogEntry(`> ${option.text}`, 'dialogue');
  s = { ...s, textLog: [...s.textLog, choiceLog] };

  // Navigate to next node
  const nextNode = npcDef.dialogueTree.find((n) => n.id === option.nextNodeId);
  if (nextNode) {
    const availableOptions = getAvailableOptions(nextNode.options, s);
    const dialogueState: DialogueState = {
      npcId,
      nodeId: nextNode.id,
      text: nextNode.text,
      options: availableOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        condition: opt.condition,
      })),
    };
    s = { ...s, activeDialogue: dialogueState };

    // Apply next node effects
    if (nextNode.effects) {
      s = applyDialogueEffects(s, nextNode.effects);
    }

    // Log the NPC's response
    const responseLog = createLogEntry(nextNode.text, 'dialogue');
    s = { ...s, textLog: [...s.textLog, responseLog] };

    // If no options remain, close dialogue
    if (availableOptions.length === 0) {
      s = { ...s, activeDialogue: null };
    }
  } else {
    // No next node — end dialogue
    s = { ...s, activeDialogue: null };
  }

  return s;
}

// ---------------------------------------------------------------------------
// Change relationship
// ---------------------------------------------------------------------------

export function changeRelationship(
  state: ChapterState,
  npcId: string,
  amount: number,
): ChapterState {
  const npc = state.npcs[npcId];
  if (!npc) return state;

  return {
    ...state,
    npcs: {
      ...state.npcs,
      [npcId]: {
        ...npc,
        relationship: Math.max(-100, Math.min(50, npc.relationship + amount)),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findAvailableDialogueNode(
  tree: DialogueNode[],
  state: ChapterState,
): DialogueNode | null {
  for (const node of tree) {
    if (!node.condition || evaluateCondition(node.condition, state)) {
      return node;
    }
  }
  return null;
}

function getAvailableOptions(
  options: DialogueOption[],
  state: ChapterState,
): DialogueOption[] {
  return options.filter(
    (opt) => !opt.condition || evaluateCondition(opt.condition, state),
  );
}
