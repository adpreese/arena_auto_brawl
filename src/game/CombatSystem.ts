// Combat System for Battle Logic
import { Character } from './types';
import { GAME_CONFIG } from './config';
import { isWithinAttackRange, calculateDamage } from './utils';
import { CharacterManager } from './CharacterManager';

export class CombatSystem {
  private characterManager: CharacterManager;
  private gameEventListeners: ((event: any) => void)[] = [];
  
  constructor(characterManager: CharacterManager) {
    this.characterManager = characterManager;
  }
  
  update(dt: number): void {
    const currentTime = Date.now();
    const characters = this.characterManager.getLivingCharacters();
    
    for (const attacker of characters) {
      if (attacker.isDead || !attacker.currentTargetId) continue;
      
      const target = this.characterManager.getCharacterById(attacker.currentTargetId);
      if (!target || target.isDead) continue;
      
      // Check if enough time has passed since last attack
      if (currentTime - attacker.lastAttackTime < GAME_CONFIG.ATTACK_COOLDOWN_MS) continue;
      
      // Check if target is within attack range
      if (!isWithinAttackRange(attacker, target)) continue;
      
      // Perform attack
      this.performAttack(attacker, target, currentTime);
    }
  }
  
  private performAttack(attacker: Character, target: Character, currentTime: number): void {
    const damage = calculateDamage(attacker, target);
    
    // Apply damage
    this.characterManager.takeDamage(target.id, damage);
    
    // Update attacker's last attack time
    attacker.lastAttackTime = currentTime;
    
    // Emit combat hit event
    this.emitEvent({
      type: 'combat_hit',
      data: {
        attacker,
        target,
        damage,
        position: { ...target.position }
      }
    });
  }
  
  checkForGameEnd(): boolean {
    const livingCount = this.characterManager.getLivingCount();
    return livingCount <= 1;
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