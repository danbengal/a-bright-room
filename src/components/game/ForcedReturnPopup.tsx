'use client';

import { useGameStore } from '@/stores/gameStore';

const THIRST_MESSAGES = [
  'your throat burns. your lips crack. the wasteland offers nothing to drink.',
  'the canteen is empty. each step is agony. you turn back before the desert claims you.',
  'no water. the sun beats down. you stumble back toward the village, half-blind.',
  'thirst like a knife in your throat. you crawl back the way you came.',
  'the last drop is gone. your body screams for water. you have no choice but to return.',
  'your tongue is leather. your vision blurs. the village is the only hope left.',
];

const HUNGER_MESSAGES = [
  'your stomach twists. the food is gone. you turn back before weakness takes your legs.',
  'nothing to eat. the cold steals what strength remains. you retreat to the village.',
  'hunger gnaws at the edges of thought. you can barely lift your feet. time to go back.',
  'the last rations are eaten. your hands shake. the wasteland will wait.',
  'empty pack. empty stomach. the walk back feels twice as long.',
  'no food. the world tilts sideways. you drag yourself home before you collapse.',
];

export default function ForcedReturnPopup() {
  const flags = useGameStore((s) => s.chapterState.flags);

  const isThirst = flags['return_thirst'];
  const isHunger = flags['return_hunger'];
  const isForced = flags['exploration_forced_return'];

  if (!isForced) return null;

  const messages = isThirst ? THIRST_MESSAGES : HUNGER_MESSAGES;
  // Pick a consistent message based on tick count for variety
  const ticks = useGameStore.getState().chapterState.ticks;
  const message = messages[ticks % messages.length];

  const dismiss = () => {
    const state = useGameStore.getState();
    const newFlags = { ...state.chapterState.flags };
    delete newFlags['exploration_forced_return'];
    delete newFlags['exploration_return_reason'];
    delete newFlags['return_thirst'];
    delete newFlags['return_hunger'];

    useGameStore.setState({
      chapterState: {
        ...state.chapterState,
        flags: newFlags,
      },
    });
  };

  return (
    <div className="map-overlay">
      <div className="forced-return-popup">
        <p className="forced-return-text">{message}</p>
        <button className="forced-return-btn" onClick={dismiss}>
          ok
        </button>
      </div>
    </div>
  );
}
