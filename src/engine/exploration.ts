// Exploration system — map generation, movement, encounters, POIs

import { ChapterState, MapTile } from '@/types/game';
import { ChapterConfig, MapConfig, POIDef, TerrainDef } from '@/types/chapter';
import { createLogEntry } from './core';
import { evaluateCondition } from './events';
import { startCombat } from './combat';

// ---------------------------------------------------------------------------
// Procedural map generation
// ---------------------------------------------------------------------------

export function generateMap(
  config: ChapterConfig,
): {
  tiles: MapTile[][];
  width: number;
  height: number;
  depth: number;
  playerPos: { x: number; y: number; z: number };
  landmarks: string[];
  exploredCount: number;
} {
  const { width, height, depth } = config.map;

  // Build the tile grid as a flat 2D array (tiles[y][x]).
  // For multi-depth maps, z layers are indexed via tile.z.
  const tiles: MapTile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      const terrain = pickTerrain(x, y, config.map);
      row.push({
        x,
        y,
        z: 0,
        terrain: terrain.id,
        explored: false,
        poi: undefined,
        enemy: undefined,
        loot: undefined,
        hazard: terrain.hazard ? terrain.hazard.type : undefined,
      });
    }
    tiles.push(row);
  }

  // Place points of interest
  for (const poi of config.map.pointsOfInterest) {
    const { x, y } = poi.position;
    if (y >= 0 && y < height && x >= 0 && x < width) {
      tiles[y][x] = {
        ...tiles[y][x],
        z: poi.position.z ?? 0,
        poi: poi.id,
      };
    }
  }

  // Player starts at center of map
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  // Mark the starting tile as explored and passable
  tiles[startY][startX] = {
    ...tiles[startY][startX],
    explored: true,
    terrain: config.map.terrainTypes.find((t) => t.passable)?.id ?? tiles[startY][startX].terrain,
  };

  return {
    tiles,
    width,
    height,
    depth,
    playerPos: { x: startX, y: startY, z: 0 },
    landmarks: [],
    exploredCount: 1,
  };
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

const DIRECTION_DELTAS: Record<Direction, { dx: number; dy: number; dz: number }> = {
  north: { dx: 0, dy: -1, dz: 0 },
  south: { dx: 0, dy: 1, dz: 0 },
  east: { dx: 1, dy: 0, dz: 0 },
  west: { dx: -1, dy: 0, dz: 0 },
  up: { dx: 0, dy: 0, dz: 1 },
  down: { dx: 0, dy: 0, dz: -1 },
};

