// Checkpoint utilities — snapshot and restore

import { ChapterState, CheckpointData } from '@/types/game';

// ---------------------------------------------------------------------------
// Create a serialized snapshot of relevant state
// ---------------------------------------------------------------------------

export function createCheckpointSnapshot(state: ChapterState): string {
  const snapshot: Partial<ChapterState> = {
    phase: state.phase,
    ticks: state.ticks,
    resources: { ...state.resources },
    resourceCaps: { ...state.resourceCaps },
    buildings: JSON.parse(JSON.stringify(state.buildings)),
    workers: {
      total: state.workers.total,
      free: state.workers.free,
      assigned: { ...state.workers.assigned },
    },
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
  };

  return JSON.stringify(snapshot);
}

// ---------------------------------------------------------------------------
// Restore state from a checkpoint
// ---------------------------------------------------------------------------

export function restoreFromCheckpoint(
  state: ChapterState,
  checkpointId: string,
): ChapterState | null {
  const checkpoint = state.checkpoints.find((cp) => cp.id === checkpointId);
  if (!checkpoint) return null;

  try {
    const restored: Partial<ChapterState> = JSON.parse(checkpoint.state);

    // Merge restored state but preserve meta-progression and log
    return {
      ...state,
      ...restored,
      // Always keep these from the current state
      deathCount: state.deathCount,
      deathsAtCheckpoint: state.deathsAtCheckpoint,
      checkpoints: state.checkpoints,
      currentCheckpoint: checkpointId,
      textLog: state.textLog,
      // Reset transient state
      combat: { active: false, log: [] },
      explorationActive: false,
      activeDialogue: null,
      departing: false,
    };
  } catch (e) {
    console.error('Failed to restore from checkpoint:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// List available checkpoints
// ---------------------------------------------------------------------------

export function listCheckpoints(
  state: ChapterState,
): { id: string; label: string; timestamp: number }[] {
  return state.checkpoints.map((cp) => ({
    id: cp.id,
    label: cp.label,
    timestamp: cp.timestamp,
  }));
}
