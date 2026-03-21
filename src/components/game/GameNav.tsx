'use client';

import { useGameStore } from '@/stores/gameStore';

export default function GameNav({ onOpenTrading }: { onOpenTrading: () => void }) {
  const buildings = useGameStore((s) => s.chapterState.buildings);
  const unlockedFeatures = useGameStore((s) => s.chapterState.unlockedFeatures);
  const explorationActive = useGameStore((s) => s.chapterState.explorationActive);
  const startExploration = useGameStore((s) => s.startExploration);
  const returnFromExploration = useGameStore((s) => s.returnFromExploration);

  const crafted = useGameStore((s) => s.chapterState.crafted);
  const hasTradingPost = buildings.tradingPost && buildings.tradingPost.level >= 1;
  const hasCompass = crafted.includes('compass');
  const canExplore = hasCompass || unlockedFeatures.includes('exploration');

  if (!canExplore && !hasTradingPost) return null;

  return (
    <div className="game-nav">
      {hasTradingPost && (
        <button className="game-nav-btn" onClick={onOpenTrading}>
          trading post
        </button>
      )}
      {canExplore && !explorationActive && (
        <button className="game-nav-btn" onClick={startExploration}>
          explore
        </button>
      )}
      {explorationActive && (
        <button className="game-nav-btn game-nav-btn--active" onClick={returnFromExploration}>
          return to village
        </button>
      )}
    </div>
  );
}
