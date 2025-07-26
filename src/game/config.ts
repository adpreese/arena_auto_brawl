// Legacy config file - keeping for backward compatibility
// New code should import from @/configs instead
export { GAME_CONFIG } from '@/configs';

// Re-export attacks for convenience
export { ATTACKS } from './attacks';

// GameState type definition (keeping here to avoid circular dependencies)
export type GameState = 'CHAR_SELECT' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER' | 'LEADERBOARD' | 'UPGRADE_PHASE';