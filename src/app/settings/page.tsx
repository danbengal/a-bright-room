'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/stores/gameStore';
import {
  getSaveSlotInfo,
  type SaveSlotInfo,
  type SaveSlot,
} from '@/persistence/save';

function formatTimestamp(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPlaytime(ticks: number | null): string {
  if (!ticks) return '';
  const hours = Math.floor(ticks / 3600);
  const mins = Math.floor((ticks % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function SettingsPage() {
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialized = useGameStore((s) => s.initialized);
  const saveToSlot = useGameStore((s) => s.saveToSlot);
  const loadFromSlot = useGameStore((s) => s.loadFromSlot);
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const addNotification = useGameStore((s) => s.addNotification);

  useEffect(() => {
    setSlots(getSaveSlotInfo());
  }, []);

  const refreshSlots = () => {
    setSlots(getSaveSlotInfo());
  };

  const handleSave = (slot: SaveSlot) => {
    saveToSlot(slot);
    refreshSlots();
  };

  const handleLoad = (slot: SaveSlot) => {
    const success = loadFromSlot(slot);
    if (success) refreshSlots();
  };

  const handleExport = () => {
    const json = exportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a-bright-room-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('save exported.', 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        const success = importSave(text);
        if (success) refreshSlots();
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = () => {
    if (!importText.trim()) return;
    const success = importSave(importText.trim());
    if (success) {
      setImportText('');
      setShowImport(false);
      refreshSlots();
    }
  };

  // Manual save slots (filter out autosave for the UI)
  const manualSlots = slots.filter(
    (s) => s.slot !== 'autosave',
  );
  const autosaveSlot = slots.find((s) => s.slot === 'autosave');

  return (
    <div className="settings-page">
      <div className="settings-header">settings</div>

      <Link href={initialized ? '/play' : '/'} className="settings-back">
        {initialized ? '< back to game' : '< back'}
      </Link>

      {/* Autosave info */}
      {autosaveSlot && (
        <div className="settings-section">
          <div className="settings-section-title">autosave</div>
          <div className="save-slot">
            <div className="save-slot-info">
              {autosaveSlot.exists ? (
                <>
                  {autosaveSlot.chapter} &middot; {autosaveSlot.phase} &middot;{' '}
                  {formatTimestamp(autosaveSlot.timestamp)}
                </>
              ) : (
                'empty'
              )}
            </div>
            {autosaveSlot.exists && (
              <div className="save-slot-actions">
                <button onClick={() => handleLoad('autosave')}>load</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual save slots */}
      <div className="settings-section">
        <div className="settings-section-title">save slots</div>
        {manualSlots.map((slot) => (
          <div key={slot.slot} className="save-slot">
            <div className="save-slot-info">
              <span style={{ color: 'var(--color-text-muted)' }}>
                {slot.slot.replace('_', ' ')}:
              </span>{' '}
              {slot.exists ? (
                <>
                  {slot.phase} &middot;{' '}
                  {formatPlaytime(slot.playtime)} &middot;{' '}
                  {formatTimestamp(slot.timestamp)}
                </>
              ) : (
                'empty'
              )}
            </div>
            <div className="save-slot-actions">
              {initialized && (
                <button onClick={() => handleSave(slot.slot)}>
                  save
                </button>
              )}
              {slot.exists && (
                <button onClick={() => handleLoad(slot.slot)}>
                  load
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export / Import */}
      <div className="settings-section">
        <div className="settings-section-title">export / import</div>
        <div className="import-export">
          {initialized && (
            <button onClick={handleExport}>export save</button>
          )}
          <button onClick={() => fileInputRef.current?.click()}>
            import file
          </button>
          <button onClick={() => setShowImport(!showImport)}>
            import text
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
        {showImport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="paste save json here..."
              rows={4}
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: '0.8rem',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                padding: '0.5rem',
                resize: 'vertical',
              }}
            />
            <button
              className="panel-item-btn"
              onClick={handleImportText}
              style={{ alignSelf: 'flex-start' }}
            >
              import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
