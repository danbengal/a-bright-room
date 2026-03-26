'use client';

import { useGameStore } from '@/stores/gameStore';

export default function DepartureSequence() {
  const crafted = useGameStore((s) => s.chapterState.crafted);
  const flags = useGameStore((s) => s.chapterState.flags);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const depart = useGameStore((s) => s.depart);

  if (!currentConfig) return null;

  const parts = [
    { id: 'vesselHull', name: 'hull assembly', done: crafted.includes('vesselHull') },
    { id: 'vesselEngine', name: 'engine installation', done: crafted.includes('vesselEngine') },
    { id: 'vesselNav', name: 'navigation systems', done: crafted.includes('vesselNav') },
  ];

  const allCrafted = parts.every((p) => p.done);
  const bossDefeated = flags.bossDefeated;
  const canDepart = allCrafted && bossDefeated;

  return (
    <div className="panel departure-panel">
      <div className="panel-header">the vessel</div>
      <div className="panel-list">
        {parts.map((part) => (
          <div
            key={part.id}
            className={`panel-item ${part.done ? 'panel-item--equipped' : ''}`}
          >
            <span className="panel-item-name">{part.name}</span>
            <span className="panel-item-cost">
              {part.done ? 'complete' : 'craft in crafting panel'}
            </span>
          </div>
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
