'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function DepartureSequence() {
  const vesselProgress = useGameStore((s) => s.chapterState.vesselProgress);
  const resources = useGameStore((s) => s.chapterState.resources);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const buildVessel = useGameStore((s) => s.buildVessel);
  const depart = useGameStore((s) => s.depart);

  if (!currentConfig) return null;

  const vesselDef = currentConfig.vessel;
  const stages = vesselDef.stages;

  const allComplete = useMemo(() => {
    return stages.every((stage) => vesselProgress[stage.id] === true);
  }, [stages, vesselProgress]);

  return (
    <div className="panel departure-panel">
      <div className="panel-header">{vesselDef.name}</div>
      <div className="departure-stages">
        {stages.map((stage) => {
          const complete = vesselProgress[stage.id] === true;
          const canAfford = Object.entries(stage.costs).every(
            ([resId, amount]) => (resources[resId] ?? 0) >= amount,
          );

          const costStr = Object.entries(stage.costs)
            .map(([resId, amount]) => `${resId} ${amount}`)
            .join(', ');

          return (
            <div
              key={stage.id}
              className={`departure-stage${
                complete ? ' departure-stage--complete' : ''
              }`}
            >
              <span className="panel-item-name">{stage.name}</span>
              {!complete && (
                <>
                  <span
                    className={`panel-item-cost${
                      !canAfford ? ' panel-item-cost--unaffordable' : ''
                    }`}
                  >
                    {costStr}
                  </span>
                  <button
                    className="panel-item-btn"
                    disabled={!canAfford}
                    onClick={() => buildVessel(stage.id)}
                  >
                    build
                  </button>
                </>
              )}
              {complete && (
                <span className="panel-item-cost">complete</span>
              )}
            </div>
          );
        })}
      </div>

      {allComplete && (
        <button className="departure-btn" onClick={depart}>
          depart
        </button>
      )}
    </div>
  );
}
