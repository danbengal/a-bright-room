'use client';

import { useGameStore } from '@/stores/gameStore';

export default function Inventory() {
  const inventory = useGameStore((s) => s.chapterState.inventory);
  const equipped = useGameStore((s) => s.chapterState.equipped);
  const health = useGameStore((s) => s.chapterState.health);
  const maxHealth = useGameStore((s) => s.chapterState.maxHealth);

  // Only show equipped gear (best items) — filter out inferior duplicates
  const equippedItems = inventory.filter((item) =>
    item.id === equipped.weapon || item.id === equipped.armor || item.id === equipped.accessory,
  );
  const consumables = inventory.filter((item) => item.type === 'consumable' && item.quantity > 0);

  if (consumables.length === 0 && equippedItems.length === 0) return null;

  const useItem = (itemId: string) => {
    const state = useGameStore.getState();
    const item = state.chapterState.inventory.find((i) => i.id === itemId);
    if (!item || item.quantity <= 0) return;

    let newHealth = state.chapterState.health;
    let message = '';

    if (itemId === 'healingSalve') {
      const healAmount = 30;
      newHealth = Math.min(state.chapterState.maxHealth, newHealth + healAmount);
      message = `used healing salve. restored ${healAmount} hp.`;
    } else if (item.bonuses?.heal) {
      newHealth = Math.min(state.chapterState.maxHealth, newHealth + item.bonuses.heal);
      message = `used ${item.name}. restored ${item.bonuses.heal} hp.`;
    } else {
      return;
    }

    const newInventory = state.chapterState.inventory.map((i) =>
      i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i,
    ).filter((i) => i.quantity > 0);

    useGameStore.setState({
      chapterState: {
        ...state.chapterState,
        health: newHealth,
        inventory: newInventory,
      },
    });

    state.addNotification(message, 2000);
  };

  return (
    <div className="panel">
      <div className="panel-header">inventory</div>
      <div className="panel-list">
        <div className="inventory-health">
          hp: {health} / {maxHealth}
        </div>
        {equippedItems.map((item) => (
          <div key={item.id} className="panel-item panel-item--equipped">
            <span className="panel-item-name">
              {item.name} <span className="equipped-badge">[equipped]</span>
            </span>
            {item.attack ? <span className="item-stat">atk:{item.attack}</span> : null}
            {item.defense ? <span className="item-stat">def:{item.defense}</span> : null}
          </div>
        ))}
        {consumables.map((item) => (
          <div key={item.id} className="panel-item">
            <span className="panel-item-name">{item.name}</span>
            <span className="panel-item-level">x{item.quantity}</span>
            <button
              className="panel-item-btn"
              onClick={() => useItem(item.id)}
              disabled={item.id === 'healingSalve' && health >= maxHealth}
            >
              use
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
