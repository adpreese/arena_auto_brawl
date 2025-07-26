// Centralized game constants to eliminate magic numbers
export const GAME_CONSTANTS = {
  // Performance and Limits
  MAX_FRAME_TIME_MS: 50, // 20 FPS minimum
  TARGET_FPS: 60,
  FRAME_TIME_WARNING_THRESHOLD: 16, // Warn if frame takes longer than 16ms (60 FPS)
  
  // Mathematics
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
  FULL_CIRCLE_RADIANS: Math.PI * 2,
  
  // Distance and Positioning
  EPSILON: 0.001, // Small value for floating point comparisons
  SAFE_DISTANCE_MULTIPLIER: 1.2, // Multiplier for "safe" distances
  COLLISION_BUFFER: 2, // Pixels of buffer for collision detection
  
  // Animation and Easing
  EASING: {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
  
  // Time Constants
  TIME: {
    SECOND_MS: 1000,
    MINUTE_MS: 60000,
    FRAME_60FPS_MS: 16.67,
    FRAME_30FPS_MS: 33.33,
  },
  
  // Physics
  PHYSICS: {
    FRICTION_DEFAULT: 0.95,
    FRICTION_GROUND: 0.98,
    GRAVITY: 0, // Top-down game, no gravity
    BOUNCE_DAMPING: 0.8,
  },
  
  // Scaling Factors
  SCALE: {
    SUPER_EFFECTIVE: 1.3,
    NOT_VERY_EFFECTIVE: 0.7,
    CRITICAL_HIT: 1.5,
    HOVER_SCALE: 1.05,
  },
  
  // Z-Index Layers
  Z_INDEX: {
    BACKGROUND: 0,
    ARENA: 1,
    CHARACTERS: 2,
    EFFECTS: 3,
    PARTICLES: 4,
    UI_OVERLAY: 5,
    TOOLTIPS: 6,
    MODALS: 7,
  },
  
  // Error Codes
  ERROR_CODES: {
    SYSTEM_NOT_FOUND: 'SYSTEM_NOT_FOUND',
    INVALID_CHARACTER: 'INVALID_CHARACTER',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
    UPDATE_FAILED: 'UPDATE_FAILED',
  },
  
  // Status Codes
  STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
} as const;

// Type helpers for constants
export type ErrorCode = keyof typeof GAME_CONSTANTS.ERROR_CODES;
export type Status = keyof typeof GAME_CONSTANTS.STATUS;
export type EasingType = keyof typeof GAME_CONSTANTS.EASING;