// Shop System for post-round upgrades
import { Character, Item, AttackScroll, EvolveStone, StatChip, ShopCard, ShopState, AttackEffect, Element, Stats } from './types';
import { generateUniqueId } from './utils';
import { elementRegistry } from './ElementRegistry';
import { InventorySystem } from './InventorySystem';

interface ShopConfig {
  baseRerollCost: number;
  rerollCostIncrease: number;
  maxRerollCost: number;
  cardCosts: {
    character: { base: number; perRound: number };
    attack: { base: number; perRound: number };
    evolve: { base: number; perRound: number };
    stat: { base: number; perRound: number };
  };
  rarityWeights: {
    common: number;
    uncommon: number;
    rare: number;
    legendary: number;
  };
}

export class ShopSystem {
  private inventorySystem: InventorySystem;
  private config: ShopConfig;

  constructor() {
    this.inventorySystem = new InventorySystem();
    this.config = {
      baseRerollCost: 1,
      rerollCostIncrease: 5,
      maxRerollCost: 100,
      cardCosts: {
        character: { base: 8, perRound: 2 },
        attack: { base: 4, perRound: 1 },
        evolve: { base: 8, perRound: 2 },
        stat: { base: 4, perRound: 1 }
      },
      rarityWeights: {
        common: 50,
        uncommon: 30,
        rare: 15,
        legendary: 5
      }
    };
  }

  /**
   * Generate a new shop state with 6 cards
   */
  generateShop(currentRound: number): ShopState {
    const cards: ShopCard[] = [];
    
    // Generate 6 cards with a mix of characters and items
    for (let i = 0; i < 6; i++) {
      const cardType = this.getRandomCardType();
      const card = this.generateCard(cardType, currentRound);
      cards.push(card);
    }

    return {
      cards,
      rerollCost: this.config.baseRerollCost,
      rerollCount: 0
    };
  }

  /**
   * Reroll the shop for a fee
   */
  rerollShop(currentShop: ShopState, currentRound: number): ShopState {
    const newCards: ShopCard[] = [];
    
    for (let i = 0; i < 6; i++) {
      const cardType = this.getRandomCardType();
      const card = this.generateCard(cardType, currentRound);
      newCards.push(card);
    }

    const newRerollCost = Math.min(
      currentShop.rerollCost + this.config.rerollCostIncrease,
      this.config.maxRerollCost
    );

    return {
      cards: newCards,
      rerollCost: newRerollCost,
      rerollCount: currentShop.rerollCount + 1
    };
  }

  /**
   * Purchase a card from the shop
   */
  purchaseCard(
    card: ShopCard,
    player: Character,
    currentScore: number
  ): { success: boolean; newScore: number; message?: string } {
    if (currentScore < card.cost) {
      return { success: false, newScore: currentScore, message: 'Not enough score!' };
    }

    if (card.type === 'character') {
      return this.purchaseCharacter(card, player, currentScore);
    } else if (card.type === 'item') {
      return this.purchaseItem(card, player, currentScore);
    }

    return { success: false, newScore: currentScore, message: 'Invalid card type!' };
  }

  private purchaseCharacter(
    card: ShopCard,
    player: Character,
    currentScore: number
  ): { success: boolean; newScore: number; message?: string } {
    if (!card.character) {
      return { success: false, newScore: currentScore, message: 'Invalid character card!' };
    }

    // Replace current character but keep inventory
    const newCharacter = { ...card.character };
    newCharacter.inventory = [...player.inventory]; // Transfer inventory
    newCharacter.isPlayer = true;
    newCharacter.currentHP = newCharacter.stats.hp; // Full HP
    
    // Update the player reference (this would need to be handled by the calling system)
    Object.assign(player, newCharacter);

    return { 
      success: true, 
      newScore: currentScore - card.cost, 
      message: 'Character purchased!' 
    };
  }

  private purchaseItem(
    card: ShopCard,
    player: Character,
    currentScore: number
  ): { success: boolean; newScore: number; message?: string } {
    if (!card.item) {
      return { success: false, newScore: currentScore, message: 'Invalid item card!' };
    }

    if (!this.inventorySystem.hasSpace(player)) {
      return { success: false, newScore: currentScore, message: 'Inventory full!' };
    }

    const added = this.inventorySystem.addItem(player, card.item);
    if (!added) {
      return { success: false, newScore: currentScore, message: 'Could not add item to inventory!' };
    }

    return { 
      success: true, 
      newScore: currentScore - card.cost, 
      message: 'Item purchased!' 
    };
  }

  private getRandomCardType(): 'character' | 'item' {
    // 30% chance for character, 70% for item
    return Math.random() < 0.3 ? 'character' : 'item';
  }

