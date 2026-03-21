// Chapter 01 — Quests
// Main quest and side quests for A Dark Room

// Note: Quest definitions are used by the NPC dialogue trees and event system.
// The quest engine (src/engine/quests.ts) handles activation, progression,
// and completion. These definitions provide step descriptions and reward data
// for the UI and narrative layers.

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side';
  steps: QuestStepDef[];
  rewards: QuestReward[];
}

export interface QuestStepDef {
  step: number;
  description: string;
  hint: string;
  completionCondition: string;
}

export interface QuestReward {
  type: 'resource' | 'item' | 'codex' | 'flag' | 'unlock';
  id: string;
  amount?: number;
  description: string;
}

// ---------------------------------------------------------------------------
// MAIN QUEST — Discover
// ---------------------------------------------------------------------------

export const mainQuest: QuestDef = {
  id: 'mainDiscover',
  name: 'discover',
  description: 'uncover what ended the world. find a way out.',
  type: 'main',
  steps: [
    {
      step: 0,
      description: 'survive. tend the fire. let the stranger in.',
      hint: 'stoke the fire. keep it burning. someone will come.',
      completionCondition: 'npc.stranger.met == true && flag.strangerAccepted == true',
    },
    {
      step: 1,
      description: 'build a village. gain the stranger\'s trust.',
      hint: 'build huts. gather resources. talk to the stranger.',
      completionCondition: 'npc.stranger.relationship >= 5 && building.hut.level >= 2',
    },
    {
      step: 2,
      description: 'learn about the old facility from the builder.',
      hint: 'the builder knows about an underground facility. build a workshop and talk to her.',
      completionCondition: 'flag.vesselBlueprintRevealed == true || (npc.builder.relationship >= 5 && quest.mainDiscover.step >= 2)',
    },
    {
      step: 3,
      description: 'find the bunker. explore what remains.',
      hint: 'explore the map. the bunker is out there. bring supplies.',
      completionCondition: 'flag.bunkerExplored == true',
    },
    {
      step: 4,
      description: 'build the vessel. defeat the raider king. leave.',
      hint: 'craft the vessel parts: hull, engine, navigation. defeat the raider king to clear the way.',
      completionCondition: 'flag.bossDefeated == true && flag.departureReady == true',
    },
  ],
  rewards: [
    {
      type: 'codex',
      id: 'lore_chapterComplete',
      description: 'the story of the dark room. complete.',
    },
    {
      type: 'flag',
      id: 'chapter01Complete',
      description: 'chapter 1 completed.',
    },
    {
      type: 'unlock',
      id: 'chapter02',
      description: 'the next chapter awaits.',
    },
  ],
};

// ---------------------------------------------------------------------------
// SIDE QUEST — The Hermit's Memories
// ---------------------------------------------------------------------------

export const hermitMemoryQuest: QuestDef = {
  id: 'hermitMemory',
  name: 'the hermit\'s memories',
  description: 'the hermit remembers fragments of the old world. help him piece them together.',
  type: 'side',
  steps: [
    {
      step: 0,
      description: 'find the hermit.',
      hint: 'explore the ruins on the map. he is waiting.',
      completionCondition: 'npc.hermit.met == true',
    },
    {
      step: 1,
      description: 'listen to the hermit\'s first memories.',
      hint: 'visit the hermit. sit with him. let him talk.',
      completionCondition: 'npc.hermit.relationship >= 3',
    },
    {
      step: 2,
      description: 'help the hermit remember the door.',
      hint: 'the hermit speaks of a door beneath the ruins. a bright room beyond it.',
      completionCondition: 'npc.hermit.relationship >= 6 && quest.hermitMemory.step >= 2',
    },
    {
      step: 3,
      description: 'follow the hermit to the hidden passage.',
      hint: 'the hermit is ready to show you. return to him when your relationship is strong enough.',
      completionCondition: 'flag.hermitPathRevealed == true',
    },
  ],
  rewards: [
    {
      type: 'codex',
      id: 'lore_hermitComplete',
      description: 'the hermit\'s full memory. a teacher who outlived his world.',
    },
    {
      type: 'flag',
      id: 'hermitPathRevealed',
      description: 'the hidden passage beneath the ruins is revealed.',
    },
    {
      type: 'unlock',
      id: 'hiddenExit_hermitPath',
      description: 'a hidden way out of this chapter.',
    },
  ],
};

// ---------------------------------------------------------------------------
// SIDE QUEST — The Scout's Lost Patrol
// ---------------------------------------------------------------------------

