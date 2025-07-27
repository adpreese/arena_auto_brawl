// Arena Brawl Utility Functions
import { Vec2, Character, LevelUpOption, PlanetaryHouse, AttackEffect, Stats, Element } from './types';
import { GAME_CONFIG } from './config';
import { elementRegistry } from './ElementRegistry';
import { characterRegistry } from './CharacterRegistry';


export function randomEmoji(): string {
  return characterRegistry.getRandomEmoji();
}

export function randomColor(): string {
  return characterRegistry.getRandomColor();
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function normalize(vec: Vec2): Vec2 {
  const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: vec.x / len, y: vec.y / len };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getRandomPosition(arenaSize: number, margin: number = GAME_CONFIG.CHARACTER_SIZE): Vec2 {
  return {
    x: margin + Math.random() * (arenaSize - 2 * margin),
    y: margin + Math.random() * (arenaSize - 2 * margin)
  };
}

export function findNearestLivingEnemy(character: Character, allCharacters: Character[]): Character | null {
  let nearest: Character | null = null;
  let nearestDistSq = Infinity;
  
  for (const other of allCharacters) {
    if (other.id !== character.id && !other.isDead) {
      const distSq = distanceSquared(character.position, other.position);
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = other;
      }
    }
  }
  
  return nearest;
}

export function isWithinAttackRange(attacker: Character, target: Character): boolean {
  return distance(attacker.position, target.position) <= attacker.equippedAttack.aoeSize;
}

export function calculateDamage(attacker: Character, defender: Character): number {
  // New damage formula: base × (1 + attackPower/10) × elementalModifier - defense
  const baseDamage = attacker.equippedAttack.baseDamage;
  const attackPowerMultiplier = 1 + (attacker.stats.attackPower / 100);
  const elementalModifier = elementRegistry.calculateElementalModifier(
    attacker.equippedAttack.element,
    attacker.stats.element,
    defender.stats.element
  );
  
  const rawDamage = Math.floor(baseDamage * attackPowerMultiplier * elementalModifier * ((Math.log(defender.stats.defense) / Math.log(attacker.stats.attackPower))*0.9));
  return Math.max(1, rawDamage); // Minimum 1 damage
}

export function checkCollision(pos1: Vec2, pos2: Vec2, radius: number): boolean {
  return distance(pos1, pos2) < radius * 2;
}

export function resolveCollision(char1: Character, char2: Character): void {
  const dist = distance(char1.position, char2.position);
  const minDist = GAME_CONFIG.CHARACTER_SIZE;
  
  if (dist < minDist && dist > 0) {
    const overlap = minDist - dist;
    const dir = normalize({
      x: char2.position.x - char1.position.x,
      y: char2.position.y - char1.position.y
    });
    
    const moveAmount = overlap / 2;
    char1.position.x -= dir.x * moveAmount;
    char1.position.y -= dir.y * moveAmount;
    char2.position.x += dir.x * moveAmount;
    char2.position.y += dir.y * moveAmount;
  }
}


export function randomPlanetaryHouse(): PlanetaryHouse {
  return characterRegistry.getRandomPlanetaryHouse() as PlanetaryHouse;
}

export function getPlanetaryHouseSymbol(house: PlanetaryHouse): string {
  return characterRegistry.getPlanetaryHouseSymbol(house);
}

export function getPlanetaryHouseColor(house: PlanetaryHouse): string {
  return characterRegistry.getPlanetaryHouseColor(house);
}

// Import attack effects from centralized config
export { getAttackEffects, randomAttackEffect, getAttackById } from './attacks';

// Helper function to create random stats with the new system
export function createRandomStats(): Stats {
  const statRanges = characterRegistry.getStatRanges();
  return {
    hp: statRanges.hp.min + Math.floor(Math.random() * (statRanges.hp.max - statRanges.hp.min + 1)),
    defense: statRanges.defense.min + Math.floor(Math.random() * (statRanges.defense.max - statRanges.defense.min + 1)),
    attackPower: statRanges.attackPower.min + Math.floor(Math.random() * (statRanges.attackPower.max - statRanges.attackPower.min + 1)),
    speed: statRanges.speed.min + Math.floor(Math.random() * (statRanges.speed.max - statRanges.speed.min + 1)),
    element: elementRegistry.getRandomElement()
  };
}

// Create random stats based on character type (for more variety)
export function createRandomStatsForType(type?: string): Stats {
  const characterType = type || characterRegistry.getRandomCharacterType();
  const baseStats = characterRegistry.createRandomStatsForType(characterType);
  
  return {
    hp: baseStats.hp,
    defense: baseStats.defense,
    attackPower: baseStats.attackPower,
    speed: baseStats.speed,
    element: elementRegistry.getRandomElement()
  };
}

// Get a random emoji that fits a character type
export function randomEmojiForType(type?: string): string {
  const characterType = type || characterRegistry.getRandomCharacterType();
  return characterRegistry.getRandomEmojiForType(characterType);
}

// AOE Calculation Functions
export function isInCircleAOE(targetPos: Vec2, attackerPos: Vec2, radius: number): boolean {
  return distance(targetPos, attackerPos) <= radius;
}