  private generateCard(type: 'character' | 'item', currentRound: number): ShopCard {
    const baseId = generateUniqueId();
    
    if (type === 'character') {
      const character = this.generateRandomCharacter();
      return {
        id: baseId,
        type: 'character',
        cost: this.config.cardCosts.character.base + (currentRound * this.config.cardCosts.character.perRound),
        character
      };
    } else {
      const item = this.generateRandomItem(currentRound);
      return {
        id: baseId,
        type: 'item',
        cost: item.cost + (currentRound * this.getItemRoundCost(item.type)),
        item
      };
    }
  }

  private generateRandomCharacter(): Character {
    const element = elementRegistry.getRandomElement();
    const planetaryHouses = ['Jupiter', 'Saturn', 'Mars', 'Neptune', 'Mercury', 'Venus', 'Sol'] as const;
    const emojis = ['🦁', '🐯', '🐸', '🐱', '🐺', '🐻', '🦊', '🐨', '🐼', '🐹'];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    const stats: Stats = {
      hp: 5 + Math.floor(Math.random() * 5), // 15-25
      defense: 1 + Math.floor(Math.random() * 4), // 1-5
      attackPower: 3 + Math.floor(Math.random() * 7), // 3-10
      speed: 50 + Math.floor(Math.random() * 30), // 50-80
      element
    };

    return {
      id: generateUniqueId(),
      stats,
      currentHP: stats.hp,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      currentTargetId: null,
      lastAttackTime: 0,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      isPlayer: false,
      isDead: false,
      lastDirectionChange: 0,
      randomDirection: Math.random() * Math.PI * 2,
      level: 1,
      baseStats: { ...stats },
      planetaryHouse: planetaryHouses[Math.floor(Math.random() * planetaryHouses.length)],
      equippedAttack: this.generateRandomAttack(),
      inventory: []
    };
  }

  private generateRandomItem(currentRound: number): Item {
    const rarity = this.getRandomRarity();
    const itemTypes = ['attack', 'evolve', 'stat'] as const;
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

    switch (itemType) {
      case 'attack':
        return this.generateAttackScroll(rarity);
      case 'evolve':
        return this.inventorySystem.createRandomEvolveStone();
      case 'stat':
        return this.inventorySystem.createRandomStatChip();
      default:
        return this.inventorySystem.createRandomStatChip();
    }
  }

  private generateAttackScroll(rarity: Item['rarity']): AttackScroll {
    const attack = this.generateRandomAttack();
    
    return {
      id: generateUniqueId(),
      type: 'attack',
      name: `${attack.name} Scroll`,
      icon: attack.icon,
      description: `Teaches ${attack.name} attack`,
      rarity,
      cost: this.config.cardCosts.attack.base,
      attackEffect: attack
    };
  }

  private generateRandomAttack(): AttackEffect {
    const elements = elementRegistry.getAllElements();
    const element = elements[Math.floor(Math.random() * elements.length)];
    const shapes = ['circle', 'line', 'cone', 'rectangle', 'arc'] as const;
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    const attackNames = ['Blast', 'Strike', 'Burst', 'Wave', 'Pulse', 'Surge', 'Beam', 'Orb'];
    const name = `${element} ${attackNames[Math.floor(Math.random() * attackNames.length)]}`;

    return {
      id: generateUniqueId(),
      name,
      icon: elementRegistry.getElementIcon(element),
      baseDamage: 2 + Math.floor(Math.random() * 4), // 2-6
      cooldown: this.calculateCooldownFromSize(shape, 60), // Base size of 60
      element,
      aoeShape: shape,
      aoeSize: 40 + Math.floor(Math.random() * 80), // 40-120
      aoeWidth: shape === 'line' || shape === 'rectangle' ? 20 + Math.floor(Math.random() * 20) : undefined,
      aoeAngle: shape === 'cone' || shape === 'arc' ? 30 + Math.floor(Math.random() * 60) : undefined,
      particleColor: elementRegistry.getElementColor(element).replace('#', ''),
      particleEffect: this.getParticleEffect(element)
    };
  }

  private calculateCooldownFromSize(shape: string, size: number): number {
    // Larger attacks = longer cooldown
    const baseMultiplier = shape === 'circle' ? 1.2 : shape === 'cone' ? 1.1 : 1.0;
    const cooldown = Math.floor(300 + (size * baseMultiplier * 20));
    return Math.min(Math.max(cooldown, 300), 3000);
  }

  private getParticleEffect(element: Element): string {
    switch (element) {
      case 'Fire': return 'explosion';
      case 'Water': return 'splash';
      case 'Electric': return 'spark';
      case 'Earth': return 'crystals';
      case 'Air': return 'wind';
      case 'Ice': return 'crystals';
      default: return 'explosion';
    }
  }

  private getRandomRarity(): Item['rarity'] {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(this.config.rarityWeights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return rarity as Item['rarity'];
      }
    }
    
    return 'common';
  }

  private getItemRoundCost(itemType: Item['type']): number {
    switch (itemType) {
      case 'attack': return this.config.cardCosts.attack.perRound;
      case 'evolve': return this.config.cardCosts.evolve.perRound;
      case 'stat': return this.config.cardCosts.stat.perRound;
      default: return 0;
    }
  }
}