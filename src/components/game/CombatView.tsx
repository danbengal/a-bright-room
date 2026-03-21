'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function CombatView() {
  const combat = useGameStore((s) => s.chapterState.combat);
  const playerHealth = useGameStore((s) => s.chapterState.health);
  const playerMaxHealth = useGameStore((s) => s.chapterState.maxHealth);
  const inventory = useGameStore((s) => s.chapterState.inventory);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const fight = useGameStore((s) => s.fight);
  const fleeFromCombat = useGameStore((s) => s.fleeFromCombat);
  const useCombatItem = useGameStore((s) => s.useCombatItem);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combat.log.length]);

  if (!combat.active || !currentConfig) return null;

  // Find enemy definition
  const enemyDef = currentConfig.map.enemies.find(
    (e) => e.id === combat.enemyId,
  );
  const enemyName = enemyDef?.name ?? combat.enemyId ?? 'unknown';

  const enemyHealthPct =
    combat.enemyMaxHealth && combat.enemyMaxHealth > 0
      ? ((combat.enemyHealth ?? 0) / combat.enemyMaxHealth) * 100
      : 0;

  const playerHealthPct =
    playerMaxHealth > 0 ? (playerHealth / playerMaxHealth) * 100 : 0;

  const getHealthClass = (pct: number): string => {
    if (pct > 60) return 'health-bar-fill health-bar-fill--high';
    if (pct > 25) return 'health-bar-fill health-bar-fill--mid';
    return 'health-bar-fill health-bar-fill--low';
  };

  // Find consumable items for combat
  const consumables = inventory.filter(
    (item) => item.type === 'consumable' && item.quantity > 0,
  );

  return (
    <div className="combat-overlay">
      <div className="combat-container">
        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
          {enemyName}
        </div>

        <div className="combat-health">
          <div className="health-row">
            <span className="health-label">{enemyName}</span>
            <div className="health-bar-track">
              <div
                className={getHealthClass(enemyHealthPct)}
                style={{ width: `${enemyHealthPct}%` }}
              />
            </div>
          </div>
          <div className="health-row">
            <span className="health-label">you</span>
            <div className="health-bar-track">
              <div
                className={getHealthClass(playerHealthPct)}
                style={{ width: `${playerHealthPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="combat-log">
          {combat.log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          <div ref={logEndRef} />
        </div>

        <div className="combat-actions">
          <button onClick={fight}>fight</button>
          <button onClick={fleeFromCombat}>flee</button>
          {consumables.map((item) => (
            <button
              key={item.id}
              onClick={() => useCombatItem(item.id)}
            >
              use {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
