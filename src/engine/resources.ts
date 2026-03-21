// Resource system — production, spending, and unlock checks

import { ChapterState } from '@/types/game';
import { ChapterConfig, BuildingEffect } from '@/types/chapter';

// ---------------------------------------------------------------------------
// Calculate per-tick production from buildings, workers, and bonuses
// ---------------------------------------------------------------------------

export function calculateProduction(
  state: ChapterState,
  config: ChapterConfig,
): Record<string, number> {
  const production: Record<string, number> = {};

  for (const buildingDef of config.buildings) {
    const built = state.buildings[buildingDef.id];
    if (!built || built.level <= 0) continue;
    if (built.damaged) continue;

    for (const effect of buildingDef.effects) {
      if (effect.type === 'produce' && effect.resourceId) {
        let amount = 0;

        // Base amount per level
        if (effect.perLevel) {
          amount += effect.perLevel * built.level;
        }

        // Per worker contribution
        if (effect.perWorker) {
          const workers = built.workers ?? 0;
          amount += effect.perWorker * workers;
        }

        // Flat amount
        if (effect.amount && !effect.perLevel && !effect.perWorker) {
          amount += effect.amount;
        }

        production[effect.resourceId] = (production[effect.resourceId] ?? 0) + amount;
      }

      if (effect.type === 'convert' && effect.inputResource && effect.outputResource) {
        const rate = effect.conversionRate ?? 1;
        const workers = built.workers ?? 0;
        const perWorker = effect.perWorker ?? 0;
        const maxConsume = perWorker > 0 ? perWorker * workers : (effect.amount ?? 1) * built.level;
        const inputAvailable = state.resources[effect.inputResource] ?? 0;
        const consume = Math.min(inputAvailable, maxConsume);
        if (consume > 0) {
          production[effect.inputResource] = (production[effect.inputResource] ?? 0) - consume;
          production[effect.outputResource] =
            (production[effect.outputResource] ?? 0) + consume * rate;
        }
      }
    }
  }

  // Apply gear / inventory bonuses
  for (const item of state.inventory) {
    if (item.bonuses) {
      for (const [resourceId, bonus] of Object.entries(item.bonuses)) {
        if (resourceId.startsWith('produce_')) {
          const resId = resourceId.replace('produce_', '');
          production[resId] = (production[resId] ?? 0) + bonus;
        }
      }
    }
  }

  return production;
}

// ---------------------------------------------------------------------------
// Apply production to state, clamping at resource caps
// ---------------------------------------------------------------------------

export function applyProduction(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const production = calculateProduction(state, config);

  if (Object.keys(production).length === 0) return state;

  const newResources = { ...state.resources };
  // No resource caps at home base — only enforce during exploration
  const useCaps = state.explorationActive;
  const caps = useCaps ? getEffectiveCaps(state, config) : {};

  for (const [resId, amount] of Object.entries(production)) {
    const current = newResources[resId] ?? 0;

    if (amount > 0) {
      if (useCaps) {
        const cap = caps[resId] ?? Infinity;
        if (current < cap) {
          newResources[resId] = Math.min(current + amount, cap);
        }
      } else {
        // No cap at base — accumulate freely
        newResources[resId] = current + amount;
      }
    } else {
      // Negative production (consumption): allow it to reduce, floor at 0
      newResources[resId] = Math.max(0, current + amount);
    }
  }

  return { ...state, resources: newResources };
}

// ---------------------------------------------------------------------------
// Effective resource caps (base + building bonuses)
// ---------------------------------------------------------------------------

export function getEffectiveCaps(
  state: ChapterState,
  config: ChapterConfig,
): Record<string, number> {
  // Always start from base caps defined in config — never from state.resourceCaps
  // This prevents percentage bonuses from compounding each tick
  const caps: Record<string, number> = {};

  for (const resDef of config.resources) {
    caps[resDef.id] = resDef.baseCap;
  }

  // Flat storage bonuses from buildings
  for (const buildingDef of config.buildings) {
    const built = state.buildings[buildingDef.id];
    if (!built || built.level <= 0) continue;

    for (const effect of buildingDef.effects) {
      if (effect.type === 'store' && effect.resourceId && effect.resourceId !== 'all_percent') {
        const perLevel = effect.perLevel ?? effect.amount ?? 0;
        caps[effect.resourceId] = (caps[effect.resourceId] ?? 0) + perLevel * built.level;
      }
    }
  }

  // Percentage bonus (e.g. storage building: +10% per level, applied once on base)
  let percentBonus = 0;
  for (const buildingDef of config.buildings) {
    const built = state.buildings[buildingDef.id];
    if (!built || built.level <= 0) continue;

    for (const effect of buildingDef.effects) {
      if (effect.type === 'store' && effect.resourceId === 'all_percent') {
        const perLevel = effect.perLevel ?? effect.amount ?? 0;
        percentBonus += perLevel * built.level;
      }
    }
  }

  if (percentBonus > 0) {
    const multiplier = 1 + percentBonus / 100;
    for (const resId of Object.keys(caps)) {
      caps[resId] = Math.floor(caps[resId] * multiplier);
    }
  }

  return caps;
}

