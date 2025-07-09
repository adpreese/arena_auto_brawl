// Inventory Management System
import { Character, Item, AttackScroll, EvolveStone, StatChip, AttackEffect, Element } from './types';
import { generateUniqueId } from './utils';
import { elementRegistry } from './ElementRegistry';

export class InventorySystem {
  private static readonly MAX_INVENTORY_SIZE = 2;

  /**
   * Add an item to character inventory
   * @param character - The character to add item to
   * @param item - The item to add
   * @returns true if successfully added, false if inventory full
   */
  addItem(character: Character, item: Item): boolean {
    if (character.inventory.length >= InventorySystem.MAX_INVENTORY_SIZE) {
      return false;
    }
    
    character.inventory.push(item);
    return true;
  }

  /**
   * Remove an item from character inventory
   * @param character - The character to remove item from
   * @param itemId - The ID of the item to remove
   * @returns true if successfully removed, false if not found
   */
  removeItem(character: Character, itemId: string): boolean {
    const itemIndex = character.inventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return false;
    }
    
    character.inventory.splice(itemIndex, 1);
    return true;
  }

  /**
   * Use an item from character inventory
   * @param character - The character using the item
   * @param itemId - The ID of the item to use
   * @returns true if successfully used, false if not found or can't use
   */
  useItem(character: Character, itemId: string): boolean {
    const item = character.inventory.find(item => item.id === itemId);
    if (!item) {
      return false;
    }

    switch (item.type) {
      case 'attack':
        return this.useAttackScroll(character, item as AttackScroll);
      case 'evolve':
        return this.useEvolveStone(character, item as EvolveStone);
      case 'stat':
        return this.useStatChip(character, item as StatChip);
      default:
        return false;
    }
  }

  /**
   * Equip an attack scroll, replacing current equipped attack
   */
  private useAttackScroll(character: Character, attackScroll: AttackScroll): boolean {
    character.equippedAttack = attackScroll.attackEffect;
    this.removeItem(character, attackScroll.id);
    return true;
  }

  /**
   * Apply evolution stone effects to character
   */
  private useEvolveStone(character: Character, evolveStone: EvolveStone): boolean {
    // Check if character meets element requirement (if any)
    if (evolveStone.targetElement && character.stats.element !== evolveStone.targetElement) {
      return false;
    }

    // Apply stat multipliers
    character.stats.hp = Math.floor(character.stats.hp * evolveStone.statMultipliers.hp);
    character.stats.defense = Math.floor(character.stats.defense * evolveStone.statMultipliers.defense);
    character.stats.attackPower = Math.floor(character.stats.attackPower * evolveStone.statMultipliers.attackPower);
    character.stats.speed = Math.floor(character.stats.speed * evolveStone.statMultipliers.speed);

    // Update current HP to match new max HP
    character.currentHP = character.stats.hp;

    // Apply new sprite if provided
    if (evolveStone.newSprite) {
      character.emoji = evolveStone.newSprite;
    }

    // Mark as evolved
    character.isEvolved = true;

    // Remove item from inventory
    this.removeItem(character, evolveStone.id);
    return true;
  }

  /**
   * Apply stat chip bonus to character
   */
  private useStatChip(character: Character, statChip: StatChip): boolean {
    switch (statChip.statType) {
      case 'hp':
        character.stats.hp += statChip.bonus;
        character.currentHP += statChip.bonus; // Also heal current HP
        break;
      case 'defense':
        character.stats.defense += statChip.bonus;
        break;
      case 'attackPower':
        character.stats.attackPower += statChip.bonus;
        break;
      case 'speed':
        character.stats.speed += statChip.bonus;
        break;
      default:
        return false;
    }

    // Remove item from inventory
    this.removeItem(character, statChip.id);
    return true;
  }

  /**
   * Check if character inventory has space
   */
  hasSpace(character: Character): boolean {
    return character.inventory.length < InventorySystem.MAX_INVENTORY_SIZE;
  }

  /**
   * Get available inventory space
   */
  getAvailableSpace(character: Character): number {
    return InventorySystem.MAX_INVENTORY_SIZE - character.inventory.length;
  }

  /**
   * Find items of a specific type in character inventory
   */
  findItemsByType<T extends Item>(character: Character, type: Item['type']): T[] {
    return character.inventory.filter(item => item.type === type) as T[];
  }

  /**
   * Create a random stat chip
   */
  createRandomStatChip(): StatChip {
    const statTypes: StatChip['statType'][] = ['hp', 'defense', 'attackPower', 'speed'];
    const randomStatType = statTypes[Math.floor(Math.random() * statTypes.length)];
    
    return {
      id: generateUniqueId(),
      type: 'stat',
      name: `${randomStatType.charAt(0).toUpperCase() + randomStatType.slice(1)} Chip`,
      icon: this.getStatChipIcon(randomStatType),
      description: `Increases ${randomStatType} by 1`,
      rarity: 'common',
      cost: 5,
      statType: randomStatType,
      bonus: 1
    };
  }

  /**
   * Create a random evolve stone
   */
  createRandomEvolveStone(): EvolveStone {
    const elements = elementRegistry.getAllElements();
    const targetElement = elements[Math.floor(Math.random() * elements.length)];
    
    return {
      id: generateUniqueId(),
      type: 'evolve',
      name: `${targetElement} Evolution Stone`,
      icon: '💎',
      description: `Evolves ${targetElement} characters with stat boosts`,
      rarity: 'rare',
      cost: 2,
      targetElement,
      statMultipliers: {
        hp: 1.5,
        defense: 1.3,
        attackPower: 1.4,
        speed: 1.2
      },
      newSprite: this.getEvolvedSprite(targetElement)
    };
  }

  private getStatChipIcon(statType: StatChip['statType']): string {
    switch (statType) {
      case 'hp': return '❤️';
      case 'defense': return '🛡️';
      case 'attackPower': return '⚔️';
      case 'speed': return '💨';
      default: return '🔧';
    }
  }

  private getEvolvedSprite(element: Element): string {
    switch (element) {
      case 'Fire': return '🔥';
      case 'Water': return '🌊';
      case 'Electric': return '⚡';
      case 'Earth': return '🌍';
      case 'Air': return '💨';
      case 'Ice': return '❄️';
      default: return '✨';
    }
  }
}