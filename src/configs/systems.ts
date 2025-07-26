export const SYSTEM_CONFIG = {
  // Damage Indicator Configuration
  DAMAGE_INDICATOR: {
    DURATION: 1500, // milliseconds
    FLOAT_SPEED: -40, // pixels per second (negative = upward)
    BASE_FONT_SIZE: 16,
    SUPER_EFFECTIVE_MULTIPLIER: 1.3,
    NOT_VERY_EFFECTIVE_MULTIPLIER: 0.7,
    OUTLINE_WIDTH: 2,
    FADE_START_RATIO: 0.7 // Start fading when 70% of lifetime is reached
  },
  
  // Round Timer Configuration
  ROUND_TIMER: {
    DURATION: 20000, // milliseconds (20 seconds)
    OVERTIME_DAMAGE: 2, // damage dealt per tick when timer expires
    OVERTIME_INTERVAL: 1000, // milliseconds between damage ticks in overtime
    WARNING_TIME: 5000 // milliseconds before timer expires to show warning
  },
  
  // Particle System Configuration
  PARTICLES: {
    POOL_SIZE: 200,
    HIT_EFFECT_COUNT: 6,
    DEATH_EFFECT_COUNT: 16,
    DEFAULT_LIFETIME: 1000,
    DEFAULT_SIZE: 4,
    DEFAULT_SPEED_MIN: 20,
    DEFAULT_SPEED_MAX: 80,
  },
  
  // Audio Configuration
  AUDIO: {
    MASTER_VOLUME: 0.7,
    SFX_VOLUME: 0.8,
    MUSIC_VOLUME: 0.5,
    FADE_DURATION: 200,
  },
  
  // Performance Settings
  PERFORMANCE: {
    MAX_FRAME_TIME: 0.05, // 50ms max frame time (20 FPS minimum)
    TARGET_FPS: 60,
    RENDER_DISTANCE: 1200, // pixels beyond which objects aren't rendered
    LOD_DISTANCE: 800, // distance for level-of-detail switching
  },
  
  // Debug Settings
  DEBUG: {
    SHOW_HITBOXES: false,
    SHOW_FPS: false,
    SHOW_SYSTEM_INFO: false,
    LOG_LEVEL: 'warn' as 'debug' | 'info' | 'warn' | 'error',
  },
} as const;