export function move(
  state: ChapterState,
  direction: Direction | string,
  config: ChapterConfig,
): ChapterState {
  const delta = DIRECTION_DELTAS[direction as Direction];
  if (!delta) return state;

  const newX = state.map.playerPos.x + delta.dx;
  const newY = state.map.playerPos.y + delta.dy;
  const newZ = state.map.playerPos.z + delta.dz;

  // Bounds check
  if (newX < 0 || newX >= state.map.width) return state;
  if (newY < 0 || newY >= state.map.height) return state;
  if (newZ < 0 || newZ >= state.map.depth) return state;

  const tile = state.map.tiles[newY]?.[newX];
  if (!tile) return state;

  // Check passability
  const terrainDef = config.map.terrainTypes.find((t) => t.id === tile.terrain);
  if (terrainDef && !terrainDef.passable) {
    const logEntry = createLogEntry('The way is blocked.', 'system');
    return { ...state, textLog: [...state.textLog, logEntry] };
  }

  // Deduct supply costs
  let s = { ...state };
  for (const [resId, cost] of Object.entries(config.map.supplyCosts)) {
    const current = s.expeditionSupplies[resId] ?? 0;
    if (current < cost) {
      // Out of supplies — force return to base
      const reason = resId === 'water' ? 'thirst' : 'hunger';
      const logEntry = createLogEntry(
        `no ${resId} left. the ${reason} drives you back.`,
        'system',
      );
      // Set flag so UI shows the popup
      s = {
        ...s,
        flags: { ...s.flags, [`exploration_forced_return`]: true, [`exploration_return_reason`]: true, [`return_${reason}`]: true },
        explorationActive: false,
        expeditionSupplies: {},
        textLog: [...s.textLog, logEntry],
        map: {
          ...s.map,
          playerPos: {
            x: Math.floor(s.map.width / 2),
            y: Math.floor(s.map.height / 2),
            z: 0,
          },
        },
      };
      return s;
    }
    s = {
      ...s,
      expeditionSupplies: {
        ...s.expeditionSupplies,
        [resId]: current - cost,
      },
    };
  }

  // Update tile explored status
  const newTiles = s.map.tiles.map((row) => row.map((t) => ({ ...t })));
  const wasExplored = newTiles[newY][newX].explored;
  newTiles[newY][newX] = { ...newTiles[newY][newX], explored: true };

  const newExploredCount = wasExplored
    ? s.map.exploredCount
    : s.map.exploredCount + 1;

  s = {
    ...s,
    map: {
      ...s.map,
      tiles: newTiles,
      playerPos: { x: newX, y: newY, z: newZ },
      exploredCount: newExploredCount,
    },
  };

  // Apply terrain hazard damage
  if (terrainDef?.hazard) {
    // Check if player has resistance gear
    const hasResist = s.expeditionInventory.some(
      (item) => item.id === terrainDef.hazard?.resistGear,
    );
    if (!hasResist) {
      s = {
        ...s,
        health: Math.max(0, s.health - terrainDef.hazard.damagePerTick),
      };
      const logEntry = createLogEntry(
        `The ${terrainDef.name} damages you for ${terrainDef.hazard.damagePerTick}.`,
        'system',
      );
      s = { ...s, textLog: [...s.textLog, logEntry] };
    }
  }

  // Check for POI — set pendingPOI for popup, don't auto-loot
  if (tile.poi) {
    const poiDef = config.map.pointsOfInterest.find((p) => p.id === tile.poi);
    if (poiDef) {
      s = { ...s, pendingPOI: tile.poi };
    }
  }

  // Check encounter
  s = checkEncounter(s, newTiles[newY][newX], config);

  return s;
}

// ---------------------------------------------------------------------------
// Get tile info
// ---------------------------------------------------------------------------

export function getTile(
  state: ChapterState,
  x: number,
  y: number,
  z: number = 0,
): MapTile | null {
  if (y < 0 || y >= state.map.height) return null;
  if (x < 0 || x >= state.map.width) return null;
  const tile = state.map.tiles[y]?.[x];
  if (!tile) return null;
  if (tile.z !== z) return null;
  return tile;
}

// ---------------------------------------------------------------------------
// Check for random encounters
// ---------------------------------------------------------------------------

export function checkEncounter(
  state: ChapterState,
  tile: MapTile,
  config: ChapterConfig,
): ChapterState {
  if (state.combat.active) return state;

  const terrainDef = config.map.terrainTypes.find((t) => t.id === tile.terrain);
  if (!terrainDef) return state;

  // Roll against encounter rate
  if (Math.random() > terrainDef.encounterRate) return state;

  // Find eligible enemies for this terrain and distance from center
  const centerX = Math.floor(state.map.width / 2);
  const centerY = Math.floor(state.map.height / 2);
  const distance = Math.abs(tile.x - centerX) + Math.abs(tile.y - centerY);

  const eligible = config.map.enemies.filter(
    (e) => e.terrain.includes(tile.terrain) && distance >= e.minDistance,
  );

  if (eligible.length === 0) return state;

  // Pick a random enemy
  const enemy = eligible[Math.floor(Math.random() * eligible.length)];
  return startCombat(state, enemy.id, config);
}

// ---------------------------------------------------------------------------
// Discover a point of interest
// ---------------------------------------------------------------------------

