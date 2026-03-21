// Death & checkpoint system — snapshots, death detection, respawn, narratives

import { ChapterState, CheckpointData } from '@/types/game';
import { ChapterConfig } from '@/types/chapter';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Create a checkpoint (snapshot current state)
// ---------------------------------------------------------------------------

export function createCheckpoint(
  state: ChapterState,
  checkpointId: string,
  label?: string,
): ChapterState {
  // Serialize relevant state (exclude text log and combat to keep it small)
  const snapshot: Partial<ChapterState> = {
    phase: state.phase,
    ticks: state.ticks,
    resources: { ...state.resources },
    resourceCaps: { ...state.resourceCaps },
    buildings: JSON.parse(JSON.stringify(state.buildings)),
    workers: { ...state.workers, assigned: { ...state.workers.assigned } },
    inventory: state.inventory.map((item) => ({ ...item })),
    health: state.health,
    maxHealth: state.maxHealth,
    npcs: JSON.parse(JSON.stringify(state.npcs)),
    quests: JSON.parse(JSON.stringify(state.quests)),
    vesselProgress: { ...state.vesselProgress },
    unlockedResources: [...state.unlockedResources],
    unlockedBuildings: [...state.unlockedBuildings],
    unlockedCrafting: [...state.unlockedCrafting],
    unlockedFeatures: [...state.unlockedFeatures],
    crafted: [...state.crafted],
    stokeCount: state.stokeCount,
    environment: { ...state.environment },
    flags: { ...(state.flags ?? {}) },
  };

  const checkpointData: CheckpointData = {
    id: checkpointId,
    label: label ?? checkpointId,
    state: JSON.stringify(snapshot),
    timestamp: Date.now(),
  };

  // Replace existing checkpoint with same id, or add new
  const checkpoints = state.checkpoints.filter((cp) => cp.id !== checkpointId);
  checkpoints.push(checkpointData);

  const logEntry = createLogEntry(`Checkpoint: ${checkpointData.label}`, 'checkpoint');

  return {
    ...state,
    checkpoints,
    currentCheckpoint: checkpointId,
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Check if the player should die
// ---------------------------------------------------------------------------

export function checkDeath(state: ChapterState): boolean {
  return state.health <= 0;
}

// ---------------------------------------------------------------------------
// Process death — restore from checkpoint
// ---------------------------------------------------------------------------

export function processDeath(
  state: ChapterState,
  config: ChapterConfig,
  cause: string = 'unknown',
): ChapterState {
  const deathCount = state.deathCount + 1;

  // Get death narrative
  const deathText = getDeathNarrative(cause, config);
  const deathLog = createLogEntry(deathText, 'death');

  // Lose 50% of all resources
  const halvedResources: Record<string, number> = {};
  for (const [resId, amount] of Object.entries(state.resources)) {
    halvedResources[resId] = Math.floor(amount * 0.5);
  }

  // Return any expedition supplies (also halved)
  for (const [resId, amount] of Object.entries(state.expeditionSupplies)) {
    if (amount > 0) {
      halvedResources[resId] = (halvedResources[resId] ?? 0) + Math.floor(amount * 0.5);
    }
  }

  const respawnLog = createLogEntry(
    'you wake by the fire. half your supplies are gone. the wasteland takes its toll.',
    'death',
  );

  // Track deaths at checkpoint
  const checkpointId = state.currentCheckpoint || 'none';
  const deathsAtCheckpoint = {
    ...state.deathsAtCheckpoint,
    [checkpointId]: (state.deathsAtCheckpoint[checkpointId] ?? 0) + 1,
  };

  return {
    ...state,
    health: Math.ceil(config.maxHealth * 0.5),
    resources: halvedResources,
    deathCount,
    deathsAtCheckpoint,
    combat: { active: false, log: [] },
    explorationActive: false,
    expeditionSupplies: {},
    expeditionInventory: [],
    activeDialogue: null,
    textLog: [...state.textLog, deathLog, respawnLog],
    // Reset player position to map center (base)
    map: {
      ...state.map,
      playerPos: {
        x: Math.floor(state.map.width / 2),
        y: Math.floor(state.map.height / 2),
        z: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Death narratives
// ---------------------------------------------------------------------------

export function getDeathNarrative(
  cause: string,
  config: ChapterConfig,
): string {
  const narratives: Record<string, string[]> = {
    combat: [
      'The darkness takes you. Your last breath fades into silence.',
      'You fall. The world grows dim around you.',
      'Defeated. The cold creeps in as consciousness slips away.',
    ],
    environment: [
      'The elements claim another soul. You succumb to the pressure.',
      'Nature is indifferent to your struggle. You collapse.',
      'The world itself has turned against you. You cannot endure.',
    ],
    starvation: [
      'Hunger gnaws at the last of your strength. There is nothing left.',
      'Your body fails you. The emptiness becomes everything.',
    ],
    unknown: [
      'You die. The story continues.',
      'An ending. But not the ending.',
      'The light fades. Something remains.',
    ],
  };

  const options = narratives[cause] ?? narratives['unknown'];
  return options[Math.floor(Math.random() * options.length)];
}

// ---------------------------------------------------------------------------
// Get checkpoint-aware death info for the UI
// ---------------------------------------------------------------------------

export function getDeathInfo(state: ChapterState): {
  totalDeaths: number;
  deathsAtCurrentCheckpoint: number;
  hasCheckpoint: boolean;
  checkpointLabel: string;
} {
  const checkpointId = state.currentCheckpoint;
  const checkpoint = state.checkpoints.find((cp) => cp.id === checkpointId);

  return {
    totalDeaths: state.deathCount,
    deathsAtCurrentCheckpoint: state.deathsAtCheckpoint[checkpointId] ?? 0,
    hasCheckpoint: !!checkpoint,
    checkpointLabel: checkpoint?.label ?? 'none',
  };
}
