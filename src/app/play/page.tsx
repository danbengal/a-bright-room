'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useAutoSave } from '@/hooks/useAutoSave';
import { chapter01Config } from '@/chapters/chapter01-dark-room/config';

import TextLog from '@/components/game/TextLog';
import ResourceBar from '@/components/game/ResourceBar';
import StokeButton from '@/components/game/StokeButton';
import BuildPanel from '@/components/game/BuildPanel';
import CraftPanel from '@/components/game/CraftPanel';
import QuestLog from '@/components/game/QuestLog';
import NPCPanel from '@/components/game/NPCPanel';
import MapView from '@/components/game/MapView';
import CombatView from '@/components/game/CombatView';
import EnvironmentMeter from '@/components/game/EnvironmentMeter';
import DepartureSequence from '@/components/game/DepartureSequence';
import NPCList from '@/components/game/NPCList';
import GameNav from '@/components/game/GameNav';
import TradingPost from '@/components/game/TradingPost';
import Inventory from '@/components/game/Inventory';
import ForcedReturnPopup from '@/components/game/ForcedReturnPopup';
import POIPopup from '@/components/game/POIPopup';
import Notifications from '@/components/game/Notifications';

export default function PlayPage() {
  const initRef = useRef(false);
  const initialized = useGameStore((s) => s.initialized);
  const phase = useGameStore((s) => s.chapterState.phase);
  const unlockedFeatures = useGameStore((s) => s.chapterState.unlockedFeatures);
  const activeDialogue = useGameStore((s) => s.chapterState.activeDialogue);
  const explorationActive = useGameStore((s) => s.chapterState.explorationActive);
  const combatActive = useGameStore((s) => s.chapterState.combat.active);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const quests = useGameStore((s) => s.chapterState.quests);
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const craftingUnlocked = useGameStore((s) => s.chapterState.ticks >= 55);

  const [tradingOpen, setTradingOpen] = useState(false);

  // Initialize game ONCE on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    useGameStore.getState().initGame(chapter01Config);
  }, []);

  useGameLoop();
  useAutoSave();

  // Apply chapter theme
  useEffect(() => {
    if (!currentConfig) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentConfig.theme.primary);
    root.style.setProperty('--color-text', currentConfig.theme.primary);
    root.style.setProperty('--color-accent', currentConfig.theme.accent);
    root.style.setProperty('--color-bg', currentConfig.theme.bg);
    root.style.setProperty('--font-main', currentConfig.theme.font);
  }, [currentConfig]);

  if (!initialized) {
    return (
      <div className="title-screen">
        <span className="title-text">loading...</span>
      </div>
    );
  }

  const showBuildings = phase !== 'spark' || unlockedFeatures.includes('build');
  const showCrafting =
    craftingUnlocked ||
    unlockedFeatures.includes('advancedCrafting') ||
    ['settlement', 'questWeb', 'wild', 'reckoning', 'departure'].includes(phase);
  const showQuests = Object.values(quests).some((q) => q.active || q.completed);
  const showDeparture = phase === 'departure' || unlockedFeatures.includes('vessel');

  return (
    <div className="game-shell">
      <div className="game-top-bar">
        <div className="game-top-row">
          <ResourceBar />
          {currentConfig?.environmentalPressure && <EnvironmentMeter />}
          <div className="speed-controls">
            {([1, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                className={`speed-btn ${gameSpeed === speed ? 'active' : ''}`}
                onClick={() => setGameSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
        <GameNav onOpenTrading={() => setTradingOpen(true)} />
      </div>

      <div className="game-main">
        <div className="game-panel-left">
          <TextLog />
        </div>

        <div className="game-panel-right">
          <StokeButton />
          <NPCList />
          {showBuildings && <BuildPanel />}
          {showCrafting && <CraftPanel />}
          <Inventory />
          {showQuests && <QuestLog />}
          {showDeparture && <DepartureSequence />}
        </div>
      </div>

      {activeDialogue && <NPCPanel />}
      {explorationActive && !combatActive && <MapView />}
      {combatActive && <CombatView />}
      {tradingOpen && <TradingPost onClose={() => setTradingOpen(false)} />}
      <POIPopup />
      <ForcedReturnPopup />
      <Notifications />
    </div>
  );
}
