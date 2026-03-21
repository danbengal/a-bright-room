'use client';

import { useGameStore } from '@/stores/gameStore';

export default function EnvironmentMeter() {
  const environment = useGameStore((s) => s.chapterState.environment);
  const currentConfig = useGameStore((s) => s.currentConfig);

  if (!currentConfig?.environmentalPressure) return null;

  const envDef = currentConfig.environmentalPressure;
  const value = environment[envDef.id] ?? envDef.meter.startValue;
  const range = envDef.meter.max - envDef.meter.min;
  const pct = range > 0 ? ((value - envDef.meter.min) / range) * 100 : 0;
  const inDanger = value <= envDef.meter.dangerThreshold;
  const inWarning =
    value <= envDef.meter.dangerThreshold * 1.5 && !inDanger;

  let fillClass = 'env-meter-fill env-meter-fill--safe';
  if (inDanger) fillClass = 'env-meter-fill env-meter-fill--danger';
  else if (inWarning) fillClass = 'env-meter-fill env-meter-fill--warning';

  return (
    <div className="env-meter">
      <span className="env-meter-label">{envDef.name}</span>
      <div className="env-meter-track">
        <div className={fillClass} style={{ width: `${pct}%` }} />
      </div>
      {inDanger && (
        <span className="env-meter-warning">danger</span>
      )}
    </div>
  );
}
