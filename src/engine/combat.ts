// Combat system — encounters, tick resolution, items, rewards

import { ChapterState, CombatState } from '@/types/game';
import { ChapterConfig, EnemyDef } from '@/types/chapter';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Start combat
// ---------------------------------------------------------------------------

export function startCombat(
  state: ChapterState,
  enemyId: string,
  config: ChapterConfig,
): ChapterState {
  const enemyDef = findEnemy(enemyId, config);
  if (!enemyDef) return state;

  const combat: CombatState = {
    active: true,
    enemyId,
    enemyHealth: enemyDef.health,
    enemyMaxHealth: enemyDef.health,
    playerHealth: state.health,
    ticksElapsed: 0,
    log: [`A ${enemyDef.name} appears! ${enemyDef.description}`],
  };

  const logEntry = createLogEntry(
    `Combat: A ${enemyDef.name} attacks!`,
    'combat',
  );

  return {
    ...state,
    combat,
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Process one combat tick
// ---------------------------------------------------------------------------

export function processCombatTick(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  if (!state.combat.active || !state.combat.enemyId) return state;

  const enemyDef = findEnemy(state.combat.enemyId, config);
  if (!enemyDef) return endCombat(state, 'error');

  let combat = { ...state.combat };
  const combatLog = [...combat.log];
  let playerHealth = combat.playerHealth ?? state.health;
  let enemyHealth = combat.enemyHealth ?? 0;
  const ticksElapsed = (combat.ticksElapsed ?? 0) + 1;

  // Player attacks
  const playerAttack = getPlayerAttack(state);
  const playerDefense = getPlayerDefense(state);
  const damageToEnemy = calculateDamage(playerAttack, enemyDef.defense);
  enemyHealth = Math.max(0, enemyHealth - damageToEnemy);
  combatLog.push(`You deal ${damageToEnemy} damage.`);

  // Check enemy death
  if (enemyHealth <= 0) {
    combatLog.push(`The ${enemyDef.name} is defeated!`);
    combat = {
      ...combat,
      enemyHealth: 0,
      ticksElapsed,
      log: combatLog,
    };

    let s = { ...state, combat };
    s = applyVictory(s, enemyDef, config);
    return s;
  }

  // Enemy attacks (speed determines if enemy attacks this tick)
  const enemyAttacksThisTick = ticksElapsed % Math.max(1, Math.ceil(10 / enemyDef.speed)) === 0;
  if (enemyAttacksThisTick) {
    const damageToPlayer = calculateDamage(enemyDef.attack, playerDefense);
    playerHealth = Math.max(0, playerHealth - damageToPlayer);
    combatLog.push(`The ${enemyDef.name} deals ${damageToPlayer} damage.`);
  }

  // Check player death
  if (playerHealth <= 0) {
    combatLog.push('You have been defeated...');
    combat = {
      ...combat,
      playerHealth: 0,
      enemyHealth,
      ticksElapsed,
      log: combatLog,
    };
    const logEntry = createLogEntry('Defeated in combat.', 'combat');
    return {
      ...state,
      combat: { ...combat, active: false },
      health: 0,
      textLog: [...state.textLog, logEntry],
    };
  }

  combat = {
    ...combat,
    playerHealth,
    enemyHealth,
    ticksElapsed,
    log: combatLog,
  };

  return { ...state, combat, health: playerHealth };
}

// ---------------------------------------------------------------------------
// Flee from combat
// ---------------------------------------------------------------------------

export function flee(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  if (!state.combat.active) return state;

  // Fleeing costs health (taking a hit as you run)
  const enemyDef = findEnemy(state.combat.enemyId ?? '', config);
  let fleeDamage = 0;
  if (enemyDef) {
    fleeDamage = Math.ceil(enemyDef.attack * 0.5);
  }

  const newHealth = Math.max(0, state.health - fleeDamage);
  const combatLog = [
    ...state.combat.log,
    fleeDamage > 0
      ? `You flee, taking ${fleeDamage} damage as you escape!`
      : 'You manage to flee!',
  ];

  const logEntry = createLogEntry('You fled from combat.', 'combat');

  return {
    ...state,
    combat: {
      active: false,
      log: combatLog,
    },
    health: newHealth,
    textLog: [...state.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Use item in combat
// ---------------------------------------------------------------------------

export function useItem(
  state: ChapterState,
  itemId: string,
): ChapterState {
  if (!state.combat.active) return state;

  const itemIndex = state.inventory.findIndex(
    (item) => item.id === itemId && item.type === 'consumable' && item.quantity > 0,
  );
  if (itemIndex < 0) return state;

  const item = state.inventory[itemIndex];
  const newInventory = [...state.inventory];

  // Reduce quantity or remove
  if (item.quantity <= 1) {
    newInventory.splice(itemIndex, 1);
  } else {
    newInventory[itemIndex] = { ...item, quantity: item.quantity - 1 };
  }

  // Apply item effects
  let playerHealth = state.combat.playerHealth ?? state.health;
  const combatLog = [...state.combat.log];

  if (item.bonuses) {
    // Healing
    if (item.bonuses.heal) {
      const heal = item.bonuses.heal;
      playerHealth = Math.min(state.maxHealth, playerHealth + heal);
      combatLog.push(`Used ${item.name}. Recovered ${heal} health.`);
    }

    // Direct damage to enemy
    if (item.bonuses.damage && state.combat.enemyHealth !== undefined) {
      const dmg = item.bonuses.damage;
      const newEnemyHealth = Math.max(0, state.combat.enemyHealth - dmg);
      combatLog.push(`Used ${item.name}. Dealt ${dmg} damage.`);

      return {
        ...state,
        inventory: newInventory,
        combat: {
          ...state.combat,
          playerHealth,
          enemyHealth: newEnemyHealth,
          log: combatLog,
        },
        health: playerHealth,
      };
    }
  }

  return {
    ...state,
    inventory: newInventory,
    combat: {
      ...state.combat,
      playerHealth,
      log: combatLog,
    },
    health: playerHealth,
  };
}

// ---------------------------------------------------------------------------
// Damage formula
// ---------------------------------------------------------------------------

export function calculateDamage(attack: number, defense: number): number {
  // Base damage: attack minus defense mitigation, with minimum 1
  const baseDamage = Math.max(1, attack - Math.floor(defense * 0.5));

  // Variance: +/- 20%
  const variance = 0.8 + Math.random() * 0.4;

  return Math.max(1, Math.round(baseDamage * variance));
}

// ---------------------------------------------------------------------------
// Get combat rewards
// ---------------------------------------------------------------------------

export function getCombatRewards(
  enemyId: string,
  config: ChapterConfig,
): { items: { itemId: string; quantity: number }[]; experience: number } {
  const enemyDef = findEnemy(enemyId, config);
  if (!enemyDef) return { items: [], experience: 0 };

  const items: { itemId: string; quantity: number }[] = [];

  for (const loot of enemyDef.loot) {
    if (Math.random() < loot.chance) {
      items.push({ itemId: loot.itemId, quantity: loot.quantity });
    }
  }

  return { items, experience: enemyDef.experienceValue };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function findEnemy(enemyId: string, config: ChapterConfig): EnemyDef | undefined {
  return config.map.enemies.find((e) => e.id === enemyId);
}

function getPlayerAttack(state: ChapterState): number {
  let attack = 1; // base attack
  // Use equipped weapon only
  if (state.equipped.weapon) {
    const weapon = state.inventory.find((i) => i.id === state.equipped.weapon);
    if (weapon?.attack) attack += weapon.attack;
  }
  // Accessory bonus
  if (state.equipped.accessory) {
    const acc = state.inventory.find((i) => i.id === state.equipped.accessory);
    if (acc?.attack) attack += acc.attack;
  }
  return attack;
}

function getPlayerDefense(state: ChapterState): number {
  let defense = 0;
  // Use equipped armor only
  if (state.equipped.armor) {
    const armor = state.inventory.find((i) => i.id === state.equipped.armor);
    if (armor?.defense) defense += armor.defense;
  }
  // Accessory bonus
  if (state.equipped.accessory) {
    const acc = state.inventory.find((i) => i.id === state.equipped.accessory);
    if (acc?.defense) defense += acc.defense;
  }
  return defense;
}

function endCombat(state: ChapterState, reason: string): ChapterState {
  return {
    ...state,
    combat: {
      active: false,
      log: [...state.combat.log, `Combat ended: ${reason}`],
    },
  };
}

function applyVictory(
  state: ChapterState,
  enemyDef: EnemyDef,
  config: ChapterConfig,
): ChapterState {
  // Get rewards
  const rewards = getCombatRewards(enemyDef.id, config);

  let s = { ...state };

  // Add loot directly to resources
  const newResources = { ...s.resources };
  for (const loot of rewards.items) {
    newResources[loot.itemId] = (newResources[loot.itemId] ?? 0) + loot.quantity;
  }

  const combatLog = [...s.combat.log];
  if (rewards.items.length > 0) {
    combatLog.push(
      `Loot: ${rewards.items.map((i) => `${i.quantity}x ${i.itemId}`).join(', ')}`,
    );
  }

  const logEntry = createLogEntry(
    `victory. the ${enemyDef.name} falls.`,
    'combat',
  );

  // Set flags for special enemies
  const newFlags = { ...s.flags };
  if (enemyDef.id === 'raiderKing') {
    newFlags.bossDefeated = true;
    newFlags.raiderKingDefeated = true;
  }

  return {
    ...s,
    combat: {
      active: false,
      log: combatLog,
    },
    resources: newResources,
    flags: newFlags,
    health: s.combat.playerHealth ?? s.health,
    textLog: [...s.textLog, logEntry],
  };
}
