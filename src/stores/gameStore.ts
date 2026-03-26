// Zustand game store — single source of truth for all game state

import { create } from 'zustand';
import type {
  SaveState,
  ChapterState,
  GlobalState,
  GameNotification,
  LogEntry,
} from '@/types/game';
import type { ChapterConfig } from '@/types/chapter';

import { processTick, createLogEntry, eventBus } from '@/engine/core';
import { addResources, canAfford, spendResources } from '@/engine/resources';
import { construct, assignWorkerChecked, unassignWorker } from '@/engine/buildings';
import { craft as engineCraft } from '@/engine/crafting';
import { startDialogue, selectOption } from '@/engine/npcs';
import { fireEvent, applyDialogueEffects } from '@/engine/events';
import { generateMap, move, returnToBase } from '@/engine/exploration';
import { flee, useItem as useCombatItemEngine } from '@/engine/combat';
import { buildVesselStage, initiateDeparture } from '@/engine/vessel';
import { processDeath, checkDeath } from '@/engine/death';

import {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportAsJSON,
  importFromJSON,
  SAVE_KEYS,
  type SaveSlot,
} from '@/persistence/save';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAVE_VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// Store state shape
// ---------------------------------------------------------------------------

export interface GameStoreState {
  // Core save state
  version: string;
  lastSaveTimestamp: number;
  currentChapter: string;
  chapterState: ChapterState;
  globalState: GlobalState;

  // UI / runtime state (not persisted in save)
  initialized: boolean;
  paused: boolean;
  notifications: GameNotification[];
  currentConfig: ChapterConfig | null;

  // Player preferences
  autoStoke: boolean;
  gameSpeed: 1 | 1.5 | 2;
}

// ---------------------------------------------------------------------------
// Store actions
// ---------------------------------------------------------------------------

export interface GameStoreActions {
  // Game lifecycle
  initGame: (chapterConfig: ChapterConfig) => void;
  loadGame: (saveState: SaveState) => void;
  resetGame: () => void;
  pause: () => void;
  resume: () => void;

  // Tick
  tick: () => void;

  // Player actions
  stoke: () => void;
  build: (buildingId: string, count?: number) => void;
  craft: (recipeId: string, count?: number) => void;
  talkTo: (npcId: string) => void;
  selectDialogueOption: (optionId: string) => void;
  closeDialogue: () => void;
  startExploration: () => void;
  moveOnMap: (direction: string) => void;
  returnFromExploration: () => void;
  fight: () => void;
  fleeFromCombat: () => void;
  useCombatItem: (itemId: string) => void;
  buildVessel: (stageId: string) => void;
  depart: () => void;
  makeEventChoice: (eventId: string, choiceId: string) => void;
  assignWorker: (buildingId: string) => void;
  unassignWorker: (buildingId: string) => void;
  enterPOI: () => void;
  fleePOI: () => void;

  // Save/load
  saveToSlot: (slot: SaveSlot) => void;
  loadFromSlot: (slot: SaveSlot) => boolean;
  autoSave: () => void;
  exportSave: () => string;
  importSave: (json: string) => boolean;

  // Preferences
  toggleAutoStoke: () => void;
  setGameSpeed: (speed: 1 | 1.5 | 2) => void;

  // Utility
  addNotification: (text: string, duration?: number) => void;
  clearNotification: (id: string) => void;
  addLogEntry: (text: string, type?: LogEntry['type']) => void;
}

// ---------------------------------------------------------------------------
// Initial chapter state factory
// ---------------------------------------------------------------------------

function createInitialChapterState(config: ChapterConfig): ChapterState {
  const map = generateMap(config);

  return {
    phase: 'spark',
    ticks: 0,
    resources: { ...config.startingResources },
    resourceCaps: {},
    buildings: {},
    workers: { total: 0, free: 0, assigned: {} },
    crafted: [],
    inventory: [],
    map,
    npcs: {},
    quests: {},
    combat: { active: false, log: [] },
    events: { fired: [], cooldowns: {} },
    environment: config.environmentalPressure
      ? { [config.environmentalPressure.id]: config.environmentalPressure.meter.startValue }
      : {},
    health: config.startingHealth,
    maxHealth: config.maxHealth,
    deathCount: 0,
    deathsAtCheckpoint: {},
    checkpoints: [],
    currentCheckpoint: '',
    stokeCooldown: 0,
    stokeCount: 0,
    vesselProgress: {},
    departing: false,
    unlockedResources: [],
    unlockedBuildings: [],
    unlockedCrafting: [],
    unlockedFeatures: [],
    textLog: [],
    activeDialogue: null,
    explorationActive: false,
    expeditionInventory: [],
    expeditionSupplies: {},
    flags: {},
    pendingPOI: null,
    equipped: { weapon: null, armor: null, accessory: null },
  };
}

