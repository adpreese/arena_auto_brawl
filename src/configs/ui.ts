export const UI_CONFIG = {
  // Panel Dimensions
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
  
  // Animation and Transitions
  ANIMATIONS: {
    CARD_HOVER_SCALE: 1.05,
    TRANSITION_DURATION: 200, // milliseconds
    FADE_DURATION: 300,
  },
  
  // Colors and Themes
  COLORS: {
    NEON_RED: '#ff073a',
    NEON_BLUE: '#0066ff',
    NEON_GREEN: '#39ff14',
    NEON_YELLOW: '#ffff00',
    NEON_PURPLE: '#bf00ff',
    NEON_CYAN: '#00ffff',
    GOLD: '#ffd700',
  },
  
  // Layout Constants
  LAYOUT: {
    MAX_CONTENT_WIDTH: '4xl', // Tailwind class
    CARD_BORDER_RADIUS: 'lg',
    PANEL_PADDING: 4, // Tailwind spacing unit
  },
  
  // Visual Effects
  EFFECTS: {
    GLOW_BLUR: '20px',
    SHADOW_OPACITY: 0.5,
    HOVER_BRIGHTNESS: 1.1,
  },
} as const;