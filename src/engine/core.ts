// Core tick engine and event bus

import { ChapterState, LogEntry } from '@/types/game';
import { ChapterConfig } from '@/types/chapter';
import { applyProduction, checkResourceUnlocks, getEffectiveCaps } from './resources';
import { checkBuildingUnlocks, recalculateWorkers } from './buildings';
import { checkCraftUnlocks } from './crafting';
import { checkEvents, fireEvent } from './events';
import { checkArrivals } from './npcs';
import { checkQuestTriggers } from './quests';
import { processCombatTick } from './combat';
import { processEnvironment, applyEnvironmentDamage, getMitigationLevel } from './environment';
import { checkDeath } from './death';

// ---------------------------------------------------------------------------
// Event Bus
// ---------------------------------------------------------------------------

type Listener = (...args: unknown[]) => void;

export class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Listener): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: unknown[]): void {
    if (!this.listeners[event]) return;
    for (const listener of this.listeners[event]) {
      listener(...args);
    }
  }

  clear(): void {
    this.listeners = {};
  }
}

/** Singleton event bus shared across the engine */
export const eventBus = new EventBus();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let logIdCounter = 0;

export function createLogEntry(
  text: string,
  type: LogEntry['type'] = 'narrative',
): LogEntry {
  logIdCounter += 1;
  return {
    id: `log-${Date.now()}-${logIdCounter}`,
    text,
    timestamp: Date.now(),
    type,
  };
}

// ---------------------------------------------------------------------------
// Tick processor
// ---------------------------------------------------------------------------

export function processTick(
  state: ChapterState,
  chapterConfig: ChapterConfig,
): ChapterState {
  let s = { ...state };

  // 1. Increment tick counter
  s = { ...s, ticks: s.ticks + 1 };

  // 2. Process stoke cooldown
  if (s.stokeCooldown > 0) {
    s = { ...s, stokeCooldown: s.stokeCooldown - 1 };
  }

  // 3. Process resource generation from buildings / workers
  s = applyProduction(s, chapterConfig);

  // 4. Process environmental pressure decay
  s = processEnvironment(s, chapterConfig);

  // 5. Apply environment damage if in danger zone
  const mitigation = getMitigationLevel(s, chapterConfig);
  if (mitigation < 1) {
    s = applyEnvironmentDamage(s, chapterConfig);
  }

  // 6. Process active combat ticks
  if (s.combat.active) {
    s = processCombatTick(s, chapterConfig);
  }

  // 7. Check phase transitions
  s = checkPhaseTransitions(s, chapterConfig);

  // 8. Check event triggers
  // Fire ALL non-repeatable events immediately (milestones, arrivals, story beats)
  // Limit repeatable events to 1 per tick (atmospheric, random)
  const eventsToFire = checkEvents(s, chapterConfig);
  let firedRepeatable = false;
  for (const evt of eventsToFire) {
    if (!evt.repeatable) {
      s = fireEvent(s, evt.id, chapterConfig);
    } else if (!firedRepeatable) {
      s = fireEvent(s, evt.id, chapterConfig);
      firedRepeatable = true;
    }
  }

  // 9. Check NPC arrivals
  s = checkArrivals(s, chapterConfig);

  // 10. Check quest triggers
  s = checkQuestTriggers(s, chapterConfig);

  // 11. Check resource unlocks
  s = checkResourceUnlocks(s, chapterConfig);

  // 12. Check building unlocks
  s = checkBuildingUnlocks(s, chapterConfig);

  // 13. Check craft unlocks
  s = checkCraftUnlocks(s, chapterConfig);

  // 14. Recalculate workers from buildings
  s = recalculateWorkers(s, chapterConfig);

  // 15. Sync effective resource caps to state (so UI reflects storage bonuses)
  s = { ...s, resourceCaps: getEffectiveCaps(s, chapterConfig) };

  // 16. Auto-equip best gear
  s = autoEquipBestGear(s);

  // 17. Cap textLog to prevent memory bloat (keep last 200 entries)
  if (s.textLog.length > 200) {
    s = { ...s, textLog: s.textLog.slice(-150) };
  }

  // 18. Check death
  if (checkDeath(s)) {
    eventBus.emit('death', s);
  }

  eventBus.emit('tick', s);

  return s;
}

