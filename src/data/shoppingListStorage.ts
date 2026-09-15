/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SHOPPING_LIST_KEY = 'nowaste_shopping_list_v1';

export interface ShoppingListItem {
  id: string;
  name: string;
  addedAt: string;
  checked: boolean;
}

export function getShoppingList(): ShoppingListItem[] {
  try {
    const raw = localStorage.getItem(SHOPPING_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erreur lecture liste de courses:', e);
    return [];
  }
}

function saveShoppingList(items: ShoppingListItem[]): void {
  try {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erreur sauvegarde liste de courses:', e);
  }
}

/**
 * Ajoute un article à la liste s'il n'y est pas déjà (non coché, même nom, insensible à la casse).
 */
export function addShoppingListItem(list: ShoppingListItem[], name: string): ShoppingListItem[] {
  const trimmed = name.trim();
  if (!trimmed) return list;

  const alreadyPresent = list.some(
    (item) => !item.checked && item.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (alreadyPresent) return list;

  const newItem: ShoppingListItem = {
    id: `sl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: trimmed,
    addedAt: new Date().toISOString(),
    checked: false,
  };
  const updated = [newItem, ...list];
  saveShoppingList(updated);
  return updated;
}

export function toggleShoppingListItem(list: ShoppingListItem[], id: string): ShoppingListItem[] {
  const updated = list.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
  saveShoppingList(updated);
  return updated;
}

export function removeShoppingListItem(list: ShoppingListItem[], id: string): ShoppingListItem[] {
  const updated = list.filter((item) => item.id !== id);
  saveShoppingList(updated);
  return updated;
}

export function clearCheckedItems(list: ShoppingListItem[]): ShoppingListItem[] {
  const updated = list.filter((item) => !item.checked);
  saveShoppingList(updated);
  return updated;
}
