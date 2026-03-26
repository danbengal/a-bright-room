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
import ChapterComplete from '@/components/game/ChapterComplete';
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
  const flags = useGameStore((s) => s.chapterState.flags);

  const [tradingOpen, setTradingOpen] = useState(false);
  const [showSaveExport, setShowSaveExport] = useState(false);

  // Initialize game ONCE on mount — check URL for continue flag
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get('continue') === '1') {
      const { loadFromLocalStorage, SAVE_KEYS } = require('@/persistence/save');
      const save = loadFromLocalStorage(SAVE_KEYS.autosave);
      if (save) {
        useGameStore.getState().loadGame(save);
        return;
      }
    }
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
  const showDeparture = phase === 'departure' || unlockedFeatures.includes('vessel') || flags.vesselBlueprintRevealed;

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
            <button
              className="speed-btn"
              onClick={() => setShowSaveExport(true)}
            >
              save
            </button>
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
      <ChapterComplete />
      {showSaveExport && <SaveExportModal onClose={() => setShowSaveExport(false)} />}
      <Notifications />
    </div>
  );
}

function SaveExportModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate save code on mount
    const state = useGameStore.getState();
    const saveState = {
      version: state.version,
      lastSaveTimestamp: Date.now(),
      currentChapter: state.currentChapter,
      chapterState: state.chapterState,
      globalState: state.globalState,
    };
    const json = JSON.stringify(saveState);
    const encoded = btoa(json);
    setCode(encoded);

    // Also save to autosave slot
    state.autoSave();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="map-overlay">
      <div className="save-modal">
        <h3 className="save-modal-title">save code</h3>
        <p className="save-modal-desc">
          copy this code and paste it into &quot;load save&quot; on the title screen to restore your progress.
        </p>
        <textarea
          className="import-textarea"
          value={code}
          readOnly
          rows={6}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
        <div className="save-modal-actions">
          <button className="poi-popup-btn poi-popup-btn--enter" onClick={handleCopy}>
            {copied ? 'copied' : 'copy to clipboard'}
          </button>
          <button className="poi-popup-btn poi-popup-btn--flee" onClick={onClose}>
            close
          </button>
        </div>
        <p className="save-modal-note">game also auto-saves to this browser every 30 seconds.</p>
      </div>
    </div>
  );
}
