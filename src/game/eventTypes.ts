// Improved type-safe game event system with discriminated unions
import { Character, AttackEffect, Vec2 } from './types';

// Base event interface
interface BaseGameEvent {
  type: string;
  timestamp: number;
}

// Combat-related events
export interface CombatHitEvent extends BaseGameEvent {
  type: 'combat_hit';
  data: {
    attacker: Character;
    target: Character;
    damage: number;
    position: Vec2;
    attackEffect: AttackEffect;
    elementalModifier: number;
    effectivenessType: 'super-effective' | 'not-very-effective' | 'regular-attack';
    damageIndicator: {
      damage: number;
      elementalModifier: number;
      effectivenessType: 'super-effective' | 'not-very-effective' | 'regular-attack';
      attackElement: string;
    };
  };
}

export interface AOEAttackEvent extends BaseGameEvent {
  type: 'aoe_attack';
  data: {
    attacker: Character;
    position: Vec2;
    direction: Vec2;
    attackEffect: AttackEffect;
    hitTargets: Character[];
  };
}

// Character lifecycle events
export interface CharacterDiedEvent extends BaseGameEvent {
  type: 'character_died';
  data: {
    character: Character;
    killer?: Character;
  };
}

export interface PlayerKillEvent extends BaseGameEvent {
  type: 'player_kill';
  data: {
    killer: Character;
    victim: Character;
    scoreAwarded: number;
  };
}

// Timer events
export interface TimerWarningEvent extends BaseGameEvent {
  type: 'timer_warning';
  data: {
    timeRemaining: number;
  };
}

export interface TimerExpiredEvent extends BaseGameEvent {
  type: 'timer_expired';
  data: {
    message: string;
  };
}

export interface OvertimeDamageEvent extends BaseGameEvent {
  type: 'overtime_damage';
  data: {
    damage: number;
  };
}

// Game state events
export interface GameOverEvent extends BaseGameEvent {
  type: 'game_over';
  data: {
    winner?: Character;
    survivors: Character[];
    finalScores: Array<{ character: Character; score: number; place: number }>;
  };
}

// Item and progression events
export interface ItemUsedEvent extends BaseGameEvent {
  type: 'item_used';
  data: {
    character: Character;
    item: any; // TODO: Replace with proper Item type
    effect: string;
  };
}

export interface CharacterEvolvedEvent extends BaseGameEvent {
  type: 'character_evolved';
  data: {
    character: Character;
    previousStats: any;
    newStats: any;
  };
}

// Zone events
export interface ZoneSpawnedEvent extends BaseGameEvent {
  type: 'zone_spawned';
  data: {
    centerX: number;
    centerY: number;
    initialRadius: number;
    duration: number;
  };
}

// Union type for all game events
export type GameEvent = 
  | CombatHitEvent
  | AOEAttackEvent
  | CharacterDiedEvent
  | PlayerKillEvent
  | TimerWarningEvent
  | TimerExpiredEvent
  | OvertimeDamageEvent
  | GameOverEvent
  | ItemUsedEvent
  | CharacterEvolvedEvent
  | ZoneSpawnedEvent;

// Type guard functions for event type checking
export function isCombatHitEvent(event: GameEvent): event is CombatHitEvent {
  return event.type === 'combat_hit';
}

export function isAOEAttackEvent(event: GameEvent): event is AOEAttackEvent {
  return event.type === 'aoe_attack';
}

export function isCharacterDiedEvent(event: GameEvent): event is CharacterDiedEvent {
  return event.type === 'character_died';
}

export function isPlayerKillEvent(event: GameEvent): event is PlayerKillEvent {
  return event.type === 'player_kill';
}

export function isTimerEvent(event: GameEvent): event is TimerWarningEvent | TimerExpiredEvent | OvertimeDamageEvent {
  return event.type === 'timer_warning' || event.type === 'timer_expired' || event.type === 'overtime_damage';
}

// Event factory functions for creating type-safe events
export function createCombatHitEvent(data: CombatHitEvent['data']): CombatHitEvent {
  return {
    type: 'combat_hit',
    timestamp: Date.now(),
    data,
  };
}

export function createCharacterDiedEvent(character: Character, killer?: Character): CharacterDiedEvent {
  return {
    type: 'character_died',
    timestamp: Date.now(),
    data: { character, killer },
  };
}

export function createTimerWarningEvent(timeRemaining: number): TimerWarningEvent {
  return {
    type: 'timer_warning',
    timestamp: Date.now(),
    data: { timeRemaining },
  };
}

// Event validation
export function validateGameEvent(event: any): event is GameEvent {
  if (!event || typeof event !== 'object') return false;
  if (typeof event.type !== 'string') return false;
  if (typeof event.timestamp !== 'number') return false;
  if (!event.data || typeof event.data !== 'object') return false;
  
  // Additional validation based on event type could be added here
  return true;
}