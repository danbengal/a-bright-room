'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { BuildingDef, BuildingEffect } from '@/types/chapter';
import { getBuildingCosts } from '@/engine/buildings';

const MULTIPLIERS = [1, 2, 5, 10] as const;

function describeEffect(e: BuildingEffect): string {
  switch (e.type) {
    case 'produce':
      if (e.perWorker) return `produces ${e.resourceId} (${e.perWorker}/worker)`;
      if (e.perLevel) return `produces ${e.resourceId} (${e.perLevel}/level)`;
      return `produces ${e.resourceId}`;
    case 'convert':
      return `converts ${e.inputResource} → ${e.outputResource} (${e.conversionRate ?? 1}x)`;
    case 'store':
      if (e.resourceId === 'all_percent') return `+${e.perLevel ?? e.amount}% all resource caps/level`;
      return `+${e.perLevel ?? e.amount} ${e.resourceId} capacity/level`;
    case 'bonus':
      return `+${e.perLevel ?? e.amount} ${e.resourceId}/level`;
    case 'unlock':
      return `unlocks ${e.unlockId}`;
    case 'defense':
      return `+${e.perLevel ?? e.amount} defense/level`;
    default:
      return '';
  }
}

export default function BuildPanel() {
  const buildings = useGameStore((s) => s.chapterState.buildings);
  const resources = useGameStore((s) => s.chapterState.resources);
  const workers = useGameStore((s) => s.chapterState.workers);
  const unlockedBuildings = useGameStore(
    (s) => s.chapterState.unlockedBuildings,
  );
  const currentConfig = useGameStore((s) => s.currentConfig);
  const build = useGameStore((s) => s.build);
  const assignWorker = useGameStore((s) => s.assignWorker);
  const unassignWorkerAction = useGameStore((s) => s.unassignWorker);
  const [multiplier, setMultiplier] = useState<number>(1);

  const availableBuildings = useMemo(() => {
    if (!currentConfig) return [];
    return currentConfig.buildings.filter((bDef) => {
      return (
        unlockedBuildings.includes(bDef.id) ||
        (buildings[bDef.id] && buildings[bDef.id].level > 0)
      );
    });
  }, [currentConfig, unlockedBuildings, buildings]);

  if (!currentConfig || availableBuildings.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <span>buildings</span>
        <span className="multiplier-controls">
          {MULTIPLIERS.map((m) => (
            <button
              key={m}
              className={`multiplier-btn ${multiplier === m ? 'active' : ''}`}
              onClick={() => setMultiplier(m)}
            >
              {m}x
            </button>
          ))}
        </span>
      </div>
      <div className="panel-list">
        {availableBuildings.map((bDef) => (
          <BuildingRow
            key={bDef.id}
            def={bDef}
            level={buildings[bDef.id]?.level ?? 0}
            assignedWorkers={buildings[bDef.id]?.workers ?? 0}
            resources={resources}
            freeWorkers={workers.free}
            multiplier={multiplier}
            config={currentConfig}
            onBuild={() => build(bDef.id, multiplier)}
            onAssign={() => assignWorker(bDef.id)}
            onUnassign={() => unassignWorkerAction(bDef.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BuildingRow({
  def,
  level,
  assignedWorkers,
  resources,
  freeWorkers,
  multiplier,
  config,
  onBuild,
  onAssign,
  onUnassign,
}: {
  def: BuildingDef;
  level: number;
  assignedWorkers: number;
  resources: Record<string, number>;
  freeWorkers: number;
  multiplier: number;
  config: import('@/types/chapter').ChapterConfig;
  onBuild: () => void;
  onAssign: () => void;
  onUnassign: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const atMax = level >= def.maxLevel;

  // Calculate total costs for building N levels from current
  const levelsCanBuild = Math.min(multiplier, def.maxLevel - level);
  const totalCosts: Record<string, number> = {};
  for (let i = 1; i <= levelsCanBuild; i++) {
    const lvl = level + i;
    const costs = getBuildingCosts(def.id, lvl, config);
    for (const [resId, amount] of Object.entries(costs)) {
      totalCosts[resId] = (totalCosts[resId] ?? 0) + amount;
    }
  }

  const canAfford = levelsCanBuild > 0 && Object.entries(totalCosts).every(
    ([resId, amount]) => (resources[resId] ?? 0) >= amount,
  );

  const costStr = Object.entries(totalCosts)
    .map(([resId, amount]) => `${resId} ${amount}`)
    .join(', ');

  const effects = def.effects.map(describeEffect).filter(Boolean);

  return (
    <div className="panel-item-wrapper">
      <div className="panel-item">
        <span
          className="panel-item-name panel-item-name--hoverable"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {def.name}
        </span>
        {level > 0 && (
          <span className="panel-item-level">lv.{level}</span>
        )}
        {!atMax && (
          <span
            className={`panel-item-cost${
              !canAfford ? ' panel-item-cost--unaffordable' : ''
            }`}
          >
            {costStr}
          </span>
        )}
        {!atMax ? (
          <button
            className="panel-item-btn"
            disabled={!canAfford}
            onClick={onBuild}
          >
            {levelsCanBuild > 1 ? `build ${levelsCanBuild}` : 'build'}
          </button>
        ) : (
          <span className="panel-item-cost">max</span>
        )}
        {def.workerSlots > 0 && level > 0 && (
          <span className="worker-controls">
            <button
              className="worker-btn"
              disabled={assignedWorkers <= 0}
              onClick={onUnassign}
            >
              -
            </button>
            <span className="worker-count">{assignedWorkers}</span>
            <button
              className="worker-btn"
              disabled={freeWorkers <= 0}
              onClick={onAssign}
            >
              +
            </button>
          </span>
        )}
      </div>
      {hovered && (
        <div className="tooltip-popup">
          <p className="tooltip-desc">{def.description}</p>
          {effects.length > 0 && (
            <ul className="tooltip-effects">
              {effects.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {def.workerSlots > 0 && (
            <p className="tooltip-workers">workers: {def.workerSlots} ({def.workerRole})</p>
          )}
        </div>
      )}
    </div>
  );
}
