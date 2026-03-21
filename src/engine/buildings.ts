// Building system — construction, upgrades, worker assignment, unlock checks

import { ChapterState } from '@/types/game';
import { ChapterConfig, BuildingDef } from '@/types/chapter';
import { canAfford, spendResources, isUnlockConditionMet } from './resources';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Get building costs for a specific level
// ---------------------------------------------------------------------------

export function getBuildingCosts(
  buildingId: string,
  level: number,
  config: ChapterConfig,
): Record<string, number> {
  const buildingDef = config.buildings.find((b) => b.id === buildingId);
  if (!buildingDef) return {};

  // Find the cost entry for the requested level
  const costEntry = buildingDef.costs.find((c) => c.level === level);
  if (costEntry) return { ...costEntry.resources };

  // If no explicit cost entry exists, scale from the last defined level
  if (buildingDef.costs.length === 0) return {};
  const lastCost = buildingDef.costs[buildingDef.costs.length - 1];
  const scaleFactor = Math.pow(1.5, level - lastCost.level);
  const scaled: Record<string, number> = {};
  for (const [resId, amount] of Object.entries(lastCost.resources)) {
    scaled[resId] = Math.ceil(amount * scaleFactor);
  }
  return scaled;
}

// ---------------------------------------------------------------------------
// Check if a building can be constructed / upgraded
// ---------------------------------------------------------------------------

