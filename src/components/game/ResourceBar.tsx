'use client';

import { useGameStore } from '@/stores/gameStore';

export default function ResourceBar() {
  const resources = useGameStore((s) => s.chapterState.resources);
  const resourceCaps = useGameStore((s) => s.chapterState.resourceCaps);
  const unlockedResources = useGameStore(
    (s) => s.chapterState.unlockedResources,
  );
  const currentConfig = useGameStore((s) => s.currentConfig);

  if (!currentConfig) return null;

  const explorationActive = useGameStore((s) => s.chapterState.explorationActive);

  // Determine which resources to show
  const visibleResources = currentConfig.resources.filter((rDef) => {
    if (rDef.hidden && !unlockedResources.includes(rDef.id)) {
      // Show hidden resources if the player has any amount
      return (resources[rDef.id] ?? 0) > 0;
    }
    return true;
  });

  if (visibleResources.length === 0) return null;

  return (
    <div className="resource-bar">
      {visibleResources.map((rDef) => {
        const amount = Math.floor(resources[rDef.id] ?? 0);
        const cap = resourceCaps[rDef.id];
        const hasCap = explorationActive && cap !== undefined && cap > 0;
        const isCapped = hasCap && amount >= cap;
        const isEmpty = amount === 0;

        let valueClass = 'resource-value';
        if (isCapped) valueClass += ' resource-value--capped';
        else if (isEmpty) valueClass += ' resource-value--empty';

        return (
          <span key={rDef.id} className="resource-item">
            <span className="resource-name">{rDef.name}:</span>
            <span className={valueClass}>{amount}</span>
            {hasCap && <span className="resource-cap">/ {cap}</span>}
          </span>
        );
      })}
    </div>
  );
}
