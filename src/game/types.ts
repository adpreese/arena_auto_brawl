// Arena Brawl Type Definitions
export interface Vec2 {
  x: number;
  y: number;
}

export interface Stats {
  attack: number;
  defense: number;
  special: number;
  hp: number;
}

export interface Character {
  id: string;
  stats: Stats;
  currentHP: number;
  position: Vec2;
  velocity: Vec2;
  currentTargetId: string | null;
  lastAttackTime: number;
  emoji: string;
  color: string;
  isPlayer: boolean;
  isDead: boolean;
  lastDirectionChange: number;
  randomDirection: number;
}

export interface Particle {
  id: string;
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'hit' | 'death';
}

export interface GameResult {
  place: number;
  score: number;
  survived: boolean;
}

export type GameEventType = 'character_died' | 'combat_hit' | 'game_over';

export interface GameEvent {
  type: GameEventType;
  data: any;
}