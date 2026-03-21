'use client';

import { useGameStore } from '@/stores/gameStore';

export default function StokeButton() {
  const stokeCooldown = useGameStore((s) => s.chapterState.stokeCooldown);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const autoStoke = useGameStore((s) => s.autoStoke);
  const stoke = useGameStore((s) => s.stoke);
  const toggleAutoStoke = useGameStore((s) => s.toggleAutoStoke);

  if (!currentConfig) return null;

  const stokeDef = currentConfig.stokeAction;
  const onCooldown = stokeCooldown > 0;
  const cooldownPercent = onCooldown
    ? (stokeCooldown / stokeDef.cooldown) * 100
    : 0;

  return (
    <div className="stoke-wrapper">
      <button
        className="stoke-btn"
        onClick={stoke}
        disabled={onCooldown}
      >
        {stokeDef.name}
        {onCooldown && (
          <span
            className="stoke-cooldown-bar"
            style={{ width: `${cooldownPercent}%` }}
          />
        )}
      </button>
      <button
        className={`auto-stoke-btn ${autoStoke ? 'active' : ''}`}
        onClick={toggleAutoStoke}
        title={autoStoke ? 'disable auto-stoke' : 'enable auto-stoke'}
      >
        auto {autoStoke ? 'on' : 'off'}
      </button>
    </div>
  );
}
