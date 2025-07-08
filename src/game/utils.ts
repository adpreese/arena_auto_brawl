// Arena Brawl Utility Functions
import { Vec2, Character } from './types';
import { GAME_CONFIG } from './config';

export function randomStat(): number {
  return Math.floor(Math.random() * 6); // 0-5 inclusive
}

export function randomEmoji(): string {
  const emojis = GAME_CONFIG.CHARACTER_EMOJIS;
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export function randomColor(): string {
  const colors = GAME_CONFIG.CHARACTER_COLORS;
  return colors[Math.floor(Math.random() * colors.length)];
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
  return distance(attacker.position, target.position) <= GAME_CONFIG.ATTACK_RANGE_PX;
}

export function calculateDamage(attacker: Character, defender: Character): number {
  const rawDamage = attacker.stats.attack - defender.stats.defense;
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