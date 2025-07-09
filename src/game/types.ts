// Arena Brawl Type Definitions
export interface Vec2 {
  x: number;
  y: number;
}

// Element system for damage types and affinities
export type Element = 'Fire' | 'Water' | 'Electric' | 'Earth' | 'Air' | 'Ice';

export interface ElementMeta {
  name: string;
  strongAgainst: Element[];
  weakAgainst: Element[];
  icon: string;
  color: string;
}

// Updated stats system per design spec
export interface Stats {
  hp: number; // Variable baseline survivability
  defense: number; // Flat damage reduction (unchanged)
  attackPower: number; // Percentage-based modifier for attack damage
  speed: number; // Pixels/second movement scalar
  element: Element; // Elemental type for damage calculations
}

export type PlanetaryHouse = 'Jupiter' | 'Saturn' | 'Mars' | 'Neptune' | 'Mercury' | 'Venus' | 'Sol';

export type DamageType = 'physical' | 'fire' | 'ice' | 'lightning' | 'poison';

export type AOEShape = 'circle' | 'line' | 'cone' | 'rectangle' | 'polygon' | 'arc';

export interface AttackEffect {
  id: string;
  name: string;
  icon: string;
  baseDamage: number;
  cooldown: number; // milliseconds between attacks
  element: Element; // elemental type for damage calculations
  aoeShape: AOEShape;
  aoeSize: number; // radius for circle, length for line, etc.
  aoeWidth?: number; // for rectangle/line width
  aoeAngle?: number; // for cone attacks in degrees
  particleColor: string;
  particleEffect: string;
}

// Item system interfaces
export interface Item {
  id: string;
  type: 'attack' | 'evolve' | 'stat';
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  cost: number;
}

export interface AttackScroll extends Item {
  type: 'attack';
  attackEffect: AttackEffect;
}

export interface EvolveStone extends Item {
  type: 'evolve';
  targetElement?: Element; // Optional element requirement
  statMultipliers: {
    hp: number;
    defense: number;
    attackPower: number;
    speed: number;
  };
  newSprite?: string; // New emoji/visual
}

export interface StatChip extends Item {
  type: 'stat';
  statType: 'hp' | 'defense' | 'attackPower' | 'speed';
  bonus: number; // Always +1 per spec
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
  level?: number;
  baseStats?: Stats;
  planetaryHouse: PlanetaryHouse;
  equippedAttack: AttackEffect;
  inventory: Item[];
  isEvolved?: boolean;
  // Jupiter house specific timing
  jupiterRunAwayStartTime?: number;
}

export interface Particle {
  id: string;
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'hit' | 'death' | 'death_icon';
}

export interface AOEIndicator {
  id: string;
  position: Vec2;
  direction: Vec2;
  attackEffect: AttackEffect;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface GameResult {
  place: number;
  score: number;
  survived: boolean;
}

export interface RoundResult {
  place: number;
  score: number;
  survived: boolean;
  roundNumber: number;
}

export interface LevelUpOption {
  id: string;
  name: string;
  description: string;
  statBonus: {
    hp: number;
    defense: number;
    attackPower: number;
    speed: number;
  };
}

// Shop system interfaces
export interface ShopCard {
  id: string;
  type: 'character' | 'item';
  cost: number;
  character?: Character;
  item?: Item;
}

export interface ShopState {
  cards: ShopCard[];
  rerollCost: number;
  rerollCount: number;
}

export interface GameSession {
  currentRound: number;
  totalRounds: number;
  cumulativeScore: number; // Total score across all rounds (non-spendable)
  gold: number; // Spendable currency for shop
  roundResults: RoundResult[];
  isComplete: boolean;
  playerCharacter?: Character;
  enemyCharacters?: Character[];
  shopState?: ShopState;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  totalScore: number;
  date: string;
  roundResults: RoundResult[];
}

// Zone constriction system
export interface ZoneState {
  isActive: boolean;
  radius: number;
  centerX: number;
  centerY: number;
  startTime: number;
  duration: number; // Total time for full constriction
  initialRadius: number;
  minRadius: number;
}

export type GameEventType = 'character_died' | 'combat_hit' | 'game_over' | 'aoe_attack' | 'item_used' | 'character_evolved' | 'zone_spawned' | 'player_kill';

export interface GameEvent {
  type: GameEventType;
  data: any;
}