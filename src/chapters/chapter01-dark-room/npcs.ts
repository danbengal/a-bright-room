// Chapter 01 — NPCs
// five named NPCs with branching dialogue trees
//
// DIALOGUE TREE RULES:
// - findAvailableDialogueNode returns the FIRST node whose condition is met
// - root nodes (entry points) are ordered MOST specific → LEAST specific
// - every root node MUST have a condition so the system can gate properly
// - child nodes (reached via nextNodeId) also carry conditions to prevent
//   accidental root selection

import { NPCDef } from '@/types/chapter';

export const npcs: NPCDef[] = [
  // =========================================================================
  // THE STRANGER
  // arrives in Phase 2, mysterious first worker
  // objective: accept the stranger, build relationship to unlock memories
  //            about the facility and the parallax array
  // =========================================================================
  {
    id: 'stranger',
    name: 'the stranger',
    title: 'a ragged figure',
    description: 'thin and scarred. they say little. their eyes hold something — memory, maybe. or just the fire reflected back.',
    arrivalCondition: { type: 'event', target: 'arrival_stranger' },
    workerRole: 'gatherer',
    questId: 'mainDiscover',
    dialogueTree: [
      // ---------------------------------------------------------------
      // ROOT 1 — late-game revelation (rel >= 8, quest step >= 2)
      // ---------------------------------------------------------------
      {
        id: 'stranger_revelation',
        text: 'the stranger is waiting for you. there is something different in their posture. straighter. steadier. "i remember," they say. "my name. what i did. all of it."',
        condition: 'npc.stranger.relationship >= 8 && quest.mainDiscover.step >= 2 && flag.strangerRevealed != true',
        options: [
          {
            id: 'tell_me',
            text: 'tell me.',
            nextNodeId: 'stranger_realName',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 2 }],
          },
          {
            id: 'only_if_ready',
            text: 'only if you\'re ready.',
            nextNodeId: 'stranger_realName',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 3 }],
          },
        ],
      },
      {
        id: 'stranger_realName',
        text: '"i was a technician. at the facility. we operated the parallax array — the machine that listens between dimensions." they take a slow breath. "my name is maren. i was the one who turned it on."',
        condition: 'false',
        options: [
          {
            id: 'ask_parallax',
            text: 'the parallax array?',
            nextNodeId: 'stranger_parallax',
          },
          {
            id: 'ask_turned_on',
            text: 'you caused this?',
            nextNodeId: 'stranger_caused',
          },
        ],
        effects: [
          { type: 'flag', flagId: 'strangerRevealed', flagValue: true },
          { type: 'codex', codexId: 'lore_parallaxArray' },
        ],
      },
      {
        id: 'stranger_parallax',
        text: '"it opens a seam. between here and — somewhere else. the bright room. the place the hermit sees." they stare at nothing. "when we turned it on, the dimensions bled together. the cold came through. the world froze around the wound."',
        condition: 'false',
        options: [
          {
            id: 'can_we_close',
            text: 'can we close it?',
            nextNodeId: 'stranger_closeIt',
          },
        ],
        effects: [{ type: 'codex', codexId: 'lore_dimensionalWound' }],
      },
      {
        id: 'stranger_caused',
        text: '"yes." no hesitation. no excuses. "i didn\'t know what would happen. none of us did. the readings said safe. the formulas said possible." they hold up their scarred hands. "these are from the machine. the last thing i remember before waking up in the snow."',
        condition: 'false',
        options: [
          {
            id: 'not_your_fault',
            text: 'you didn\'t know.',
            nextNodeId: 'stranger_closeIt',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_closeIt',
        text: '"close it. or go through it. those are the only choices." they look at the village. "the builder\'s vessel — it\'s based on the array\'s design. she doesn\'t know that. but i do." they meet your eyes. "we\'re not building an escape. we\'re building a key."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'vesselIsPalKey', flagValue: true },
          { type: 'log', logText: 'the stranger reveals the truth. the vessel is a key to the parallax.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 2 — post-revelation check-in (rel >= 8, already revealed)
      // ---------------------------------------------------------------
      {
        id: 'stranger_postReveal',
        text: 'maren is standing by the fire. they look at you differently now — openly. no more hiding. "it feels strange," they say. "having a name again."',
        condition: 'npc.stranger.relationship >= 8 && flag.strangerRevealed == true',
        options: [
          {
            id: 'suits_you',
            text: 'maren suits you.',
            nextNodeId: 'stranger_postRevealEnd',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'ask_vessel_more',
            text: 'tell me more about the vessel.',
            nextNodeId: 'stranger_vesselMore',
          },
        ],
      },
      {
        id: 'stranger_postRevealEnd',
        text: '"maren." they say it like tasting food after a long fast. "the person i was. the person i might be again." they stare into the fire. "thank you. for waiting. for not giving up on me."',
        condition: 'false',
        options: [],
      },
      {
        id: 'stranger_vesselMore',
        text: '"the array creates a resonance — a frequency that thins the boundary. the vessel is tuned to ride that frequency. not a ship. a needle. threading through the seam between dimensions." they trace a shape in the air. "the hermit understands the theory. the builder has the hands. i have the calibration. together we can make it work."',
        condition: 'false',
        options: [],
        effects: [{ type: 'codex', codexId: 'lore_vesselCalibration' }],
      },

      // ---------------------------------------------------------------
      // ROOT 3 — hope and the wasteland (rel >= 5, wild phase)
      // ---------------------------------------------------------------
      {
        id: 'stranger_hope',
        text: 'the stranger is watching the horizon. the wind carries ice. "do you think there\'s something out there worth finding?" they ask. "or are we just running from this?"',
        condition: 'npc.stranger.relationship >= 5 && phase == "wild" && flag.strangerHope != true',
        options: [
          {
            id: 'worth_finding',
            text: 'there has to be.',
            nextNodeId: 'stranger_hopeMaybe',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'running_ok',
            text: 'running is surviving.',
            nextNodeId: 'stranger_hopeRunning',
          },
          {
            id: 'both',
            text: 'maybe both.',
            nextNodeId: 'stranger_hopeBoth',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_hopeMaybe',
        text: '"has to be." they repeat it like a prayer. "the hermit talks about doors. the builder talks about vessels. everyone is looking for a way through." they press their forehead against the cold glass. "i just want to remember who i was on the other side."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'strangerHope', flagValue: true }],
      },
      {
        id: 'stranger_hopeRunning',
        text: '"surviving." they taste the word. "i\'ve been surviving so long i forgot there was anything else." they watch the snow. "the scout says survival is enough. maybe she\'s right. maybe that\'s all there is."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'strangerHope', flagValue: true }],
      },
      {
        id: 'stranger_hopeBoth',
        text: '"both." they nod. "running toward something and away from something else. the same motion." they look at you. "you do that. you run forward. it\'s why people follow you."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'strangerHope', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 4 — deeper memories / facility (rel >= 5, quest step >= 1)
      // ---------------------------------------------------------------
      {
        id: 'stranger_deep',
        text: 'the stranger catches your arm as you pass. "i remember something," they say. "before the cold. there was a facility. underground. they were building something."',
        condition: 'npc.stranger.relationship >= 5 && quest.mainDiscover.step >= 1 && flag.strangerDeepDone != true',
        options: [
          {
            id: 'ask_facility',
            text: 'what kind of facility?',
            nextNodeId: 'stranger_facility',
          },
          {
            id: 'ask_building',
            text: 'building what?',
            nextNodeId: 'stranger_building',
          },
        ],
      },
      {
        id: 'stranger_facility',
        text: '"deep. metal walls. clean air. they said it was for research." their eyes go distant. "i worked there. before. i think i worked there."',
        condition: 'false',
        options: [
          {
            id: 'press_memory',
            text: 'try to remember.',
            nextNodeId: 'stranger_remember',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
        effects: [{ type: 'codex', codexId: 'lore_undergroundFacility' }],
      },
      {
        id: 'stranger_building',
        text: '"a way out. that\'s what they called it. i don\'t know what it means." they rub their temples. "the memories come in pieces."',
        condition: 'false',
        options: [
          {
            id: 'press_memory2',
            text: 'we\'ll find it together.',
            nextNodeId: 'stranger_remember',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 2 }],
          },
        ],
      },
      {
        id: 'stranger_remember',
        text: '"yes," they say. "yes. maybe the builder would know more. she has the old blueprints."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'strangerDeepDone', flagValue: true },
          { type: 'quest', questId: 'mainDiscover', questStep: 2 },
          { type: 'log', logText: 'the stranger remembers fragments. the builder may know more.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 5 — nightmare / the signal (rel >= 4, ticks > 500)
      // ---------------------------------------------------------------
      {
        id: 'stranger_nightmare',
        text: 'the stranger is awake. shaking. the fire has burned low. "the dream again," they say. their voice is raw. "the signal. the white room. i can hear it when i sleep."',
        condition: 'npc.stranger.relationship >= 4 && ticks > 500 && flag.strangerNightmare != true',
        options: [
          {
            id: 'ask_signal',
            text: 'what signal?',
            nextNodeId: 'stranger_signal',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'ask_white_room',
            text: 'the white room?',
            nextNodeId: 'stranger_whiteRoom',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'comfort_nightmare',
            text: 'you\'re safe. it was a dream.',
            nextNodeId: 'stranger_safe',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 2 }],
          },
        ],
      },
      {
        id: 'stranger_signal',
        text: '"a sound. not a sound. a pull. like something beneath everything is calling." they press their palms against their temples. "the facility had receivers. we were listening for it. i think we found it."',
        condition: 'false',
        options: [
          {
            id: 'found_what',
            text: 'found what?',
            nextNodeId: 'stranger_foundIt',
          },
        ],
        effects: [
          { type: 'flag', flagId: 'strangerNightmare', flagValue: true },
          { type: 'codex', codexId: 'lore_theSignal' },
        ],
      },
      {
        id: 'stranger_whiteRoom',
        text: '"bright. impossibly bright. not sunlight. something older." their eyes are wide. "there were people. or shapes like people. they were waiting. they\'ve been waiting a long time."',
        condition: 'false',
        options: [
          {
            id: 'waiting_for',
            text: 'waiting for what?',
            nextNodeId: 'stranger_foundIt',
          },
        ],
        effects: [
          { type: 'flag', flagId: 'strangerNightmare', flagValue: true },
          { type: 'codex', codexId: 'lore_brightRoomVision' },
        ],
      },
      {
        id: 'stranger_safe',
        text: 'they lean against the wall. breathing slows. "safe," they repeat. "i don\'t know what safe means. but this — this fire. this room. it\'s the closest thing." they close their eyes. "the bright room is real. i know it is."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'strangerNightmare', flagValue: true },
          { type: 'flag', flagId: 'strangerMentionedBrightRoom', flagValue: true },
        ],
      },
      {
        id: 'stranger_foundIt',
        text: '"us," they whisper. "waiting for us. for anyone who could hear." they pull a blanket around their shoulders. "the cold started after we turned the receivers on. i don\'t think that\'s a coincidence."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'strangerMentionedBrightRoom', flagValue: true },
          { type: 'log', logText: 'the stranger connects the signal to the cold. the facility caused this.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 6 — memory fragments (rel >= 3, settlement phase)
      // ---------------------------------------------------------------
      {
        id: 'stranger_memory1',
        text: 'the stranger is sitting alone. staring at their hands. "i remembered something today," they say quietly. "my hands. they used to do something. not gathering. something precise."',
        condition: 'flag.strangerAccepted == true && npc.stranger.relationship >= 3 && phase == "settlement" && flag.strangerMemory1 != true',
        options: [
          {
            id: 'ask_precise',
            text: 'like what?',
            nextNodeId: 'stranger_preciseWork',
          },
          {
            id: 'give_time',
            text: 'it will come back.',
            nextNodeId: 'stranger_patience',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_preciseWork',
        text: '"instruments. dials. readings." they flex their fingers. "i think i measured things. temperatures. pressures. in a room with clean air and humming machines." the memory fades. "it\'s gone."',
        condition: 'false',
        options: [
          {
            id: 'end_precise',
            text: 'it\'ll come back. give it time.',
            nextNodeId: 'stranger_silence',
            effects: [
              { type: 'flag', flagId: 'strangerMemory1', flagValue: true },
              { type: 'codex', codexId: 'lore_strangerPast' },
            ],
          },
        ],
      },
      {
        id: 'stranger_patience',
        text: '"patience." they almost smile. "that\'s a word from before. no one has patience out here. just survival." they look at the fire. "but you — you have patience."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'strangerMemory1', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 7 — settlement reaction (rel >= 3, settlement, accepted)
      // ---------------------------------------------------------------
      {
        id: 'stranger_settlement',
        text: 'the stranger watches the villagers move between buildings. "never thought i\'d see this again," they say. "people building. planning. like it matters."',
        condition: 'flag.strangerAccepted == true && phase == "settlement" && npc.stranger.relationship >= 3 && flag.strangerSettlement != true',
        options: [
          {
            id: 'it_matters',
            text: 'it does matter.',
            nextNodeId: 'stranger_doesMatter',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'stranger_doubt',
            text: 'you don\'t think so?',
            nextNodeId: 'stranger_dontKnow',
          },
        ],
      },
      {
        id: 'stranger_doesMatter',
        text: '"i want to believe that." they watch smoke rise from the workshop chimney. "the builder says we could have something permanent here. i don\'t know what permanent means anymore."',
        condition: 'false',
        options: [
          {
            id: 'end_doesMatter',
            text: 'we\'ll find out together.',
            nextNodeId: 'stranger_silence',
            effects: [{ type: 'flag', flagId: 'strangerSettlement', flagValue: true }],
          },
        ],
      },
      {
        id: 'stranger_dontKnow',
        text: '"i\'ve seen places like this before. on the road. they grow. people come." their voice drops. "then something comes for them. raiders. the cold. something worse."',
        condition: 'false',
        options: [
          {
            id: 'we_are_different',
            text: 'we\'re different.',
            nextNodeId: 'stranger_silence',
            effects: [
              { type: 'relationship', npcId: 'stranger', amount: 1 },
              { type: 'flag', flagId: 'strangerSettlement', flagValue: true },
            ],
          },
          {
            id: 'maybe_right',
            text: 'maybe. but we try.',
            nextNodeId: 'stranger_silence',
            effects: [
              { type: 'relationship', npcId: 'stranger', amount: 1 },
              { type: 'flag', flagId: 'strangerSettlement', flagValue: true },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 8 — check-in (strangerAccepted, rel 2-4)
      // ---------------------------------------------------------------
      {
        id: 'stranger_checkIn',
        text: 'the stranger is sorting gathered wood. they glance up as you approach.',
        condition: 'flag.strangerAccepted == true && npc.stranger.relationship >= 2 && npc.stranger.relationship < 5',
        options: [
          {
            id: 'ask_village',
            text: 'how are things?',
            nextNodeId: 'stranger_village',
          },
          {
            id: 'ask_seen',
            text: 'seen anything out there?',
            nextNodeId: 'stranger_seen',
          },
          {
            id: 'share_iron_stranger',
            text: 'here. take some iron for tools.',
            nextNodeId: 'stranger_ironGift',
            effects: [
              { type: 'resource', resourceId: 'iron', amount: -5 },
              { type: 'relationship', npcId: 'stranger', amount: 2 },
            ],
            condition: 'resource.iron >= 5',
          },
        ],
      },
      {
        id: 'stranger_village',
        text: '"it\'s something," they say. "walls. warmth. people." they turn a stick in their hands. "i forgot what that felt like. being around people who aren\'t trying to kill you."',
        condition: 'false',
        options: [
          {
            id: 'end_village',
            text: 'it\'s getting better.',
            nextNodeId: 'stranger_silence',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_seen',
        text: '"tracks in the snow. wolf, mostly. some human. heading north." they pause. "i steer clear. bring back what i find. that\'s enough."',
        condition: 'false',
        options: [
          {
            id: 'stranger_careful',
            text: 'be careful.',
            nextNodeId: 'stranger_silence',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_ironGift',
        text: 'they turn the iron over in their scarred hands. "good weight. clean ore." they look up. "i can make proper hooks for the gathering baskets. double our yield." a pause. "thank you."',
        condition: 'false',
        options: [],
        effects: [{ type: 'log', logText: 'the stranger fashions gathering hooks from the iron.' }],
      },

      // ---------------------------------------------------------------
      // ROOT 9 — offer to work (rel >= 2, not yet accepted)
      // ---------------------------------------------------------------
      {
        id: 'stranger_offerWork',
        text: 'the stranger stands near the fire. steadier now. less hollow. "i can work," they say. "i\'m not useless. not yet."',
        condition: 'npc.stranger.relationship >= 2 && flag.strangerAccepted != true',
        options: [
          {
            id: 'accept_stranger',
            text: 'good. we need help.',
            nextNodeId: 'stranger_accepted',
            effects: [
              { type: 'relationship', npcId: 'stranger', amount: 2 },
              { type: 'flag', flagId: 'strangerAccepted', flagValue: true },
            ],
          },
          {
            id: 'what_can_you_do',
            text: 'what can you do?',
            nextNodeId: 'stranger_whatCanDo',
          },
        ],
      },
      {
        id: 'stranger_whatCanDo',
        text: '"i remember how to gather. how to find things." they look at their scarred hands. "roots under snow. dry wood in wet forests. water where there shouldn\'t be any." they flex their fingers. "the land still talks to me. i just have to listen."',
        condition: 'false',
        options: [
          {
            id: 'accept_after',
            text: 'that\'s exactly what we need.',
            nextNodeId: 'stranger_accepted',
            effects: [
              { type: 'relationship', npcId: 'stranger', amount: 2 },
              { type: 'flag', flagId: 'strangerAccepted', flagValue: true },
            ],
          },
        ],
      },
      {
        id: 'stranger_accepted',
        text: 'the stranger nods. stands. "show me what needs doing."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'quest', questId: 'mainDiscover', questStep: 1 },
          { type: 'log', logText: 'the stranger joins the village.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 10 — initial greeting (rel < 2, default)
      // ---------------------------------------------------------------
      {
        id: 'stranger_greeting',
        text: 'the stranger sits by the fire. the flames move in their eyes.',
        condition: 'npc.stranger.relationship < 2',
        options: [
          {
            id: 'ask_name',
            text: 'who are you?',
            nextNodeId: 'stranger_noName',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'ask_cold',
            text: 'how long were you out there?',
            nextNodeId: 'stranger_cold',
          },
          {
            id: 'leave_alone',
            text: 'say nothing.',
            nextNodeId: 'stranger_silence',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_noName',
        text: '"names don\'t matter anymore," they say. "nothing from before matters."',
        condition: 'false',
        options: [
          {
            id: 'press_name',
            text: 'everything matters.',
            nextNodeId: 'stranger_matters',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
          {
            id: 'accept_noName',
            text: 'fair enough.',
            nextNodeId: 'stranger_silence',
          },
        ],
      },
      {
        id: 'stranger_cold',
        text: '"long enough to forget what warm feels like." they hold their hands closer to the fire. "this is good. this fire."',
        condition: 'false',
        options: [
          {
            id: 'offer_warmth',
            text: 'you can stay.',
            nextNodeId: 'stranger_stay',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 2 }],
          },
          {
            id: 'ask_where',
            text: 'where did you come from?',
            nextNodeId: 'stranger_origin',
          },
        ],
      },
      {
        id: 'stranger_matters',
        text: 'they look at you for a long time. "maybe," they say. "maybe it does."',
        condition: 'false',
        options: [
          {
            id: 'end_matters',
            text: 'rest now.',
            nextNodeId: 'stranger_silence',
          },
        ],
        effects: [{ type: 'codex', codexId: 'people_stranger' }],
      },
      {
        id: 'stranger_stay',
        text: '"i can work," they say. "i\'m not useless. not yet." they look at their scarred hands. "i remember how to gather. how to find things."',
        condition: 'false',
        options: [
          {
            id: 'accept_help',
            text: 'good. we need help.',
            nextNodeId: 'stranger_accepted',
            effects: [
              { type: 'relationship', npcId: 'stranger', amount: 2 },
              { type: 'flag', flagId: 'strangerAccepted', flagValue: true },
            ],
          },
          {
            id: 'rest_first',
            text: 'rest first. work tomorrow.',
            nextNodeId: 'stranger_silence',
            effects: [{ type: 'relationship', npcId: 'stranger', amount: 1 }],
          },
        ],
      },
      {
        id: 'stranger_origin',
        text: '"south. east. does it matter? everywhere looks the same now. snow and ruins."',
        condition: 'false',
        options: [
          {
            id: 'ask_ruins',
            text: 'what ruins?',
            nextNodeId: 'stranger_ruins',
          },
          {
            id: 'end_origin',
            text: 'rest. we\'ll talk later.',
            nextNodeId: 'stranger_silence',
          },
        ],
      },
      {
        id: 'stranger_ruins',
        text: '"cities. towns. all frozen. all empty." they pause. "not all empty. things live there now. changed things."',
        condition: 'false',
        options: [
          {
            id: 'end_ruins',
            text: 'we\'ll be careful.',
            nextNodeId: 'stranger_silence',
            effects: [{ type: 'codex', codexId: 'lore_ruinedCities' }],
          },
        ],
      },

      // --- shared terminal node ---
      {
        id: 'stranger_silence',
        text: 'the stranger stares into the fire. the conversation is over.',
        condition: 'false',
        options: [],
      },
    ],
  },

  // =========================================================================
  // THE BUILDER
  // arrives when hut level 2+, unlocks advanced buildings
  // objective: gain trust, get the vessel blueprints
  // =========================================================================
  {
    id: 'builder',
    name: 'the builder',
    title: 'a woman with old-world tools',
    description: 'calloused hands. sharp eyes. she sees structures in everything — how things fit together. how they could be better.',
    arrivalCondition: { type: 'event', target: 'arrival_builder' },
    questId: 'builderBlueprint',
    dialogueTree: [
      // ---------------------------------------------------------------
      // ROOT 1 — departure doubts (rel >= 8, departure phase)
      // ---------------------------------------------------------------
      {
        id: 'builder_doubts',
        text: 'the builder is staring at the vessel. it\'s nearly complete. "i keep thinking about the people who won\'t fit," she says quietly. "the vessel carries a few. the village has many."',
        condition: 'npc.builder.relationship >= 8 && phase == "departure" && flag.builderDoubts != true',
        options: [
          {
            id: 'ask_doubts',
            text: 'are you having second thoughts?',
            nextNodeId: 'builder_secondThoughts',
          },
          {
            id: 'builder_everyone_opt',
            text: 'we\'ll find a way for everyone.',
            nextNodeId: 'builder_everyone',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
        ],
      },
      {
        id: 'builder_secondThoughts',
        text: '"not about building it. about leaving." she runs her hand along the hull. "i built this village. every wall. every roof. if i leave — who maintains it? who fixes the boiler when it fails in january?" she turns to you. "is leaving the right thing when people need you to stay?"',
        condition: 'false',
        options: [
          {
            id: 'stay_or_go',
            text: 'that\'s a choice only you can make.',
            nextNodeId: 'builder_choice',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 2 }],
          },
        ],
        effects: [{ type: 'flag', flagId: 'builderDoubts', flagValue: true }],
      },
      {
        id: 'builder_everyone',
        text: '"a way for everyone." she repeats it. counts the bolts on the hull. "maybe. if i could rebuild the array, scale it up — but i\'d need years. materials we don\'t have." she straightens. "or maybe what we find on the other side changes everything. maybe the bright room is big enough for all of us."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'builderDoubts', flagValue: true }],
      },
      {
        id: 'builder_choice',
        text: '"yes." she nods slowly. "i\'ll train someone. the apprentice in the workshop — she has good hands. steady." she looks at the vessel one more time. "i didn\'t build this to sit on the ground. and i didn\'t walk this far to stop at the door."',
        condition: 'false',
        options: [],
        effects: [{ type: 'log', logText: 'the builder decides. she\'ll go through.' }],
      },

      // ---------------------------------------------------------------
      // ROOT 2 — vessel design details (rel >= 6, blueprint revealed)
      // ---------------------------------------------------------------
      {
        id: 'builder_vesselTalk',
        text: 'the builder has the blueprints spread across the workshop table. she\'s drawn additional notes in charcoal. "i\'ve been thinking about the hull," she says.',
        condition: 'flag.vesselBlueprintRevealed == true && npc.builder.relationship >= 6 && flag.builderVesselTalk != true',
        options: [
          {
            id: 'ask_hull',
            text: 'what about it?',
            nextNodeId: 'builder_hullDesign',
          },
          {
            id: 'ask_navigation',
            text: 'what about the navigation system?',
            nextNodeId: 'builder_navDesign',
          },
          {
            id: 'share_steel_builder',
            text: 'brought you some steel. for the hull.',
            nextNodeId: 'builder_steelGift',
            effects: [
              { type: 'resource', resourceId: 'steel', amount: -10 },
              { type: 'relationship', npcId: 'builder', amount: 3 },
            ],
            condition: 'resource.steel >= 10',
          },
        ],
      },
      {
        id: 'builder_hullDesign',
        text: '"the original design assumes alloys we can\'t make. but i\'ve been working on substitutions." she shows the annotations. "layered steel. gaps filled with packed earth for insulation. it won\'t be elegant. but it\'ll hold." she looks up. "i hope."',
        condition: 'false',
        options: [
          {
            id: 'end_hull',
            text: 'it\'ll hold.',
            nextNodeId: 'builder_silence',
            effects: [
              { type: 'flag', flagId: 'builderVesselTalk', flagValue: true },
              { type: 'relationship', npcId: 'builder', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'builder_navDesign',
        text: '"that\'s the part i don\'t understand." she frowns at the blueprint. "the navigation system — it\'s not geographic. it doesn\'t point north or south. it points — somewhere else. like it\'s designed to travel in a direction that doesn\'t exist on a compass."',
        condition: 'false',
        options: [
          {
            id: 'ask_direction',
            text: 'what direction?',
            nextNodeId: 'builder_strangeDirection',
          },
        ],
        effects: [{ type: 'flag', flagId: 'builderVesselTalk', flagValue: true }],
      },
      {
        id: 'builder_strangeDirection',
        text: '"inward. outward. i don\'t have words for it." she sets down her pencil. "the stranger — they might know. they get this look sometimes. like they\'re remembering something that hasn\'t happened yet."',
        condition: 'false',
        options: [],
        effects: [{ type: 'codex', codexId: 'lore_vesselNavigation' }],
      },
      {
        id: 'builder_steelGift',
        text: 'she takes the steel. weighs it in her hands. runs a thumbnail along the grain. "good carbon content. proper tempering." she sets it with the hull plates. "this is enough for the starboard reinforcement. the vessel is taking shape." she looks at you with something close to warmth. "you know what matters."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'builderVesselTalk', flagValue: true },
          { type: 'log', logText: 'the builder uses the steel for the vessel hull.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 3 — blueprint reveal (rel >= 5, quest step >= 2) KEY QUEST
      // ---------------------------------------------------------------
      {
        id: 'builder_blueprint',
        text: 'the builder catches you alone. "i have something," she says. she unfolds a blueprint — yellowed, delicate. "a vessel. old-world design. for leaving."',
        condition: 'npc.builder.relationship >= 5 && quest.mainDiscover.step >= 2 && flag.vesselBlueprintRevealed != true',
        options: [
          {
            id: 'ask_blueprint',
            text: 'leaving where?',
            nextNodeId: 'builder_blueprintDetail',
          },
          {
            id: 'ask_build_it',
            text: 'can we build it?',
            nextNodeId: 'builder_canBuild',
          },
        ],
      },
      {
        id: 'builder_blueprintDetail',
        text: '"here. this place. this cold." she traces the lines on the paper. "it was designed to carry people somewhere else. somewhere warm."',
        condition: 'false',
        options: [
          {
            id: 'pursue_blueprint',
            text: 'show me everything.',
            nextNodeId: 'builder_blueprintReveal',
            effects: [
              { type: 'relationship', npcId: 'builder', amount: 2 },
              { type: 'quest', questId: 'builderBlueprint', questStep: 1 },
            ],
          },
        ],
        effects: [{ type: 'codex', codexId: 'lore_vesselBlueprint' }],
      },
      {
        id: 'builder_canBuild',
        text: '"with enough materials. the right metals. alloy, mostly." she folds the blueprint carefully. "it won\'t be easy. but i remember how."',
        condition: 'false',
        options: [
          {
            id: 'commit_build',
            text: 'we\'ll get the materials.',
            nextNodeId: 'builder_blueprintReveal',
            effects: [
              { type: 'relationship', npcId: 'builder', amount: 2 },
              { type: 'quest', questId: 'builderBlueprint', questStep: 1 },
            ],
          },
        ],
      },
      {
        id: 'builder_blueprintReveal',
        text: 'she lays the blueprint flat. the vessel. the engine. the navigation systems. "three parts," she says. "build all three and we have a way out."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'vesselBlueprintRevealed', flagValue: true },
          { type: 'quest', questId: 'builderBlueprint', questStep: 2 },
          { type: 'log', logText: 'the builder reveals the vessel blueprints. three parts needed.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 4 — entropy / philosophy (rel >= 7)
      // ---------------------------------------------------------------
      {
        id: 'builder_entropy',
        text: 'the builder is sitting outside the workshop. not working. just sitting. "everything falls apart," she says. "that\'s the first law. entropy. disorder. decay."',
        condition: 'npc.builder.relationship >= 7 && flag.builderEntropy != true',
        options: [
          {
            id: 'ask_why_build',
            text: 'then why do you build?',
            nextNodeId: 'builder_whyBuild',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
          {
            id: 'sit_with_builder',
            text: 'sit with her.',
            nextNodeId: 'builder_sitTogether',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 2 }],
          },
        ],
      },
      {
        id: 'builder_whyBuild',
        text: '"because." she picks up a nail. turns it in her fingers. "because the act of building is the answer. not the building itself. the building will fall. but the act of making it — that\'s the thing that matters. that\'s the thing entropy can\'t touch."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'builderEntropy', flagValue: true },
          { type: 'codex', codexId: 'lore_builderPhilosophy' },
        ],
      },
      {
        id: 'builder_sitTogether',
        text: 'you sit beside her. the cold settles around you both. after a long time: "thank you," she says. "for not asking me to fix something." she watches the snow. "the old world was always asking me to fix things. here, sometimes, someone just sits."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'builderEntropy', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 5 — university memories (rel >= 4)
      // ---------------------------------------------------------------
      {
        id: 'builder_university',
        text: 'the builder is quiet tonight. her hands are still, which is unusual. "i was thinking about the university," she says. "the campus. there was a quad with trees. real trees. green ones."',
        condition: 'flag.builderAccepted == true && npc.builder.relationship >= 4 && flag.builderUniversity != true',
        options: [
          {
            id: 'ask_trees',
            text: 'i\'ve never seen a green tree.',
            nextNodeId: 'builder_trees',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
          {
            id: 'ask_studied',
            text: 'what did you study?',
            nextNodeId: 'builder_studied',
          },
          {
            id: 'share_wood_builder',
            text: 'i found this branch. still has a leaf on it. frozen, but green.',
            nextNodeId: 'builder_leafGift',
            effects: [
              { type: 'resource', resourceId: 'wood', amount: -5 },
              { type: 'relationship', npcId: 'builder', amount: 3 },
            ],
            condition: 'resource.wood >= 5',
          },
        ],
      },
      {
        id: 'builder_trees',
        text: '"they grew leaves. every spring. you could sit under them and the light came through in pieces." her voice is far away. "the campus had a library. real books. thousands. they burned when the power went out and people needed warmth." she closes her eyes. "i understand why they burned them. i still hate it."',
        condition: 'false',
        options: [
          {
            id: 'end_trees',
            text: 'some things are worth remembering.',
            nextNodeId: 'builder_silence',
            effects: [
              { type: 'flag', flagId: 'builderUniversity', flagValue: true },
              { type: 'codex', codexId: 'lore_universities' },
            ],
          },
        ],
      },
      {
        id: 'builder_studied',
        text: '"structural engineering. materials science. how to make things that don\'t fall down." she laughs, short and dry. "we had a professor who said: \'everything falls. your job is to decide when.\' i thought he was being dramatic."',
        condition: 'false',
        options: [
          {
            id: 'end_studied',
            text: 'he was right.',
            nextNodeId: 'builder_silence',
            effects: [
              { type: 'flag', flagId: 'builderUniversity', flagValue: true },
              { type: 'relationship', npcId: 'builder', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'builder_leafGift',
        text: 'she takes the branch. holds it like it might dissolve. the frozen leaf catches the firelight. "green," she whispers. "still green." she sets it on the workshop shelf, carefully, between a hammer and a set square. "i\'ll keep it there. so i remember what we\'re building toward."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'builderUniversity', flagValue: true },
          { type: 'codex', codexId: 'lore_universities' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 6 — technical talk about buildings (rel >= 3, accepted)
      // ---------------------------------------------------------------
      {
        id: 'builder_technical',
        text: 'the builder is sketching on scrap paper. blueprints for something. she looks up. "want to know why i build things the way i do?"',
        condition: 'flag.builderAccepted == true && npc.builder.relationship >= 3 && flag.builderTechnical != true',
        options: [
          {
            id: 'yes_tell',
            text: 'show me.',
            nextNodeId: 'builder_philosophy',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
          {
            id: 'ask_upgrades',
            text: 'what should we build next?',
            nextNodeId: 'builder_priorities',
          },
        ],
      },
      {
        id: 'builder_philosophy',
        text: '"redundancy. that\'s the secret." she draws overlapping lines. "every wall load-bearing. every joint doubled. the old world built for beauty. i build for the end of things." she taps the paper. "a building should outlast the people who made it."',
        condition: 'false',
        options: [
          {
            id: 'outlast_us',
            text: 'that\'s a bleak philosophy.',
            nextNodeId: 'builder_bleak',
          },
          {
            id: 'smart_building',
            text: 'sounds right for this world.',
            nextNodeId: 'builder_silence',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
        ],
        effects: [{ type: 'flag', flagId: 'builderTechnical', flagValue: true }],
      },
      {
        id: 'builder_priorities',
        text: '"storage first. always storage. then shelter. then production." she counts on her fingers. "warmth, security, growth. in that order. skip a step and the whole thing collapses."',
        condition: 'false',
        options: [
          {
            id: 'end_priorities',
            text: 'noted.',
            nextNodeId: 'builder_silence',
            effects: [
              { type: 'flag', flagId: 'builderTechnical', flagValue: true },
              { type: 'relationship', npcId: 'builder', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'builder_bleak',
        text: '"bleak." she smiles. it\'s rare. "i used to think so. now i think it\'s hopeful. if i build something that stands after i\'m gone — that\'s the closest thing to forever we get."',
        condition: 'false',
        options: [
          {
            id: 'end_bleak',
            text: 'then build it to last.',
            nextNodeId: 'builder_silence',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 7 — steelworks reaction (building-gated)
      // ---------------------------------------------------------------
      {
        id: 'builder_steelworks',
        text: 'the builder is standing by the steelworks. the heat radiates. she\'s smiling — actually smiling. "look at it," she says. "real metallurgy. real industry. in the middle of the apocalypse."',
        condition: 'building.steelworks.level >= 1 && flag.builderAccepted == true && flag.builderSteelSeen != true',
        options: [
          {
            id: 'builder_steel_mean',
            text: 'what does this mean for us?',
            nextNodeId: 'builder_steelMeaning',
          },
          {
            id: 'builder_steel_pride',
            text: 'you built this.',
            nextNodeId: 'builder_steelPride',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 2 }],
          },
        ],
      },
      {
        id: 'builder_steelMeaning',
        text: '"it means we\'re not just surviving. we\'re making." she watches the glow. "steel changes everything. stronger walls. better weapons. and the vessel — the vessel needs alloy. we can make alloy now."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'builderSteelSeen', flagValue: true },
          { type: 'log', logText: 'the builder sees the steelworks. the vessel is possible now.' },
        ],
      },
      {
        id: 'builder_steelPride',
        text: '"we built this," she corrects. but there\'s pride in it. the kind that lights up a face that\'s been dark for years. "my professor would have wept. a blast furnace from scrap metal and determination." she wipes soot from her cheek. "the old world had nothing on us."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'builderSteelSeen', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 8 — workshop reaction (building-gated)
      // ---------------------------------------------------------------
      {
        id: 'builder_workshopReaction',
        text: 'the builder stands in the workshop doorway. runs her hand along the frame. "proper joints. good timber." she turns to you. "this is where real work happens."',
        condition: 'building.workshop.level >= 1 && flag.builderAccepted == true && flag.builderWorkshopSeen != true',
        options: [
          {
            id: 'builder_what_now',
            text: 'what can you build now?',
            nextNodeId: 'builder_workshopPlan',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
          {
            id: 'builder_proud',
            text: 'you earned this.',
            nextNodeId: 'builder_workshopProud',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 2 }],
          },
        ],
      },
      {
        id: 'builder_workshopPlan',
        text: '"everything." she\'s already laying out tools. "reinforced walls. smelting improvements. storage systems that actually work." she pauses. "and eventually — the thing i\'ve been thinking about. the vessel. but we need steel first. proper steel."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'builderWorkshopSeen', flagValue: true },
          { type: 'log', logText: 'the builder begins work in the workshop.' },
        ],
      },
      {
        id: 'builder_workshopProud',
        text: 'she stops. looks at you. "earned." she says the word like she\'s testing its weight. "i haven\'t earned anything in a long time. just survived." she picks up a hammer. the weight is familiar. right. "this feels like earning."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'builderWorkshopSeen', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 9 — survivors on the road (rel >= 3, accepted)
      // ---------------------------------------------------------------
      {
        id: 'builder_survivors',
        text: '"i didn\'t come straight here," the builder says. "there were other places. other groups." her jaw tightens. "they didn\'t last."',
        condition: 'flag.builderAccepted == true && npc.builder.relationship >= 3 && flag.builderSurvivors != true',
        options: [
          {
            id: 'ask_others',
            text: 'what happened to them?',
            nextNodeId: 'builder_otherGroups',
          },
          {
            id: 'end_survivors',
            text: 'you don\'t have to talk about it.',
            nextNodeId: 'builder_silence',
            effects: [
              { type: 'relationship', npcId: 'builder', amount: 1 },
              { type: 'flag', flagId: 'builderSurvivors', flagValue: true },
            ],
          },
        ],
      },
      {
        id: 'builder_otherGroups',
        text: '"first group — raiders found them. second — the cold took the children first. then the adults gave up." she stares at her hands. "third group fought over food. i left before the fighting stopped." she looks at the village. "this is the fourth. i keep telling myself: this one\'s different."',
        condition: 'false',
        options: [
          {
            id: 'it_is_different',
            text: 'it is different.',
            nextNodeId: 'builder_silence',
            effects: [
              { type: 'relationship', npcId: 'builder', amount: 2 },
              { type: 'flag', flagId: 'builderSurvivors', flagValue: true },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 10 — default greeting (rel < 3)
      // ---------------------------------------------------------------
      {
        id: 'builder_greeting',
        text: 'the builder examines the walls of the room. runs her fingers along the joins. "sloppy," she says. "but standing."',
        condition: 'npc.builder.relationship < 3',
        options: [
          {
            id: 'ask_help',
            text: 'can you make them better?',
            nextNodeId: 'builder_offer',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
          {
            id: 'ask_background',
            text: 'where did you learn to build?',
            nextNodeId: 'builder_past',
          },
          {
            id: 'ask_tools',
            text: 'those are real tools.',
            nextNodeId: 'builder_tools',
          },
        ],
      },
      {
        id: 'builder_offer',
        text: '"better? i can make them last." she sets her toolbox down. "give me materials. i\'ll show you what buildings should look like."',
        condition: 'false',
        options: [
          {
            id: 'accept_builder',
            text: 'welcome.',
            nextNodeId: 'builder_accepted',
            effects: [
              { type: 'relationship', npcId: 'builder', amount: 2 },
              { type: 'flag', flagId: 'builderAccepted', flagValue: true },
            ],
          },
        ],
      },
      {
        id: 'builder_past',
        text: '"the old world had schools for this. universities." she says the word carefully, like something fragile. "i remember the lectures. the formulas. all useless now, mostly. but the hands remember."',
        condition: 'false',
        options: [
          {
            id: 'ask_oldWorld',
            text: 'what was the old world like?',
            nextNodeId: 'builder_oldWorld',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
          {
            id: 'end_past',
            text: 'the past is past.',
            nextNodeId: 'builder_silence',
          },
        ],
      },
      {
        id: 'builder_oldWorld',
        text: '"warm," she says. "bright. loud. wasteful." she pauses. "i miss the waste. we had so much we could afford to throw things away."',
        condition: 'false',
        options: [
          {
            id: 'end_oldWorld',
            text: 'we\'ll build something new.',
            nextNodeId: 'builder_hope',
            effects: [
              { type: 'relationship', npcId: 'builder', amount: 2 },
              { type: 'codex', codexId: 'lore_oldWorld' },
            ],
          },
        ],
      },
      {
        id: 'builder_tools',
        text: '"found them in a collapsed hardware store. buried under rubble. they were just sitting there." she turns a wrench in her hands. "some things survive."',
        condition: 'false',
        options: [
          {
            id: 'end_tools',
            text: 'glad they found you.',
            nextNodeId: 'builder_silence',
            effects: [{ type: 'relationship', npcId: 'builder', amount: 1 }],
          },
        ],
      },
      {
        id: 'builder_hope',
        text: '"new." she tests the word. "i\'d like that." she picks up her tools. "let\'s get to work."',
        condition: 'false',
        options: [],
        effects: [{ type: 'log', logText: 'the builder sees a future here.' }],
      },
      {
        id: 'builder_accepted',
        text: 'the builder nods once. "i\'ll need a workshop. proper one. then we can start building things that matter."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'unlock', unlockId: 'workshop' },
          { type: 'log', logText: 'the builder joins the village. advanced buildings unlocked.' },
        ],
      },

      // --- shared terminal node ---
      {
        id: 'builder_silence',
        text: 'the builder turns back to her work. the conversation is over.',
        condition: 'false',
        options: [],
      },
    ],
  },

  // =========================================================================
  // THE CARTOGRAPHER
  // arrives when trading post built, unlocks the map
  // objective: learn the map, discover the raider king threat, find hidden
  //            locations
  // =========================================================================
  {
    id: 'cartographer',
    name: 'the cartographer',
    title: 'a thin man with ink-stained fingers',
    description: 'he speaks in distances and directions. his maps are beautiful — precise lines on salvaged paper. he has walked further than anyone.',
    arrivalCondition: { type: 'event', target: 'arrival_cartographer' },
    dialogueTree: [
      // ---------------------------------------------------------------
      // ROOT 1 — beyond the map edge (rel >= 8)
      // ---------------------------------------------------------------
      {
        id: 'carto_beyond',
        text: 'the cartographer has run out of paper. his maps cover every wall of his room. "i\'ve mapped everything i can reach," he says. "and still — there\'s more. there\'s always more."',
        condition: 'npc.cartographer.relationship >= 8 && flag.cartoBeyond != true',
        options: [
          {
            id: 'ask_beyond',
            text: 'what\'s at the edge?',
            nextNodeId: 'carto_edgeOfMap',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
          {
            id: 'enough_mapped',
            text: 'maybe we\'ve mapped enough.',
            nextNodeId: 'carto_neverEnough',
          },
        ],
      },
      {
        id: 'carto_edgeOfMap',
        text: '"the map stops. the land doesn\'t." he stares at the blank edge of the paper. "but there\'s something. at the farthest point — where the wall curves out of sight — the sky looks different. thinner. like looking through water." he meets your eyes. "i think the map ends because the world ends. not a cliff. just — a boundary. between what\'s real and what\'s next."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'cartoBeyond', flagValue: true },
          { type: 'codex', codexId: 'lore_edgeOfWorld' },
        ],
      },
      {
        id: 'carto_neverEnough',
        text: '"never." he says it immediately. without doubt. "a cartographer who stops mapping is just a man with dirty fingers." he looks at his ink-stained hands. "the vessel — it goes somewhere new. somewhere unmapped. that\'s reason enough for me."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'cartoBeyond', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 2 — hidden locations (rel >= 7)
      // ---------------------------------------------------------------
      {
        id: 'carto_hidden',
        text: 'the cartographer pulls you aside. "i have a map i don\'t show anyone," he says. "places i\'ve found. places that feel... wrong. or right. hard to explain."',
        condition: 'npc.cartographer.relationship >= 7 && flag.cartoHidden != true',
        options: [
          {
            id: 'see_hidden',
            text: 'show me.',
            nextNodeId: 'carto_hiddenMap',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 2 }],
          },
        ],
      },
      {
        id: 'carto_hiddenMap',
        text: 'the map is drawn on the back of the others. three markers. "here — a bunker, sealed. old-world tech behind the door." he points. "here — a grove where the trees aren\'t frozen. leaves, green, in the middle of winter." last marker. "and here — a circle of stones. old. older than the old world. the air hums there. like the ground is singing."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'cartoHidden', flagValue: true },
          { type: 'codex', codexId: 'lore_hiddenPlaces' },
          { type: 'log', logText: 'the cartographer reveals hidden locations on the map.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 3 — underground map (rel >= 6, quest step >= 3)
      // ---------------------------------------------------------------
      {
        id: 'carto_secret',
        text: '"there\'s something i haven\'t shown you." the cartographer pulls out a different map. older. "i found this in a bunker. it shows something underground."',
        condition: 'npc.cartographer.relationship >= 6 && quest.mainDiscover.step >= 3',
        options: [
          {
            id: 'see_secret_map',
            text: 'show me.',
            nextNodeId: 'carto_secretReveal',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 2 }],
          },
        ],
      },
      {
        id: 'carto_secretReveal',
        text: 'the old map shows tunnels. a network beneath the wasteland. one tunnel leads to a marker labeled "EXIT — CLASS A." "i don\'t know what it means," he says. "but it\'s real."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'codex', codexId: 'lore_undergroundNetwork' },
          { type: 'flag', flagId: 'undergroundMapRevealed', flagValue: true },
          { type: 'log', logText: 'the cartographer reveals a map of underground tunnels.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 4 — raider king detail (rel >= 5, raiderKingKnown)
      // ---------------------------------------------------------------
      {
        id: 'carto_raiderDetail',
        text: 'the cartographer has been marking raider patrol routes. red lines across the north. "i\'ve been watching the king\'s movements," he says. "there\'s a pattern."',
        condition: 'flag.raiderKingKnown == true && npc.cartographer.relationship >= 5 && flag.cartoRaiderDetail != true',
        options: [
          {
            id: 'ask_pattern',
            text: 'what pattern?',
            nextNodeId: 'carto_raiderPattern',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
          {
            id: 'ask_king_himself',
            text: 'what do you know about the king?',
            nextNodeId: 'carto_theKing',
          },
          {
            id: 'share_iron_carto',
            text: 'here. iron for better ink pens.',
            nextNodeId: 'carto_ironGift',
            effects: [
              { type: 'resource', resourceId: 'iron', amount: -5 },
              { type: 'relationship', npcId: 'cartographer', amount: 2 },
            ],
            condition: 'resource.iron >= 5',
          },
        ],
      },
      {
        id: 'carto_raiderPattern',
        text: '"they radiate out from the old city. always in threes. one group scouts, one raids, one guards the route back." he traces the lines. "but there\'s a gap. the western approach — the terrain is too rough for their vehicles. that\'s how you get in."',
        condition: 'false',
        options: [
          {
            id: 'end_pattern',
            text: 'that\'s useful.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoRaiderDetail', flagValue: true },
              { type: 'flag', flagId: 'raidApproachKnown', flagValue: true },
            ],
          },
        ],
      },
      {
        id: 'carto_theKing',
        text: '"he was military. before. someone who understood supply chains, territory, force." the cartographer taps the old city marker. "the difference between him and us — he decided that surviving wasn\'t enough. he wants to own what\'s left." he pauses. "and he\'s building something in the city center. something tall. i saw scaffolding."',
        condition: 'false',
        options: [
          {
            id: 'end_theKing',
            text: 'we\'ll deal with him when we must.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoRaiderDetail', flagValue: true },
              { type: 'codex', codexId: 'lore_raiderKingDetail' },
            ],
          },
        ],
      },
      {
        id: 'carto_ironGift',
        text: 'he takes the iron carefully, weighs it. "good metal. i can make nibs that hold a point." he\'s already thinking about the maps he\'ll draw. "finer lines. more detail. the old maps were approximate — these will be precise." he nods to you. "an investment in knowledge. the best kind."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'cartoRaiderDetail', flagValue: true },
          { type: 'log', logText: 'the cartographer crafts new mapping tools from the iron.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 5 — travel stories (rel >= 4)
      // ---------------------------------------------------------------
      {
        id: 'carto_stories',
        text: 'the cartographer is warming his hands. his fingers are always cold — occupational hazard of holding charcoal in winter. "want to know the strangest thing i\'ve seen out there?"',
        condition: 'flag.cartographerAccepted == true && npc.cartographer.relationship >= 4 && flag.cartoStories != true',
        options: [
          {
            id: 'tell_me_story',
            text: 'tell me.',
            nextNodeId: 'carto_strangest',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
          {
            id: 'ask_farthest',
            text: 'what\'s the farthest you\'ve been?',
            nextNodeId: 'carto_farthest',
          },
        ],
      },
      {
        id: 'carto_strangest',
        text: '"a lake. three days east. the water isn\'t frozen. it steams. warm as a bath." he draws it on scrap paper. "nothing around it explains the heat. no hot springs. no geological activity. just warm water in the middle of ice." he lowers his voice. "fish still live in it. real fish. i ate one. tasted like the old world."',
        condition: 'false',
        options: [
          {
            id: 'end_strangest',
            text: 'that\'s worth investigating.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoStories', flagValue: true },
              { type: 'codex', codexId: 'lore_warmLake' },
            ],
          },
        ],
      },
      {
        id: 'carto_farthest',
        text: '"six days west. the land changes. the snow gets thinner. you can see dirt — real dirt. brown and wet." his voice goes quiet. "and there\'s a wall. metal. taller than the tallest tree. stretching north and south farther than i could walk. no gate. no seam. just wall." he looks at you. "someone built a border. or a cage."',
        condition: 'false',
        options: [
          {
            id: 'a_cage',
            text: 'a cage for what?',
            nextNodeId: 'carto_cage',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
        ],
        effects: [{ type: 'flag', flagId: 'cartoStories', flagValue: true }],
      },
      {
        id: 'carto_cage',
        text: '"for us." he says it flatly. "the wall curves. i followed it for two days. it curves. whatever\'s on the other side — they don\'t want us there. or they don\'t want what\'s out there in here." he folds the paper. "i never put it on the official map. didn\'t want to scare people."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'codex', codexId: 'lore_theWall' },
          { type: 'flag', flagId: 'cartoWallKnown', flagValue: true },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 6 — terrain descriptions (rel >= 3, accepted)
      // ---------------------------------------------------------------
      {
        id: 'carto_terrain',
        text: 'the cartographer has new marks on the map. different colors — brown, blue, grey. "each terrain tells a story," he says. "you just have to know how to read it."',
        condition: 'flag.cartographerAccepted == true && npc.cartographer.relationship >= 3 && flag.cartoTerrain != true',
        options: [
          {
            id: 'ask_forests',
            text: 'what about the forests?',
            nextNodeId: 'carto_forests',
          },
          {
            id: 'ask_swamps',
            text: 'the swamps?',
            nextNodeId: 'carto_swamps',
          },
          {
            id: 'ask_mountains',
            text: 'and the hills?',
            nextNodeId: 'carto_hills',
          },
        ],
      },
      {
        id: 'carto_forests',
        text: '"dense pine. frozen solid. the trees are alive but barely. they creak in the wind like bones." he traces the green areas. "good for timber. bad for visibility. wolves hunt there. stay to the paths if you can."',
        condition: 'false',
        options: [
          {
            id: 'end_forests',
            text: 'noted.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoTerrain', flagValue: true },
              { type: 'relationship', npcId: 'cartographer', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'carto_swamps',
        text: '"where the rivers froze and thawed and froze again. the ground is treacherous — looks solid, breaks under weight." he marks the blue areas. "but there are herbs there. medicines. the hermit used to gather them. worth the risk if you\'re careful."',
        condition: 'false',
        options: [
          {
            id: 'end_swamps',
            text: 'we\'ll tread carefully.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoTerrain', flagValue: true },
              { type: 'relationship', npcId: 'cartographer', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'carto_hills',
        text: '"caves. old mines. some collapsed, some open." he taps the grey marks. "the bears den there in winter. but deeper in — iron. tin. maybe more. i found old-world survey markers. someone was mining here before."',
        condition: 'false',
        options: [
          {
            id: 'end_hills',
            text: 'good to know.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoTerrain', flagValue: true },
              { type: 'relationship', npcId: 'cartographer', amount: 1 },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 7 — trade routes (rel >= 3, accepted)
      // ---------------------------------------------------------------
      {
        id: 'carto_trade',
        text: '"there are others," the cartographer says. "not raiders. survivors. trading groups. i\'ve marked the ones i know."',
        condition: 'flag.cartographerAccepted == true && npc.cartographer.relationship >= 3 && flag.cartoTrade != true',
        options: [
          {
            id: 'ask_traders',
            text: 'who trades?',
            nextNodeId: 'carto_traders',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
          {
            id: 'ask_routes',
            text: 'show me the routes.',
            nextNodeId: 'carto_routes',
          },
        ],
      },
      {
        id: 'carto_traders',
        text: '"a family south of the swamp — they tan hides, make leather. a group in the eastern caves — they mine. and a woman who walks alone. sells information." he looks up. "she told me about the wall. charged me three days\' food for the knowledge."',
        condition: 'false',
        options: [
          {
            id: 'end_traders',
            text: 'we should make contact.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoTrade', flagValue: true },
              { type: 'codex', codexId: 'lore_tradeRoutes' },
            ],
          },
        ],
      },
      {
        id: 'carto_routes',
        text: 'he draws the paths. south through the forest. east along the frozen river. "the routes shift with the seasons. when the thaw comes — if it comes — the swamp paths close and the hill passes open." he marks waypoints. "caches here and here. supplies for the road."',
        condition: 'false',
        options: [
          {
            id: 'end_routes',
            text: 'this changes everything.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoTrade', flagValue: true },
              { type: 'relationship', npcId: 'cartographer', amount: 1 },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 8 — rivers and the freeze (rel >= 4, accepted)
      // ---------------------------------------------------------------
      {
        id: 'carto_rivers',
        text: 'the cartographer stares at the blue lines on his map. "the rivers used to flow," he says. "real water. moving water. i found the high-water marks on the bridges."',
        condition: 'flag.cartographerAccepted == true && npc.cartographer.relationship >= 4 && flag.cartoRivers != true',
        options: [
          {
            id: 'ask_froze',
            text: 'what happened?',
            nextNodeId: 'carto_froze',
          },
          {
            id: 'ask_bridges',
            text: 'the bridges still stand?',
            nextNodeId: 'carto_bridges',
          },
        ],
      },
      {
        id: 'carto_froze',
        text: '"they froze from the source. something upstream — far upstream — changed the temperature. not gradually. overnight." he measures distances with his thumb. "i\'ve walked the frozen riverbed. the ice captured everything. fish. boats. a man standing in the shallows." he pauses. "he\'s still there. perfectly preserved. reaching for the shore."',
        condition: 'false',
        options: [
          {
            id: 'end_froze',
            text: 'the cold came fast.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoRivers', flagValue: true },
              { type: 'codex', codexId: 'lore_frozenRivers' },
            ],
          },
        ],
      },
      {
        id: 'carto_bridges',
        text: '"some. the stone ones. the metal ones rusted and fell." he sketches a bridge on scrap paper. "there\'s one — three days south — that\'s perfectly intact. carved stone. old. older than the old world. no one knows who built it." he looks at you. "it was there before people mapped this place. i checked the oldest records."',
        condition: 'false',
        options: [
          {
            id: 'end_bridges',
            text: 'older than the old world.',
            nextNodeId: 'carto_silence',
            effects: [
              { type: 'flag', flagId: 'cartoRivers', flagValue: true },
              { type: 'relationship', npcId: 'cartographer', amount: 1 },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 9 — exploration progress (rel >= 5, bunker explored)
      // ---------------------------------------------------------------
      {
        id: 'carto_progress',
        text: 'the cartographer looks up as you return. "you found it," he says. there\'s something like joy in his voice. "another piece of the picture. another line on the map."',
        condition: 'flag.cartographerAccepted == true && npc.cartographer.relationship >= 5 && flag.bunkerExplored == true && flag.cartoProgress != true',
        options: [
          {
            id: 'carto_keep_going',
            text: 'there\'s more to find.',
            nextNodeId: 'carto_moreToFind',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
        ],
      },
      {
        id: 'carto_moreToFind',
        text: '"always." he adds your findings to the map. charcoal lines connecting places, paths, possibilities. "every expedition fills in a blank space. every blank space filled makes the next expedition possible." he steps back from the map. "it\'s starting to look like a world."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'cartoProgress', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 10 — default greeting (rel < 3)
      // ---------------------------------------------------------------
      {
        id: 'carto_greeting',
        text: 'the cartographer spreads his maps on the table. charcoal lines on brown paper. "this is what i know," he says.',
        condition: 'npc.cartographer.relationship < 3',
        options: [
          {
            id: 'ask_map',
            text: 'what\'s out there?',
            nextNodeId: 'carto_outThere',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
          {
            id: 'ask_travel',
            text: 'how far have you gone?',
            nextNodeId: 'carto_traveled',
          },
          {
            id: 'ask_dangers',
            text: 'what should we fear?',
            nextNodeId: 'carto_dangers',
          },
        ],
      },
      {
        id: 'carto_outThere',
        text: '"forests, mostly. frozen. then swamps where the rivers backed up. ruins of towns. caves in the hills." he taps the map. "and at the edges, things i haven\'t mapped yet."',
        condition: 'false',
        options: [
          {
            id: 'ask_edges',
            text: 'what things?',
            nextNodeId: 'carto_edges',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
          {
            id: 'end_outThere',
            text: 'we\'ll explore together.',
            nextNodeId: 'carto_accepted',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 2 }],
          },
        ],
      },
      {
        id: 'carto_traveled',
        text: '"far enough to know this valley is small. the world is bigger. was bigger." he folds the map. "most of it is empty now."',
        condition: 'false',
        options: [
          {
            id: 'ask_notEmpty',
            text: 'most?',
            nextNodeId: 'carto_notEmpty',
          },
          {
            id: 'end_traveled',
            text: 'stay. map for us.',
            nextNodeId: 'carto_accepted',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
        ],
      },
      {
        id: 'carto_notEmpty',
        text: '"there are others. groups. some trade. some take." he meets your eyes. "one group has a leader. calls himself king. has an army."',
        condition: 'false',
        options: [
          {
            id: 'ask_king',
            text: 'where?',
            nextNodeId: 'carto_kingLocation',
            effects: [
              { type: 'codex', codexId: 'lore_raiderKing' },
              { type: 'flag', flagId: 'raiderKingKnown', flagValue: true },
            ],
          },
        ],
      },
      {
        id: 'carto_kingLocation',
        text: '"north. in the old city. the tall buildings." he draws a circle on the map. "i wouldn\'t go there. not yet."',
        condition: 'false',
        options: [
          {
            id: 'end_king',
            text: 'we\'ll be ready.',
            nextNodeId: 'carto_silence',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 1 }],
          },
        ],
      },
      {
        id: 'carto_dangers',
        text: '"everything. cold. raiders. wolves. cave bears." he pauses. "but mostly the cold. the cold kills more than anything else out there."',
        condition: 'false',
        options: [
          {
            id: 'end_dangers',
            text: 'we know the cold.',
            nextNodeId: 'carto_silence',
          },
        ],
        effects: [{ type: 'codex', codexId: 'lore_wastelandDangers' }],
      },
      {
        id: 'carto_edges',
        text: '"smoke, sometimes. from the wrong direction. lights at night. sounds that don\'t belong." he shrugs. "could be anything. that\'s why i map."',
        condition: 'false',
        options: [
          {
            id: 'end_edges',
            text: 'we\'ll find out what\'s there.',
            nextNodeId: 'carto_accepted',
            effects: [{ type: 'relationship', npcId: 'cartographer', amount: 2 }],
          },
        ],
      },
      {
        id: 'carto_accepted',
        text: '"good. i\'ll keep mapping. you explore." he rolls up his papers. "bring back anything you find. i\'ll mark it down."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'unlock', unlockId: 'map' },
          { type: 'flag', flagId: 'cartographerAccepted', flagValue: true },
          { type: 'log', logText: 'the cartographer joins the village. the map is available.' },
        ],
      },

      // --- shared terminal node ---
      {
        id: 'carto_silence',
        text: 'the cartographer bends over his maps again. lost in lines and distances.',
        condition: 'false',
        options: [],
      },
    ],
  },

  // =========================================================================
  // THE HERMIT
  // hidden NPC, found in ruins on the map
  // objective: build relationship through repeated visits, learn about the
  //            bright room and hidden exit
  // =========================================================================
  {
    id: 'hermit',
    name: 'the hermit',
    title: 'an old man in the ruins',
    description: 'ancient and still. he sits among collapsed walls like he grew there. his eyes see things that aren\'t there anymore. or things that haven\'t happened yet.',
    arrivalCondition: { type: 'event', target: 'story_hermitFound' },
    questId: 'hermitMemory',
    dialogueTree: [
      // ---------------------------------------------------------------
      // ROOT 1 — farewell / hidden passage (rel >= 9, quest step >= 2)
      // ---------------------------------------------------------------
      {
        id: 'hermit_farewell',
        text: 'the hermit stands by the door. the hum is louder now. the metal is warm. "so you\'re going through," he says. not a question.',
        condition: 'flag.hermitPathRevealed == true && npc.hermit.relationship >= 9 && flag.hermitFarewell != true',
        options: [
          {
            id: 'come_with',
            text: 'come with me.',
            nextNodeId: 'hermit_comesAlong',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
          {
            id: 'ask_stay',
            text: 'will you be alright?',
            nextNodeId: 'hermit_staysBehind',
          },
        ],
      },
      {
        id: 'hermit_comesAlong',
        text: '"no." he shakes his head gently. "my place is here. with the ruins. with the memories." he puts his hand on the door. "but i\'ll keep it open. for anyone else who hears the frequency. anyone else who needs to step between the pages." he looks at you. "remember the old world for me. even the parts that weren\'t worth remembering."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'hermitFarewell', flagValue: true },
          { type: 'codex', codexId: 'lore_hermitFarewell' },
          { type: 'log', logText: 'the hermit says goodbye. he will keep the door open.' },
        ],
      },
      {
        id: 'hermit_staysBehind',
        text: '"i\'ve been alright for a long time. alone in the cold with my memories." he smiles. it transforms his face. "but i\'m not alone anymore. am i. you came. others will come." he touches the door one last time. "go. find the bright room. and when you get there — listen for beethoven. if the universe has any sense of poetry, there will be music."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'hermitFarewell', flagValue: true },
          { type: 'log', logText: 'the hermit will be alright. he has always been alright.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 2 — hidden passage reveal (rel >= 8, quest step >= 2)
      // ---------------------------------------------------------------
      {
        id: 'hermit_final',
        text: '"i remember," the hermit says. his voice is clear now, strong. "the passage is beneath these ruins. i can show you." he stands. for the first time, he moves.',
        condition: 'npc.hermit.relationship >= 8 && quest.hermitMemory.step >= 2 && flag.hermitPathRevealed != true',
        options: [
          {
            id: 'follow_hermit',
            text: 'show me.',
            nextNodeId: 'hermit_reveal',
            effects: [
              { type: 'relationship', npcId: 'hermit', amount: 3 },
              { type: 'quest', questId: 'hermitMemory', questStep: 3 },
            ],
          },
        ],
      },
      {
        id: 'hermit_reveal',
        text: 'he leads you down broken stairs. behind a collapsed wall, a door. metal. old-world. sealed. "this is it," he says. "the way to the bright room." he puts his hand on the metal. it hums.',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'hermitPathRevealed', flagValue: true },
          { type: 'codex', codexId: 'lore_hermitPath' },
          { type: 'log', logText: 'the hermit reveals a hidden passage beneath the ruins.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 3 — bright room theory / parallax (rel >= 5, quest >= 2)
      // ---------------------------------------------------------------
      {
        id: 'hermit_brightRoomDeep',
        text: 'the hermit is awake. alert. his usual dreaminess is gone. "i\'ve been thinking about the bright room," he says. "not remembering. thinking. there\'s a difference."',
        condition: 'npc.hermit.relationship >= 5 && quest.hermitMemory.step >= 2 && flag.hermitBrightDeep != true',
        options: [
          {
            id: 'what_thinking',
            text: 'what have you figured out?',
            nextNodeId: 'hermit_brightTheory',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
        ],
      },
      {
        id: 'hermit_brightTheory',
        text: '"it\'s not a place. not exactly. it\'s a — state. a frequency." he searches for words. "imagine this world is a page in a book. the bright room is the space between pages. you can\'t see it from inside the page. but if you step sideways — just slightly — you\'re there."',
        condition: 'false',
        options: [
          {
            id: 'ask_parallax_hermit',
            text: 'like the parallax.',
            nextNodeId: 'hermit_parallaxConnection',
            condition: 'flag.strangerRevealed == true',
          },
          {
            id: 'how_step',
            text: 'how do you step sideways?',
            nextNodeId: 'hermit_stepSideways',
          },
        ],
        effects: [
          { type: 'flag', flagId: 'hermitBrightDeep', flagValue: true },
          { type: 'codex', codexId: 'lore_brightRoomTheory' },
        ],
      },
      {
        id: 'hermit_parallaxConnection',
        text: '"yes." his eyes sharpen. "the parallax. that\'s the word they used at the facility. i didn\'t tell you i worked there, did i?" he pauses. "i wasn\'t a teacher. not first. first i was a researcher. the teacher came later. after i understood what we were doing and couldn\'t bear it."',
        condition: 'false',
        options: [
          {
            id: 'what_doing',
            text: 'what were you doing?',
            nextNodeId: 'hermit_researcher',
          },
        ],
      },
      {
        id: 'hermit_researcher',
        text: '"opening the door. the parallax array — it creates a resonance. a vibration that thins the boundary between pages." he stares at his hands. "i calculated the frequencies. i wrote the equations. when the cold came — when the dimensions bled — i ran. became a teacher. hid in a school. pretended i was someone else."',
        condition: 'false',
        options: [
          {
            id: 'end_researcher',
            text: 'you\'re still that person.',
            nextNodeId: 'hermit_silence',
            effects: [
              { type: 'flag', flagId: 'hermitWasResearcher', flagValue: true },
              { type: 'codex', codexId: 'lore_hermitTruth' },
              { type: 'relationship', npcId: 'hermit', amount: 2 },
            ],
          },
        ],
      },
      {
        id: 'hermit_stepSideways',
        text: '"the door beneath these ruins. it\'s not a physical door. it\'s a threshold — tuned to a specific frequency. when you approach it the right way — with the right intent, the right resonance — it opens." he looks at his shaking hands. "i used to know the frequency. it\'s in here somewhere. fading."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'hermitFrequencyHint', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 4 — old-world memories / philosophy (rel >= 4)
      // ---------------------------------------------------------------
      {
        id: 'hermit_philosophy',
        text: 'the hermit is watching the sky. "do you think about endings?" he asks. "not death. endings. the moment when something stops being what it was and becomes something else."',
        condition: 'npc.hermit.relationship >= 4 && flag.hermitPhilosophy != true',
        options: [
          {
            id: 'think_about_it',
            text: 'every day.',
            nextNodeId: 'hermit_endings',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
          {
            id: 'dont_think',
            text: 'i try not to.',
            nextNodeId: 'hermit_tryNot',
          },
        ],
      },
      {
        id: 'hermit_endings',
        text: '"good. most people avoid it. but you — you walk toward it." he pulls his cloak around him. "the cold was an ending. the world as it was — ended. but here we are. still speaking. still building fires. the ending gave birth to this." he gestures at everything. "every ending is a door."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'hermitPhilosophy', flagValue: true },
          { type: 'codex', codexId: 'lore_endingsAndDoors' },
        ],
      },
      {
        id: 'hermit_tryNot',
        text: '"that\'s wise too. the old buddhists called it \'beginner\'s mind.\' not thinking about what comes next. just being in the moment." he closes his eyes. "the snow falls. the fire burns. you breathe. that is enough." he opens one eye. "but the thinker in you won\'t rest. i can see it."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'hermitPhilosophy', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 5 — old memories / music (rel >= 4)
      // ---------------------------------------------------------------
      {
        id: 'hermit_oldMemories',
        text: 'the hermit is humming. a melody. broken and wandering. "i heard music today," he says. "in my head. an orchestra. do you know what an orchestra is?"',
        condition: 'npc.hermit.relationship >= 4 && flag.hermitOldMemories != true',
        options: [
          {
            id: 'know_orchestra',
            text: 'many instruments. playing together.',
            nextNodeId: 'hermit_musicMemory',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
          {
            id: 'dont_know',
            text: 'no.',
            nextNodeId: 'hermit_musicExplain',
          },
        ],
      },
      {
        id: 'hermit_musicMemory',
        text: '"yes. dozens of people. each one making a different sound. alone — noise. together — something that makes your chest ache." he hums again. "beethoven. the ninth. the one about joy." the humming stops. "joy. what a thing to write about. he was deaf when he wrote it. couldn\'t hear a single note. just felt the vibrations."',
        condition: 'false',
        options: [
          {
            id: 'end_music',
            text: 'that\'s beautiful.',
            nextNodeId: 'hermit_silence',
            effects: [
              { type: 'flag', flagId: 'hermitOldMemories', flagValue: true },
              { type: 'codex', codexId: 'lore_oldWorldMusic' },
            ],
          },
        ],
      },
      {
        id: 'hermit_musicExplain',
        text: '"of course you don\'t. how would you." he doesn\'t say it unkindly. "imagine every sound you\'ve ever heard — wind, fire, footsteps — all happening at once. but arranged. intentional. each sound knowing its place." his eyes are far away. "there were seasons too. four of them. summer — when the air was warm and the days were long. you could lie in grass — green grass, soft grass — and watch clouds."',
        condition: 'false',
        options: [
          {
            id: 'end_explain',
            text: 'it sounds like another world.',
            nextNodeId: 'hermit_anotherWorld',
          },
        ],
        effects: [{ type: 'flag', flagId: 'hermitOldMemories', flagValue: true }],
      },
      {
        id: 'hermit_anotherWorld',
        text: '"it was." he says it simply. "another world. and it\'s gone. except in here." he touches his temple. "and maybe — maybe in the bright room. if the bright room is what i think it is."',
        condition: 'false',
        options: [],
        effects: [{ type: 'codex', codexId: 'lore_oldWorldSeasons' }],
      },

      // ---------------------------------------------------------------
      // ROOT 6 — meditation (rel >= 5)
      // ---------------------------------------------------------------
      {
        id: 'hermit_meditation',
        text: 'the hermit is sitting perfectly still. eyes closed. breathing slow. he doesn\'t acknowledge you. the ruins are silent. the wind has stopped.',
        condition: 'npc.hermit.relationship >= 5 && flag.hermitMeditation != true',
        options: [
          {
            id: 'sit_meditate',
            text: 'sit. be still.',
            nextNodeId: 'hermit_stillness',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
          {
            id: 'wait_hermit',
            text: 'wait for him to finish.',
            nextNodeId: 'hermit_waitFinish',
          },
        ],
      },
      {
        id: 'hermit_stillness',
        text: 'you sit. the cold presses in. your mind races — tasks, threats, the village. slowly, the noise fades. the cold becomes distant. there is only breath. only the present moment. time stretches. when you open your eyes, the hermit is watching you. "good," he says. "you heard it."',
        condition: 'false',
        options: [
          {
            id: 'heard_what',
            text: 'heard what?',
            nextNodeId: 'hermit_heardSilence',
          },
        ],
        effects: [{ type: 'flag', flagId: 'hermitMeditation', flagValue: true }],
      },
      {
        id: 'hermit_heardSilence',
        text: '"the silence beneath the silence. the hum. the frequency of the boundary." he nods. "most people can\'t hear it. too much noise in their heads. but you — you listened." he touches your hand. his fingers are warm. "the bright room heard you too."',
        condition: 'false',
        options: [],
        effects: [{ type: 'codex', codexId: 'lore_innerSilence' }],
      },
      {
        id: 'hermit_waitFinish',
        text: 'after a long time, he opens his eyes. "patience," he says. "that\'s rare. most people interrupt." he stretches, old bones creaking. "the silence teaches more than words. but words are what we have."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'hermitMeditation', flagValue: true },
          { type: 'relationship', npcId: 'hermit', amount: 1 },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 7 — artifact reaction (rel >= 4, artifact found)
      // ---------------------------------------------------------------
      {
        id: 'hermit_artifact',
        text: 'the hermit stares at the object in your hands. his eyes go wide. "where did you find that?" his voice trembles. "i haven\'t seen one since — since before."',
        condition: 'npc.hermit.relationship >= 4 && flag.oldWorldArtifactFound == true && flag.hermitArtifact != true',
        options: [
          {
            id: 'show_artifact',
            text: 'in the ruins. what is it?',
            nextNodeId: 'hermit_artifactMemory',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
        ],
      },
      {
        id: 'hermit_artifactMemory',
        text: 'he holds it carefully. like it might break. or like it might break him. "a compass. but not for directions. for frequencies. we used them in the facility. to find the resonance points." he turns it over. "this one is still calibrated. still pointing toward the bright room." he looks up. tears on his cheeks. "it\'s real. i didn\'t imagine it."',
        condition: 'false',
        options: [
          {
            id: 'keep_compass',
            text: 'keep it. you need it more than i do.',
            nextNodeId: 'hermit_silence',
            effects: [
              { type: 'flag', flagId: 'hermitArtifact', flagValue: true },
              { type: 'flag', flagId: 'hermitHasCompass', flagValue: true },
              { type: 'relationship', npcId: 'hermit', amount: 2 },
              { type: 'codex', codexId: 'lore_frequencyCompass' },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 8 — teaching / history lessons (rel >= 3)
      // ---------------------------------------------------------------
      {
        id: 'hermit_teaching',
        text: 'the hermit is drawing in the dust with a stick. shapes. letters. "i was a teacher," he says. "i still am. the question is whether anyone wants to learn."',
        condition: 'npc.hermit.relationship >= 3 && flag.hermitTeaching != true',
        options: [
          {
            id: 'teach_me',
            text: 'teach me.',
            nextNodeId: 'hermit_lesson',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
          {
            id: 'ask_what_teach',
            text: 'what would you teach?',
            nextNodeId: 'hermit_curriculum',
          },
          {
            id: 'share_food_hermit',
            text: 'brought you some food. you look thin.',
            nextNodeId: 'hermit_foodGift',
            effects: [
              { type: 'resource', resourceId: 'food', amount: -10 },
              { type: 'relationship', npcId: 'hermit', amount: 3 },
            ],
            condition: 'resource.food >= 10',
          },
        ],
      },
      {
        id: 'hermit_lesson',
        text: '"lesson one. this has happened before." he draws a circle in the dust. "civilizations rise. they peak. they fall. they forget. they rise again." he completes the circle. "the greeks. the romans. the mongols. the americans. now us." he taps the center. "the mistake is thinking you\'re the first. or the last."',
        condition: 'false',
        options: [
          {
            id: 'end_lesson',
            text: 'so this isn\'t the end.',
            nextNodeId: 'hermit_notEnd',
          },
        ],
        effects: [
          { type: 'flag', flagId: 'hermitTeaching', flagValue: true },
          { type: 'codex', codexId: 'lore_cyclesOfHistory' },
        ],
      },
      {
        id: 'hermit_curriculum',
        text: '"history. patterns. the shape of things." he looks at the ruins around him. "this school had textbooks. i burned most of them for warmth." he touches his temple. "but these ones are still here. the lessons in my head. fire can\'t reach those."',
        condition: 'false',
        options: [
          {
            id: 'learn_hermit',
            text: 'then share them.',
            nextNodeId: 'hermit_notEnd',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
        ],
        effects: [{ type: 'flag', flagId: 'hermitTeaching', flagValue: true }],
      },
      {
        id: 'hermit_notEnd',
        text: '"no. not the end." he smiles. "just the space between. the silence between notes." he closes his eyes. "listen carefully and you can hear the next note beginning."',
        condition: 'false',
        options: [],
      },
      {
        id: 'hermit_foodGift',
        text: 'he takes the food. holds it in both hands like an offering. "i forgot what generosity feels like." he eats slowly, savoring. "in the old world we gave things freely. food, knowledge, time. now everything is a transaction." he looks at you. "except this. this is a gift. i remember gifts." he straightens slightly. "let me give you something back. a lesson. come, sit."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'hermitTeaching', flagValue: true },
          { type: 'codex', codexId: 'lore_cyclesOfHistory' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 9 — default greeting (rel < 3)
      // ---------------------------------------------------------------
      {
        id: 'hermit_greeting',
        text: 'the hermit watches you approach. he doesn\'t move. "sit," he says. his voice is like dry leaves.',
        condition: 'npc.hermit.relationship < 3',
        options: [
          {
            id: 'sit_down',
            text: 'sit with him.',
            nextNodeId: 'hermit_sit',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
          {
            id: 'ask_who',
            text: 'who are you?',
            nextNodeId: 'hermit_who',
          },
          {
            id: 'ask_why_here',
            text: 'why are you here?',
            nextNodeId: 'hermit_whyHere',
          },
        ],
      },
      {
        id: 'hermit_sit',
        text: 'you sit. the ruins are quiet. the hermit says nothing for a long time. then: "this was a school. before. children sat here." he touches a cracked wall. "i taught here."',
        condition: 'false',
        options: [
          {
            id: 'ask_taught',
            text: 'what did you teach?',
            nextNodeId: 'hermit_taught',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
          {
            id: 'ask_children',
            text: 'what happened to the children?',
            nextNodeId: 'hermit_children',
          },
        ],
        effects: [{ type: 'codex', codexId: 'lore_oldSchool' }],
      },
      {
        id: 'hermit_who',
        text: '"i was someone. before." he holds up a hand — trembling, spotted with age. "now i am what\'s left of that someone. not much."',
        condition: 'false',
        options: [
          {
            id: 'encourage_hermit',
            text: 'you\'re still here. that counts.',
            nextNodeId: 'hermit_still',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
          {
            id: 'end_who',
            text: 'i understand.',
            nextNodeId: 'hermit_silence',
          },
        ],
      },
      {
        id: 'hermit_whyHere',
        text: '"where else?" he gestures at the ruins. "this is the only place i remember. so i stay."',
        condition: 'false',
        options: [
          {
            id: 'invite_village',
            text: 'come to the village. it\'s warm.',
            nextNodeId: 'hermit_decline',
          },
          {
            id: 'respect_choice',
            text: 'i\'ll visit again.',
            nextNodeId: 'hermit_visit',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
        ],
      },
      {
        id: 'hermit_taught',
        text: '"history. the long story of people." he smiles faintly. "now i\'m part of it. the last chapter, maybe."',
        condition: 'false',
        options: [
          {
            id: 'ask_remember',
            text: 'what do you remember?',
            nextNodeId: 'hermit_memories',
            effects: [{ type: 'quest', questId: 'hermitMemory', questStep: 1 }],
          },
        ],
      },
      {
        id: 'hermit_children',
        text: 'his face goes still. "gone. like everything else." a long pause. "i hope they found somewhere warm."',
        condition: 'false',
        options: [
          {
            id: 'end_children',
            text: 'i\'m sorry.',
            nextNodeId: 'hermit_silence',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
        ],
      },
      {
        id: 'hermit_still',
        text: '"still here." he considers this. "yes. still here. there must be a reason."',
        condition: 'false',
        options: [
          {
            id: 'ask_reason',
            text: 'maybe there is.',
            nextNodeId: 'hermit_reason',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
        ],
      },
      {
        id: 'hermit_reason',
        text: '"i remember things. pieces of before. maybe that\'s the reason." he looks at you with sudden clarity. "come back. i\'ll try to remember more."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'quest', questId: 'hermitMemory', questStep: 1 },
          { type: 'log', logText: 'the hermit will try to remember. visit him again.' },
        ],
      },
      {
        id: 'hermit_decline',
        text: '"no. the cold doesn\'t bother me anymore." he pulls his ragged cloak tighter. "i belong here. with the ruins."',
        condition: 'false',
        options: [
          {
            id: 'end_decline',
            text: 'the offer stands.',
            nextNodeId: 'hermit_silence',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 1 }],
          },
        ],
      },
      {
        id: 'hermit_visit',
        text: '"yes. come back." he nods slowly. "i\'ll be here. where else would i go?"',
        condition: 'false',
        options: [],
      },
      {
        id: 'hermit_memories',
        text: '"the facility," he says. "i remember it now. underground. they built it to survive the end. but the end came differently than they expected." he closes his eyes. "there was a door. a special door. it led somewhere else."',
        condition: 'false',
        options: [
          {
            id: 'ask_door',
            text: 'where?',
            nextNodeId: 'hermit_theDoor',
            effects: [{ type: 'relationship', npcId: 'hermit', amount: 2 }],
          },
        ],
        effects: [{ type: 'codex', codexId: 'lore_facilityDoor' }],
      },
      {
        id: 'hermit_theDoor',
        text: '"somewhere bright." he opens his eyes. they\'re wet. "i remember light. warm light. not fire. something else. something from before before."',
        condition: 'false',
        options: [
          {
            id: 'ask_before',
            text: 'before before?',
            nextNodeId: 'hermit_beforeBefore',
          },
        ],
      },
      {
        id: 'hermit_beforeBefore',
        text: '"before the cold. before the ruins. before even the old world." he shakes his head. "i\'m rambling. old man\'s dreams." but his eyes say different.',
        condition: 'false',
        options: [],
        effects: [
          { type: 'quest', questId: 'hermitMemory', questStep: 2 },
          { type: 'codex', codexId: 'lore_brightRoom' },
          { type: 'log', logText: 'the hermit speaks of a bright room. somewhere before.' },
        ],
      },

      // --- shared terminal node ---
      {
        id: 'hermit_silence',
        text: 'the hermit closes his eyes. the wind moves through the ruins. the conversation is over.',
        condition: 'false',
        options: [],
      },
    ],
  },

  // =========================================================================
  // THE SCOUT
  // arrives when cart built, guides exploration
  // objective: learn about threats, find the lost patrol, prepare for the
  //            boss fight
  // =========================================================================
  {
    id: 'scout',
    name: 'the scout',
    title: 'a young woman with sharp eyes',
    description: 'quick and quiet. she moves through the forest like she belongs there. she carries a short bow and speaks in short sentences. efficiency in everything.',
    arrivalCondition: { type: 'event', target: 'arrival_scout' },
    questId: 'scoutPatrol',
    dialogueTree: [
      // ---------------------------------------------------------------
      // ROOT 1 — stay or leave (rel >= 8, departure phase)
      // ---------------------------------------------------------------
      {
        id: 'scout_stayOrLeave',
        text: 'the scout finds you near the vessel. "so this is it," she says. "the way out." she looks at the village. at the walls she helped defend. "i have a question."',
        condition: 'npc.scout.relationship >= 8 && phase == "departure" && flag.scoutStayLeave != true',
        options: [
          {
            id: 'ask_question',
            text: 'ask.',
            nextNodeId: 'scout_theQuestion',
          },
        ],
      },
      {
        id: 'scout_theQuestion',
        text: '"if i leave — who watches the perimeter? who keeps the people safe? kade, maybe. but she\'s a healer, not a fighter." she grips her bow. "the patrol\'s duty was to protect. i swore that. marsh made us swear." she looks at you. "is there a point where you\'ve protected enough?"',
        condition: 'false',
        options: [
          {
            id: 'enough_yes',
            text: 'you\'ve given enough. more than enough.',
            nextNodeId: 'scout_givenEnough',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 2 }],
          },
          {
            id: 'your_choice',
            text: 'only you can answer that.',
            nextNodeId: 'scout_herChoice',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
          {
            id: 'need_you',
            text: 'i need you out there. wherever we\'re going.',
            nextNodeId: 'scout_needed',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 2 }],
          },
        ],
      },
      {
        id: 'scout_givenEnough',
        text: '"enough." she lets out a breath she\'s been holding for a long time. "marsh wouldn\'t agree. he\'d say the duty never ends." she puts her hand on the vessel\'s hull. cold metal. "but marsh is gone. and the living have to choose for the living." she looks up. "i\'m coming with you. someone has to watch your back on the other side."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutStayLeave', flagValue: true },
          { type: 'flag', flagId: 'scoutComesAlong', flagValue: true },
          { type: 'log', logText: 'the scout chooses to go. someone has to watch the perimeter, even in the bright room.' },
        ],
      },
      {
        id: 'scout_herChoice',
        text: 'she nods. stares at the bow in her hands for a long time. "i think i\'ll train the village. set up a rotation. teach them what i know." she looks toward the tree line. "then i\'ll go. because the truth is — there\'s something out there i haven\'t mapped yet. something i haven\'t seen. and a scout who stops scouting is just a woman with a bow."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutStayLeave', flagValue: true },
          { type: 'flag', flagId: 'scoutComesAlong', flagValue: true },
        ],
      },
      {
        id: 'scout_needed',
        text: '"needed." she says it quietly. like it means more than the word can carry. "no one\'s needed me since the patrol." she slings the bow over her shoulder. decisive. "then i\'m in. wherever it leads. whatever is on the other side." she almost smiles. this time, she actually does. "besides — can\'t let you go out there without someone who knows how to track."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutStayLeave', flagValue: true },
          { type: 'flag', flagId: 'scoutComesAlong', flagValue: true },
          { type: 'log', logText: 'the scout smiles. she\'s coming with you.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 2 — battle planning (rel >= 7, reckoning phase)
      // ---------------------------------------------------------------
      {
        id: 'scout_battlePlan',
        text: 'the scout has her bow strung. arrows counted. she\'s been awake all night. "he\'s close," she says. "the king. i can feel it." she looks at you. "are you ready?"',
        condition: 'npc.scout.relationship >= 7 && phase == "reckoning" && flag.scoutBattlePlan != true',
        options: [
          {
            id: 'ready_plan',
            text: 'walk me through the plan.',
            nextNodeId: 'scout_fullPlan',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
          {
            id: 'ask_weakness',
            text: 'does the king have a weakness?',
            nextNodeId: 'scout_kingWeakness',
          },
        ],
      },
      {
        id: 'scout_fullPlan',
        text: '"first wave: traps slow them down. second: archers thin the ranks. third: you go through the gap and find the king." she draws it out. "he\'ll be in the center. surrounded. but the center moves with him. kill the king, the circle breaks." she meets your eyes. "i\'ll cover you. from the rooftops. every arrow i have."',
        condition: 'false',
        options: [
          {
            id: 'end_plan',
            text: 'together, then.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutBattlePlan', flagValue: true },
              { type: 'relationship', npcId: 'scout', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'scout_kingWeakness',
        text: '"pride. he stands at the front. thinks it makes him look strong." she shakes her head. "marsh used to say: a leader who needs to look strong isn\'t." she nocks an arrow, aims at nothing. "he\'ll show himself. he can\'t help it. and when he does — we take the shot."',
        condition: 'false',
        options: [
          {
            id: 'end_weakness',
            text: 'one shot.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutBattlePlan', flagValue: true },
              { type: 'codex', codexId: 'lore_raiderKingWeakness' },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 3 — raider king warning (rel >= 6, raider king known)
      // ---------------------------------------------------------------
      {
        id: 'scout_deep',
        text: '"found tracks today," the scout says. "big group. heading this way." she checks her arrows. "the raider king is moving. we need to be ready."',
        condition: 'npc.scout.relationship >= 6 && flag.raiderKingKnown == true && flag.raidWarning != true',
        options: [
          {
            id: 'prepare',
            text: 'how long do we have?',
            nextNodeId: 'scout_prepare',
          },
          {
            id: 'scout_advice',
            text: 'what do you recommend?',
            nextNodeId: 'scout_strategy',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
        ],
      },
      {
        id: 'scout_prepare',
        text: '"days. maybe a week." she\'s calm. professional. "enough time to arm the village. set traps on the approaches. but we need iron. steel. everything you\'ve got."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'raidWarning', flagValue: true },
          { type: 'log', logText: 'the scout warns of the approaching army. prepare.' },
        ],
      },
      {
        id: 'scout_strategy',
        text: '"traps on the north approach. archers on the roofs. keep the non-fighters in the lodge." she draws a map in the dirt. "and someone needs to face the king. their army breaks when the king falls."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'raidWarning', flagValue: true },
          { type: 'flag', flagId: 'battleStrategyKnown', flagValue: true },
          { type: 'codex', codexId: 'lore_battleStrategy' },
          { type: 'log', logText: 'the scout outlines a battle plan. defeat the king and the army breaks.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 4 — post-victory (raider king defeated)
      // ---------------------------------------------------------------
      {
        id: 'scout_postVictory',
        text: 'the scout is sitting on the wall. bow unstrung. her hands are still. "it\'s over," she says. she sounds surprised.',
        condition: 'flag.raiderKingDefeated == true && npc.scout.relationship >= 6 && flag.scoutPostVictory != true',
        options: [
          {
            id: 'it_is_over',
            text: 'it\'s over.',
            nextNodeId: 'scout_reflection',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 2 }],
          },
          {
            id: 'cost',
            text: 'at what cost?',
            nextNodeId: 'scout_theCost',
          },
        ],
      },
      {
        id: 'scout_reflection',
        text: '"i\'ve been fighting so long i forgot what comes after." she looks at the village. people moving. repairing. living. "this. this is what comes after." she climbs down from the wall. "marsh would have liked this. he always said we were fighting for something, not just against something. i never believed him." she looks at you. "i believe him now."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutPostVictory', flagValue: true },
          { type: 'codex', codexId: 'lore_afterTheBattle' },
        ],
      },
      {
        id: 'scout_theCost',
        text: '"too much. always too much." she counts on her fingers. stops. "but i\'ve learned something. the cost isn\'t the point. the point is what you buy with it." she gestures at the village. "we bought this. safety. time. a chance." she straightens. "marsh would say that\'s worth it. i\'m starting to agree."',
        condition: 'false',
        options: [],
        effects: [{ type: 'flag', flagId: 'scoutPostVictory', flagValue: true }],
      },

      // ---------------------------------------------------------------
      // ROOT 5 — patrol member found (rel >= 5, flag)
      // ---------------------------------------------------------------
      {
        id: 'scout_patrolFound',
        text: 'the scout is standing at the village edge. her back is straight. her eyes are red. "you found her," she says. "kade. she\'s alive." her voice breaks, just slightly. just for a moment.',
        condition: 'npc.scout.relationship >= 5 && flag.patrolMemberFound == true && flag.scoutReunion != true',
        options: [
          {
            id: 'she_is_safe',
            text: 'she\'s safe now.',
            nextNodeId: 'scout_reunion',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 3 }],
          },
        ],
      },
      {
        id: 'scout_reunion',
        text: '"safe." she tastes the word. nods. "i owe you. and i don\'t say that." she pulls the patrol patch from her pocket. holds it out. "take this. it means you\'re one of us. whatever happens next — wherever we go — you\'re patrol."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutReunion', flagValue: true },
          { type: 'codex', codexId: 'lore_patrolReunion' },
          { type: 'log', logText: 'the scout gives you her patrol patch. you are one of them now.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 6 — gear reaction / training (rel >= 4, accepted)
      // ---------------------------------------------------------------
      {
        id: 'scout_training',
        text: 'the scout tosses you a stick. "catch." you catch it. "good reflexes. that\'ll keep you alive." she picks up another stick. "want to learn something useful?"',
        condition: 'flag.scoutAccepted == true && npc.scout.relationship >= 4 && flag.scoutTraining != true',
        options: [
          {
            id: 'learn_tracking',
            text: 'teach me to track.',
            nextNodeId: 'scout_trackingLesson',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
          {
            id: 'learn_combat',
            text: 'teach me to fight.',
            nextNodeId: 'scout_combatLesson',
          },
          {
            id: 'share_iron_scout',
            text: 'here. iron for arrowheads.',
            nextNodeId: 'scout_ironGift',
            effects: [
              { type: 'resource', resourceId: 'iron', amount: -10 },
              { type: 'relationship', npcId: 'scout', amount: 3 },
            ],
            condition: 'resource.iron >= 10',
          },
        ],
      },
      {
        id: 'scout_trackingLesson',
        text: '"the snow tells you everything. depth of print tells you weight. spacing tells you speed. direction tells you intent." she crouches, points at nothing. "every creature has a pattern. wolves wander. bears lumber. raiders march. learn the pattern, predict the movement."',
        condition: 'false',
        options: [
          {
            id: 'end_tracking',
            text: 'i\'ll start watching.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutTraining', flagValue: true },
              { type: 'codex', codexId: 'lore_tracking' },
            ],
          },
        ],
      },
      {
        id: 'scout_combatLesson',
        text: '"first rule: don\'t. avoid the fight. run if you can." she flips the stick in her hand. "second rule: if you can\'t run, strike first. hard. end it fast." she demonstrates — a quick jab, a sweep. "third rule: protect your neck, your belly, your knees. everything else heals."',
        condition: 'false',
        options: [
          {
            id: 'end_combat',
            text: 'noted.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutTraining', flagValue: true },
              { type: 'relationship', npcId: 'scout', amount: 1 },
              { type: 'codex', codexId: 'lore_combatBasics' },
            ],
          },
        ],
      },
      {
        id: 'scout_ironGift',
        text: 'she takes the iron. weighs each piece. sorts them by size. "twenty heads from this lot. maybe twenty-five if i\'m careful." she\'s already planning. "broadheads for the wolves. bodkin points for armored raiders. and a few blunts for practice." she nods once — the scout equivalent of a hug. "good iron. this saves lives."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutTraining', flagValue: true },
          { type: 'log', logText: 'the scout fashions arrowheads from the iron.' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 7 — patrol backstory (rel >= 4, accepted)
      // ---------------------------------------------------------------
      {
        id: 'scout_patrolStories',
        text: 'the scout is sitting by the fire. unusual for her. she\'s holding something — a patch. faded insignia. "kade made these," she says. "our medic. she said a unit needs a symbol."',
        condition: 'flag.scoutAccepted == true && npc.scout.relationship >= 4 && flag.scoutPatrolStories != true',
        options: [
          {
            id: 'ask_patrol_members',
            text: 'tell me about them.',
            nextNodeId: 'scout_patrolMembers',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
          {
            id: 'ask_kade',
            text: 'kade. the one in the eastern ruins?',
            nextNodeId: 'scout_aboutKade',
            condition: 'flag.patrolSearchStarted == true',
          },
        ],
      },
      {
        id: 'scout_patrolMembers',
        text: '"six of us. kade the medic. bren the tracker. li the sniper. felix the cook — terrible cook, good fighter. and marsh." she stops. swallows. "marsh was our leader. ex-military. real military. he held us together." she puts the patch away. "the ambush took him first. they knew to take him first."',
        condition: 'false',
        options: [
          {
            id: 'end_patrol_members',
            text: 'they sound like good people.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutPatrolStories', flagValue: true },
              { type: 'relationship', npcId: 'scout', amount: 1 },
              { type: 'codex', codexId: 'lore_scoutPatrol' },
            ],
          },
        ],
      },
      {
        id: 'scout_aboutKade',
        text: '"kade. yeah." her voice softens. barely. "she\'s tough. trained as a nurse before. if anyone survived — it\'s her." she stands. "when you go east — look for medical supplies. if she\'s alive, that\'s what she\'d be near. that\'s who she is. she can\'t stop helping people."',
        condition: 'false',
        options: [
          {
            id: 'find_kade',
            text: 'we\'ll find her.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutPatrolStories', flagValue: true },
              { type: 'relationship', npcId: 'scout', amount: 2 },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 8 — tactical briefing (rel >= 3, accepted)
      // ---------------------------------------------------------------
      {
        id: 'scout_tactical',
        text: 'the scout is sharpening arrowheads on a flat stone. "want a briefing?" she asks without looking up. "know your enemy. that\'s rule one."',
        condition: 'flag.scoutAccepted == true && npc.scout.relationship >= 3 && flag.scoutTactical != true',
        options: [
          {
            id: 'brief_wolves',
            text: 'tell me about the wolves.',
            nextNodeId: 'scout_wolves',
          },
          {
            id: 'brief_raiders',
            text: 'tell me about the raiders.',
            nextNodeId: 'scout_raiderBrief',
          },
          {
            id: 'brief_bears',
            text: 'the cave bears?',
            nextNodeId: 'scout_bears',
          },
        ],
      },
      {
        id: 'scout_wolves',
        text: '"smart. patient. they don\'t attack unless they outnumber you." she sets down an arrow. "but i respect them. they survive the same way we do. together." she looks at the fire. "the alpha female — i\'ve seen her three times. she watches the village. not hunting. studying."',
        condition: 'false',
        options: [
          {
            id: 'end_wolves',
            text: 'let\'s not give her a reason to attack.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutTactical', flagValue: true },
              { type: 'relationship', npcId: 'scout', amount: 1 },
              { type: 'codex', codexId: 'lore_wolfPacks' },
            ],
          },
        ],
      },
      {
        id: 'scout_raiderBrief',
        text: '"disorganized without the king. small groups — three, four. armed with scrap. no training." she picks up a finished arrow, tests the point. "but desperate. desperate is dangerous. they don\'t care about dying because dying is just another tuesday."',
        condition: 'false',
        options: [
          {
            id: 'end_raiders',
            text: 'we\'ll be ready.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutTactical', flagValue: true },
              { type: 'relationship', npcId: 'scout', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'scout_bears',
        text: '"don\'t fight them. avoid them. a cave bear weighs six times what you do and moves twice as fast." she holds up three fingers. "three rules. never enter a cave without checking for sign. never get between a bear and her cubs. never run — they chase." she lowers her hand. "i lost a patrol member to a bear. he ran."',
        condition: 'false',
        options: [
          {
            id: 'end_bears',
            text: 'i\'ll remember.',
            nextNodeId: 'scout_silence',
            effects: [
              { type: 'flag', flagId: 'scoutTactical', flagValue: true },
              { type: 'codex', codexId: 'lore_caveBears' },
            ],
          },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 9 — gear reaction (rel >= 5, accepted)
      // ---------------------------------------------------------------
      {
        id: 'scout_gearReaction',
        text: 'the scout eyes your equipment. "you\'re gearing up," she says. there\'s approval. "let me see what you\'ve got."',
        condition: 'flag.scoutAccepted == true && npc.scout.relationship >= 5 && flag.scoutGear != true',
        options: [
          {
            id: 'show_gear',
            text: 'what do you think?',
            nextNodeId: 'scout_gearAdvice',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
        ],
      },
      {
        id: 'scout_gearAdvice',
        text: 'she checks the edges, the weight, the balance. "decent. the blade needs work — too heavy for quick draw. and you need something for range." she hands it back. "ask the builder about reinforced leather. stops a knife, doesn\'t slow you down." she pauses. "and carry a fire kit. always. if everything goes wrong, a fire is the difference between surviving the night and not."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutGear', flagValue: true },
          { type: 'codex', codexId: 'lore_survivalGear' },
        ],
      },

      // ---------------------------------------------------------------
      // ROOT 10 — default greeting (rel < 3)
      // ---------------------------------------------------------------
      {
        id: 'scout_greeting',
        text: 'the scout leans against the doorframe. she doesn\'t come inside. "nice fire," she says.',
        condition: 'npc.scout.relationship < 3',
        options: [
          {
            id: 'invite_in',
            text: 'come in. warm up.',
            nextNodeId: 'scout_inside',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
          {
            id: 'ask_watching',
            text: 'you said you were watching.',
            nextNodeId: 'scout_watching',
          },
          {
            id: 'ask_skills',
            text: 'you know the land?',
            nextNodeId: 'scout_skills',
          },
        ],
      },
      {
        id: 'scout_inside',
        text: 'she steps in. looks around. catalogues exits, angles, shadows. old habits. "cozy," she says, not meaning it.',
        condition: 'false',
        options: [
          {
            id: 'ask_scout_from',
            text: 'where are you from?',
            nextNodeId: 'scout_from',
          },
          {
            id: 'offer_work',
            text: 'we need a scout.',
            nextNodeId: 'scout_offer',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
        ],
      },
      {
        id: 'scout_watching',
        text: '"three days. wanted to make sure you weren\'t raiders." she shrugs. "you\'re not."',
        condition: 'false',
        options: [
          {
            id: 'impressed',
            text: 'three days and we never saw you.',
            nextNodeId: 'scout_good',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 2 }],
          },
          {
            id: 'concerned',
            text: 'if you can watch us, others can too.',
            nextNodeId: 'scout_concern',
          },
        ],
      },
      {
        id: 'scout_skills',
        text: '"every trail. every cave. every water source within two days\' walk." she holds up her bow. "and i know what lives out there."',
        condition: 'false',
        options: [
          {
            id: 'ask_what_lives',
            text: 'what lives out there?',
            nextNodeId: 'scout_whatLives',
          },
          {
            id: 'hire_scout',
            text: 'work with us.',
            nextNodeId: 'scout_offer',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
        ],
      },
      {
        id: 'scout_from',
        text: '"had a group. patrol. military, sort of. we kept the roads safe." her jaw tightens. "roads aren\'t safe anymore. patrol\'s gone."',
        condition: 'false',
        options: [
          {
            id: 'ask_patrol',
            text: 'what happened?',
            nextNodeId: 'scout_patrol',
            effects: [
              { type: 'relationship', npcId: 'scout', amount: 1 },
              { type: 'quest', questId: 'scoutPatrol', questStep: 1 },
            ],
          },
          {
            id: 'end_from',
            text: 'you have a new group now.',
            nextNodeId: 'scout_offer',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 2 }],
          },
        ],
      },
      {
        id: 'scout_good',
        text: '"that\'s the point." she almost smiles. almost.',
        condition: 'false',
        options: [
          {
            id: 'hire_after_good',
            text: 'stay. be our eyes.',
            nextNodeId: 'scout_offer',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
        ],
      },
      {
        id: 'scout_concern',
        text: '"smart," she says. there\'s approval in her voice. "your defenses need work. i can help with that."',
        condition: 'false',
        options: [
          {
            id: 'accept_help_scout',
            text: 'we\'d appreciate that.',
            nextNodeId: 'scout_offer',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 2 }],
          },
        ],
      },
      {
        id: 'scout_whatLives',
        text: '"dogs gone feral. wolf packs. bears in the caves. raiders in the ruins." she counts on her fingers. "and something in the deep forest. haven\'t seen it. heard it. big."',
        condition: 'false',
        options: [
          {
            id: 'end_whatLives',
            text: 'we\'ll deal with it.',
            nextNodeId: 'scout_offer',
            effects: [{ type: 'codex', codexId: 'lore_wastelandCreatures' }],
          },
        ],
      },
      {
        id: 'scout_patrol',
        text: '"ambush. raiders. we were six. i\'m one." she stares at the fire. "the others might be alive. scattered. i\'ve been looking."',
        condition: 'false',
        options: [
          {
            id: 'help_patrol',
            text: 'we\'ll help you find them.',
            nextNodeId: 'scout_patrolHelp',
            effects: [
              { type: 'relationship', npcId: 'scout', amount: 3 },
              { type: 'quest', questId: 'scoutPatrol', questStep: 1 },
            ],
          },
          {
            id: 'end_patrol',
            text: 'i\'m sorry.',
            nextNodeId: 'scout_silence',
            effects: [{ type: 'relationship', npcId: 'scout', amount: 1 }],
          },
        ],
      },
      {
        id: 'scout_patrolHelp',
        text: 'she looks at you. really looks. "you mean that." it isn\'t a question. "last i heard, one of them was held up in some ruins to the east. another headed north."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'patrolSearchStarted', flagValue: true },
          { type: 'log', logText: 'the scout\'s lost patrol. search the ruins to the east and the northern woods.' },
        ],
      },
      {
        id: 'scout_offer',
        text: '"alright," she says. "i\'ll stay. scout the perimeter. guide your expeditions." she pulls her bow off her shoulder. "let\'s see what\'s out there."',
        condition: 'false',
        options: [],
        effects: [
          { type: 'flag', flagId: 'scoutAccepted', flagValue: true },
          { type: 'unlock', unlockId: 'scoutGuidance' },
          { type: 'log', logText: 'the scout joins the village. exploration is safer now.' },
        ],
      },

      // --- shared terminal node ---
      {
        id: 'scout_silence',
        text: 'the scout nods and steps outside. she\'s more comfortable in the cold.',
        condition: 'false',
        options: [],
      },
    ],
  },
];
