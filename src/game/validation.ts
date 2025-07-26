// Runtime validation for game systems and configurations
import { Character, Stats, AttackEffect, Vec2 } from './types';
import { GAME_CONFIG } from '@/configs';

// Validation error types
export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Helper function to create validation results
function createValidationResult(errors: ValidationError[] = [], warnings: string[] = []): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate Vec2 objects
export function validateVec2(vec: any, fieldName = 'position'): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!vec || typeof vec !== 'object') {
    errors.push(new ValidationError(`${fieldName} must be an object`, fieldName));
    return createValidationResult(errors);
  }
  
  if (typeof vec.x !== 'number' || !isFinite(vec.x)) {
    errors.push(new ValidationError(`${fieldName}.x must be a finite number`, `${fieldName}.x`));
  }
  
  if (typeof vec.y !== 'number' || !isFinite(vec.y)) {
    errors.push(new ValidationError(`${fieldName}.y must be a finite number`, `${fieldName}.y`));
  }
  
  return createValidationResult(errors);
}

// Validate Stats objects
export function validateStats(stats: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  if (!stats || typeof stats !== 'object') {
    errors.push(new ValidationError('Stats must be an object', 'stats'));
    return createValidationResult(errors, warnings);
  }
  
  // Validate HP
  if (typeof stats.hp !== 'number' || !isFinite(stats.hp) || stats.hp <= 0) {
    errors.push(new ValidationError('HP must be a positive finite number', 'stats.hp'));
  } else if (stats.hp > GAME_CONFIG.MAX_HP * 2) {
    warnings.push(`HP (${stats.hp}) is unusually high`);
  }
  
  // Validate defense
  if (typeof stats.defense !== 'number' || !isFinite(stats.defense) || stats.defense < 0) {
    errors.push(new ValidationError('Defense must be a non-negative finite number', 'stats.defense'));
  }
  
  // Validate attack power
  if (typeof stats.attackPower !== 'number' || !isFinite(stats.attackPower) || stats.attackPower <= 0) {
    errors.push(new ValidationError('Attack power must be a positive finite number', 'stats.attackPower'));
  }
  
  // Validate speed
  if (typeof stats.speed !== 'number' || !isFinite(stats.speed) || stats.speed <= 0) {
    errors.push(new ValidationError('Speed must be a positive finite number', 'stats.speed'));
  }
  
  // Validate element
  const validElements = ['Fire', 'Water', 'Electric', 'Earth', 'Air', 'Ice'];
  if (typeof stats.element !== 'string' || !validElements.includes(stats.element)) {
    errors.push(new ValidationError(`Element must be one of: ${validElements.join(', ')}`, 'stats.element'));
  }
  
  return createValidationResult(errors, warnings);
}

// Validate AttackEffect objects
export function validateAttackEffect(attack: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  if (!attack || typeof attack !== 'object') {
    errors.push(new ValidationError('Attack effect must be an object', 'attackEffect'));
    return createValidationResult(errors, warnings);
  }
  
  // Validate required string fields
  const requiredStringFields = ['id', 'name', 'icon', 'particleColor', 'particleEffect'];
  for (const field of requiredStringFields) {
    if (typeof attack[field] !== 'string' || attack[field].length === 0) {
      errors.push(new ValidationError(`${field} must be a non-empty string`, `attackEffect.${field}`));
    }
  }
  
  // Validate numeric fields
  if (typeof attack.baseDamage !== 'number' || !isFinite(attack.baseDamage) || attack.baseDamage <= 0) {
    errors.push(new ValidationError('Base damage must be a positive finite number', 'attackEffect.baseDamage'));
  }
  
  if (typeof attack.cooldown !== 'number' || !isFinite(attack.cooldown) || attack.cooldown <= 0) {
    errors.push(new ValidationError('Cooldown must be a positive finite number', 'attackEffect.cooldown'));
  }
  
  if (typeof attack.aoeSize !== 'number' || !isFinite(attack.aoeSize) || attack.aoeSize <= 0) {
    errors.push(new ValidationError('AOE size must be a positive finite number', 'attackEffect.aoeSize'));
  }
  
  // Validate AOE shape
  const validShapes = ['circle', 'line', 'cone', 'rectangle', 'polygon', 'arc'];
  if (!validShapes.includes(attack.aoeShape)) {
    errors.push(new ValidationError(`AOE shape must be one of: ${validShapes.join(', ')}`, 'attackEffect.aoeShape'));
  }
  
  // Validate element
  const validElements = ['Fire', 'Water', 'Electric', 'Earth', 'Air', 'Ice'];
  if (!validElements.includes(attack.element)) {
    errors.push(new ValidationError(`Element must be one of: ${validElements.join(', ')}`, 'attackEffect.element'));
  }
  
  return createValidationResult(errors, warnings);
}

