'use client';

import { useMemo, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

const DISCOVERY_INTROS = [
  'you come across',
  'you discover',
  'you stumble upon',
  'through the snow, you find',
  'ahead, something emerges from the white —',
  'the terrain shifts. before you lies',
];

export default function POIPopup() {
  const pendingPOI = useGameStore((s) => s.chapterState.pendingPOI);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const ticks = useGameStore((s) => s.chapterState.ticks);
  const enterPOI = useGameStore((s) => s.enterPOI);
  const fleePOI = useGameStore((s) => s.fleePOI);

  const poiDef = useMemo(() => {
    if (!pendingPOI || !currentConfig) return null;
    return currentConfig.map.pointsOfInterest.find((p) => p.id === pendingPOI);
  }, [pendingPOI, currentConfig]);

  // Clear invalid pending POI
  useEffect(() => {
    if (pendingPOI && !poiDef) {
      fleePOI(); // clear the invalid pending state
    }
  }, [pendingPOI, poiDef, fleePOI]);

  if (!poiDef) return null;

  const intro = DISCOVERY_INTROS[ticks % DISCOVERY_INTROS.length];

  return (
    <div className="poi-popup-overlay">
      <div className="poi-popup">
        <p className="poi-popup-intro">{intro}</p>
        <h3 className="poi-popup-name">{poiDef.name}</h3>
        <p className="poi-popup-desc">{poiDef.description}</p>
        <div className="poi-popup-actions">
          <button className="poi-popup-btn poi-popup-btn--enter" onClick={enterPOI}>
            enter
          </button>
          <button className="poi-popup-btn poi-popup-btn--flee" onClick={fleePOI}>
            leave
          </button>
        </div>
      </div>
    </div>
  );
}
