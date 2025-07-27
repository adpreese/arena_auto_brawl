export const GAME_RULES = {
  // Core Game Settings
  ARENA_SIZE: 800,
  MAX_HP: 20,
  TOTAL_COMBATANTS: 20,
  FPS: 60,
  
  // Character Settings
  CHARACTER_SIZE: 48,
  BASE_ATTACK_RANGE: 50,
  BASE_SPEED: 60,
  
  // Game Progression
  TOTAL_ROUNDS: 4,
  
  // Pool Sizes
  PARTICLE_POOL_SIZE: 200,
  
  // Combat Rules
  COMBAT: {
    DAMAGE_VARIANCE: 0.1, // ±10% damage variance
    CRITICAL_HIT_CHANCE: 0.05, // 5% critical hit chance
    CRITICAL_HIT_MULTIPLIER: 1.5,
    ELEMENTAL_EFFECTIVENESS_STRONG: 1.5,
    ELEMENTAL_EFFECTIVENESS_WEAK: 0.75,
  },
  
  // Economy
  ECONOMY: {
    BASE_GOLD_PER_ROUND: 3,
    GOLD_PER_KILL: 1,
    SHOP_REROLL_BASE_COST: 2,
    SHOP_REROLL_COST_INCREASE: 1,
  },
  
} as const;