export const scoutPatrolQuest: QuestDef = {
  id: 'scoutPatrol',
  name: 'the lost patrol',
  description: 'the scout lost her patrol to a raider ambush. some may still be alive.',
  type: 'side',
  steps: [
    {
      step: 0,
      description: 'learn about the scout\'s patrol.',
      hint: 'talk to the scout. ask about her past.',
      completionCondition: 'npc.scout.relationship >= 2',
    },
    {
      step: 1,
      description: 'search the eastern ruins for the first survivor.',
      hint: 'explore the ruins to the east. look for signs of a camp.',
      completionCondition: 'flag.patrolSurvivor1Found == true',
    },
    {
      step: 2,
      description: 'search the northern woods for the second survivor.',
      hint: 'the northern forests are dangerous. bring weapons.',
      completionCondition: 'flag.patrolSurvivor2Found == true',
    },
    {
      step: 3,
      description: 'rescue the captured patrol member from the raider outpost.',
      hint: 'the third survivor is held in a raider camp. this will be a fight.',
      completionCondition: 'flag.patrolSurvivor3Rescued == true',
    },
    {
      step: 4,
      description: 'return to the scout with news of the patrol.',
      hint: 'tell the scout what you found. for better or worse.',
      completionCondition: 'flag.patrolQuestReported == true',
    },
  ],
  rewards: [
    {
      type: 'codex',
      id: 'people_lostPatrol',
      description: 'the story of the scout\'s patrol. loyalty in a broken world.',
    },
    {
      type: 'item',
      id: 'scoutBow',
      description: 'the scout\'s old bow. she gives it to you. "you earned this."',
    },
    {
      type: 'flag',
      id: 'patrolReunited',
      description: 'the surviving patrol members join the village.',
    },
  ],
};

// ---------------------------------------------------------------------------
// SIDE QUEST — The Builder's Secret Blueprint
// ---------------------------------------------------------------------------

export const builderBlueprintQuest: QuestDef = {
  id: 'builderBlueprint',
  name: 'the builder\'s blueprint',
  description: 'the builder carries old-world plans for something extraordinary. help her realize them.',
  type: 'side',
  steps: [
    {
      step: 0,
      description: 'gain the builder\'s trust.',
      hint: 'build. expand the village. show her it\'s worth investing in.',
      completionCondition: 'npc.builder.relationship >= 5',
    },
    {
      step: 1,
      description: 'learn about the vessel blueprints.',
      hint: 'the builder will show the blueprints when she trusts you.',
      completionCondition: 'flag.vesselBlueprintRevealed == true',
    },
    {
      step: 2,
      description: 'gather materials for the vessel.',
      hint: 'alloy, steel, iron. the vessel needs the best metals.',
      completionCondition: 'crafted.includes("vesselHull") && crafted.includes("vesselEngine")',
    },
    {
      step: 3,
      description: 'complete the vessel.',
      hint: 'the navigation module is the last piece.',
      completionCondition: 'crafted.includes("vesselNav")',
    },
  ],
  rewards: [
    {
      type: 'codex',
      id: 'lore_builderLegacy',
      description: 'the builder\'s legacy. she built a way out of the dark.',
    },
    {
      type: 'flag',
      id: 'vesselComplete',
      description: 'the vessel is complete and ready for departure.',
    },
  ],
};

// ---------------------------------------------------------------------------
// SIDE QUEST — Village Defense
// ---------------------------------------------------------------------------

export const villageDefenseQuest: QuestDef = {
  id: 'villageDefense',
  name: 'village defense',
  description: 'raiders threaten the village. prepare defenses. survive the assault.',
  type: 'side',
  steps: [
    {
      step: 0,
      description: 'learn of the raider threat.',
      hint: 'the cartographer or scout will warn of the raiders.',
      completionCondition: 'flag.raiderKingKnown == true',
    },
    {
      step: 1,
      description: 'prepare the village defenses. wave one: scouts.',
      hint: 'build traps on the approaches. arm the villagers. the first wave is a test.',
      completionCondition: 'flag.wave1Survived == true',
    },
    {
      step: 2,
      description: 'survive the second wave. the main force.',
      hint: 'more raiders. better armed. the armoury helps.',
      completionCondition: 'flag.wave2Survived == true',
    },
    {
      step: 3,
      description: 'face the raider king.',
      hint: 'the king comes last. defeat him and the army breaks.',
      completionCondition: 'flag.bossDefeated == true',
    },
  ],
  rewards: [
    {
      type: 'resource',
      id: 'alloy',
      amount: 15,
      description: 'the raider king\'s armor, melted down.',
    },
    {
      type: 'codex',
      id: 'lore_villageDefense',
      description: 'the village stood. the king fell.',
    },
    {
      type: 'flag',
      id: 'villageSurvived',
      description: 'the village survived the reckoning.',
    },
  ],
};

// ---------------------------------------------------------------------------
// All quests export
// ---------------------------------------------------------------------------

export const quests: QuestDef[] = [
  mainQuest,
  hermitMemoryQuest,
  scoutPatrolQuest,
  builderBlueprintQuest,
  villageDefenseQuest,
];
