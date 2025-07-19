// Combat System for Battle Logic
import { Character, Vec2 } from './types';
import { GAME_CONFIG } from './config';
import { isInAttackAOE, normalize, calculateDamage } from './utils';
import { CharacterManager } from './CharacterManager';
import { elementRegistry } from './ElementRegistry';

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
      
      // Check if enough time has passed since last attack (using cooldown)
      const attackCooldown = attacker.equippedAttack.cooldown;
      if (currentTime - attacker.lastAttackTime < attackCooldown) continue;
      
      // Calculate attack direction towards target
      const attackDirection = {
        x: target.position.x - attacker.position.x,
        y: target.position.y - attacker.position.y
      };
      
      // Check if target is within AOE range
      if (isInAttackAOE(target.position, attacker.position, attackDirection, attacker.equippedAttack)) {
        // Perform AOE attack (hits all characters in AOE)
        this.performAOEAttack(attacker, attackDirection, characters, currentTime);
      }
    }
  }
  
  private performAOEAttack(attacker: Character, attackDirection: Vec2, allCharacters: Character[], currentTime: number): void {
    const hitTargets: Character[] = [];
    
    // Find all characters in AOE
    for (const character of allCharacters) {
      if (character.id === attacker.id || character.isDead) continue;
      
      if (isInAttackAOE(character.position, attacker.position, attackDirection, attacker.equippedAttack)) {
        hitTargets.push(character);
      }
    }
    
    // Update attacker's last attack time
    attacker.lastAttackTime = currentTime;
    
    // Apply damage to all hit targets
    for (const target of hitTargets) {
      const damage = calculateDamage(attacker, target); // Use new damage calculation
      this.characterManager.takeDamage(target.id, damage, attacker.id);
      
      // Calculate effectiveness for audio feedback
      const elementalModifier = elementRegistry.calculateElementalModifier(
        attacker.equippedAttack.element,
        attacker.stats.element,
        target.stats.element
      );
      
      // Determine effectiveness type
      let effectivenessType: 'super-effective' | 'not-very-effective' | 'regular-attack';
      if (elementalModifier > 1.2) {
        effectivenessType = 'super-effective';
      } else if (elementalModifier < 0.8) {
        effectivenessType = 'not-very-effective';
      } else {
        effectivenessType = 'regular-attack';
      }
      
      // Emit combat hit event for each target
      this.emitEvent({
        type: 'combat_hit',
        data: {
          attacker,
          target,
          damage,
          position: { ...target.position },
          attackEffect: attacker.equippedAttack,
          elementalModifier,
          effectivenessType
        }
      });
    }
    
    // Emit AOE attack event for visual effects
    this.emitEvent({
      type: 'aoe_attack',
      data: {
        attacker,
        position: { ...attacker.position },
        direction: normalize(attackDirection),
        attackEffect: attacker.equippedAttack,
        hitTargets
      }
    });
  }

  // Removed calculateAttackDamage method as it's now in utils with elemental calculations
  
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