function createInitialGlobalState(): GlobalState {
  return {
    chaptersCompleted: [],
    codex: {},
    relics: [],
    traits: [],
    parallaxShards: [],
    legacyScores: {},
    totalDeaths: 0,
    totalPlaytime: 0,
    exitsTaken: {},
    newGamePlus: false,
  };
}

// ---------------------------------------------------------------------------
// Default store state
// ---------------------------------------------------------------------------

const defaultState: GameStoreState = {
  version: SAVE_VERSION,
  lastSaveTimestamp: 0,
  currentChapter: '',
  chapterState: {
    phase: 'spark',
    ticks: 0,
    resources: {},
    resourceCaps: {},
    buildings: {},
    workers: { total: 0, free: 0, assigned: {} },
    crafted: [],
    inventory: [],
    map: {
      tiles: [],
      width: 0,
      height: 0,
      depth: 1,
      playerPos: { x: 0, y: 0, z: 0 },
      landmarks: [],
      exploredCount: 0,
    },
    npcs: {},
    quests: {},
    combat: { active: false, log: [] },
    events: { fired: [], cooldowns: {} },
    environment: {},
    health: 10,
    maxHealth: 10,
    deathCount: 0,
    deathsAtCheckpoint: {},
    checkpoints: [],
    currentCheckpoint: '',
    stokeCooldown: 0,
    stokeCount: 0,
    vesselProgress: {},
    departing: false,
    unlockedResources: [],
    unlockedBuildings: [],
    unlockedCrafting: [],
    unlockedFeatures: [],
    textLog: [],
    activeDialogue: null,
    explorationActive: false,
    expeditionInventory: [],
    expeditionSupplies: {},
    flags: {},
    pendingPOI: null,
    equipped: { weapon: null, armor: null, accessory: null },
  },
  globalState: createInitialGlobalState(),
  initialized: false,
  paused: false,
  notifications: [],
  currentConfig: null,
  autoStoke: false,
  gameSpeed: 1,
};

// ---------------------------------------------------------------------------
// Notification ID generator
// ---------------------------------------------------------------------------

let notificationIdCounter = 0;

function generateNotificationId(): string {
  notificationIdCounter += 1;
  return `notif-${Date.now()}-${notificationIdCounter}`;
}

// ---------------------------------------------------------------------------
// Parse the stoke effect string into resource deltas
// ---------------------------------------------------------------------------

