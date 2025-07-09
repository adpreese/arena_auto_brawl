// Arena Brawl Game Configuration
export const GAME_CONFIG = {
  ARENA_SIZE: 800,
  MAX_HP: 20,
  PARTICLE_POOL_SIZE: 200,
  CHARACTER_SIZE: 48,
  FPS: 60,
  TOTAL_COMBATANTS: 4,
  
  // Base stat values
  BASE_ATTACK_RANGE: 50,
  BASE_SPEED: 60,
  
  // UI Constants
  UI_PANEL_WIDTH: 240,
  CHARACTER_LIST_ITEM_HEIGHT: 60,
  HP_BAR_HEIGHT: 6,
  
  // Character Colors
  CHARACTER_COLORS: [
    'rgb(var(--neon-red))',
    'rgb(var(--neon-blue))',
    'rgb(var(--neon-green))',
    'rgb(var(--neon-yellow))',
    'rgb(var(--neon-purple))',
    'rgb(var(--neon-cyan))',
  ],
  
  // Emoji sprites for characters
  CHARACTER_EMOJIS: [
    '🦁', '🐯', '🐸', '🐱', '🐺', '🐻', '🦊', '🐨', '🐼', '🐹',
    '🐰', '🦝', '🐭', '🐷', '🐮', '🐗', '🐠', '🐙', '🐳', '🦈',
    '🐉', '🐲', '🦄', '🦍', '🦀', '🐞', '🐋', '🦅', '🐧', '🦜',
  ],
  
  // Game States
  GAME_STATES: {
    BOOT: 'BOOT',
    CHAR_SELECT: 'CHAR_SELECT',
    ROUND_INIT: 'ROUND_INIT',
    PLAYING: 'PLAYING',
    ROUND_END: 'ROUND_END'
  } as const
};

export type GameState = keyof typeof GAME_CONFIG.GAME_STATES;