export function canBuild(
  state: ChapterState,
  buildingId: string,
  config: ChapterConfig,
): boolean {
  const buildingDef = config.buildings.find((b) => b.id === buildingId);
  if (!buildingDef) return false;

  const current = state.buildings[buildingId];
  const currentLevel = current?.level ?? 0;

  // Check max level
  if (currentLevel >= buildingDef.maxLevel) return false;

  // Check unlock condition
  if (!isUnlockConditionMet(buildingDef.unlockCondition, state)) return false;

  // Check dependencies
  for (const dep of buildingDef.dependencies) {
    const depBuilding = state.buildings[dep.buildingId];
    if (!depBuilding || depBuilding.level < dep.level) return false;
  }

  // Check costs
  const costs = getBuildingCosts(buildingId, currentLevel + 1, config);
  if (!canAfford(state, costs)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Construct or upgrade a building
// ---------------------------------------------------------------------------

export function construct(
  state: ChapterState,
  buildingId: string,
  config: ChapterConfig,
): ChapterState {
  if (!canBuild(state, buildingId, config)) return state;

  const buildingDef = config.buildings.find((b) => b.id === buildingId)!;
  const current = state.buildings[buildingId];
  const currentLevel = current?.level ?? 0;
  const nextLevel = currentLevel + 1;

  // Spend resources
  const costs = getBuildingCosts(buildingId, nextLevel, config);
  let s = spendResources(state, costs);

  // Update building
  const newBuildings = { ...s.buildings };
  newBuildings[buildingId] = {
    level: nextLevel,
    workers: current?.workers ?? 0,
    damaged: false,
  };

  // Apply any unlock effects
  let unlockedFeatures = [...s.unlockedFeatures];
  for (const effect of buildingDef.effects) {
    if (effect.type === 'unlock' && effect.unlockId) {
      if (!unlockedFeatures.includes(effect.unlockId)) {
        unlockedFeatures.push(effect.unlockId);
      }
    }
  }

  // Update resource caps from storage effects
  const newCaps = { ...s.resourceCaps };
  for (const effect of buildingDef.effects) {
    if (effect.type === 'store' && effect.resourceId) {
      const perLevel = effect.perLevel ?? effect.amount ?? 0;
      if (perLevel > 0) {
        // Recalculate: remove old level contribution, add new
        const oldContribution = perLevel * currentLevel;
        const newContribution = perLevel * nextLevel;
        newCaps[effect.resourceId] =
          (newCaps[effect.resourceId] ?? 0) - oldContribution + newContribution;
      }
    }
  }

  // Add log entry
  const logEntry = createLogEntry(
    nextLevel === 1
      ? `Built ${buildingDef.name}.`
      : `Upgraded ${buildingDef.name} to level ${nextLevel}.`,
    'system',
  );

  s = {
    ...s,
    buildings: newBuildings,
    resourceCaps: newCaps,
    unlockedFeatures,
    textLog: [...s.textLog, logEntry],
  };

  return s;
}

// ---------------------------------------------------------------------------
// Check building unlocks
// ---------------------------------------------------------------------------

export function checkBuildingUnlocks(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const newUnlocked = [...state.unlockedBuildings];
  let changed = false;

  for (const buildingDef of config.buildings) {
    if (newUnlocked.includes(buildingDef.id)) continue;

    if (isUnlockConditionMet(buildingDef.unlockCondition, state)) {
      // Also check dependencies are met
      let depsOk = true;
      for (const dep of buildingDef.dependencies) {
        const depBuilding = state.buildings[dep.buildingId];
        if (!depBuilding || depBuilding.level < dep.level) {
          depsOk = false;
          break;
        }
      }
      if (depsOk) {
        newUnlocked.push(buildingDef.id);
        changed = true;
      }
    }
  }

  if (!changed) return state;
  return { ...state, unlockedBuildings: newUnlocked };
}

// ---------------------------------------------------------------------------
// Worker assignment
// ---------------------------------------------------------------------------

export function assignWorker(
  state: ChapterState,
  buildingId: string,
): ChapterState {
  if (state.workers.free <= 0) return state;

  const building = state.buildings[buildingId];
  if (!building || building.level <= 0) return state;

  // Find building def to check worker slot limit
  // (We don't have config here, so we rely on the workers field and a
  //  reasonable max. If needed the caller can pass config and check
  //  workerSlots. For simplicity we allow up to level * base slot.)
  const newBuildings = { ...state.buildings };
  newBuildings[buildingId] = {
    ...building,
    workers: building.workers + 1,
  };

  const newAssigned = { ...state.workers.assigned };
  newAssigned[buildingId] = (newAssigned[buildingId] ?? 0) + 1;

  return {
    ...state,
    buildings: newBuildings,
    workers: {
      ...state.workers,
      free: state.workers.free - 1,
      assigned: newAssigned,
    },
  };
}

export function assignWorkerChecked(
  state: ChapterState,
  buildingId: string,
  config: ChapterConfig,
): ChapterState {
  if (state.workers.free <= 0) return state;

  const building = state.buildings[buildingId];
  if (!building || building.level <= 0) return state;

  const buildingDef = config.buildings.find((b) => b.id === buildingId);
  if (!buildingDef) return state;

  // No cap — assign freely as long as there are free workers
  return assignWorker(state, buildingId);
}

// ---------------------------------------------------------------------------
// Recalculate total workers from buildings with bonus effects + NPC workers
// ---------------------------------------------------------------------------

export function recalculateWorkers(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  // Calculate total worker capacity from buildings with 'bonus' type for workers
  let buildingWorkers = 0;
  for (const buildingDef of config.buildings) {
    const built = state.buildings[buildingDef.id];
    if (!built || built.level <= 0) continue;

    for (const effect of buildingDef.effects) {
      if (effect.type === 'bonus' && effect.resourceId === 'workers') {
        const perLevel = effect.perLevel ?? effect.amount ?? 0;
        buildingWorkers += perLevel * built.level;
      }
    }
  }

  // Count NPC workers (NPCs that have arrived with worker roles)
  let npcWorkers = 0;
  for (const npcDef of config.npcs) {
    if (!npcDef.workerRole) continue;
    const npc = state.npcs[npcDef.id];
    if (npc && npc.met && npc.alive) {
      npcWorkers += 1;
    }
  }

  const newTotal = buildingWorkers + npcWorkers;
  const currentAssigned = Object.values(state.workers.assigned).reduce((sum, n) => sum + n, 0);
  const newFree = Math.max(0, newTotal - currentAssigned);

  // Only update if changed
  if (newTotal === state.workers.total && newFree === state.workers.free) {
    return state;
  }

  return {
    ...state,
    workers: {
      ...state.workers,
      total: newTotal,
      free: newFree,
    },
  };
}

export function unassignWorker(
  state: ChapterState,
  buildingId: string,
): ChapterState {
  const building = state.buildings[buildingId];
  if (!building || building.workers <= 0) return state;

  const newBuildings = { ...state.buildings };
  newBuildings[buildingId] = {
    ...building,
    workers: building.workers - 1,
  };

  const newAssigned = { ...state.workers.assigned };
  newAssigned[buildingId] = Math.max(0, (newAssigned[buildingId] ?? 0) - 1);

  return {
    ...state,
    buildings: newBuildings,
    workers: {
      ...state.workers,
      free: state.workers.free + 1,
      assigned: newAssigned,
    },
  };
}
