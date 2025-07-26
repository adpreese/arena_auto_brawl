// AI Controller for Character Movement and Targeting
import { Character, PlanetaryHouse } from './types';
import { GAME_CONFIG } from './config';
import { findNearestLivingEnemy, normalize, clamp, checkCollision, resolveCollision, distance } from './utils';

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
      
      // Update movement based on planetary house strategy
      this.updateMovementByHouse(character, nearestEnemy, characters, dt, currentTime);
      this.clampToArena(character);
    }
    
    // Handle collisions between all characters
    this.handleCollisions(characters);
  }
  
  private updateMovementByHouse(character: Character, target: Character | null, allCharacters: Character[], dt: number, currentTime: number): void {
    switch (character.planetaryHouse) {
      case 'Jupiter':
        this.updateJupiterMovement(character, target, allCharacters, dt, currentTime);
        break;
      case 'Saturn':
        this.updateSaturnMovement(character, target, dt, currentTime);
        break;
      case 'Mars':
        this.updateMarsMovement(character, target, dt, currentTime);
        break;
      case 'Neptune':
        this.updateNeptuneMovement(character, target, dt, currentTime);
        break;
      case 'Mercury':
        this.updateMercuryMovement(character, target, dt, currentTime);
        break;
      case 'Venus':
        this.updateVenusMovement(character, target, allCharacters, dt, currentTime);
        break;
      case 'Sol':
        this.updateSolMovement(character, target, dt, currentTime);
        break;
      default:
        this.updateDefaultMovement(character, target, dt, currentTime);
    }
  }
  
  private updateDefaultMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      // No target, move randomly
      this.updateRandomMovement(character, dt, currentTime);
      return;
    } else {
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
      const speed = character.stats.speed;
      character.velocity = {
        x: jitteredDirection.x * speed,
        y: jitteredDirection.y * speed
      };
    }
    
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
    const speed = character.stats.speed * 0.5; // Slower when no target
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
  

  private handleCollisions(characters: Character[]): void {
    const radius = GAME_CONFIG.CHARACTER_SIZE / 2;
    
    // Check all pairs of characters for collisions
    for (let i = 0; i < characters.length; i++) {
      if (characters[i].isDead) continue;
      
      for (let j = i + 1; j < characters.length; j++) {
        if (characters[j].isDead) continue;
        
        if (checkCollision(characters[i].position, characters[j].position, radius)) {
          resolveCollision(characters[i], characters[j]);
        }
      }
    }
  }

  // Jupiter House - "The Protector"
  private updateJupiterMovement(character: Character, target: Character | null, allCharacters: Character[], dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      // Reset run away timer when no target
      character.jupiterRunAwayStartTime = undefined;
      return;
    }

    const targetDistance = distance(character.position, target.position);
    const optimalDistance = character.equippedAttack.aoeSize * 1.5; // Maintain medium distance
    const MAX_RUN_AWAY_TIME = 3000; // 3 seconds maximum

    let direction: { x: number; y: number };
    let shouldRunAway = targetDistance < optimalDistance;

    // Check if we've been running away for too long
    if (shouldRunAway) {
      if (character.jupiterRunAwayStartTime === undefined) {
        // Start timing the run away behavior
        character.jupiterRunAwayStartTime = currentTime;
      } else if (currentTime - character.jupiterRunAwayStartTime > MAX_RUN_AWAY_TIME) {
        // Force approach if we've been running away for more than 3 seconds
        shouldRunAway = false;
        character.jupiterRunAwayStartTime = undefined;
      }
    } else {
      // Reset timer when not running away
      character.jupiterRunAwayStartTime = undefined;
    }

    if (shouldRunAway) {
      // Too close, back away slowly
      direction = {
        x: character.position.x - target.position.x,
        y: character.position.y - target.position.y
      };
    } else {
      // Approach cautiously
      direction = {
        x: target.position.x - character.position.x,
        y: target.position.y - character.position.y
      };
    }

    const normalizedDirection = normalize(direction);
    const speed = shouldRunAway ? character.stats.speed * (0.5 + (0.5 * Math.random())) : character.stats.speed; // Slower, more defensive

    character.velocity = {
      x: normalizedDirection.x * speed,
      y: normalizedDirection.y * speed
    };

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }

  // Saturn House - "The Disciplined"
  private updateSaturnMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }

    // Change direction less frequently but more decisively
    if (currentTime - character.lastDirectionChange > 2000 + Math.random() * 1000) {
      const direction = {
        x: target.position.x - character.position.x,
        y: target.position.y - character.position.y
      };

      character.randomDirection = Math.atan2(direction.y, direction.x);
      character.lastDirectionChange = currentTime;
    }

    // Move in straight lines with minimal jitter
    const speed = character.stats.speed;
    character.velocity = {
      x: Math.cos(character.randomDirection) * speed,
      y: Math.sin(character.randomDirection) * speed
    };

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }

  // Mars House - "The Aggressor"
  private updateMarsMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }

    const direction = {
      x: target.position.x - character.position.x,
      y: target.position.y - character.position.y
    };

    const normalizedDirection = normalize(direction);
    const targetDistance = distance(character.position, target.position);

    // High jitter and aggressive movement
    const jitterAngle = (Math.random() - 0.5) * (15 * Math.PI / 180); // ±15 degrees
    const cos = Math.cos(jitterAngle);
    const sin = Math.sin(jitterAngle);

    const jitteredDirection = {
      x: normalizedDirection.x * cos - normalizedDirection.y * sin,
      y: normalizedDirection.x * sin + normalizedDirection.y * cos
    };

    // Speed increases when close to target
    const speedMultiplier = targetDistance < character.equippedAttack.aoeSize * 2 ? 1.3 : 1.1;
    const speed = character.stats.speed * speedMultiplier;

    character.velocity = {
      x: jitteredDirection.x * speed,
      y: jitteredDirection.y * speed
    };

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }

  // Neptune House - "The Mystic"
  private updateNeptuneMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }

    // Flowing, curved movement patterns
    const timeFactor = currentTime * 0.002; // Slow oscillation
    const direction = {
      x: target.position.x - character.position.x,
      y: target.position.y - character.position.y
    };

    const normalizedDirection = normalize(direction);
    
    // Add sine wave to create flowing movement
    const waveOffset = Math.sin(timeFactor + character.id.charCodeAt(0)) * 0.5;
    const perpendicularDirection = {
      x: -normalizedDirection.y,
      y: normalizedDirection.x
    };

    const flowingDirection = {
      x: normalizedDirection.x + perpendicularDirection.x * waveOffset,
      y: normalizedDirection.y + perpendicularDirection.y * waveOffset
    };

    const normalizedFlowing = normalize(flowingDirection);
    
    // Variable speed like ocean currents
    const speedVariation = 0.8 + Math.sin(timeFactor * 1.5) * 0.4;
    const speed = character.stats.speed * speedVariation;

    character.velocity = {
      x: normalizedFlowing.x * speed,
      y: normalizedFlowing.y * speed
    };

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }

  // Mercury House - "The Swift"
  private updateMercuryMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }

    const targetDistance = distance(character.position, target.position);
    const attackRange = character.equippedAttack.aoeSize;

    // Frequent direction changes
    if (currentTime - character.lastDirectionChange > 300 + Math.random() * 400) {
      character.lastDirectionChange = currentTime;
      
      if (targetDistance <= attackRange * 1.2) {
        // Close range: retreat quickly
        character.randomDirection = Math.atan2(
          character.position.y - target.position.y,
          character.position.x - target.position.x
        ) + (Math.random() - 0.5) * Math.PI;
      } else {
        // Long range: approach rapidly
        character.randomDirection = Math.atan2(
          target.position.y - character.position.y,
          target.position.x - character.position.x
        ) + (Math.random() - 0.5) * (Math.PI / 3);
      }
    }

    // Fast movement with sharp turns
    const speed = character.stats.speed * 1.2;
    character.velocity = {
      x: Math.cos(character.randomDirection) * speed,
      y: Math.sin(character.randomDirection) * speed
    };

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }

  // Venus House - "The Graceful"
  private updateVenusMovement(character: Character, target: Character | null, allCharacters: Character[], dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }

    // Avoid clusters, prefer 1v1 engagements
    const nearbyEnemies = allCharacters.filter(c => 
      !c.isDead && c.id !== character.id && 
      distance(character.position, c.position) < character.equippedAttack.aoeSize * 3
    );

    let direction = {
      x: target.position.x - character.position.x,
      y: target.position.y - character.position.y
    };

    // If too many enemies nearby, find space
    if (nearbyEnemies.length > 2) {
      const escapeDirection = { x: 0, y: 0 };
      nearbyEnemies.forEach(enemy => {
        const enemyDirection = {
          x: character.position.x - enemy.position.x,
          y: character.position.y - enemy.position.y
        };
        const normalizedEscape = normalize(enemyDirection);
        escapeDirection.x += normalizedEscape.x;
        escapeDirection.y += normalizedEscape.y;
      });
      direction = normalize(escapeDirection);
    }

    // Smooth, graceful movement
    const normalizedDirection = normalize(direction);
    const smoothingFactor = 0.1;
    
    character.velocity.x += (normalizedDirection.x * character.stats.speed - character.velocity.x) * smoothingFactor;
    character.velocity.y += (normalizedDirection.y * character.stats.speed - character.velocity.y) * smoothingFactor;

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }

  // Sol House - "The Radiant"
  private updateSolMovement(character: Character, target: Character | null, dt: number, currentTime: number): void {
    if (!target) {
      this.updateRandomMovement(character, dt, currentTime);
      return;
    }

    const arenaCenter = {
      x: GAME_CONFIG.ARENA_SIZE / 2,
      y: GAME_CONFIG.ARENA_SIZE / 2
    };

    const distanceToCenter = distance(character.position, arenaCenter);
    const targetDistance = distance(character.position, target.position);

    let direction: { x: number; y: number };

    // Prefer central positioning but still engage enemies
    if (distanceToCenter > GAME_CONFIG.ARENA_SIZE * 0.3) {
      // Too far from center, move toward center
      direction = {
        x: arenaCenter.x - character.position.x,
        y: arenaCenter.y - character.position.y
      };
    } else if (targetDistance > character.equippedAttack.aoeSize * 1.5) {
      // Enemy is far, approach while maintaining central position
      const toTarget = {
        x: target.position.x - character.position.x,
        y: target.position.y - character.position.y
      };
      const toCenter = {
        x: arenaCenter.x - character.position.x,
        y: arenaCenter.y - character.position.y
      };
      
      direction = {
        x: toTarget.x * 0.7 + toCenter.x * 0.3,
        y: toTarget.y * 0.7 + toCenter.y * 0.3
      };
    } else {
      // Engage from current position
      direction = {
        x: target.position.x - character.position.x,
        y: target.position.y - character.position.y
      };
    }

    const normalizedDirection = normalize(direction);
    const speed = character.stats.speed * 0.9; // Steady, confident movement

    character.velocity = {
      x: normalizedDirection.x * speed,
      y: normalizedDirection.y * speed
    };

    character.position.x += character.velocity.x * dt;
    character.position.y += character.velocity.y * dt;
  }
}