// Save/load utilities — localStorage persistence and import/export

import { SaveState } from '@/types/game';

// ---------------------------------------------------------------------------
// localStorage key constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'abrightroom';

export const SAVE_KEYS = {
  autosave: `${STORAGE_PREFIX}_autosave`,
  slot_1: `${STORAGE_PREFIX}_slot_1`,
  slot_2: `${STORAGE_PREFIX}_slot_2`,
  slot_3: `${STORAGE_PREFIX}_slot_3`,
} as const;

export type SaveSlot = keyof typeof SAVE_KEYS;

const CURRENT_VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// Save to localStorage
// ---------------------------------------------------------------------------

export function saveToLocalStorage(key: string, state: SaveState): boolean {
  try {
    const serialized = JSON.stringify({
      ...state,
      version: CURRENT_VERSION,
      lastSaveTimestamp: Date.now(),
    });
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Load from localStorage
// ---------------------------------------------------------------------------

export function loadFromLocalStorage(key: string): SaveState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SaveState;

    // Basic validation
    if (!parsed.chapterState || !parsed.globalState) {
      console.error('Invalid save data: missing required fields');
      return null;
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Export as JSON string (for file download)
// ---------------------------------------------------------------------------

export function exportAsJSON(state: SaveState): string {
  return JSON.stringify(
    {
      ...state,
      version: CURRENT_VERSION,
      lastSaveTimestamp: Date.now(),
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------
// Import from JSON string
// ---------------------------------------------------------------------------

export function importFromJSON(json: string): SaveState | null {
  try {
    const parsed = JSON.parse(json) as SaveState;

    // Validate required structure
    if (!parsed.chapterState || !parsed.globalState) {
      console.error('Invalid import data: missing chapterState or globalState');
      return null;
    }

    if (!parsed.currentChapter) {
      console.error('Invalid import data: missing currentChapter');
      return null;
    }

    // Validate chapterState has key fields
    const cs = parsed.chapterState;
    if (
      cs.phase === undefined ||
      cs.ticks === undefined ||
      cs.resources === undefined ||
      cs.health === undefined
    ) {
      console.error('Invalid import data: chapterState missing key fields');
      return null;
    }

    return parsed;
  } catch (e) {
    console.error('Failed to parse import JSON:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get info about each save slot (for save/load UI)
// ---------------------------------------------------------------------------

export interface SaveSlotInfo {
  slot: SaveSlot;
  key: string;
  exists: boolean;
  chapter: string | null;
  playtime: number | null;
  timestamp: number | null;
  phase: string | null;
}

export function getSaveSlotInfo(): SaveSlotInfo[] {
  const slots: SaveSlotInfo[] = [];

  for (const [slot, key] of Object.entries(SAVE_KEYS)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        slots.push({
          slot: slot as SaveSlot,
          key,
          exists: false,
          chapter: null,
          playtime: null,
          timestamp: null,
          phase: null,
        });
        continue;
      }

      const parsed = JSON.parse(raw) as SaveState;
      slots.push({
        slot: slot as SaveSlot,
        key,
        exists: true,
        chapter: parsed.currentChapter ?? null,
        playtime: parsed.globalState?.totalPlaytime ?? null,
        timestamp: parsed.lastSaveTimestamp ?? null,
        phase: parsed.chapterState?.phase ?? null,
      });
    } catch {
      slots.push({
        slot: slot as SaveSlot,
        key,
        exists: false,
        chapter: null,
        playtime: null,
        timestamp: null,
        phase: null,
      });
    }
  }

  return slots;
}
