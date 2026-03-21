'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { quests as questDefs } from '@/chapters/chapter01-dark-room/quests';

export default function QuestLog() {
  const quests = useGameStore((s) => s.chapterState.quests);
  const currentConfig = useGameStore((s) => s.currentConfig);

  const questEntries = useMemo(() => {
    return Object.entries(quests)
      .filter(([, q]) => q.active || q.completed)
      .sort((a, b) => {
        if (a[1].active && !b[1].active) return -1;
        if (!a[1].active && b[1].active) return 1;
        return 0;
      });
  }, [quests]);

  if (questEntries.length === 0) return null;

  const getQuestName = (questId: string): string => {
    const def = questDefs.find((q) => q.id === questId);
    if (def) return def.name;
    if (!currentConfig) return questId;
    const npc = currentConfig.npcs.find((n) => n.questId === questId);
    if (npc) return `${npc.name}'s task`;
    return questId.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  };

  return (
    <div className="panel">
      <div className="panel-header">quests</div>
      <div className="panel-list">
        {questEntries.map(([id, quest]) => (
          <QuestRow
            key={id}
            questId={id}
            name={getQuestName(id)}
            step={quest.step}
            active={quest.active}
            completed={quest.completed}
          />
        ))}
      </div>
    </div>
  );
}

function QuestRow({
  questId,
  name,
  step,
  active,
  completed,
}: {
  questId: string;
  name: string;
  step: number;
  active: boolean;
  completed: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const def = questDefs.find((q) => q.id === questId);
  const currentStep = def?.steps.find((s) => s.step === step);
  const totalSteps = def?.steps.length ?? 0;

  return (
    <div className="panel-item-wrapper">
      <div
        className={`quest-item ${
          completed ? 'quest-item--completed' : 'quest-item--active'
        }`}
      >
        <span
          className="panel-item-name panel-item-name--hoverable"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {name}
        </span>
        {active && !completed && (
          <span className="quest-objective">
            step {step + 1}/{totalSteps}
          </span>
        )}
        {completed && (
          <span className="quest-objective quest-objective--done">done</span>
        )}
      </div>
      {hovered && def && (
        <div className="tooltip-popup">
          <p className="tooltip-desc">{def.description}</p>
          {currentStep && !completed && (
            <>
              <p className="tooltip-step">{currentStep.description}</p>
              <p className="tooltip-hint">{currentStep.hint}</p>
            </>
          )}
          {completed && (
            <p className="tooltip-step">quest complete.</p>
          )}
        </div>
      )}
    </div>
  );
}
