'use client';

import type { OfflineProgressSummary } from '@/persistence/offline';

interface OfflineSummaryProps {
  summary: OfflineProgressSummary;
  onDismiss: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}${
    mins > 0 ? `, ${mins} min` : ''
  }`;
}

export default function OfflineSummary({
  summary,
  onDismiss,
}: OfflineSummaryProps) {
  const resourceEntries = Object.entries(summary.resourcesGained).filter(
    ([, amount]) => amount !== 0,
  );

  return (
    <div className="offline-overlay">
      <div className="offline-container">
        <div className="offline-title">while you were away...</div>
        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
          {formatDuration(summary.secondsElapsed)} passed
          {summary.capped && ' (capped at 24h)'}
        </div>

        {resourceEntries.length > 0 ? (
          <div className="offline-resources">
            {resourceEntries.map(([resId, amount]) => (
              <div
                key={resId}
                className={
                  amount > 0
                    ? 'offline-resource-gain'
                    : 'offline-resource-loss'
                }
              >
                {resId}: {amount > 0 ? '+' : ''}
                {Math.floor(amount)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            nothing changed.
          </div>
        )}

        <button className="offline-dismiss" onClick={onDismiss}>
          continue
        </button>
      </div>
    </div>
  );
}
