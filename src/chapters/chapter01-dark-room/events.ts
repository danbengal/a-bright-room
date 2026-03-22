// Chapter 01 — Events
// atmospheric, arrival, crisis, milestone, and story events for A Dark Room

import { EventDef } from '@/types/chapter';

export const events: EventDef[] = [
  // =========================================================================
  // ATMOSPHERIC — Spark phase (fire/cold ambiance)
  // =========================================================================
  {
    id: 'atmos_fireCrackles',
    text: 'the fire crackles. the room is warm.',
    type: 'atmospheric',
    condition: 'phase == "spark" || phase == "hearth"',
    cooldown: 30,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_windHowls',
    text: 'the wind howls outside. the walls shake.',
    type: 'atmospheric',
    condition: 'phase == "spark"',
    cooldown: 25,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_embersFloat',
    text: 'embers float up from the fire. tiny orange stars, dying.',
    type: 'atmospheric',
    condition: 'environment.cold > 40',
    cooldown: 40,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_darkCorners',
    text: 'the corners of the room are dark. something could be there. probably nothing.',
    type: 'atmospheric',
    condition: 'phase == "spark" && stokeCount < 5',
    cooldown: 20,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_iceOnWindows',
    text: 'ice crystals bloom on the windows. beautiful and cold.',
    type: 'atmospheric',
    condition: 'environment.cold < 40',
    cooldown: 35,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_fireDying',
    text: 'the fire is dying. the cold creeps in from the edges.',
    type: 'atmospheric',
    condition: 'environment.cold < 25',
    cooldown: 15,
    repeatable: true,
    priority: 2,
  },
  {
    id: 'atmos_woodShifts',
    text: 'a log shifts in the fire. sparks spray across the hearth.',
    type: 'atmospheric',
    condition: 'environment.cold > 50',
    cooldown: 45,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_silenceHeavy',
    text: 'the silence is heavy. only the fire speaks.',
    type: 'atmospheric',
    condition: 'phase == "spark" && stokeCount >= 3 && stokeCount < 10',
    cooldown: 30,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_snowOnRoof',
    text: 'snow slides off the roof. a soft thump. then silence again.',
    type: 'atmospheric',
    condition: 'true',
    cooldown: 60,
    repeatable: true,
    priority: 0,
  },
  {
    id: 'atmos_breathVisible',
    text: 'breath hangs in the air like smoke. the cold is winning.',
    type: 'atmospheric',
    condition: 'environment.cold < 30',
    cooldown: 20,
    repeatable: true,
    priority: 2,
  },

  // =========================================================================
  // ATMOSPHERIC — Settlement phase
  // =========================================================================
  {
    id: 'atmos_villageSounds',
    text: 'sounds carry through the walls. hammering. voices. the village is alive.',
    type: 'atmospheric',
    condition: 'phase == "settlement" || phase == "questWeb"',
    cooldown: 50,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_smokeRises',
    text: 'smoke rises from the chimneys. grey threads against a grey sky.',
    type: 'atmospheric',
    condition: 'building.hut.level >= 3',
    cooldown: 55,
    repeatable: true,
    priority: 0,
  },
  {
    id: 'atmos_childLaughs',
    text: 'a child laughs somewhere in the village. the sound is startling. almost forgotten.',
    type: 'atmospheric',
    condition: 'building.hut.level >= 5',
    cooldown: 80,
    repeatable: true,
    priority: 1,
  },

  // =========================================================================
  // ATMOSPHERIC — Wild/Exploration phase
  // =========================================================================
  {
    id: 'atmos_wastelandWind',
    text: 'the wasteland stretches in every direction. the wind carries dust and old memories.',
    type: 'atmospheric',
    condition: 'phase == "wild" && explorationActive == true',
    cooldown: 40,
    repeatable: true,
    priority: 1,
  },
  {
    id: 'atmos_distantFire',
    text: 'a distant fire on the horizon. someone else is out here.',
    type: 'atmospheric',
    condition: 'phase == "wild" && explorationActive == true',
    cooldown: 60,
    repeatable: true,
    priority: 1,
  },

  // =========================================================================
  // ARRIVAL — Key NPCs
  // =========================================================================
  {
    id: 'arrival_stranger',
    text: 'a ragged stranger stumbles through the door. collapses by the fire. barely breathing.',
    type: 'arrival',
    condition: 'stokeCount >= 15 && !npc.stranger.met',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'strangerArrived', flagValue: true },
      { type: 'log', logText: 'the stranger shivers by the fire. alive. barely.' },
    ],
    priority: 10,
  },
  {
    id: 'arrival_strangerWakes',
    text: 'the stranger stirs. opens their eyes. looks at the fire, then at you. says nothing.',
    type: 'arrival',
    condition: 'flag.strangerArrived == true && ticks > 50 && !npc.stranger.met',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the stranger is awake.' },
    ],
    priority: 9,
  },
  {
    id: 'arrival_builder',
    text: 'a woman walks into the village. she carries tools — real tools, old-world make. she looks at the huts and frowns. "i can do better," she says.',
    type: 'arrival',
    condition: 'building.hut.level >= 2 && !npc.builder.met',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'builderArrived', flagValue: true },
      { type: 'log', logText: 'the builder has arrived. she looks at everything with calculating eyes.' },
    ],
    priority: 10,
  },
  {
    id: 'arrival_cartographer',
    text: 'a thin man appears at the trading post. he spreads a worn map on the counter. "this is what i know," he says. "there\'s more out there."',
    type: 'arrival',
    condition: 'building.tradingPost.level >= 1 && !npc.cartographer.met',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'cartographerArrived', flagValue: true },
      { type: 'log', logText: 'the cartographer has arrived. he knows the land.' },
    ],
    priority: 10,
  },
  {
    id: 'arrival_scout',
    text: 'a young woman jogs into the village from the tree line. she wears furs and carries a short bow. "saw your smoke," she says. "been watching a while."',
    type: 'arrival',
    condition: 'building.cart.level >= 1 && !npc.scout.met',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'scoutArrived', flagValue: true },
      { type: 'log', logText: 'the scout has arrived. she knows the wilderness.' },
    ],
    priority: 10,
  },

  // =========================================================================
  // RANDOM — Resource and trade events
  // =========================================================================
  {
    id: 'random_woodDrift',
    text: 'driftwood piles up against the door. the river must have thawed upstream.',
    type: 'random',
    condition: 'phase != "spark"',
    cooldown: 100,
    repeatable: true,
    choices: [
      {
        id: 'gather_drift',
        text: 'gather the wood.',
        effects: [{ type: 'resource', resourceId: 'wood', amount: 15 }],
        resultText: 'the wood is wet but it will dry. +15 wood.',
      },
    ],
    priority: 3,
  },
  {
    id: 'random_traderAppears',
    text: 'a trader appears from the south. bundled in rags, pulling a sled. they have goods.',
    type: 'random',
    condition: 'building.tradingPost.level >= 1',
    cooldown: 120,
    repeatable: true,
    choices: [
      {
        id: 'trade_fur',
        text: 'trade fur for iron.',
        effects: [
          { type: 'resource', resourceId: 'fur', amount: -20 },
          { type: 'resource', resourceId: 'iron', amount: 8 },
        ],
        resultText: 'the trader weighs the furs, nods. leaves iron on the counter.',
      },
      {
        id: 'trade_meat',
        text: 'trade meat for cloth.',
        effects: [
          { type: 'resource', resourceId: 'meat', amount: -15 },
          { type: 'resource', resourceId: 'cloth', amount: 10 },
        ],
        resultText: 'the trader takes the meat eagerly. leaves bolts of rough cloth.',
      },
      {
        id: 'trade_nothing',
        text: 'send them away.',
        effects: [],
        resultText: 'the trader shrugs and disappears into the snow.',
      },
    ],
    priority: 4,
  },
  {
    id: 'random_supplyCaravan',
    text: 'a supply caravan crests the hill. three sleds. guards with spears. they\'re looking to trade in bulk.',
    type: 'random',
    condition: 'building.tradingPost.level >= 2',
    cooldown: 200,
    repeatable: true,
    choices: [
      {
        id: 'caravan_buyIron',
        text: 'buy iron and coal.',
        effects: [
          { type: 'resource', resourceId: 'fur', amount: -30 },
          { type: 'resource', resourceId: 'leather', amount: -10 },
          { type: 'resource', resourceId: 'iron', amount: 20 },
          { type: 'resource', resourceId: 'coal', amount: 15 },
        ],
        resultText: 'heavy sacks of ore and coal pile up by the trading post.',
      },
      {
        id: 'caravan_buySteel',
        text: 'buy steel ingots.',
        effects: [
          { type: 'resource', resourceId: 'fur', amount: -40 },
          { type: 'resource', resourceId: 'curedMeat', amount: -20 },
          { type: 'resource', resourceId: 'steel', amount: 10 },
        ],
        resultText: 'steel ingots. heavy and cold. worth every pelt.',
      },
      {
        id: 'caravan_ignore',
        text: 'let them pass.',
        effects: [],
        resultText: 'the caravan moves on. their tracks fill with snow.',
      },
    ],
    priority: 5,
  },
  {
    id: 'random_herbPatch',
    text: 'a patch of green pushes through the snow near the village. bitter herbs, but useful.',
    type: 'random',
    condition: 'phase == "settlement" || phase == "questWeb" || phase == "wild"',
    cooldown: 80,
    repeatable: true,
    choices: [
      {
        id: 'gather_herbs',
        text: 'gather the herbs.',
        effects: [{ type: 'resource', resourceId: 'herb', amount: 8 }],
        resultText: 'the roots are tough. the leaves are bitter. they will help. +8 herbs.',
      },
    ],
    priority: 3,
  },
  {
    id: 'random_scavengerFind',
    text: 'a gatherer returns with something unusual. old-world metal, half-buried in the frost.',
    type: 'random',
    condition: 'workers.assigned.gatherer >= 1',
    cooldown: 150,
    repeatable: true,
    choices: [
      {
        id: 'keep_metal',
        text: 'take the metal.',
        effects: [{ type: 'resource', resourceId: 'iron', amount: 5 }],
        resultText: 'the metal is pitted but usable. +5 iron.',
      },
      {
        id: 'melt_metal',
        text: 'melt it down.',
        effects: [{ type: 'resource', resourceId: 'steel', amount: 2 }],
        resultText: 'the old-world metal melts clean. good steel. +2 steel.',
      },
    ],
    priority: 3,
  },

  // =========================================================================
  // CRISIS — Threats and challenges
  // =========================================================================
  {
    id: 'crisis_raiderAttack',
    text: 'torches in the tree line. raiders. they come howling out of the dark.',
    type: 'crisis',
    condition: 'phase == "settlement" || phase == "questWeb" || phase == "wild"',
    cooldown: 180,
    repeatable: true,
    choices: [
      {
        id: 'fight_raiders',
        text: 'defend the village.',
        effects: [
          { type: 'resource', resourceId: 'fur', amount: -5 },
          { type: 'resource', resourceId: 'wood', amount: -10 },
          { type: 'flag', flagId: 'raidersRepelled', flagValue: true },
        ],
        resultText: 'the raiders break against the defenses. some buildings are damaged. some people are hurt. but they\'re gone.',
      },
      {
        id: 'bribe_raiders',
        text: 'offer them supplies.',
        effects: [
          { type: 'resource', resourceId: 'fur', amount: -15 },
          { type: 'resource', resourceId: 'meat', amount: -10 },
          { type: 'resource', resourceId: 'wood', amount: -20 },
        ],
        resultText: 'they take the supplies. spit on the ground. leave. they will be back.',
      },
    ],
    priority: 8,
  },
  {
    id: 'crisis_blizzard',
    text: 'the sky goes white. the temperature drops. a blizzard descends on the village.',
    type: 'crisis',
    condition: 'phase != "spark"',
    cooldown: 200,
    repeatable: true,
    effects: [
      { type: 'resource', resourceId: 'wood', amount: -15 },
    ],
    choices: [
      {
        id: 'hunker_blizzard',
        text: 'burn extra wood. keep everyone warm.',
        effects: [
          { type: 'resource', resourceId: 'wood', amount: -20 },
          { type: 'log', logText: 'the blizzard passes. everyone survives. the wood stores are depleted.' },
        ],
        resultText: 'the blizzard howls for hours. the fires burn high. everyone survives.',
      },
      {
        id: 'ration_blizzard',
        text: 'conserve wood. endure the cold.',
        effects: [
          { type: 'resource', resourceId: 'wood', amount: -5 },
          { type: 'log', logText: 'the blizzard passes. some are frostbitten. wood is saved.' },
        ],
        resultText: 'the cold bites deep. some lose fingers. toes. but the wood stores hold.',
      },
    ],
    priority: 9,
  },
  {
    id: 'crisis_foodShortage',
    text: 'the traps are empty. the stores are low. hungry eyes around the fire.',
    type: 'crisis',
    condition: 'resource.meat < 5 && resource.curedMeat < 5 && building.hut.level >= 3',
    cooldown: 100,
    repeatable: true,
    choices: [
      {
        id: 'ration_food',
        text: 'ration what remains.',
        effects: [
          { type: 'log', logText: 'rations are tight. morale is low. but no one starves.' },
        ],
        resultText: 'half portions. no one complains. the hunger shows in their eyes.',
      },
      {
        id: 'hunt_emergency',
        text: 'send hunters into the deep woods.',
        effects: [
          { type: 'resource', resourceId: 'meat', amount: 15 },
          { type: 'resource', resourceId: 'fur', amount: 5 },
          { type: 'log', logText: 'the hunters return with game. enough for now.' },
        ],
        resultText: 'the hunters return at dawn. bloody but successful. meat enough for days.',
      },
    ],
    priority: 7,
  },
  {
    id: 'crisis_fireGoesOut',
    text: 'the fire goes out. the darkness is total. the cold rushes in.',
    type: 'crisis',
    condition: 'environment.cold <= 5',
    cooldown: 30,
    repeatable: true,
    effects: [
      { type: 'log', logText: 'the fire has gone out. stoke it. now.' },
    ],
    priority: 10,
  },
  {
    id: 'crisis_sickness',
    text: 'sickness spreads through the village. fever and coughing in every hut.',
    type: 'crisis',
    condition: 'building.hut.level >= 4 && resource.herb < 3',
    cooldown: 250,
    repeatable: true,
    choices: [
      {
        id: 'treat_sick',
        text: 'use herbs to treat the sick.',
        effects: [
          { type: 'resource', resourceId: 'herb', amount: -5 },
          { type: 'log', logText: 'the sick recover slowly. the herbs help.' },
        ],
        resultText: 'bitter tea and poultices. the fever breaks. most recover.',
      },
      {
        id: 'quarantine',
        text: 'quarantine the sick.',
        effects: [
          { type: 'log', logText: 'the sick are isolated. some recover. some do not.' },
        ],
        resultText: 'the sick hut stands alone at the edge of the village. the sounds from inside are hard to hear.',
      },
    ],
    priority: 7,
  },
  {
    id: 'crisis_wolfPack',
    text: 'wolves circle the village at night. yellow eyes in the dark. the livestock are restless.',
    type: 'crisis',
    condition: 'building.trap.level >= 2 && phase != "spark"',
    cooldown: 150,
    repeatable: true,
    choices: [
      {
        id: 'hunt_wolves',
        text: 'drive them off.',
        effects: [
          { type: 'resource', resourceId: 'fur', amount: 8 },
          { type: 'resource', resourceId: 'meat', amount: 5 },
          { type: 'resource', resourceId: 'teeth', amount: 3 },
        ],
        resultText: 'the wolves fight back but they\'re outnumbered. good pelts. sharp teeth.',
      },
      {
        id: 'ignore_wolves',
        text: 'stay inside. wait them out.',
        effects: [
          { type: 'resource', resourceId: 'meat', amount: -8 },
          { type: 'log', logText: 'the wolves raid the traps. meat is lost.' },
        ],
        resultText: 'the wolves take what they want and vanish at dawn.',
      },
    ],
    priority: 6,
  },

  // =========================================================================
  // MILESTONE — Story progression
  // =========================================================================
  {
    id: 'milestone_firstWarmth',
    text: 'the fire catches. warmth spreads through the room. fingers thaw. toes tingle. the dark retreats.',
    type: 'milestone',
    condition: 'stokeCount == 3',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the room is warming. the fire holds.' },
    ],
    priority: 5,
  },
  {
    id: 'milestone_firstTrap',
    text: 'the first trap is set. a simple snare of wood and cord. something will come.',
    type: 'milestone',
    condition: 'building.trap.level >= 1',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'a trap is set in the snow.' },
    ],
    priority: 5,
  },
  {
    id: 'milestone_firstHut',
    text: 'the hut stands. rough-hewn and leaning, but it stands. there is room for another now.',
    type: 'milestone',
    condition: 'building.hut.level >= 1',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the first hut is built.' },
    ],
    priority: 5,
  },
  {
    id: 'milestone_villageForming',
    text: 'three huts. five. smoke from each chimney. people gather around shared fires. a village is forming.',
    type: 'milestone',
    condition: 'building.hut.level >= 5',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the village grows.' },
      { type: 'codex', codexId: 'lore_village' },
    ],
    priority: 5,
  },
  {
    id: 'milestone_ironAge',
    text: 'the first iron comes from the earth. cold and heavy in the hand. everything changes with iron.',
    type: 'milestone',
    condition: 'resource.iron > 0',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'iron. the world shifts.' },
      { type: 'codex', codexId: 'lore_ironAge' },
    ],
    priority: 6,
  },
  {
    id: 'milestone_steelForged',
    text: 'the steelworks roars. iron and coal become something stronger. the old world built everything from this.',
    type: 'milestone',
    condition: 'resource.steel > 0',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'steel. the village has teeth now.' },
      { type: 'codex', codexId: 'lore_steelAge' },
    ],
    priority: 6,
  },
  {
    id: 'milestone_compassCrafted',
    text: 'the compass needle spins, then settles. it points away from the village. into the unknown.',
    type: 'milestone',
    condition: 'crafted.includes("compass")',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the compass is ready. the wasteland waits.' },
      { type: 'codex', codexId: 'lore_compass' },
    ],
    priority: 6,
  },
  {
    id: 'milestone_mapExplored50',
    text: 'half the map is filled in. the cartographer traces the lines with his finger. "still more," he says.',
    type: 'milestone',
    condition: 'flag.mapExplored50 == true',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the map grows. the wasteland takes shape.' },
    ],
    priority: 5,
  },
  {
    id: 'milestone_mapExplored70',
    text: 'the map is nearly complete. at the edges, the cartographer has drawn question marks. and one word: "danger."',
    type: 'milestone',
    condition: 'flag.mapExplored70 == true',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'log', logText: 'the map is nearly complete. something waits at the edge.' },
      { type: 'flag', flagId: 'mapExplored70', flagValue: true },
    ],
    priority: 7,
  },

  // =========================================================================
  // STORY — Quest and narrative events
  // =========================================================================
  {
    id: 'story_strangerSpeaks',
    text: 'the stranger speaks for the first time. "the world ended," they say. "but not all at once. slowly. like a fire going out."',
    type: 'story',
    condition: 'npc.stranger.met == true && npc.stranger.relationship >= 2',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'codex', codexId: 'lore_theEnd' },
      { type: 'log', logText: 'the stranger remembers how it ended.' },
    ],
    priority: 7,
  },
  {
    id: 'story_builderPlans',
    text: 'the builder unrolls old blueprints on the table. "there was a facility," she says. "underground. it might still work."',
    type: 'story',
    condition: 'npc.builder.met == true && npc.builder.relationship >= 3 && quest.mainDiscover.step >= 1',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'quest', questId: 'mainDiscover', questStep: 2 },
      { type: 'codex', codexId: 'lore_facility' },
      { type: 'log', logText: 'the builder knows about an underground facility.' },
    ],
    priority: 8,
  },
  {
    id: 'story_cartographerWarning',
    text: 'the cartographer pulls you aside. "there\'s a force out there," he says. "organized. armed. they call their leader king."',
    type: 'story',
    condition: 'npc.cartographer.met == true && npc.cartographer.relationship >= 3',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'codex', codexId: 'lore_raiderKing' },
      { type: 'log', logText: 'the cartographer warns of the raider king.' },
      { type: 'flag', flagId: 'raiderKingKnown', flagValue: true },
    ],
    priority: 8,
  },
  {
    id: 'story_hermitFound',
    text: 'in the ruins, a figure sits among rubble. old. still. eyes like deep water. "you found me," the hermit says. "took you long enough."',
    type: 'story',
    condition: 'flag.hermitRuinsDiscovered == true && !npc.hermit.met',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'hermitMet', flagValue: true },
      { type: 'log', logText: 'the hermit watches from the ruins. he has been here a long time.' },
      { type: 'codex', codexId: 'people_hermit' },
    ],
    priority: 9,
  },
  {
    id: 'story_vesselDiscovery',
    text: 'deep in the bunker, behind a sealed door, something gleams. a vessel. old-world design. broken but maybe not beyond repair.',
    type: 'story',
    condition: 'quest.mainDiscover.step >= 3 && flag.bunkerExplored == true',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'quest', questId: 'mainDiscover', questStep: 4 },
      { type: 'flag', flagId: 'vesselDiscovered', flagValue: true },
      { type: 'codex', codexId: 'lore_vessel' },
      { type: 'log', logText: 'a vessel. a way out. if it can be rebuilt.' },
    ],
    priority: 10,
  },
  {
    id: 'story_raiderKingMessage',
    text: 'an arrow thuds into the gate. a message is tied to it. "surrender your village. your people. your fire. — the king"',
    type: 'story',
    condition: 'flag.raiderKingKnown == true && phase == "reckoning"',
    cooldown: 0,
    repeatable: false,
    choices: [
      {
        id: 'defy_king',
        text: 'burn the message.',
        effects: [
          { type: 'flag', flagId: 'defiedKing', flagValue: true },
          { type: 'log', logText: 'the message burns. the answer is clear.' },
        ],
        resultText: 'the paper curls and blackens in the fire. the village watches. they understand.',
      },
      {
        id: 'read_terms',
        text: 'read the full message.',
        effects: [
          { type: 'codex', codexId: 'lore_raiderKingTerms' },
          { type: 'log', logText: 'the king\'s terms are read. they are not generous.' },
        ],
        resultText: '"all resources. all workers. the fire. — or i come and take them." the handwriting is precise. educated.',
      },
    ],
    priority: 9,
  },
  {
    id: 'story_bossApproach',
    text: 'drums in the distance. the scout runs in, breathless. "they\'re coming. all of them. the king leads."',
    type: 'story',
    condition: 'flag.defiedKing == true && phase == "reckoning"',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'bossApproaching', flagValue: true },
      { type: 'log', logText: 'the raider king approaches. prepare.' },
    ],
    priority: 10,
  },
  {
    id: 'story_bossDefeated',
    text: 'the raider king falls. silence spreads across the battlefield. then, slowly, cheering. the village survived.',
    type: 'story',
    condition: 'flag.bossDefeated == true',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'codex', codexId: 'lore_kingFalls' },
      { type: 'log', logText: 'the raider king is dead. the wasteland is quieter now.' },
    ],
    priority: 10,
  },
  {
    id: 'story_departureReady',
    text: 'the vessel hums in the cold air. the navigator module glows. coordinates locked. it is time.',
    type: 'story',
    condition: 'flag.bossDefeated == true && crafted.includes("vesselHull") && crafted.includes("vesselEngine") && crafted.includes("vesselNav")',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'departureReady', flagValue: true },
      { type: 'log', logText: 'the vessel is ready. the way out is open.' },
    ],
    priority: 10,
  },

  // =========================================================================
  // VILLAGE DEFENSE — Raider waves
  // =========================================================================
  {
    id: 'defense_wave1',
    text: 'raiders at the perimeter. a small group — scouts. they test the defenses. your traps catch two. the rest scatter into the trees.',
    type: 'crisis',
    condition: 'flag.bossApproaching == true && !flag.wave1Survived',
    cooldown: 0,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'wave1Survived', flagValue: true },
      { type: 'log', logText: 'the first wave is beaten back. but more will come.' },
    ],
    priority: 9,
  },
  {
    id: 'defense_wave2',
    text: 'the second wave hits harder. torches and iron. the lodge wall cracks. the archers hold the line. bodies in the snow when it is over.',
    type: 'crisis',
    condition: 'flag.wave1Survived == true && !flag.wave2Survived',
    cooldown: 60,
    repeatable: false,
    effects: [
      { type: 'flag', flagId: 'wave2Survived', flagValue: true },
      { type: 'log', logText: 'the second wave breaks. the village holds. but the king has not come yet.' },
    ],
    priority: 9,
  },

  // =========================================================================
  // RANDOM — Exploration discoveries
  // =========================================================================
  {
    id: 'random_oldWorldCache',
    text: 'buried in the snow, a metal box. sealed. old-world markings on the lid.',
    type: 'random',
    condition: 'explorationActive == true',
    cooldown: 120,
    repeatable: true,
    choices: [
      {
        id: 'open_cache',
        text: 'pry it open.',
        effects: [
          { type: 'resource', resourceId: 'iron', amount: 8 },
          { type: 'resource', resourceId: 'cloth', amount: 5 },
        ],
        resultText: 'inside: iron fittings and a bolt of preserved cloth. the old world was generous.',
      },
    ],
    priority: 4,
  },
  {
    id: 'random_wandererTale',
    text: 'a lone wanderer crosses your path. gaunt and hollow-eyed. they speak of a city to the east. "don\'t go there," they say.',
    type: 'random',
    condition: 'explorationActive == true',
    cooldown: 150,
    repeatable: true,
    choices: [
      {
        id: 'ask_more',
        text: 'ask about the city.',
        effects: [
          { type: 'codex', codexId: 'lore_easternCity' },
          { type: 'log', logText: 'the wanderer speaks of a city. towers of glass, now shattered.' },
        ],
        resultText: '"glass towers," they say. "all broken now. and things live inside. hungry things."',
      },
      {
        id: 'share_food',
        text: 'share food with them.',
        effects: [
          { type: 'resource', resourceId: 'curedMeat', amount: -3 },
          { type: 'log', logText: 'the wanderer eats. smiles. disappears into the snow.' },
        ],
        resultText: 'they eat slowly. tears on their cheeks. then they walk on.',
      },
    ],
    priority: 3,
  },
  {
    id: 'random_strangeLight',
    text: 'a light in the sky at night. not stars. not fire. something moving. something old.',
    type: 'random',
    condition: 'phase == "wild" || phase == "reckoning"',
    cooldown: 200,
    repeatable: true,
    effects: [
      { type: 'codex', codexId: 'lore_skyLight' },
      { type: 'log', logText: 'a light moves across the sky. no one speaks.' },
    ],
    priority: 2,
  },
];
