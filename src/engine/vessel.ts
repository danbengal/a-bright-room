// Vessel construction & departure system

import { ChapterState } from '@/types/game';
import { ChapterConfig } from '@/types/chapter';
import { canAfford, spendResources } from './resources';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Check if a vessel stage can be built
// ---------------------------------------------------------------------------

export function canBuildStage(
  state: ChapterState,
  stageId: string,
  config: ChapterConfig,
): boolean {
  const vesselDef = config.vessel;
  if (!vesselDef) return false;

  // Find the stage
  const stageIndex = vesselDef.stages.findIndex((s) => s.id === stageId);
  if (stageIndex < 0) return false;

  // Already built
  if (state.vesselProgress[stageId]) return false;

  // Stages must be built in order — previous stages must be complete
  for (let i = 0; i < stageIndex; i++) {
    if (!state.vesselProgress[vesselDef.stages[i].id]) return false;
  }

  // Check costs
  const stage = vesselDef.stages[stageIndex];
  if (!canAfford(state, stage.costs)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Build a vessel stage
// ---------------------------------------------------------------------------

export function buildVesselStage(
  state: ChapterState,
  stageId: string,
  config: ChapterConfig,
): ChapterState {
  if (!canBuildStage(state, stageId, config)) return state;

  const vesselDef = config.vessel;
  const stage = vesselDef.stages.find((s) => s.id === stageId);
  if (!stage) return state;

  // Spend resources
  let s = spendResources(state, stage.costs);

  // Mark stage as complete
  s = {
    ...s,
    vesselProgress: {
      ...s.vesselProgress,
      [stageId]: true,
    },
  };

  // Log it
  const logEntry = createLogEntry(
    `Vessel stage complete: ${stage.name}. ${stage.description}`,
    'system',
  );
  s = { ...s, textLog: [...s.textLog, logEntry] };

  // Check if vessel is now complete
  if (isVesselComplete(s, config)) {
    const completeLog = createLogEntry(
      `The ${vesselDef.name} is complete. Departure is now possible.`,
      'narrative',
    );
    s = { ...s, textLog: [...s.textLog, completeLog] };
  }

  return s;
}

// ---------------------------------------------------------------------------
// Check if the vessel is fully constructed
// ---------------------------------------------------------------------------

export function isVesselComplete(
  state: ChapterState,
  config: ChapterConfig,
): boolean {
  const vesselDef = config.vessel;
  if (!vesselDef) return false;

  return vesselDef.stages.every((stage) => state.vesselProgress[stage.id] === true);
}

// ---------------------------------------------------------------------------
// Initiate departure
// ---------------------------------------------------------------------------

export function initiateDeparture(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  if (state.departing) return state;
  // Vessel is complete if all 3 parts are crafted
  const partsReady = state.crafted.includes('vesselHull') &&
    state.crafted.includes('vesselEngine') &&
    state.crafted.includes('vesselNav');
  if (!partsReady) return state;

  const narrative = config.departure.standardNarrative;

  // Check for hidden narrative conditions
  // (The hidden narrative plays if certain secret conditions are met;
  //  for now we use the standard one by default.)
  let narrativeLines = narrative;

  // Check if the hidden narrative should play
  if (config.departure.hiddenNarrative.length > 0) {
    // Hidden narrative conditions could be checked here via evaluateCondition.
    // For now, we just use standard. Content authors can extend this.
  }

  // Add all narrative lines to the log
  let s = { ...state, departing: true };
  for (const line of narrativeLines) {
    const logEntry = createLogEntry(line, 'narrative');
    s = { ...s, textLog: [...s.textLog, logEntry] };
  }

  return s;
}

// ---------------------------------------------------------------------------
// Get vessel construction status for UI
// ---------------------------------------------------------------------------

export function getVesselStatus(
  state: ChapterState,
  config: ChapterConfig,
): {
  name: string;
  stages: {
    id: string;
    name: string;
    description: string;
    built: boolean;
    canBuild: boolean;
    costs: Record<string, number>;
  }[];
  complete: boolean;
  departing: boolean;
} | null {
  const vesselDef = config.vessel;
  if (!vesselDef) return null;

  return {
    name: vesselDef.name,
    stages: vesselDef.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      description: stage.description,
      built: state.vesselProgress[stage.id] ?? false,
      canBuild: canBuildStage(state, stage.id, config),
      costs: stage.costs,
    })),
    complete: isVesselComplete(state, config),
    departing: state.departing,
  };
}
