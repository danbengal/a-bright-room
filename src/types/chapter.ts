// Chapter configuration types — the contract between engine and content

import { Phase } from './game';

export interface ResourceDef {
  id: string;
  name: string;
  description: string;
  category: 'raw' | 'refined' | 'crafted' | 'endgame';
  baseCap: number;
  capGrowth: number; // cap increases per storage building level
  unlockCondition: UnlockCondition;
  hidden: boolean; // hidden until unlocked
}

export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  category: string;
  maxLevel: number;
  costs: { level: number; resources: Record<string, number> }[];
  effects: BuildingEffect[];
  workerSlots: number;
  workerRole: string;
  dependencies: { buildingId: string; level: number }[];
  unlockCondition: UnlockCondition;
}

export interface BuildingEffect {
  type: 'produce' | 'store' | 'convert' | 'unlock' | 'bonus' | 'defense';
  resourceId?: string;
  amount?: number;
  perWorker?: number;
  perLevel?: number;
  inputResource?: string;
  outputResource?: string;
  conversionRate?: number;
  unlockId?: string;
}

export interface CraftRecipeDef {
  id: string;
  name: string;
  description: string;
  category: 'tool' | 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest' | 'vessel';
  costs: Record<string, number>;
  result: {
    itemId: string;
    type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest' | 'relic' | 'material';
    attack?: number;
    defense?: number;
    bonuses?: Record<string, number>;
    description: string;
    stackable: boolean;
  };
  buildingRequired?: string;
  buildingLevel?: number;
  unlockCondition: UnlockCondition;
}

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  description: string;
  arrivalCondition: UnlockCondition;
  workerRole?: string;
  dialogueTree: DialogueNode[];
  questId?: string;
}

export interface DialogueNode {
  id: string;
  text: string;
  condition?: string; // evaluated expression
  options: DialogueOption[];
  effects?: DialogueEffect[];
}

export interface DialogueOption {
  id: string;
  text: string;
  nextNodeId: string;
  condition?: string;
  effects?: DialogueEffect[];
}

export interface DialogueEffect {
  type: 'relationship' | 'resource' | 'flag' | 'quest' | 'unlock' | 'codex' | 'log';
  npcId?: string;
  amount?: number;
  resourceId?: string;
  flagId?: string;
  flagValue?: boolean;
  questId?: string;
  questStep?: number;
  unlockId?: string;
  codexId?: string;
  logText?: string;
}

export interface EventDef {
  id: string;
  text: string;
  type: 'atmospheric' | 'arrival' | 'crisis' | 'random' | 'milestone' | 'story';
  condition: string; // evaluated expression
  cooldown: number; // minimum ticks between firings
  repeatable: boolean;
  choices?: EventChoice[];
  effects?: DialogueEffect[];
  priority: number;
}

export interface EventChoice {
  id: string;
  text: string;
  effects: DialogueEffect[];
  resultText: string;
}

export interface MapConfig {
  width: number;
  height: number;
  depth: number; // 1 for 2D maps, >1 for Z-axis
  terrainTypes: TerrainDef[];
  pointsOfInterest: POIDef[];
  enemies: EnemyDef[];
  movementCosts: Record<string, number>; // terrain type → ticks to cross
  supplyCosts: Record<string, number>; // resource → amount per tile moved
  hiddenAreas: HiddenAreaDef[];
}

export interface TerrainDef {
  id: string;
  name: string;
  symbol: string;
  color: string;
  passable: boolean;
  hazard?: { damagePerTick: number; type: string; resistGear?: string };
  encounterRate: number; // 0-1
}

export interface POIDef {
  id: string;
  name: string;
  description: string;
  type: 'landmark' | 'dungeon' | 'cache' | 'outpost' | 'quest' | 'exit' | 'boss';
  position: { x: number; y: number; z: number };
  discoveryText: string;
  loot?: Record<string, number>;
  questTrigger?: string;
  hidden: boolean;
  revealCondition?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  description: string;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  terrain: string[]; // which terrain types this enemy appears on
  minDistance: number; // minimum tiles from base
  loot: { itemId: string; chance: number; quantity: number }[];
  experienceValue: number;
}

export interface HiddenAreaDef {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { w: number; h: number };
  revealCondition: string;
  terrain: string;
}

export interface BossDef {
  id: string;
  name: string;
  description: string;
  phases: BossPhase[];
  loot: Record<string, number>;
  defeatCondition: string;
}

export interface BossPhase {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  description: string;
  specialMechanic?: string;
}

export interface VesselDef {
  id: string;
  name: string;
  stages: { id: string; name: string; costs: Record<string, number>; description: string }[];
}

export interface DepartureDef {
  standardNarrative: string[];
  hiddenNarrative: string[];
}

export interface ExitDef {
  id: string;
  name: string;
  description: string;
  conditions: ExitCondition[];
  narrative: string[];
}

export interface ExitCondition {
  type: 'npc_relationship' | 'quest_complete' | 'item' | 'resource' | 'map_explored' | 'flag' | 'building';
  target: string;
  value: number | string | boolean;
}

export interface EnvironmentDef {
  id: string;
  name: string;
  description: string;
  meter: { min: number; max: number; startValue: number; dangerThreshold: number };
  decayRate: number; // per tick
  damageRate: number; // damage per tick when in danger zone
  mitigators: { type: 'building' | 'resource' | 'gear'; id: string; effect: number }[];
}

export interface PhaseConfig {
  trigger: string; // evaluated expression for when this phase activates
  unlocks?: string[]; // feature IDs to unlock
  text?: string; // narrative text when phase starts
}

export interface UnlockCondition {
  type: 'phase' | 'building' | 'resource' | 'quest' | 'event' | 'npc' | 'tick' | 'always';
  target?: string;
  value?: number | string;
}

export interface ChapterTheme {
  primary: string;
  accent: string;
  bg: string;
  font: string;
}

export interface ChapterConfig {
  id: string;
  name: string;
  chapterNumber: number;
  theme: ChapterTheme;

  phases: Record<Phase, PhaseConfig>;

  stokeAction: {
    name: string;
    description: string;
    resourceCost: Record<string, number>;
    cooldown: number;
    effect: string;
    upgradesAvailable: boolean;
  };

  resources: ResourceDef[];
  buildings: BuildingDef[];
  crafting: CraftRecipeDef[];
  npcs: NPCDef[];
  map: MapConfig;
  events: EventDef[];
  boss: BossDef;
  vessel: VesselDef;
  departure: DepartureDef;

  exits: {
    standard: ExitDef;
    hidden: ExitDef[];
  };

  environmentalPressure: EnvironmentDef;
  newMechanic: null; // will be typed per chapter in later phases

  startingResources: Record<string, number>;
  startingHealth: number;
  maxHealth: number;

  checkpoints: { id: string; trigger: string; label: string }[];
}
