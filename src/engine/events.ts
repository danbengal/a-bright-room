// Event system — condition evaluation, event triggers, firing

import { ChapterState, LogEntry } from '@/types/game';
import { ChapterConfig, EventDef, DialogueEffect } from '@/types/chapter';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Evaluate a condition string against game state
// ---------------------------------------------------------------------------

export function evaluateCondition(
  condition: string,
  state: ChapterState,
): boolean {
  if (!condition || condition.trim() === '' || condition.trim() === 'true') {
    return true;
  }
  if (condition.trim() === 'false') {
    return false;
  }

  const trimmed = condition.trim();

  // Handle negation prefix: !expression
  if (trimmed.startsWith('!') && !trimmed.startsWith('!=')) {
    const inner = trimmed.slice(1).trim();
    return !evaluateCondition(inner, state);
  }

  // Handle compound conditions with && and ||
  // Process || first (lower precedence)
  if (condition.includes('||')) {
    const parts = splitOnOperator(condition, '||');
    return parts.some((part) => evaluateCondition(part.trim(), state));
  }

  // Process && (higher precedence than ||)
  if (condition.includes('&&')) {
    const parts = splitOnOperator(condition, '&&');
    return parts.every((part) => evaluateCondition(part.trim(), state));
  }

  // Handle crafted.includes("x") pattern
  const includesMatch = trimmed.match(/^crafted\.includes\(["'](\w+)["']\)$/);
  if (includesMatch) {
    return state.crafted.includes(includesMatch[1]);
  }

  // Handle bare boolean paths (e.g., "npc.stranger.met" without an operator)
  // If there's no operator, resolve the path and return its truthiness
  if (!trimmed.match(/\s*(>=|<=|!=|==|>|<)\s*/)) {
    const value = resolveStatePath(trimmed, state);
    return Boolean(value);
  }

  // Single condition: parse "path operator value"
  return evaluateSingleCondition(trimmed, state);
}

/**
 * Split a condition string on a logical operator, respecting nesting.
 * Simple split since we don't support parentheses.
 */
function splitOnOperator(condition: string, operator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < condition.length; i++) {
    if (condition[i] === '(') depth++;
    if (condition[i] === ')') depth--;

    if (depth === 0 && condition.substring(i, i + operator.length) === operator) {
      parts.push(current);
      current = '';
      i += operator.length - 1;
    } else {
      current += condition[i];
    }
  }
  parts.push(current);
  return parts;
}

/**
 * Evaluate a single condition like "resource.wood > 50"
 */
function evaluateSingleCondition(condition: string, state: ChapterState): boolean {
  // Match: path operator value
  const match = condition.match(
    /^([\w.]+)\s*(>=|<=|!=|==|>|<)\s*(.+)$/,
  );
  if (!match) return false;

  const [, path, operator, rawValue] = match;
  const stateValue = resolveStatePath(path, state);
  const compareValue = parseValue(rawValue.trim());

  return compare(stateValue, operator, compareValue);
}

/**
 * Resolve a dot-path against the game state.
 *
 * Supported patterns:
 *   ticks                           -> state.ticks
 *   phase                           -> state.phase
 *   health                          -> state.health
 *   maxHealth                       -> state.maxHealth
 *   deathCount                      -> state.deathCount
 *   stokeCount                      -> state.stokeCount
 *   stokeCooldown                   -> state.stokeCooldown
 *   resource.<id>                   -> state.resources[id]
 *   building.<id>.level             -> state.buildings[id].level
 *   building.<id>.workers           -> state.buildings[id].workers
 *   npc.<id>.met                    -> state.npcs[id].met
 *   npc.<id>.relationship           -> state.npcs[id].relationship
 *   npc.<id>.alive                  -> state.npcs[id].alive
 *   quest.<id>.completed            -> state.quests[id].completed
 *   quest.<id>.active               -> state.quests[id].active
 *   quest.<id>.failed               -> state.quests[id].failed
 *   quest.<id>.step                 -> state.quests[id].step
 *   flag.<id>                       -> looks up across NPC / quest flags
 *   event.<id>.fired                -> state.events.fired.includes(id)
 *   exploredCount                   -> state.map.exploredCount
 *   combat.active                   -> state.combat.active
 *   departing                       -> state.departing
 */
function resolveStatePath(path: string, state: ChapterState): unknown {
  const parts = path.split('.');

  switch (parts[0]) {
    case 'ticks':
      return state.ticks;
    case 'phase':
      return state.phase;
    case 'health':
      return state.health;
    case 'maxHealth':
      return state.maxHealth;
    case 'deathCount':
      return state.deathCount;
    case 'stokeCount':
      return state.stokeCount;
    case 'stokeCooldown':
      return state.stokeCooldown;
    case 'exploredCount':
      return state.map.exploredCount;
    case 'departing':
      return state.departing;
    case 'explorationActive':
      return state.explorationActive;

    case 'crafted': {
      // Support "crafted" as a path for checking the array
      // The includes() pattern is handled separately in evaluateCondition,
      // but if someone writes "crafted" alone, return the array length
      return state.crafted.length;
    }

    case 'environment': {
      const envId = parts.slice(1).join('.');
      if (envId) return state.environment[envId] ?? 0;
      return 0;
    }

    case 'resource': {
      const resId = parts.slice(1).join('.');
      return state.resources[resId] ?? 0;
    }

    case 'building': {
      const buildingId = parts[1];
      const building = state.buildings[buildingId];
      if (!building) return 0;
      const field = parts[2] ?? 'level';
      if (field === 'level') return building.level;
      if (field === 'workers') return building.workers;
      if (field === 'damaged') return building.damaged ?? false;
      return 0;
    }

    case 'npc': {
      const npcId = parts[1];
      const npc = state.npcs[npcId];
      if (!npc) return parts[2] === 'met' ? false : 0;
      const field = parts[2] ?? 'met';
      if (field === 'met') return npc.met;
      if (field === 'relationship') return npc.relationship;
      if (field === 'alive') return npc.alive;
      if (field === 'questStep') return npc.questStep;
      return 0;
    }

    case 'quest': {
      const questId = parts[1];
      const quest = state.quests[questId];
      if (!quest) return parts[2] === 'step' ? 0 : false;
      const field = parts[2] ?? 'active';
      if (field === 'completed') return quest.completed;
      if (field === 'active') return quest.active;
      if (field === 'failed') return quest.failed;
      if (field === 'step') return quest.step;
      return false;
    }

    case 'flag': {
      const flagId = parts.slice(1).join('.');
      // Check top-level flags first
      if (state.flags && state.flags[flagId] !== undefined) {
        return state.flags[flagId];
      }
      // Search across all NPC dialogue flags
      for (const npc of Object.values(state.npcs)) {
        if (npc.dialogueFlags[flagId] !== undefined) {
          return npc.dialogueFlags[flagId];
        }
      }
      // Search across quest flags
      for (const quest of Object.values(state.quests)) {
        if (quest.flags[flagId] !== undefined) {
          return quest.flags[flagId];
        }
      }
      return false;
    }

    case 'event': {
      const eventId = parts[1];
      const field = parts[2] ?? 'fired';
      if (field === 'fired') {
        return state.events.fired.includes(eventId);
      }
      if (field === 'cooldown') {
        return state.events.cooldowns[eventId] ?? 0;
      }
      return false;
    }

    case 'combat': {
      const field = parts[1] ?? 'active';
      if (field === 'active') return state.combat.active;
      if (field === 'enemyHealth') return state.combat.enemyHealth ?? 0;
      if (field === 'playerHealth') return state.combat.playerHealth ?? 0;
      if (field === 'ticksElapsed') return state.combat.ticksElapsed ?? 0;
      return false;
    }

    case 'vessel': {
      const stageId = parts[1];
      if (stageId) return state.vesselProgress[stageId] ?? false;
      // No specific stage: count completed stages
      return Object.values(state.vesselProgress).filter(Boolean).length;
    }

    case 'workers': {
      const field = parts[1] ?? 'total';
      if (field === 'total') return state.workers.total;
      if (field === 'free') return state.workers.free;
      if (field === 'assigned') {
        const roleOrBuildingId = parts[2];
        if (roleOrBuildingId) {
          return state.workers.assigned[roleOrBuildingId] ?? 0;
        }
        // Return total assigned
        return Object.values(state.workers.assigned).reduce((sum, n) => sum + n, 0);
      }
      return 0;
    }

    default:
      return undefined;
  }
}

/**
 * Parse a raw value string into the appropriate type.
 */
function parseValue(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null' || raw === 'undefined') return undefined;

  // Strip quotes for strings
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  const num = Number(raw);
  if (!isNaN(num)) return num;

  // Bare string (e.g. phase names like "hearth")
  return raw;
}

/**
 * Compare two values with the given operator.
 */
function compare(left: unknown, operator: string, right: unknown): boolean {
  // Normalize booleans when comparing against boolean-typed right values
  // (e.g., npc.stranger.met == true)
  if (typeof right === 'boolean') {
    const leftBool = Boolean(left);
    switch (operator) {
      case '==': return leftBool === right;
      case '!=': return leftBool !== right;
      default: return false;
    }
  }

  // Numeric comparisons
  if (typeof left === 'number' && typeof right === 'number') {
    switch (operator) {
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '==': return left === right;
      case '!=': return left !== right;
      default: return false;
    }
  }

  // If one side is a number, coerce the other
  if (typeof right === 'number') {
    const leftNum = Number(left);
    if (!isNaN(leftNum)) {
      return compare(leftNum, operator, right);
    }
  }

  // String / generic equality
  switch (operator) {
    case '==': return String(left) === String(right);
    case '!=': return String(left) !== String(right);
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// Check which events should fire this tick
// ---------------------------------------------------------------------------

export function checkEvents(
  state: ChapterState,
  config: ChapterConfig,
): EventDef[] {
  const eligible: EventDef[] = [];

  for (const eventDef of config.events) {
    // Skip non-repeatable events that have already fired
    if (!eventDef.repeatable && state.events.fired.includes(eventDef.id)) {
      continue;
    }

    // Check cooldown
    const cooldownUntil = state.events.cooldowns[eventDef.id] ?? 0;
    if (state.ticks < cooldownUntil) continue;

    // Evaluate condition
    if (evaluateCondition(eventDef.condition, state)) {
      eligible.push(eventDef);
    }
  }

  // Sort by priority (higher = more important = fires first)
  eligible.sort((a, b) => b.priority - a.priority);

  return eligible;
}

// ---------------------------------------------------------------------------
// Fire an event — apply effects and update state
// ---------------------------------------------------------------------------

export function fireEvent(
  state: ChapterState,
  eventId: string,
  config: ChapterConfig,
): ChapterState {
  const eventDef = config.events.find((e) => e.id === eventId);
  if (!eventDef) return state;

  let s = { ...state };

  // Mark as fired
  const firedEvents = [...s.events.fired];
  if (!firedEvents.includes(eventId)) {
    firedEvents.push(eventId);
  }

  // Set cooldown
  const cooldowns = { ...s.events.cooldowns };
  if (eventDef.cooldown > 0) {
    cooldowns[eventId] = s.ticks + eventDef.cooldown;
  }

  s = { ...s, events: { fired: firedEvents, cooldowns } };

  // Add text to log
  if (eventDef.text) {
    const logEntry = createLogEntry(eventDef.text, 'event');
    s = { ...s, textLog: [...s.textLog, logEntry] };
  }

  // Apply effects
  if (eventDef.effects) {
    s = applyDialogueEffects(s, eventDef.effects);
  }

  return s;
}

// ---------------------------------------------------------------------------
// Apply dialogue/event effects (shared with NPC dialogue system)
// ---------------------------------------------------------------------------

export function applyDialogueEffects(
  state: ChapterState,
  effects: DialogueEffect[],
): ChapterState {
  let s = { ...state };

  for (const effect of effects) {
    switch (effect.type) {
      case 'relationship': {
        if (effect.npcId && effect.amount !== undefined) {
          const npc = s.npcs[effect.npcId];
          if (npc) {
            s = {
              ...s,
              npcs: {
                ...s.npcs,
                [effect.npcId]: {
                  ...npc,
                  relationship: Math.max(-100, Math.min(50, npc.relationship + effect.amount)),
                },
              },
            };
          }
        }
        break;
      }

      case 'resource': {
        if (effect.resourceId && effect.amount !== undefined) {
          const newResources = { ...s.resources };
          newResources[effect.resourceId] = Math.max(
            0,
            (newResources[effect.resourceId] ?? 0) + effect.amount,
          );
          s = { ...s, resources: newResources };
        }
        break;
      }

      case 'flag': {
        if (effect.flagId) {
          // Store flags in the NPC's dialogueFlags if npcId is given,
          // otherwise store in top-level flags
          if (effect.npcId) {
            const npc = s.npcs[effect.npcId];
            if (npc) {
              s = {
                ...s,
                npcs: {
                  ...s.npcs,
                  [effect.npcId]: {
                    ...npc,
                    dialogueFlags: {
                      ...npc.dialogueFlags,
                      [effect.flagId]: effect.flagValue ?? true,
                    },
                  },
                },
              };
            } else {
              // NPC doesn't exist yet, store as top-level flag
              s = {
                ...s,
                flags: {
                  ...(s.flags ?? {}),
                  [effect.flagId]: effect.flagValue ?? true,
                },
              };
            }
          } else {
            // No npcId — store as top-level flag
            s = {
              ...s,
              flags: {
                ...(s.flags ?? {}),
                [effect.flagId]: effect.flagValue ?? true,
              },
            };
          }
        }
        break;
      }

      case 'quest': {
        if (effect.questId) {
          const quest = s.quests[effect.questId];
          if (quest && effect.questStep !== undefined) {
            s = {
              ...s,
              quests: {
                ...s.quests,
                [effect.questId]: {
                  ...quest,
                  step: effect.questStep,
                  active: true,
                },
              },
            };
          } else if (!quest) {
            // Start new quest
            s = {
              ...s,
              quests: {
                ...s.quests,
                [effect.questId]: {
                  id: effect.questId,
                  active: true,
                  completed: false,
                  failed: false,
                  step: effect.questStep ?? 0,
                  flags: {},
                },
              },
            };
          }
        }
        break;
      }

      case 'unlock': {
        if (effect.unlockId) {
          const newFeatures = [...s.unlockedFeatures];
          if (!newFeatures.includes(effect.unlockId)) {
            newFeatures.push(effect.unlockId);
          }
          s = { ...s, unlockedFeatures: newFeatures };
        }
        break;
      }

      case 'log': {
        if (effect.logText) {
          const logEntry = createLogEntry(effect.logText, 'narrative');
          s = { ...s, textLog: [...s.textLog, logEntry] };
        }
        break;
      }

      default:
        break;
    }
  }

  return s;
}
