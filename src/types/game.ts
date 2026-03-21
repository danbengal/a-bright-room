// Core game state types

export type Phase = 'spark' | 'hearth' | 'settlement' | 'questWeb' | 'wild' | 'reckoning' | 'departure';

export type WorkerRole = string;

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest' | 'relic' | 'material';
  attack?: number;
  defense?: number;
  bonuses?: Record<string, number>;
  description: string;
  stackable: boolean;
  quantity: number;
}

export interface MapTile {
  x: number;
  y: number;
  z: number;
  terrain: string;
  explored: boolean;
  poi?: string;
  enemy?: string;
  loot?: string[];
  hazard?: string;
}

export interface NPCState {
  id: string;
  relationship: number;
  met: boolean;
  questStep: number;
  alive: boolean;
  assignedRole?: WorkerRole;
  dialogueFlags: Record<string, boolean>;
}

export interface QuestState {
  id: string;
  active: boolean;
  completed: boolean;
  failed: boolean;
  step: number;
  flags: Record<string, boolean>;
}

export interface CombatState {
  active: boolean;
  enemyId?: string;
  enemyHealth?: number;
  enemyMaxHealth?: number;
  playerHealth?: number;
  ticksElapsed?: number;
  log: string[];
}

export interface CheckpointData {
  id: string;
  label: string;
  state: string; // JSON serialized partial state
  timestamp: number;
}

export interface ChapterState {
  phase: Phase;
  ticks: number;
  resources: Record<string, number>;
  resourceCaps: Record<string, number>;
  buildings: Record<string, { level: number; workers: number; damaged?: boolean }>;
  workers: { total: number; free: number; assigned: Record<string, number> };
  crafted: string[];
  inventory: InventoryItem[];
  map: {
    tiles: MapTile[][];
    width: number;
    height: number;
    depth: number;
    playerPos: { x: number; y: number; z: number };
    landmarks: string[];
    exploredCount: number;
  };
  npcs: Record<string, NPCState>;
  quests: Record<string, QuestState>;
  combat: CombatState;
  events: { fired: string[]; cooldowns: Record<string, number> };
  environment: Record<string, number>;
  health: number;
  maxHealth: number;
  deathCount: number;
  deathsAtCheckpoint: Record<string, number>;
  checkpoints: CheckpointData[];
  currentCheckpoint: string;
  stokeCooldown: number;
  stokeCount: number;
  vesselProgress: Record<string, boolean>;
  departing: boolean;
  unlockedResources: string[];
  unlockedBuildings: string[];
  unlockedCrafting: string[];
  unlockedFeatures: string[];
  textLog: LogEntry[];
  activeDialogue: DialogueState | null;
  explorationActive: boolean;
  expeditionInventory: InventoryItem[];
  expeditionSupplies: Record<string, number>;
  flags: Record<string, boolean>;
  pendingPOI: string | null; // POI id awaiting player decision (enter/flee)
  equipped: {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
  };
}

export interface LogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'narrative' | 'event' | 'system' | 'combat' | 'death' | 'quest' | 'dialogue' | 'checkpoint';
}

export interface DialogueState {
  npcId: string;
  nodeId: string;
  text: string;
  options: { id: string; text: string; condition?: string }[];
}

export interface CodexEntry {
  id: string;
  category: 'worlds' | 'people' | 'creatures' | 'items' | 'lore' | 'parallax' | 'achievements';
  title: string;
  text: string;
  unlocked: boolean;
  chapter: number;
}

export interface GlobalState {
  chaptersCompleted: string[];
  codex: Record<string, CodexEntry>;
  relics: InventoryItem[];
  traits: string[];
  parallaxShards: string[];
  legacyScores: Record<string, number>;
  totalDeaths: number;
  totalPlaytime: number;
  exitsTaken: Record<string, string>;
  newGamePlus: boolean;
}

export interface SaveState {
  version: string;
  lastSaveTimestamp: number;
  currentChapter: string;
  chapterState: ChapterState;
  globalState: GlobalState;
}

export interface GameNotification {
  id: string;
  text: string;
  timestamp: number;
  duration: number;
}
