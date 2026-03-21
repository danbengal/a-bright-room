// Environmental pressure system — meters, decay, damage, mitigation

import { ChapterState } from '@/types/game';
import { ChapterConfig } from '@/types/chapter';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Process environment tick — decay the pressure meter
// ---------------------------------------------------------------------------

export function processEnvironment(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const envDef = config.environmentalPressure;
  if (!envDef) return state;

  const meterId = envDef.id;
  const currentValue = state.environment[meterId] ?? envDef.meter.startValue;

  // Decay the meter toward danger
  const mitigation = getMitigationLevel(state, config);
  const effectiveDecay = envDef.decayRate * (1 - mitigation);
  const newValue = Math.max(
    envDef.meter.min,
    Math.min(envDef.meter.max, currentValue - effectiveDecay),
  );

  if (newValue === currentValue) return state;

  return {
    ...state,
    environment: {
      ...state.environment,
      [meterId]: newValue,
    },
  };
}

// ---------------------------------------------------------------------------
// Apply damage when in danger zone
// ---------------------------------------------------------------------------

export function applyEnvironmentDamage(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const envDef = config.environmentalPressure;
  if (!envDef) return state;

  const meterId = envDef.id;
  const currentValue = state.environment[meterId] ?? envDef.meter.startValue;

  // Only apply damage if below danger threshold
  if (currentValue >= envDef.meter.dangerThreshold) return state;

  // Damage scales with how far below the threshold we are
  const dangerRatio =
    (envDef.meter.dangerThreshold - currentValue) /
    (envDef.meter.dangerThreshold - envDef.meter.min || 1);
  const damage = Math.ceil(envDef.damageRate * dangerRatio);

  if (damage <= 0) return state;

  const newHealth = Math.max(0, state.health - damage);

  // Only log periodically to avoid spam (every 10 ticks of damage)
  let textLog = state.textLog;
  if (state.ticks % 10 === 0) {
    const logEntry = createLogEntry(
      `${envDef.name} takes its toll. You lose ${damage} health.`,
      'system',
    );
    textLog = [...textLog, logEntry];
  }

  return { ...state, health: newHealth, textLog };
}

// ---------------------------------------------------------------------------
// Calculate mitigation level (0 = no mitigation, 1 = fully mitigated)
// ---------------------------------------------------------------------------

export function getMitigationLevel(
  state: ChapterState,
  config: ChapterConfig,
): number {
  const envDef = config.environmentalPressure;
  if (!envDef) return 1; // no environmental pressure = fully mitigated

  let totalMitigation = 0;

  for (const mitigator of envDef.mitigators) {
    switch (mitigator.type) {
      case 'building': {
        const building = state.buildings[mitigator.id];
        if (building && building.level > 0 && !building.damaged) {
          totalMitigation += mitigator.effect * building.level;
        }
        break;
      }

      case 'resource': {
        const amount = state.resources[mitigator.id] ?? 0;
        if (amount > 0) {
          totalMitigation += mitigator.effect;
        }
        break;
      }

      case 'gear': {
        const hasGear =
          state.inventory.some((item) => item.id === mitigator.id) ||
          state.expeditionInventory.some((item) => item.id === mitigator.id);
        if (hasGear) {
          totalMitigation += mitigator.effect;
        }
        break;
      }
    }
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, totalMitigation));
}

// ---------------------------------------------------------------------------
// Get the current environment status for UI display
// ---------------------------------------------------------------------------

export function getEnvironmentStatus(
  state: ChapterState,
  config: ChapterConfig,
): {
  meterId: string;
  name: string;
  value: number;
  max: number;
  min: number;
  dangerThreshold: number;
  inDanger: boolean;
  mitigation: number;
} | null {
  const envDef = config.environmentalPressure;
  if (!envDef) return null;

  const value = state.environment[envDef.id] ?? envDef.meter.startValue;
  const mitigation = getMitigationLevel(state, config);

  return {
    meterId: envDef.id,
    name: envDef.name,
    value,
    max: envDef.meter.max,
    min: envDef.meter.min,
    dangerThreshold: envDef.meter.dangerThreshold,
    inDanger: value < envDef.meter.dangerThreshold,
    mitigation,
  };
}