// ---------------------------------------------------------------------------
// Auto-equip best gear
// ---------------------------------------------------------------------------

function autoEquipBestGear(state: ChapterState): ChapterState {
  const { inventory } = state;

  // Find best weapon (highest attack)
  let bestWeapon: string | null = null;
  let bestAttack = 0;
  for (const item of inventory) {
    if (item.type === 'weapon' && (item.attack ?? 0) > bestAttack) {
      bestAttack = item.attack ?? 0;
      bestWeapon = item.id;
    }
  }

  // Find best armor (highest defense)
  let bestArmor: string | null = null;
  let bestDefense = 0;
  for (const item of inventory) {
    if (item.type === 'armor' && (item.defense ?? 0) > bestDefense) {
      bestDefense = item.defense ?? 0;
      bestArmor = item.id;
    }
  }

  // Find best accessory (highest combined attack + defense + bonus count)
  let bestAccessory: string | null = null;
  let bestAccScore = 0;
  for (const item of inventory) {
    if (item.type === 'accessory') {
      const score = (item.attack ?? 0) + (item.defense ?? 0) +
        Object.values(item.bonuses ?? {}).reduce((s, v) => s + v, 0);
      if (score > bestAccScore) {
        bestAccScore = score;
        bestAccessory = item.id;
      }
    }
  }

  // Remove inferior weapons and armor (keep only the best of each type)
  const filteredInventory = inventory.filter((item) => {
    if (item.type === 'weapon') return item.id === bestWeapon;
    if (item.type === 'armor') return item.id === bestArmor;
    if (item.type === 'accessory') return item.id === bestAccessory;
    return true; // keep consumables, quest items, etc.
  });

  // Only update if changed
  const equipChanged =
    state.equipped.weapon !== bestWeapon ||
    state.equipped.armor !== bestArmor ||
    state.equipped.accessory !== bestAccessory;
  const inventoryChanged = filteredInventory.length !== inventory.length;

  if (!equipChanged && !inventoryChanged) return state;

  return {
    ...state,
    inventory: filteredInventory,
    equipped: {
      weapon: bestWeapon,
      armor: bestArmor,
      accessory: bestAccessory,
    },
  };
}

// ---------------------------------------------------------------------------
// Phase transitions
// ---------------------------------------------------------------------------

import { evaluateCondition } from './events';

const PHASE_ORDER: ChapterState['phase'][] = [
  'spark',
  'hearth',
  'settlement',
  'questWeb',
  'wild',
  'reckoning',
  'departure',
];

function checkPhaseTransitions(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const currentIdx = PHASE_ORDER.indexOf(state.phase);

  // Walk forward through phases to see if a later one should activate
  for (let i = currentIdx + 1; i < PHASE_ORDER.length; i++) {
    const phase = PHASE_ORDER[i];
    const phaseConfig = config.phases[phase];
    if (!phaseConfig) continue;

    if (evaluateCondition(phaseConfig.trigger, state)) {
      const logEntries: LogEntry[] = [...state.textLog];
      if (phaseConfig.text) {
        logEntries.push(createLogEntry(phaseConfig.text, 'narrative'));
      }

      let unlockedFeatures = [...state.unlockedFeatures];
      if (phaseConfig.unlocks) {
        unlockedFeatures = [...unlockedFeatures, ...phaseConfig.unlocks];
      }

      eventBus.emit('phaseChange', phase, state.phase);

      return {
        ...state,
        phase,
        textLog: logEntries,
        unlockedFeatures,
      };
    }
  }

  return state;
}
