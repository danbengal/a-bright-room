'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';

const VIEWPORT_RADIUS = 15;

export default function MapView() {
  const map = useGameStore((s) => s.chapterState.map);
  const expeditionSupplies = useGameStore(
    (s) => s.chapterState.expeditionSupplies,
  );
  const health = useGameStore((s) => s.chapterState.health);
  const maxHealth = useGameStore((s) => s.chapterState.maxHealth);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const moveOnMap = useGameStore((s) => s.moveOnMap);
  const returnFromExploration = useGameStore((s) => s.returnFromExploration);

  // Keyboard controls: WASD / arrows to move, space to interact
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          moveOnMap('n');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveOnMap('s');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveOnMap('w');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveOnMap('e');
          break;
        case ' ':
          e.preventDefault();
          // Interact with current tile POI
          {
            const tile = map.tiles[map.playerPos.y]?.[map.playerPos.x];
            if (tile?.poi) {
              // POI interaction is handled by movement landing on the tile
              // For now, log that we're at a POI
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          returnFromExploration();
          break;
      }
    },
    [moveOnMap, returnFromExploration, map],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Current tile info
  const currentTile = map.tiles[map.playerPos.y]?.[map.playerPos.x];
  const currentTerrain = currentConfig?.map.terrainTypes.find(
    (t) => t.id === currentTile?.terrain,
  );
  const currentPOI = currentTile?.poi
    ? currentConfig?.map.pointsOfInterest.find((p) => p.id === currentTile.poi)
    : null;

  // Build the visible grid
  const gridLines = useMemo(() => {
    if (!map.tiles || map.tiles.length === 0 || !currentConfig) return [];

    const { x: px, y: py } = map.playerPos;
    const terrainLookup: Record<string, { symbol: string; color: string }> = {};
    for (const t of currentConfig.map.terrainTypes) {
      terrainLookup[t.id] = { symbol: t.symbol, color: t.color };
    }

    const lines: { chars: { ch: string; className: string; color?: string }[] }[] = [];

    const startY = Math.max(0, py - VIEWPORT_RADIUS);
    const endY = Math.min(map.height - 1, py + VIEWPORT_RADIUS);
    const startX = Math.max(0, px - VIEWPORT_RADIUS);
    const endX = Math.min(map.width - 1, px + VIEWPORT_RADIUS);

    for (let y = startY; y <= endY; y++) {
      const row: { ch: string; className: string; color?: string }[] = [];
      for (let x = startX; x <= endX; x++) {
        const tile = map.tiles[y]?.[x];
        if (!tile) {
          row.push({ ch: ' ', className: 'map-tile' });
          continue;
        }

        if (x === px && y === py) {
          row.push({ ch: '@', className: 'map-tile map-tile--player' });
        } else if (!tile.explored) {
          row.push({ ch: ' ', className: 'map-tile map-tile--unexplored' });
        } else if (tile.poi) {
          row.push({ ch: '!', className: 'map-tile map-tile--poi' });
        } else {
          const terrain = terrainLookup[tile.terrain];
          row.push({
            ch: terrain?.symbol ?? '.',
            className: 'map-tile map-tile--explored',
            color: terrain?.color,
          });
        }
      }
      lines.push({ chars: row });
    }

    return lines;
  }, [map, currentConfig]);

  const supplyEntries = Object.entries(expeditionSupplies).filter(
    ([, v]) => v > 0,
  );

  return (
    <div className="map-overlay">
      <div className="map-container">
        <div className="map-header">
          <span className="map-title">the wasteland</span>
          <span className="map-pos">
            [{map.playerPos.x}, {map.playerPos.y}]
          </span>
          <button className="panel-item-btn" onClick={returnFromExploration}>
            return to village [esc]
          </button>
        </div>

        <div className="map-grid">
          {gridLines.map((line, ly) => (
            <div key={ly}>
              {line.chars.map((c, lx) => (
                <span
                  key={lx}
                  className={c.className}
                  style={c.color ? { color: c.color } : undefined}
                >
                  {c.ch}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="map-bottom">
          <div className="map-arrows">
            <button className="map-arrow map-arrow-up" onClick={() => moveOnMap('n')}>
              &#9650;
            </button>
            <div className="map-arrow-row">
              <button className="map-arrow" onClick={() => moveOnMap('w')}>
                &#9664;
              </button>
              <button className="map-arrow map-arrow-center" disabled>
                &#9679;
              </button>
              <button className="map-arrow" onClick={() => moveOnMap('e')}>
                &#9654;
              </button>
            </div>
            <button className="map-arrow map-arrow-down" onClick={() => moveOnMap('s')}>
              &#9660;
            </button>
          </div>

          <div className="map-status">
            <div className="map-status-row">
              <span>hp: {health}/{maxHealth}</span>
              {supplyEntries.map(([id, amount]) => (
                <span key={id}>{id}: {Math.floor(amount)}</span>
              ))}
            </div>
            {currentTerrain && (
              <div className="map-terrain-info">
                {currentTerrain.name}
                {currentPOI && (
                  <span className="map-poi-name"> — {currentPOI.name}</span>
                )}
              </div>
            )}
            <div className="map-hint">wasd / arrows to move · esc to return</div>
          </div>
        </div>
      </div>
    </div>
  );
}
