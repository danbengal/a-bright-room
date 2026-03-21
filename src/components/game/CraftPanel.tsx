'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { CraftRecipeDef } from '@/types/chapter';

const MULTIPLIERS = [1, 2, 5, 10] as const;

export default function CraftPanel() {
  const resources = useGameStore((s) => s.chapterState.resources);
  const unlockedCrafting = useGameStore(
    (s) => s.chapterState.unlockedCrafting,
  );
  const crafted = useGameStore((s) => s.chapterState.crafted);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const craft = useGameStore((s) => s.craft);
  const [multiplier, setMultiplier] = useState<number>(1);

  const availableRecipes = useMemo(() => {
    if (!currentConfig) return [];
    return currentConfig.crafting.filter((recipe) => {
      if (!unlockedCrafting.includes(recipe.id)) return false;
      // Hide non-stackable items that have already been crafted
      if (!recipe.result.stackable && crafted.includes(recipe.id)) return false;
      return true;
    });
  }, [currentConfig, unlockedCrafting, crafted]);

  if (!currentConfig || availableRecipes.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <span>crafting</span>
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
        {availableRecipes.map((recipe) => (
          <CraftRow
            key={recipe.id}
            recipe={recipe}
            resources={resources}
            alreadyCrafted={!recipe.result.stackable && crafted.includes(recipe.id)}
            multiplier={recipe.result.stackable ? multiplier : 1}
            onCraft={() => craft(recipe.id, recipe.result.stackable ? multiplier : 1)}
          />
        ))}
      </div>
    </div>
  );
}

function CraftRow({
  recipe,
  resources,
  alreadyCrafted,
  multiplier,
  onCraft,
}: {
  recipe: CraftRecipeDef;
  resources: Record<string, number>;
  alreadyCrafted: boolean;
  multiplier: number;
  onCraft: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Total cost = per-craft cost * multiplier
  const totalCosts: Record<string, number> = {};
  for (const [resId, amount] of Object.entries(recipe.costs)) {
    totalCosts[resId] = amount * multiplier;
  }

  const canAfford = Object.entries(totalCosts).every(
    ([resId, amount]) => (resources[resId] ?? 0) >= amount,
  );

  const costStr = Object.entries(totalCosts)
    .map(([resId, amount]) => `${resId} ${amount}`)
    .join(', ');

  const stats: string[] = [];
  if (recipe.result.attack) stats.push(`attack: ${recipe.result.attack}`);
  if (recipe.result.defense) stats.push(`defense: ${recipe.result.defense}`);
  if (recipe.result.bonuses) {
    for (const [k, v] of Object.entries(recipe.result.bonuses)) {
      stats.push(`${k}: +${v}`);
    }
  }

  return (
    <div className="panel-item-wrapper">
      <div className="panel-item">
        <span
          className="panel-item-name panel-item-name--hoverable"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {recipe.name}
        </span>
        <span
          className={`panel-item-cost${
            !canAfford ? ' panel-item-cost--unaffordable' : ''
          }`}
        >
          {costStr}
        </span>
        <button
          className="panel-item-btn"
          disabled={!canAfford || alreadyCrafted}
          onClick={onCraft}
        >
          {alreadyCrafted ? 'done' : multiplier > 1 ? `craft ${multiplier}` : 'craft'}
        </button>
      </div>
      {hovered && (
        <div className="tooltip-popup">
          <p className="tooltip-desc">{recipe.description}</p>
          <p className="tooltip-type">{recipe.result.type}</p>
          {stats.length > 0 && (
            <ul className="tooltip-effects">
              {stats.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