export function discoverPOI(
  state: ChapterState,
  poiId: string,
  config: ChapterConfig,
): ChapterState {
  const poiDef = config.map.pointsOfInterest.find((p) => p.id === poiId);
  if (!poiDef) return state;

  // Check if hidden POI has its reveal condition met
  if (poiDef.hidden && poiDef.revealCondition) {
    if (!evaluateCondition(poiDef.revealCondition, state)) {
      return state;
    }
  }

  // Don't re-discover if already in landmarks (just revisiting)
  const alreadyDiscovered = state.map.landmarks.includes(poiId);

  let s = { ...state };

  // Add to landmarks
  if (!alreadyDiscovered) {
    s = {
      ...s,
      map: {
        ...s.map,
        landmarks: [...s.map.landmarks, poiId],
      },
    };
  }

  // Add discovery text
  const logEntry = createLogEntry(
    alreadyDiscovered
      ? `you return to ${poiDef.name}.`
      : poiDef.discoveryText,
    'narrative',
  );
  s = { ...s, textLog: [...s.textLog, logEntry] };

  // Set a discovery flag for this POI (e.g., hermitRuinsDiscovered, bunkerExplored)
  const poiFlagId = poiId.replace('poi_', '') + 'Discovered';
  s = {
    ...s,
    flags: { ...s.flags, [poiFlagId]: true },
  };

  // Handle special POI flags based on id
  if (poiId === 'poi_oldBunker') {
    s = { ...s, flags: { ...s.flags, bunkerExplored: true } };
  }
  if (poiId === 'poi_frozenLake') {
    s = { ...s, flags: { ...s.flags, frozenLakeVisited: true } };
  }
  if (poiId === 'poi_bossArena') {
    s = { ...s, flags: { ...s.flags, bossArenaReached: true } };
  }
  if (poiId === 'poi_hermitRuins') {
    s = { ...s, flags: { ...s.flags, hermitRuinsDiscovered: true } };
  }
  if (poiId === 'poi_scoutSurvivor1') {
    s = { ...s, flags: { ...s.flags, patrolSurvivor1Found: true, patrolMemberFound: true } };
  }
  if (poiId === 'poi_scoutSurvivor2') {
    s = { ...s, flags: { ...s.flags, patrolSurvivor2Found: true, patrolMemberFound: true } };
  }
  if (poiId === 'poi_raiderOutpost') {
    s = { ...s, flags: { ...s.flags, patrolSurvivor3Rescued: true } };
  }

  // Award loot (only on first visit)
  if (poiDef.loot && !alreadyDiscovered) {
    const newResources = { ...s.resources };
    for (const [resId, amount] of Object.entries(poiDef.loot)) {
      newResources[resId] = (newResources[resId] ?? 0) + amount;
    }
    s = { ...s, resources: newResources };

    const lootList = Object.entries(poiDef.loot)
      .map(([resId, amount]) => `${amount} ${resId}`)
      .join(', ');
    const lootLog = createLogEntry(
      `looted from ${poiDef.name}: ${lootList}`,
      'narrative',
    );
    s = { ...s, textLog: [...s.textLog, lootLog] };
  }

  // Handle quest trigger — activate or advance the linked quest
  if (poiDef.questTrigger) {
    const questId = poiDef.questTrigger;
    const quest = s.quests[questId];
    if (quest && quest.active && !quest.completed) {
      const triggerLog = createLogEntry(
        `this place is connected to your quest.`,
        'quest',
      );
      s = { ...s, textLog: [...s.textLog, triggerLog] };
    } else if (!quest) {
      // Activate the quest if not yet active
      s = {
        ...s,
        quests: {
          ...s.quests,
          [questId]: {
            id: questId,
            active: true,
            completed: false,
            failed: false,
            step: 0,
            flags: {},
          },
        },
      };
      const questLog = createLogEntry(
        `new quest discovered at ${poiDef.name}.`,
        'quest',
      );
      s = { ...s, textLog: [...s.textLog, questLog] };
    }
  }

  // Handle special POI types
  if (poiDef.type === 'dungeon' && !alreadyDiscovered) {
    // Dungeons trigger a combat encounter
    const distance = Math.abs(poiDef.position.x - Math.floor(s.map.width / 2)) +
      Math.abs(poiDef.position.y - Math.floor(s.map.height / 2));
    // Pick an enemy based on distance
    const eligible = config.map.enemies.filter((e) => e.minDistance <= distance);
    if (eligible.length > 0) {
      const enemy = eligible[eligible.length - 1]; // strongest eligible
      s = startCombat(s, enemy.id, config);
      const combatLog = createLogEntry(
        `a ${enemy.name} guards this place.`,
        'combat',
      );
      s = { ...s, textLog: [...s.textLog, combatLog] };
    }
  }

  if (poiDef.type === 'boss') {
    if (!s.flags.bossDefeated) {
      // Start boss combat
      s = startCombat(s, config.boss.id, config);
      const bossLog = createLogEntry(
        `${config.boss.name} stands before you. this is the reckoning.`,
        'combat',
      );
      s = { ...s, textLog: [...s.textLog, bossLog] };
    } else {
      const bossLog = createLogEntry(
        'the arena is empty. the king is dead. the way is clear.',
        'narrative',
      );
      s = { ...s, textLog: [...s.textLog, bossLog] };
    }
  }

  // Track map exploration percentage
  const totalTiles = s.map.width * s.map.height;
  const exploredPercent = (s.map.exploredCount / totalTiles) * 100;
  if (exploredPercent >= 50 && !s.flags.mapExplored50) {
    s = { ...s, flags: { ...s.flags, mapExplored50: true } };
    const mapLog = createLogEntry(
      'the map takes shape. half the wasteland is known now.',
      'narrative',
    );
    s = { ...s, textLog: [...s.textLog, mapLog] };
  }
  if (exploredPercent >= 70 && !s.flags.mapExplored70) {
    s = { ...s, flags: { ...s.flags, mapExplored70: true } };
    const mapLog = createLogEntry(
      'the map is mostly filled in now. the edges are all that remain.',
      'narrative',
    );
    s = { ...s, textLog: [...s.textLog, mapLog] };
  }

  // Auto-set patrol reported flag when all 3 survivors found
  if (s.flags.patrolSurvivor1Found && s.flags.patrolSurvivor2Found && s.flags.patrolSurvivor3Rescued && !s.flags.patrolQuestReported) {
    s = { ...s, flags: { ...s.flags, patrolQuestReported: true } };
    const patrolLog = createLogEntry(
      'all three patrol members accounted for. the scout will want to know.',
      'quest',
    );
    s = { ...s, textLog: [...s.textLog, patrolLog] };
  }

  return s;
}

// ---------------------------------------------------------------------------
// Return to base
// ---------------------------------------------------------------------------

export function returnToBase(state: ChapterState): ChapterState {
  const centerX = Math.floor(state.map.width / 2);
  const centerY = Math.floor(state.map.height / 2);

  const logEntry = createLogEntry('Returned to base.', 'system');

  return {
    ...state,
    map: {
      ...state.map,
      playerPos: { x: centerX, y: centerY, z: 0 },
    },
    explorationActive: false,
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Pick a terrain type for a tile based on position. Uses a simple
 * deterministic noise-like approach based on coordinates so maps are
 * reproducible for the same config.
 */
function pickTerrain(x: number, y: number, mapConfig: MapConfig): TerrainDef {
  const types = mapConfig.terrainTypes;
  if (types.length === 0) {
    return {
      id: 'void',
      name: 'Void',
      symbol: '.',
      color: '#000',
      passable: true,
      encounterRate: 0,
    };
  }

  // Simple hash-based selection
  const hash = simpleHash(x, y);
  const index = Math.abs(hash) % types.length;
  return types[index];
}

function simpleHash(x: number, y: number): number {
  let h = 0;
  h = ((h << 5) - h + x * 374761393) | 0;
  h = ((h << 5) - h + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  return h;
}
