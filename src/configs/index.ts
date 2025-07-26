import { STARTER_CHARACTERS } from './characters';
import { GAME_RULES } from './gameRules';
import { UI_CONFIG } from './ui';
import { SYSTEM_CONFIG } from './systems';

// Re-export individual configs
export { STARTER_CHARACTERS } from './characters';
export { GAME_RULES } from './gameRules';
export { UI_CONFIG } from './ui';
export { SYSTEM_CONFIG } from './systems';

// Game States definition
export const GAME_STATES = {
  BOOT: 'BOOT',
  CHAR_SELECT: 'CHAR_SELECT',
  ROUND_INIT: 'ROUND_INIT',
  PLAYING: 'PLAYING',
  ROUND_END: 'ROUND_END'
} as const;

export type GameState = keyof typeof GAME_STATES;

// Legacy compatibility - combine all configs into a single object
// This maintains backward compatibility while we transition to the new structure
export const GAME_CONFIG = {
  // Core game rules
  ...GAME_RULES,
  
  // UI constants
  ...UI_CONFIG,
  
  // System configurations
  ...SYSTEM_CONFIG,
  
  // Character data
  STARTER_CHARACTERS,
  
  // Game States (keeping for compatibility)
  GAME_STATES,
} as const;