function parseStokeEffect(effect: string): Record<string, number> {
  // Effect format: "resource.wood + 5" or "resource.wood + 5, resource.heat + 10"
  const result: Record<string, number> = {};

  const parts = effect.split(',').map((s) => s.trim());
  for (const part of parts) {
    // Match patterns like "resource.wood + 5" or "resource.heat + 10"
    const match = part.match(/^resource\.(\w+)\s*([+-])\s*(\d+(?:\.\d+)?)$/);
    if (match) {
      const [, resourceId, operator, valueStr] = match;
      const value = parseFloat(valueStr);
      result[resourceId] = operator === '+' ? value : -value;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stoke narrative texts
// ---------------------------------------------------------------------------

const STOKE_TEXTS = [
  'the embers glow brighter.',
  'warmth spreads through the room.',
  'the fire crackles and spits.',
  'shadows retreat from the growing light.',
  'the coals hiss softly.',
  'a faint warmth returns to the air.',
  'the flame steadies.',
  'sparks drift upward like tiny stars.',
  'the room breathes with heat.',
  'the darkness pulls back, grudgingly.',
  'the wood catches. orange light blooms.',
  'a log shifts in the fire. sparks scatter.',
  'the heat pushes outward. the walls feel closer.',
  'the fire grows. the cold retreats another inch.',
  'smoke curls upward through the cracks in the ceiling.',
  'the flames dance. their shadows play on the walls.',
  'a pocket of sap pops. the fire flares briefly.',
  'the warmth seeps into the stone floor.',
  'the fire burns steady now. reliable.',
  'light fills the room. the corners are visible again.',
  'the wood crackles. a comforting sound.',
  'heat radiates from the stones around the hearth.',
  'the fire is strong. the room is safe.',
  'the flames lick at new wood hungrily.',
  'warmth pools in the room like water.',
  'the coals shift and settle. the fire deepens.',
  'a wave of heat washes over you.',
  'the fire hums. a low, patient sound.',
  'the room glows amber. almost peaceful.',
  'the cold gives ground. the fire holds.',
];

function getStokeText(stokeCount: number): string {
  // Use a mix of count and randomness for variety
  const index = (stokeCount * 7 + stokeCount) % STOKE_TEXTS.length;
  return STOKE_TEXTS[index];
}

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  (set, get) => ({
    ...defaultState,

    // -----------------------------------------------------------------------
    // Game lifecycle
    // -----------------------------------------------------------------------

    initGame: (chapterConfig: ChapterConfig) => {
      const chapterState = createInitialChapterState(chapterConfig);

      // Add initial narrative log entry
      const initialLog = createLogEntry(
        chapterConfig.phases.spark?.text ?? 'The room is dark.',
        'narrative',
      );
      chapterState.textLog = [initialLog];

      eventBus.clear();

      set({
        version: SAVE_VERSION,
        lastSaveTimestamp: Date.now(),
        currentChapter: chapterConfig.id,
        chapterState,
        globalState: get().globalState.totalPlaytime > 0
          ? get().globalState
          : createInitialGlobalState(),
        initialized: true,
        paused: false,
        notifications: [],
        currentConfig: chapterConfig,
      });
    },

    loadGame: (saveState: SaveState) => {
      // Patch missing fields that may not exist in older saves
      const cs = saveState.chapterState;
      if (!cs.pendingPOI && cs.pendingPOI !== null) cs.pendingPOI = null;
      if (!cs.equipped) cs.equipped = { weapon: null, armor: null, accessory: null };
      if (!cs.flags) cs.flags = {};

      // Must set currentConfig so all components work
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { chapter01Config } = require('@/chapters/chapter01-dark-room/config');

      set({
        version: saveState.version,
        lastSaveTimestamp: saveState.lastSaveTimestamp,
        currentChapter: saveState.currentChapter,
        chapterState: cs,
        globalState: saveState.globalState,
        initialized: true,
        paused: false,
        currentConfig: chapter01Config,
      });
    },

    resetGame: () => {
      eventBus.clear();
      set({
        ...defaultState,
        globalState: get().globalState, // preserve global state across resets
      });
    },

    pause: () => {
      set({ paused: true });
    },

    resume: () => {
      set({ paused: false });
    },

    // -----------------------------------------------------------------------
    // Tick
    // -----------------------------------------------------------------------

    tick: () => {
      const { chapterState, currentConfig, initialized, paused, autoStoke } = get();
      if (!initialized || paused || !currentConfig) return;

      let newState: ChapterState;
      try {
        // Process one game tick through the engine
        newState = processTick(chapterState, currentConfig);
      } catch (err) {
        console.error('[tick] engine error:', err);
        return;
      }

      // Auto-stoke: if enabled and cooldown just hit 0, fire stoke
      if (autoStoke && newState.stokeCooldown === 0) {
        const stokeDef = currentConfig.stokeAction;
        const hasCosts = stokeDef.resourceCost && Object.keys(stokeDef.resourceCost).length > 0;
        const affordable = !hasCosts || canAfford(newState, stokeDef.resourceCost);

        if (affordable) {
          if (hasCosts) {
            newState = spendResources(newState, stokeDef.resourceCost);
          }
          const resourceGains = parseStokeEffect(stokeDef.effect);
          if (Object.keys(resourceGains).length > 0) {
            newState = addResources(newState, resourceGains, currentConfig);
          }
          newState = {
            ...newState,
            stokeCooldown: stokeDef.cooldown,
            stokeCount: newState.stokeCount + 1,
          };
          // Boost environment meter
          if (currentConfig.environmentalPressure) {
            const envId = currentConfig.environmentalPressure.id;
            const currentEnvValue = newState.environment[envId] ?? currentConfig.environmentalPressure.meter.startValue;
            const maxEnv = currentConfig.environmentalPressure.meter.max;
            newState = {
              ...newState,
              environment: {
                ...newState.environment,
                [envId]: Math.min(maxEnv, currentEnvValue + 10),
              },
            };
          }
          const logEntry = createLogEntry(getStokeText(newState.stokeCount), 'narrative');
          newState = { ...newState, textLog: [...newState.textLog, logEntry] };
        }
      }

      // Check for death after tick processing
      if (checkDeath(newState)) {
        newState = processDeath(newState, currentConfig, 'unknown');
      }

      set({
        chapterState: newState,
        lastSaveTimestamp: Date.now(),
        globalState: {
          ...get().globalState,
          totalPlaytime: get().globalState.totalPlaytime + 1,
        },
      });
    },

    // -----------------------------------------------------------------------
    // Player actions
    // -----------------------------------------------------------------------

    stoke: () => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      // Check cooldown
      if (chapterState.stokeCooldown > 0) return;

      // Check resource costs (if any)
      const stokeDef = currentConfig.stokeAction;
      if (stokeDef.resourceCost && Object.keys(stokeDef.resourceCost).length > 0) {
        if (!canAfford(chapterState, stokeDef.resourceCost)) return;
      }

      // Start with the current state
      let s = { ...chapterState };

      // Spend resource costs if any
      if (stokeDef.resourceCost && Object.keys(stokeDef.resourceCost).length > 0) {
        s = spendResources(s, stokeDef.resourceCost);
      }

      // Apply stoke effect (parse the effect string into resource gains)
      const resourceGains = parseStokeEffect(stokeDef.effect);
      if (Object.keys(resourceGains).length > 0) {
        s = addResources(s, resourceGains, currentConfig);
      }

      // Set cooldown, increment count
      s = {
        ...s,
        stokeCooldown: stokeDef.cooldown,
        stokeCount: s.stokeCount + 1,
      };

      // Boost the environmental pressure meter (warmth against cold)
      if (currentConfig.environmentalPressure) {
        const envId = currentConfig.environmentalPressure.id;
        const currentEnvValue = s.environment[envId] ?? currentConfig.environmentalPressure.meter.startValue;
        const maxEnv = currentConfig.environmentalPressure.meter.max;
        s = {
          ...s,
          environment: {
            ...s.environment,
            [envId]: Math.min(maxEnv, currentEnvValue + 10),
          },
        };
      }

      // Add atmospheric log entry
      const logEntry = createLogEntry(
        getStokeText(s.stokeCount),
        'narrative',
      );
      s = { ...s, textLog: [...s.textLog, logEntry] };

      set({ chapterState: s });
    },

    build: (buildingId: string, count: number = 1) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      let s = chapterState;
      for (let i = 0; i < count; i++) {
        const next = construct(s, buildingId, currentConfig);
        if (next === s) break; // can't build anymore
        s = next;
      }
      if (s !== chapterState) {
        set({ chapterState: s });
      }
    },

    craft: (recipeId: string, count: number = 1) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      let s = chapterState;
      for (let i = 0; i < count; i++) {
        const next = engineCraft(s, recipeId, currentConfig);
        if (next === s) break; // can't craft anymore
        s = next;
      }
      if (s !== chapterState) {
        set({ chapterState: s });
      }
    },

    talkTo: (npcId: string) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      const newState = startDialogue(chapterState, npcId, currentConfig);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    selectDialogueOption: (optionId: string) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      const newState = selectOption(chapterState, optionId, currentConfig);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    closeDialogue: () => {
      const { chapterState } = get();
      if (!chapterState.activeDialogue) return;

      set({
        chapterState: {
          ...chapterState,
          activeDialogue: null,
        },
      });
    },

    startExploration: () => {
      const { chapterState, currentConfig } = get();
      if (chapterState.explorationActive) return;
      if (!currentConfig) return;

      // Calculate carry capacity from inventory bonuses
      let waterCap = 50; // base capacity
      let foodCap = 50;
      for (const item of chapterState.inventory) {
        if (item.bonuses) {
          if (item.bonuses.waterCapacity) waterCap += item.bonuses.waterCapacity;
          if (item.bonuses.foodCapacity) foodCap += item.bonuses.foodCapacity;
          if (item.bonuses.carryCapacity) {
            waterCap += Math.floor(item.bonuses.carryCapacity / 2);
            foodCap += Math.floor(item.bonuses.carryCapacity / 2);
          }
        }
      }

      // Pack supplies from main resources up to capacity
      const capMap: Record<string, number> = { water: waterCap, curedMeat: foodCap };
      const supplies: Record<string, number> = {};
      for (const [resId] of Object.entries(currentConfig.map.supplyCosts)) {
        const available = chapterState.resources[resId] ?? 0;
        const cap = capMap[resId] ?? 50;
        const toTake = Math.min(available, cap);
        supplies[resId] = toTake;
      }

      // Deduct packed supplies from main resources
      const newResources = { ...chapterState.resources };
      for (const [resId, amount] of Object.entries(supplies)) {
        newResources[resId] = (newResources[resId] ?? 0) - amount;
      }

      const logEntry = createLogEntry('you set out into the wasteland.', 'narrative');

      set({
        chapterState: {
          ...chapterState,
          explorationActive: true,
          resources: newResources,
          expeditionSupplies: supplies,
          textLog: [...chapterState.textLog, logEntry],
        },
      });
    },

    moveOnMap: (direction: string) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;
      if (!chapterState.explorationActive) return;
      if (chapterState.combat.active) return;
      if (chapterState.pendingPOI) return; // can't move while POI popup is showing

      // Map short direction codes to full names
      const directionMap: Record<string, string> = {
        n: 'north',
        s: 'south',
        e: 'east',
        w: 'west',
        north: 'north',
        south: 'south',
        east: 'east',
        west: 'west',
      };

      const fullDirection = directionMap[direction] ?? direction;
      const newState = move(chapterState, fullDirection, currentConfig);

      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    returnFromExploration: () => {
      const { chapterState } = get();
      if (!chapterState.explorationActive) return;

      // Return unused supplies to main resources
      const newResources = { ...chapterState.resources };
      for (const [resId, amount] of Object.entries(chapterState.expeditionSupplies)) {
        if (amount > 0) {
          newResources[resId] = (newResources[resId] ?? 0) + amount;
        }
      }

      let newState = returnToBase(chapterState);
      newState = {
        ...newState,
        resources: newResources,
        expeditionSupplies: {},
      };

      const logEntry = createLogEntry('you return to the village.', 'narrative');
      newState = { ...newState, textLog: [...newState.textLog, logEntry] };

      set({ chapterState: newState });
    },

    fight: () => {
      // The fight action during combat is handled by the combat tick system.
      // Choosing "fight" means the player stays in combat (default behavior).
      // Combat progresses automatically via processCombatTick in the tick loop.
      // This action exists for UI symmetry with flee.
    },

    fleeFromCombat: () => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;
      if (!chapterState.combat.active) return;

      const newState = flee(chapterState, currentConfig);
      set({ chapterState: newState });
    },

    useCombatItem: (itemId: string) => {
      const { chapterState } = get();
      if (!chapterState.combat.active) return;

      const newState = useCombatItemEngine(chapterState, itemId);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    buildVessel: (stageId: string) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      const newState = buildVesselStage(chapterState, stageId, currentConfig);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    depart: () => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      const newState = initiateDeparture(chapterState, currentConfig);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    makeEventChoice: (eventId: string, choiceId: string) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      // Find the event definition
      const eventDef = currentConfig.events.find((e) => e.id === eventId);
      if (!eventDef || !eventDef.choices) return;

      // Find the chosen option
      const choice = eventDef.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      // Fire the event with the chosen effects
      let s = fireEvent(chapterState, eventId, currentConfig);

      // Apply choice-specific effects
      if (choice.effects && choice.effects.length > 0) {
        s = applyDialogueEffects(s, choice.effects);
      }

      // Add choice result text to log
      if (choice.resultText) {
        const logEntry = createLogEntry(choice.resultText, 'event');
        s = { ...s, textLog: [...s.textLog, logEntry] };
      }

      set({ chapterState: s });
    },

    assignWorker: (buildingId: string) => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig) return;

      const newState = assignWorkerChecked(chapterState, buildingId, currentConfig);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    unassignWorker: (buildingId: string) => {
      const { chapterState } = get();

      const newState = unassignWorker(chapterState, buildingId);
      if (newState !== chapterState) {
        set({ chapterState: newState });
      }
    },

    enterPOI: () => {
      const { chapterState, currentConfig } = get();
      if (!currentConfig || !chapterState.pendingPOI) return;

      const { discoverPOI } = require('@/engine/exploration');
      let s = discoverPOI(chapterState, chapterState.pendingPOI, currentConfig);
      s = { ...s, pendingPOI: null };
      set({ chapterState: s });
    },

    fleePOI: () => {
      const { chapterState } = get();
      if (!chapterState.pendingPOI) return;

      const logEntry = createLogEntry('you back away. not today.', 'narrative');
      set({
        chapterState: {
          ...chapterState,
          pendingPOI: null,
          textLog: [...chapterState.textLog, logEntry],
        },
      });
    },

    // -----------------------------------------------------------------------
    // Save / Load
    // -----------------------------------------------------------------------

    saveToSlot: (slot: SaveSlot) => {
      const state = get();
      const saveState: SaveState = {
        version: state.version,
        lastSaveTimestamp: Date.now(),
        currentChapter: state.currentChapter,
        chapterState: state.chapterState,
        globalState: state.globalState,
      };

      const key = SAVE_KEYS[slot];
      const success = saveToLocalStorage(key, saveState);

      if (success) {
        state.addNotification(`Game saved to ${slot}.`, 3000);
      } else {
        state.addNotification('Failed to save game.', 5000);
      }
    },

    loadFromSlot: (slot: SaveSlot): boolean => {
      const key = SAVE_KEYS[slot];
      const saveState = loadFromLocalStorage(key);

      if (!saveState) {
        get().addNotification(`No save found in ${slot}.`, 3000);
        return false;
      }

      set({
        version: saveState.version,
        lastSaveTimestamp: saveState.lastSaveTimestamp,
        currentChapter: saveState.currentChapter,
        chapterState: saveState.chapterState,
        globalState: saveState.globalState,
        initialized: true,
        paused: false,
      });

      get().addNotification(`Game loaded from ${slot}.`, 3000);
      return true;
    },

    autoSave: () => {
      const state = get();
      if (!state.initialized) return;

      const saveState: SaveState = {
        version: state.version,
        lastSaveTimestamp: Date.now(),
        currentChapter: state.currentChapter,
        chapterState: state.chapterState,
        globalState: state.globalState,
      };

      saveToLocalStorage(SAVE_KEYS.autosave, saveState);
    },

    exportSave: (): string => {
      const state = get();
      const saveState: SaveState = {
        version: state.version,
        lastSaveTimestamp: Date.now(),
        currentChapter: state.currentChapter,
        chapterState: state.chapterState,
        globalState: state.globalState,
      };

      return exportAsJSON(saveState);
    },

    importSave: (json: string): boolean => {
      const saveState = importFromJSON(json);
      if (!saveState) {
        get().addNotification('Failed to import save. Invalid format.', 5000);
        return false;
      }

      set({
        version: saveState.version,
        lastSaveTimestamp: saveState.lastSaveTimestamp,
        currentChapter: saveState.currentChapter,
        chapterState: saveState.chapterState,
        globalState: saveState.globalState,
        initialized: true,
        paused: false,
      });

      get().addNotification('Save imported successfully.', 3000);
      return true;
    },

    // -----------------------------------------------------------------------
    // Preferences
    // -----------------------------------------------------------------------

    toggleAutoStoke: () => {
      const autoStoke = !get().autoStoke;
      set({ autoStoke });
      get().addNotification(autoStoke ? 'auto-stoke enabled.' : 'auto-stoke disabled.', 2000);
    },

    setGameSpeed: (speed: 1 | 1.5 | 2) => {
      set({ gameSpeed: speed });
      get().addNotification(`speed set to ${speed}x.`, 2000);
    },

    // -----------------------------------------------------------------------
    // Utility
    // -----------------------------------------------------------------------

    addNotification: (text: string, duration: number = 5000) => {
      const id = generateNotificationId();
      const notification: GameNotification = {
        id,
        text,
        timestamp: Date.now(),
        duration,
      };

      set((state) => ({
        notifications: [...state.notifications, notification],
      }));

      // Auto-clear after duration
      if (duration > 0) {
        setTimeout(() => {
          get().clearNotification(id);
        }, duration);
      }
    },

    clearNotification: (id: string) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    },

    addLogEntry: (text: string, type: LogEntry['type'] = 'narrative') => {
      const logEntry = createLogEntry(text, type);

      set((state) => ({
        chapterState: {
          ...state.chapterState,
          textLog: [...state.chapterState.textLog, logEntry],
        },
      }));
    },
  }),
);