// ---------------------------------------------------------------------------
// Cost checking and spending
// ---------------------------------------------------------------------------

export function canAfford(
  state: ChapterState,
  costs: Record<string, number>,
): boolean {
  for (const [resId, amount] of Object.entries(costs)) {
    if ((state.resources[resId] ?? 0) < amount) {
      return false;
    }
  }
  return true;
}

export function spendResources(
  state: ChapterState,
  costs: Record<string, number>,
): ChapterState {
  const newResources = { ...state.resources };
  for (const [resId, amount] of Object.entries(costs)) {
    newResources[resId] = Math.max(0, (newResources[resId] ?? 0) - amount);
  }
  return { ...state, resources: newResources };
}

export function addResources(
  state: ChapterState,
  amounts: Record<string, number>,
  config?: ChapterConfig,
): ChapterState {
  const newResources = { ...state.resources };

  // No caps at home base — only enforce during exploration
  if (state.explorationActive && config) {
    const caps = getEffectiveCaps(state, config);
    for (const [resId, amount] of Object.entries(amounts)) {
      const current = newResources[resId] ?? 0;
      const cap = caps[resId] ?? Infinity;
      if (current < cap) {
        newResources[resId] = Math.min(current + amount, cap);
      }
    }
  } else {
    for (const [resId, amount] of Object.entries(amounts)) {
      newResources[resId] = (newResources[resId] ?? 0) + amount;
    }
  }

  return { ...state, resources: newResources };
}

// ---------------------------------------------------------------------------
// Resource unlock checks
// ---------------------------------------------------------------------------

export function checkResourceUnlocks(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const newUnlocked = [...state.unlockedResources];
  let changed = false;

  for (const resDef of config.resources) {
    if (newUnlocked.includes(resDef.id)) continue;
    if (resDef.hidden && !isUnlockConditionMet(resDef.unlockCondition, state)) continue;

    // Non-hidden resources or met conditions
    if (!resDef.hidden || isUnlockConditionMet(resDef.unlockCondition, state)) {
      newUnlocked.push(resDef.id);
      changed = true;

      // Set initial cap if not already set
      if (state.resourceCaps[resDef.id] === undefined) {
        state = {
          ...state,
          resourceCaps: { ...state.resourceCaps, [resDef.id]: resDef.baseCap },
        };
      }
    }
  }

  if (!changed) return state;
  return { ...state, unlockedResources: newUnlocked };
}

// ---------------------------------------------------------------------------
// Unlock condition evaluation helper
// ---------------------------------------------------------------------------

import { UnlockCondition } from '@/types/chapter';

export function isUnlockConditionMet(
  condition: UnlockCondition,
  state: ChapterState,
): boolean {
  switch (condition.type) {
    case 'always':
      return true;

    case 'phase': {
      // "At or past" this phase — once unlocked, stays unlocked
      const PHASE_ORDER = ['spark', 'hearth', 'settlement', 'questWeb', 'wild', 'reckoning', 'departure'];
      const requiredIdx = PHASE_ORDER.indexOf(String(condition.target ?? condition.value));
      const currentIdx = PHASE_ORDER.indexOf(state.phase);
      return requiredIdx >= 0 && currentIdx >= requiredIdx;
    }

    case 'building': {
      const building = state.buildings[condition.target ?? ''];
      return building !== undefined && building.level >= (Number(condition.value) || 1);
    }

    case 'resource': {
      const amount = state.resources[condition.target ?? ''] ?? 0;
      return amount >= (Number(condition.value) || 0);
    }

    case 'quest': {
      const quest = state.quests[condition.target ?? ''];
      if (!quest) return false;
      if (condition.value === 'completed') return quest.completed;
      if (condition.value === 'active') return quest.active;
      return quest.step >= (Number(condition.value) || 0);
    }

    case 'event':
      return state.events.fired.includes(condition.target ?? '');

    case 'npc': {
      const npc = state.npcs[condition.target ?? ''];
      return npc !== undefined && npc.met;
    }

    case 'tick':
      return state.ticks >= (Number(condition.value) || 0);

    default:
      return false;
  }
}