// Validate Character objects
export function validateCharacter(character: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  if (!character || typeof character !== 'object') {
    errors.push(new ValidationError('Character must be an object', 'character'));
    return createValidationResult(errors, warnings);
  }
  
  // Validate required fields
  if (typeof character.id !== 'string' || character.id.length === 0) {
    errors.push(new ValidationError('Character ID must be a non-empty string', 'character.id'));
  }
  
  if (typeof character.emoji !== 'string' || character.emoji.length === 0) {
    errors.push(new ValidationError('Character emoji must be a non-empty string', 'character.emoji'));
  }
  
  if (typeof character.color !== 'string' || character.color.length === 0) {
    errors.push(new ValidationError('Character color must be a non-empty string', 'character.color'));
  }
  
  if (typeof character.isPlayer !== 'boolean') {
    errors.push(new ValidationError('isPlayer must be a boolean', 'character.isPlayer'));
  }
  
  if (typeof character.isDead !== 'boolean') {
    errors.push(new ValidationError('isDead must be a boolean', 'character.isDead'));
  }
  
  // Validate current HP
  if (typeof character.currentHP !== 'number' || !isFinite(character.currentHP) || character.currentHP < 0) {
    errors.push(new ValidationError('Current HP must be a non-negative finite number', 'character.currentHP'));
  }
  
  // Validate nested objects
  const statsValidation = validateStats(character.stats);
  errors.push(...statsValidation.errors);
  warnings.push(...statsValidation.warnings);
  
  const positionValidation = validateVec2(character.position, 'character.position');
  errors.push(...positionValidation.errors);
  
  const velocityValidation = validateVec2(character.velocity, 'character.velocity');
  errors.push(...velocityValidation.errors);
  
  const attackValidation = validateAttackEffect(character.equippedAttack);
  errors.push(...attackValidation.errors);
  warnings.push(...attackValidation.warnings);
  
  // Cross-field validation
  if (character.stats && character.currentHP > character.stats.hp) {
    warnings.push('Current HP exceeds maximum HP');
  }
  
  return createValidationResult(errors, warnings);
}

// Validate game configuration
export function validateGameConfig(config: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  if (!config || typeof config !== 'object') {
    errors.push(new ValidationError('Game config must be an object', 'config'));
    return createValidationResult(errors, warnings);
  }
  
  // Validate arena size
  if (typeof config.ARENA_SIZE !== 'number' || config.ARENA_SIZE <= 0) {
    errors.push(new ValidationError('ARENA_SIZE must be a positive number', 'config.ARENA_SIZE'));
  }
  
  // Validate character size
  if (typeof config.CHARACTER_SIZE !== 'number' || config.CHARACTER_SIZE <= 0) {
    errors.push(new ValidationError('CHARACTER_SIZE must be a positive number', 'config.CHARACTER_SIZE'));
  }
  
  // Validate total combatants
  if (typeof config.TOTAL_COMBATANTS !== 'number' || config.TOTAL_COMBATANTS <= 1) {
    errors.push(new ValidationError('TOTAL_COMBATANTS must be greater than 1', 'config.TOTAL_COMBATANTS'));
  }
  
  return createValidationResult(errors, warnings);
}

// Validate system references for null safety
export function validateSystemReferences(systems: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  const requiredSystems = [
    'characterManager',
    'aiController',
    'combatSystem',
    'particleSystem',
    'aoeSystem',
    'damageIndicatorSystem',
    'roundTimerSystem',
    'shopSystem',
    'inventorySystem',
  ];
  
  for (const systemName of requiredSystems) {
    if (!systems[systemName]) {
      errors.push(new ValidationError(`${systemName} is required but not provided`, systemName));
    } else if (typeof systems[systemName] !== 'object') {
      errors.push(new ValidationError(`${systemName} must be an object`, systemName));
    }
  }
  
  return createValidationResult(errors);
}

// Runtime assertion function
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(`Assertion failed: ${message}`);
  }
}

// Safe getter with validation
export function safeGet<T>(obj: any, path: string, validator?: (value: any) => value is T): T | null {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return null;
      }
      current = current[key];
    }
    
    if (validator && !validator(current)) {
      return null;
    }
    
    return current as T;
  } catch {
    return null;
  }
}