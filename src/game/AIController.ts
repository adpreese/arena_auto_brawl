// AI Controller for Character Movement and Targeting
import { Character } from './types';
import { GAME_CONFIG } from './config';
import { findNearestLivingEnemy, normalize, clamp } from './utils';

export class AIController {
  update(characters: Character[], dt: number): void {
    const currentTime = Date.now();
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      // Find nearest target
      const nearestEnemy = findNearestLivingEnemy(character, characters);
      if (nearestEnemy) {
        character.currentTargetId = nearestEnemy.id;
      } else {
        character.currentTargetId = null;
      }
      
      // Update movement
      this.updateMovement(character, nearestEnemy, dt, currentTime);
      this.clampToArena(character);
    }
  }
  
  private updateMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      // No target, move randomly
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }
    
    // Calculate direction to target
    const direction = {
      x: target.position.x - character.position.x,
      y: target.position.y - character.position.y
    };
    
    const normalizedDirection = normalize(direction);
    
    // Add random jitter (±5 degrees)
    const jitterAngle = (Math.random() - 0.5) * (5 * Math.PI / 180); // ±5 degrees in radians
    const cos = Math.cos(jitterAngle);
    const sin = Math.sin(jitterAngle);
    
    const jitteredDirection = {
      x: normalizedDirection.x * cos - normalizedDirection.y * sin,
      y: normalizedDirection.x * sin + normalizedDirection.y * cos
    };
    
    // Update velocity
    const speed = GAME_CONFIG.MOVE_PX_PER_SEC;
    character.velocity = {
      x: jitteredDirection.x * speed,
      y: jitteredDirection.y * speed
    };
    
    // Update position
    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }
  
  private updateRandomMovement(character: Character, dt: number, currentTime: number): void {
    // Change direction every 1-3 seconds
    if (currentTime - character.lastDirectionChange > 1000 + Math.random() * 2000) {
      character.randomDirection = Math.random() * Math.PI * 2;
      character.lastDirectionChange = currentTime;
    }
    
    // Move in random direction
    const speed = GAME_CONFIG.MOVE_PX_PER_SEC * 0.5; // Slower when no target
    character.velocity = {
      x: Math.cos(character.randomDirection) * speed,
      y: Math.sin(character.randomDirection) * speed
    };
    
    // Update position
    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }
  
  private clampToArena(character: Character): void {
    const halfSize = GAME_CONFIG.CHARACTER_SIZE / 2;
    const maxPos = GAME_CONFIG.ARENA_SIZE - halfSize;
    
    character.position.x = clamp(character.position.x, halfSize, maxPos);
    character.position.y = clamp(character.position.y, halfSize, maxPos);
    
    // Bounce off walls by reversing velocity
    if (character.position.x <= halfSize || character.position.x >= maxPos) {
      character.velocity.x *= -0.5;
      character.randomDirection = Math.PI - character.randomDirection;
    }
    if (character.position.y <= halfSize || character.position.y >= maxPos) {
      character.velocity.y *= -0.5;
      character.randomDirection = -character.randomDirection;
    }
  }
}