'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function DepartureSequence() {
  const crafted = useGameStore((s) => s.chapterState.crafted);
  const buildings = useGameStore((s) => s.chapterState.buildings);
  const flags = useGameStore((s) => s.chapterState.flags);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const depart = useGameStore((s) => s.depart);

  if (!currentConfig) return null;

  const getRecipe = (id: string) => currentConfig.crafting.find((r) => r.id === id);

  const parts = [
    { id: 'vesselHull', name: 'hull assembly', done: crafted.includes('vesselHull'), recipe: getRecipe('vesselHull') },
    { id: 'vesselEngine', name: 'engine installation', done: crafted.includes('vesselEngine'), recipe: getRecipe('vesselEngine') },
    { id: 'vesselNav', name: 'navigation systems', done: crafted.includes('vesselNav'), recipe: getRecipe('vesselNav') },
  ];

  const allCrafted = parts.every((p) => p.done);
  const bossDefeated = flags.bossDefeated;
  const canDepart = allCrafted && bossDefeated;

  return (
    <div className="panel departure-panel">
      <div className="panel-header">the vessel</div>
      <div className="panel-list">
        {parts.map((part) => (
          <VesselPart key={part.id} part={part} buildings={buildings} />
        ))}
        <div className={`panel-item ${bossDefeated ? 'panel-item--equipped' : ''}`}>
          <span className="panel-item-name">clear the way</span>
          <span className="panel-item-cost">
            {bossDefeated ? 'the king is dead' : 'defeat the raider king'}
          </span>
        </div>
      </div>

      {canDepart && (
        <button className="departure-btn" onClick={depart}>
          depart
        </button>
      )}

      {!canDepart && (
        <div className="craft-requirement" style={{ marginTop: '0.5rem' }}>
          {!allCrafted && 'craft all vessel parts. '}
          {!bossDefeated && 'defeat the raider king.'}
        </div>
      )}
    </div>
  );
}

function VesselPart({ part, buildings }: {
  part: { id: string; name: string; done: boolean; recipe: ReturnType<typeof Array.prototype.find> };
  buildings: Record<string, { level: number; workers: number }>;
}) {
  const [hovered, setHovered] = useState(false);

  const recipe = part.recipe as {
    costs: Record<string, number>;
    buildingRequired?: string;
    buildingLevel?: number;
    description?: string;
  } | undefined;

  const reqBuilding = recipe?.buildingRequired;
  const reqLevel = recipe?.buildingLevel ?? 1;
  const currentLevel = reqBuilding ? (buildings[reqBuilding]?.level ?? 0) : 999;
  const buildingMet = currentLevel >= reqLevel;

  return (
    <div className="panel-item-wrapper">
      <div className={`panel-item ${part.done ? 'panel-item--equipped' : ''}`}>
        <span
          className="panel-item-name panel-item-name--hoverable"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {part.name}
        </span>
        <span className="panel-item-cost">
          {part.done ? 'complete' : 'craft in crafting panel'}
        </span>
      </div>
      {hovered && recipe && (
        <div className="tooltip-popup">
          {recipe.description && <p className="tooltip-desc">{recipe.description}</p>}
          <ul className="tooltip-effects">
            {Object.entries(recipe.costs).map(([res, amt]) => (
              <li key={res}>{res}: {amt}</li>
            ))}
          </ul>
          {reqBuilding && (
            <p className={buildingMet ? 'tooltip-workers' : 'craft-requirement'}>
              requires: {reqBuilding} lv.{reqLevel}
              {!buildingMet && ` (currently ${currentLevel})`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
