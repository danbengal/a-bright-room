// Offline progression — calculates what happened while the player was away

import { ChapterState, SaveState } from '@/types/game';
import { ChapterConfig } from '@/types/chapter';
import { calculateProduction, getEffectiveCaps } from '@/engine/resources';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OFFLINE_EFFICIENCY = 0.5; // 50% production efficiency
const MAX_OFFLINE_SECONDS = 24 * 60 * 60; // 24 hours
const TICKS_PER_SECOND = 1;

// ---------------------------------------------------------------------------
// Offline progress summary
// ---------------------------------------------------------------------------

export interface OfflineProgressSummary {
  secondsElapsed: number;
  ticksSimulated: number;
  resourcesGained: Record<string, number>;
  capped: boolean; // true if max offline time was reached
}

// ---------------------------------------------------------------------------
// Calculate offline progress
// ---------------------------------------------------------------------------

export function calculateOfflineProgress(
  state: SaveState,
  config: ChapterConfig,
): { summary: OfflineProgressSummary; updatedState: SaveState } {
  const now = Date.now();
  const lastSave = state.lastSaveTimestamp;

  if (!lastSave || lastSave >= now) {
    return {
      summary: {
        secondsElapsed: 0,
        ticksSimulated: 0,
        resourcesGained: {},
        capped: false,
      },
      updatedState: state,
    };
  }

  const elapsedMs = now - lastSave;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  // Cap at max offline time
  const effectiveSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);
  const capped = elapsedSeconds > MAX_OFFLINE_SECONDS;
  const ticksToSimulate = effectiveSeconds * TICKS_PER_SECOND;

  if (ticksToSimulate <= 0) {
    return {
      summary: {
        secondsElapsed: 0,
        ticksSimulated: 0,
        resourcesGained: {},
        capped: false,
      },
      updatedState: state,
    };
  }

  // Calculate production rates from the saved state
  const chapterState = state.chapterState;
  const production = calculateProduction(chapterState, config);
  const caps = getEffectiveCaps(chapterState, config);

  // Apply offline efficiency to production
  const offlineProduction: Record<string, number> = {};
  for (const [resId, rate] of Object.entries(production)) {
    offlineProduction[resId] = rate * OFFLINE_EFFICIENCY;
  }

  // Calculate total gains over the offline period
  const resourcesGained: Record<string, number> = {};
  const newResources = { ...chapterState.resources };

  for (const [resId, ratePerTick] of Object.entries(offlineProduction)) {
    const totalGain = ratePerTick * ticksToSimulate;
    if (totalGain === 0) continue;

    const current = newResources[resId] ?? 0;
    const cap = caps[resId] ?? Infinity;

    // Only positive production applies offline (no consumption draining to 0)
    if (totalGain > 0) {
      const actualGain = Math.min(totalGain, Math.max(0, cap - current));
      newResources[resId] = Math.min(current + totalGain, cap);
      resourcesGained[resId] = actualGain;
    } else {
      // For negative production (consumption), apply but don't let resources go below 0
      const actualLoss = Math.min(Math.abs(totalGain), current);
      newResources[resId] = Math.max(0, current + totalGain);
      if (actualLoss > 0) {
        resourcesGained[resId] = -actualLoss;
      }
    }
  }

  // Build the updated chapter state
  // No events, no exploration, no combat — just resources and ticks
  const updatedChapterState: ChapterState = {
    ...chapterState,
    ticks: chapterState.ticks + ticksToSimulate,
    resources: newResources,
  };

  const updatedState: SaveState = {
    ...state,
    lastSaveTimestamp: now,
    chapterState: updatedChapterState,
    globalState: {
      ...state.globalState,
      totalPlaytime: state.globalState.totalPlaytime + effectiveSeconds,
    },
  };

  return {
    summary: {
      secondsElapsed: effectiveSeconds,
      ticksSimulated: ticksToSimulate,
      resourcesGained,
      capped,
    },
    updatedState,
  };
}
