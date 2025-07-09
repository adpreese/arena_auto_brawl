// Character Management System
import { Character, Stats, Vec2 } from './types';
import { GAME_CONFIG } from './config';
import { randomStat, randomEmoji, randomColor, generateUniqueId, getRandomPosition, randomPlanetaryHouse, randomAttackEffect, createRandomStats } from './utils';

export class CharacterManager {
  private characters: Map<string, Character> = new Map();
  private deathTracker: string[] = [];
  private gameEventListeners: ((event: any) => void)[] = [];
  
  generateCandidates(count: number = 3): Character[] {
    const candidates: Character[] = [];
    
    for (let i = 0; i < count; i++) {
      const stats = createRandomStats();
      
      const candidate: Character = {
        id: generateUniqueId(),
        stats,
        currentHP: stats.hp,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        currentTargetId: null,
        lastAttackTime: 0,
        emoji: randomEmoji(),
        color: randomColor(),
        isPlayer: false,
        isDead: false,
        lastDirectionChange: 0,
        randomDirection: Math.random() * Math.PI * 2,
        planetaryHouse: randomPlanetaryHouse(),
        equippedAttack: randomAttackEffect(),
        inventory: []
      };
      
      candidates.push(candidate);
    }
    
    return candidates;
  }
  
  spawnCombatants(playerCharacter: Character, existingEnemies?: Character[]): void {
    this.characters.clear();
    
    // Set player as player character
    playerCharacter.isPlayer = true;
    playerCharacter.isDead = false;
    playerCharacter.position = getRandomPosition(GAME_CONFIG.ARENA_SIZE);
    this.characters.set(playerCharacter.id, playerCharacter);
    
    const usedPositions: Vec2[] = [playerCharacter.position];
    
    if (existingEnemies && existingEnemies.length > 0) {
      // Use existing enemies but reset their positions and state
      for (const enemy of existingEnemies) {
        let position: Vec2;
        let attempts = 0;
        do {
          position = getRandomPosition(GAME_CONFIG.ARENA_SIZE);
          attempts++;
        } while (this.isPositionTooClose(position, usedPositions) && attempts < 50);
        
        usedPositions.push(position);
        
        // Reset enemy for new round
        enemy.position = position;
        enemy.velocity = { x: 0, y: 0 };
        enemy.currentTargetId = null;
        enemy.lastAttackTime = 0;
        enemy.isDead = false;
        enemy.currentHP = enemy.stats.hp; // Use updated HP from stats
        enemy.lastDirectionChange = 0;
        enemy.randomDirection = Math.random() * Math.PI * 2;
        
        this.characters.set(enemy.id, enemy);
      }
    } else {
      // Generate new NPCs (first round)
      for (let i = 1; i < GAME_CONFIG.TOTAL_COMBATANTS; i++) {
        const stats = createRandomStats();
        
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
          currentHP: stats.hp,
          position,
          velocity: { x: 0, y: 0 },
          currentTargetId: null,
          lastAttackTime: 0,
          emoji: randomEmoji(),
          color: randomColor(),
          isPlayer: false,
          isDead: false,
          lastDirectionChange: 0,
          randomDirection: Math.random() * Math.PI * 2,
          level: 1,
          baseStats: { ...stats },
          planetaryHouse: randomPlanetaryHouse(),
          equippedAttack: randomAttackEffect(),
          inventory: []
        };
        
        this.characters.set(npc.id, npc);
      }
    }
  }
  
  getEnemyCharacters(): Character[] {
    return Array.from(this.characters.values()).filter(c => !c.isPlayer);
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

  clearDeathTracker() {
    this.deathTracker = [];
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
  
  takeDamage(characterId: string, damage: number, attackerId?: string): void {
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
      
      // If killed by player, emit player kill event
      if (attackerId) {
        const attacker = this.characters.get(attackerId);
        if (attacker && attacker.isPlayer) {
          this.emitEvent({
            type: 'player_kill',
            data: { 
              killer: attacker,
              victim: character,
              scoreAwarded: 3
            }
          });
        }
      }
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