export function isInLineAOE(targetPos: Vec2, attackerPos: Vec2, targetDirection: Vec2, length: number, width: number): boolean {
  const toTarget = {
    x: targetPos.x - attackerPos.x,
    y: targetPos.y - attackerPos.y
  };
  
  const normalizedDirection = normalize(targetDirection);
  
  // Project target position onto attack direction
  const projectionLength = toTarget.x * normalizedDirection.x + toTarget.y * normalizedDirection.y;
  
  // Check if target is within line length
  if (projectionLength < 0 || projectionLength > length) {
    return false;
  }
  
  // Calculate perpendicular distance
  const perpendicularDistance = Math.abs(
    toTarget.x * (-normalizedDirection.y) + toTarget.y * normalizedDirection.x
  );
  
  return perpendicularDistance <= width / 2;
}

export function isInConeAOE(targetPos: Vec2, attackerPos: Vec2, direction: Vec2, range: number, angleInDegrees: number): boolean {
  const toTarget = {
    x: targetPos.x - attackerPos.x,
    y: targetPos.y - attackerPos.y
  };
  
  const targetDistance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y);
  
  // Check if target is within range
  if (targetDistance > range) {
    return false;
  }
  
  const normalizedDirection = normalize(direction);
  const normalizedToTarget = normalize(toTarget);
  
  // Calculate angle between direction and target
  const dotProduct = normalizedDirection.x * normalizedToTarget.x + normalizedDirection.y * normalizedToTarget.y;
  const angleToTarget = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
  const angleToTargetDegrees = (angleToTarget * 180) / Math.PI;
  
  return angleToTargetDegrees <= angleInDegrees / 2;
}

export function isInRectangleAOE(targetPos: Vec2, attackerPos: Vec2, direction: Vec2, length: number, width: number): boolean {
  return isInLineAOE(targetPos, attackerPos, direction, length, width);
}

// ARC AOE calculation - similar to cone but with hollow center
export function isInArcAOE(targetPos: Vec2, attackerPos: Vec2, direction: Vec2, range: number, angleInDegrees: number, innerRadius: number = 20): boolean {
  const toTarget = {
    x: targetPos.x - attackerPos.x,
    y: targetPos.y - attackerPos.y
  };
  
  const targetDistance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y);
  
  // Check if target is within range but outside inner radius
  if (targetDistance > range || targetDistance < innerRadius) {
    return false;
  }
  
  const normalizedDirection = normalize(direction);
  const normalizedToTarget = normalize(toTarget);
  
  // Calculate angle between direction and target
  const dotProduct = normalizedDirection.x * normalizedToTarget.x + normalizedDirection.y * normalizedToTarget.y;
  const angleToTarget = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
  const angleToTargetDegrees = (angleToTarget * 180) / Math.PI;
  
  return angleToTargetDegrees <= angleInDegrees / 2;
}

export function isInAttackAOE(targetPos: Vec2, attackerPos: Vec2, attackDirection: Vec2, attack: AttackEffect): boolean {
  switch (attack.aoeShape) {
    case 'circle':
      return isInCircleAOE(targetPos, attackerPos, attack.aoeSize);
    case 'line':
      return isInLineAOE(targetPos, attackerPos, attackDirection, attack.aoeSize, attack.aoeWidth || 20);
    case 'cone':
      return isInConeAOE(targetPos, attackerPos, attackDirection, attack.aoeSize, attack.aoeAngle || 45);
    case 'rectangle':
      return isInRectangleAOE(targetPos, attackerPos, attackDirection, attack.aoeSize, attack.aoeWidth || 30);
    case 'arc':
      return isInArcAOE(targetPos, attackerPos, attackDirection, attack.aoeSize, attack.aoeAngle || 60);
    default:
      return false;
  }
}

export function upgradeEnemyCharacter(character: Character, round: number = 1): Character {
  const upgradedCharacter = { ...character };
  
  // Initialize base stats if not present
  if (!upgradedCharacter.baseStats) {
    upgradedCharacter.baseStats = { ...character.stats };
  }
  
  // Initialize level if not present
  if (!upgradedCharacter.level) {
    upgradedCharacter.level = 1;
  }
  
  // Generate random stat upgrades (same ranges as player)
  const statUpgrades = {
    hp: Math.floor(Math.random() * 6), // 0-5
    defense: Math.floor(Math.random() * 4), // 0-3
    attackPower: Math.floor(Math.random() * 4), // 0-3
    speed: Math.floor(Math.random() * 4) // 0-3
  };

  // Scaling factor makes later rounds 10-30% stronger than the previous
  const roundsAhead = Math.max(round - (upgradedCharacter.level ?? 1), 1);
  const scalingFactor = 1 + (0.1 + Math.random() * 0.2) * roundsAhead;
  
  // Apply random upgrades and round-based scaling
  upgradedCharacter.stats = {
    ...upgradedCharacter.stats,
    hp: Math.round((upgradedCharacter.stats.hp + statUpgrades.hp) * scalingFactor),
    defense: upgradedCharacter.stats.defense + statUpgrades.defense,
    attackPower: Math.round((upgradedCharacter.stats.attackPower + statUpgrades.attackPower) * scalingFactor),
    speed: upgradedCharacter.stats.speed + statUpgrades.speed
  };
  
  // Level up
  upgradedCharacter.level++;
  
  // Restore to full HP
  upgradedCharacter.currentHP = upgradedCharacter.stats.hp;
  
  // Reset state for new round
  upgradedCharacter.isDead = false;
  upgradedCharacter.currentTargetId = null;
  upgradedCharacter.lastAttackTime = 0;
  
  return upgradedCharacter;
}