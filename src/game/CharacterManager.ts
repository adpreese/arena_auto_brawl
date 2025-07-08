// Character Management System
import { Character, Stats, Vec2 } from './types';
import { GAME_CONFIG } from './config';
import { randomStat, randomEmoji, randomColor, generateUniqueId, getRandomPosition } from './utils';

export class CharacterManager {
  private characters: Map<string, Character> = new Map();
  private deathTracker: string[] = [];
  private gameEventListeners: ((event: any) => void)[] = [];
  
  generateCandidates(count: number = 3): Character[] {
    const candidates: Character[] = [];
    
    for (let i = 0; i < count; i++) {
      const stats: Stats = {
        attack: randomStat(),
        defense: randomStat(),
        special: randomStat(),
        hp: GAME_CONFIG.MAX_HP
      };
      
      const candidate: Character = {
        id: generateUniqueId(),
        stats,
        currentHP: GAME_CONFIG.MAX_HP,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        currentTargetId: null,
        lastAttackTime: 0,
        emoji: randomEmoji(),
        color: randomColor(),
        isPlayer: false,
        isDead: false,
        lastDirectionChange: 0,
        randomDirection: Math.random() * Math.PI * 2
      };
      
      candidates.push(candidate);
    }
    
    return candidates;
  }
  
  spawnCombatants(playerCharacter: Character): void {
    this.characters.clear();
    
    // Set player as player character
    playerCharacter.isPlayer = true;
    playerCharacter.position = getRandomPosition(GAME_CONFIG.ARENA_SIZE);
    this.characters.set(playerCharacter.id, playerCharacter);
    
    // Generate NPCs
    const usedPositions: Vec2[] = [playerCharacter.position];
    
    for (let i = 1; i < GAME_CONFIG.TOTAL_COMBATANTS; i++) {
      const stats: Stats = {
        attack: randomStat(),
        defense: randomStat(),
        special: randomStat(),
        hp: GAME_CONFIG.MAX_HP
      };
      
      let position: Vec2;
      let attempts = 0;
      do {
        position = getRandomPosition(GAME_CONFIG.ARENA_SIZE);
        attempts++;
      } while (this.isPositionTooClose(position, usedPositions) && attempts < 50);
      
      usedPositions.push(position);
      
      const npc: Character = {
        id: generateUniqueId(),
        stats,
        currentHP: GAME_CONFIG.MAX_HP,
        position,
        velocity: { x: 0, y: 0 },
        currentTargetId: null,
        lastAttackTime: 0,
        emoji: randomEmoji(),
        color: randomColor(),
        isPlayer: false,
        isDead: false,
        lastDirectionChange: 0,
        randomDirection: Math.random() * Math.PI * 2
      };
      
      this.characters.set(npc.id, npc);
    }
  }
  
  private isPositionTooClose(position: Vec2, existingPositions: Vec2[]): boolean {
    const minDistance = GAME_CONFIG.CHARACTER_SIZE * 2;
    return existingPositions.some(existing => {
      const dx = position.x - existing.x;
      const dy = position.y - existing.y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });
  }

  addDeadCharacterByID(characterId) {
    this.deathTracker.push(characterId);
  }
  
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
  
  getLivingCharacters(): Character[] {
    return Array.from(this.characters.values()).filter(c => !c.isDead);
  }
  
  getCharacterById(id: string): Character | undefined {
    return this.characters.get(id);
  }
  
  getPlayerCharacter(): Character | undefined {
    return Array.from(this.characters.values()).find(c => c.isPlayer);
  }
  
  takeDamage(characterId: string, damage: number): void {
    const character = this.characters.get(characterId);
    if (!character || character.isDead) return;
    
    character.currentHP -= damage;
    
    if (character.currentHP <= 0) {
      character.currentHP = 0;
      character.isDead = true;
      
      // Emit death event
      this.emitEvent({
        type: 'character_died',
        data: { character }
      });
    }
  }
  
  removeDead(): void {
  }
  
  getLivingCount(): number {
    return this.getLivingCharacters().length;
  }
  
  getPlayerPlace(): number {
    const player = this.getPlayerCharacter();
    if (!player) return GAME_CONFIG.TOTAL_COMBATANTS;
    
    if (!player.isDead) return 1; // Winner
    
    
    return this.deathTracker.indexOf(player.id) + 1;
  }
  
  addEventListener(listener: (event: any) => void): void {
    this.gameEventListeners.push(listener);
  }
  
  removeEventListener(listener: (event: any) => void): void {
    const index = this.gameEventListeners.indexOf(listener);
    if (index > -1) {
      this.gameEventListeners.splice(index, 1);
    }
  }
  
  private emitEvent(event: any): void {
    this.gameEventListeners.forEach(listener => listener(event));
  }
}