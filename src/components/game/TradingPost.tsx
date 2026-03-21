'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';

interface TradeOffer {
  id: string;
  give: { resource: string; amount: number };
  receive: { resource: string; amount: number };
}

const TRADES: TradeOffer[] = [
  { id: 'fur_to_wood', give: { resource: 'fur', amount: 5 }, receive: { resource: 'wood', amount: 30 } },
  { id: 'wood_to_fur', give: { resource: 'wood', amount: 50 }, receive: { resource: 'fur', amount: 5 } },
  { id: 'meat_to_fur', give: { resource: 'meat', amount: 10 }, receive: { resource: 'fur', amount: 5 } },
  { id: 'fur_to_leather', give: { resource: 'fur', amount: 10 }, receive: { resource: 'leather', amount: 3 } },
  { id: 'leather_to_iron', give: { resource: 'leather', amount: 10 }, receive: { resource: 'iron', amount: 5 } },
  { id: 'iron_to_coal', give: { resource: 'iron', amount: 5 }, receive: { resource: 'coal', amount: 5 } },
  { id: 'coal_to_iron', give: { resource: 'coal', amount: 5 }, receive: { resource: 'iron', amount: 3 } },
  { id: 'scales_to_cloth', give: { resource: 'scales', amount: 5 }, receive: { resource: 'cloth', amount: 3 } },
  { id: 'cloth_to_leather', give: { resource: 'cloth', amount: 5 }, receive: { resource: 'leather', amount: 3 } },
  { id: 'steel_to_alloy', give: { resource: 'steel', amount: 10 }, receive: { resource: 'alloy', amount: 1 } },
  { id: 'meat_to_water', give: { resource: 'meat', amount: 5 }, receive: { resource: 'water', amount: 10 } },
  { id: 'herb_to_meat', give: { resource: 'herb', amount: 5 }, receive: { resource: 'meat', amount: 10 } },
];

const MULTIPLIERS = [1, 2, 5, 10] as const;

export default function TradingPost({ onClose }: { onClose: () => void }) {
  const resources = useGameStore((s) => s.chapterState.resources);
  const [message, setMessage] = useState('');
  const [multiplier, setMultiplier] = useState<number>(1);

  const executeTrade = (trade: TradeOffer) => {
    const state = useGameStore.getState();
    const giveCost = trade.give.amount * multiplier;
    const receiveAmount = trade.receive.amount * multiplier;
    const current = state.chapterState.resources[trade.give.resource] ?? 0;

    if (current < giveCost) {
      setMessage(`not enough ${trade.give.resource}.`);
      return;
    }

    const newResources = { ...state.chapterState.resources };
    newResources[trade.give.resource] = (newResources[trade.give.resource] ?? 0) - giveCost;
    newResources[trade.receive.resource] = (newResources[trade.receive.resource] ?? 0) + receiveAmount;

    useGameStore.setState({
      chapterState: {
        ...state.chapterState,
        resources: newResources,
      },
    });

    setMessage(`traded ${giveCost} ${trade.give.resource} for ${receiveAmount} ${trade.receive.resource}.`);
  };

  return (
    <div className="map-overlay">
      <div className="trading-container">
        <div className="map-header">
          <span className="map-title">trading post</span>
          <span className="multiplier-controls">
            {MULTIPLIERS.map((m) => (
              <button
                key={m}
                className={`multiplier-btn ${multiplier === m ? 'active' : ''}`}
                onClick={() => setMultiplier(m)}
              >
                {m}x
              </button>
            ))}
          </span>
          <button className="panel-item-btn" onClick={onClose}>
            close
          </button>
        </div>

        <div className="trading-message">{message || 'barter what you have for what you need.'}</div>

        <div className="panel-list">
          {TRADES.map((trade) => {
            const giveCost = trade.give.amount * multiplier;
            const receiveAmount = trade.receive.amount * multiplier;
            const canAfford = (resources[trade.give.resource] ?? 0) >= giveCost;
            return (
              <div key={trade.id} className="panel-item">
                <span className={`trading-give ${!canAfford ? 'panel-item-cost--unaffordable' : ''}`}>
                  {giveCost} {trade.give.resource}
                </span>
                <span className="trading-arrow">→</span>
                <span className="trading-receive">
                  {receiveAmount} {trade.receive.resource}
                </span>
                <button
                  className="panel-item-btn"
                  disabled={!canAfford}
                  onClick={() => executeTrade(trade)}
                >
                  trade
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
