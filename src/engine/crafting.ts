// Crafting system — recipes, crafting, unlock checks

import { ChapterState, InventoryItem } from '@/types/game';
import { ChapterConfig, CraftRecipeDef } from '@/types/chapter';
import { canAfford, spendResources, isUnlockConditionMet } from './resources';
import { createLogEntry } from './core';

// ---------------------------------------------------------------------------
// Get available recipes (unlocked and visible)
// ---------------------------------------------------------------------------

export function getAvailableRecipes(
  state: ChapterState,
  config: ChapterConfig,
): CraftRecipeDef[] {
  return config.crafting.filter((recipe) => {
    // Must be unlocked
    if (!state.unlockedCrafting.includes(recipe.id)) return false;

    // Non-stackable items that are already crafted are excluded
    if (!recipe.result.stackable && state.crafted.includes(recipe.id)) return false;

    return true;
  });
}

// ---------------------------------------------------------------------------
// Check if a recipe can be crafted
// ---------------------------------------------------------------------------

export function canCraft(
  state: ChapterState,
  recipeId: string,
  config: ChapterConfig,
): boolean {
  const recipe = config.crafting.find((r) => r.id === recipeId);
  if (!recipe) return false;

  // Must be unlocked
  if (!state.unlockedCrafting.includes(recipeId)) return false;

  // Non-stackable items can only be crafted once
  if (!recipe.result.stackable && state.crafted.includes(recipeId)) return false;

  // Check building requirements
  if (recipe.buildingRequired) {
    const building = state.buildings[recipe.buildingRequired];
    if (!building || building.level <= 0) return false;
    if (recipe.buildingLevel && building.level < recipe.buildingLevel) return false;
  }

  // Check resource costs
  if (!canAfford(state, recipe.costs)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Craft an item
// ---------------------------------------------------------------------------

export function craft(
  state: ChapterState,
  recipeId: string,
  config: ChapterConfig,
): ChapterState {
  if (!canCraft(state, recipeId, config)) return state;

  const recipe = config.crafting.find((r) => r.id === recipeId)!;

  // Deduct costs
  let s = spendResources(state, recipe.costs);

  // Create the inventory item
  const newItem: InventoryItem = {
    id: recipe.result.itemId,
    name: recipe.name,
    type: recipe.result.type,
    attack: recipe.result.attack,
    defense: recipe.result.defense,
    bonuses: recipe.result.bonuses,
    description: recipe.result.description,
    stackable: recipe.result.stackable,
    quantity: 1,
  };

  // Add to inventory (stack if applicable)
  const newInventory = [...s.inventory];
  if (recipe.result.stackable) {
    const existingIndex = newInventory.findIndex((item) => item.id === newItem.id);
    if (existingIndex >= 0) {
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        quantity: newInventory[existingIndex].quantity + 1,
      };
    } else {
      newInventory.push(newItem);
    }
  } else {
    newInventory.push(newItem);
  }

  // Mark as crafted
  const newCrafted = [...s.crafted];
  if (!newCrafted.includes(recipeId)) {
    newCrafted.push(recipeId);
  }

  // Log it
  const logEntry = createLogEntry(`Crafted ${recipe.name}.`, 'system');

  return {
    ...s,
    inventory: newInventory,
    crafted: newCrafted,
    textLog: [...s.textLog, logEntry],
  };
}

// ---------------------------------------------------------------------------
// Check craft unlocks
// ---------------------------------------------------------------------------

export function checkCraftUnlocks(
  state: ChapterState,
  config: ChapterConfig,
): ChapterState {
  const newUnlocked = [...state.unlockedCrafting];
  let changed = false;

  for (const recipe of config.crafting) {
    if (newUnlocked.includes(recipe.id)) continue;

    if (isUnlockConditionMet(recipe.unlockCondition, state)) {
      // Also check building requirements are met (building exists)
      if (recipe.buildingRequired) {
        const building = state.buildings[recipe.buildingRequired];
        if (!building || building.level <= 0) continue;
        if (recipe.buildingLevel && building.level < recipe.buildingLevel) continue;
      }
      newUnlocked.push(recipe.id);
      changed = true;
    }
  }

  if (!changed) return state;
  return { ...state, unlockedCrafting: newUnlocked };
}
