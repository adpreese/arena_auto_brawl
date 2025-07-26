# Arena Brawl Royale - Implementation Design Document

## Executive Summary

Arena Brawl Royale is a React-based real-time arena combat game featuring character selection, automated combat simulation, and a progression system. This document outlines the complete architecture and implementation approach for building the game from scratch.

## Technology Stack

### Core Technologies
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom theme
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: React Router DOM
- **Canvas Rendering**: HTML5 Canvas API for game visualization

### Development Dependencies
- **TypeScript**: For type safety and development experience
- **ESLint**: Code linting and quality enforcement
- **Autoprefixer/PostCSS**: CSS processing
- **Vite Plugins**: React SWC for fast refresh

## Project Structure

```
src/
├── components/          # React UI components
│   ├── ui/             # shadcn/ui base components
│   ├── game/           # Game-specific components
│   └── *.tsx           # Main game components
├── game/               # Core game logic systems
│   ├── types.ts        # TypeScript interfaces
│   ├── config.ts       # Game configuration
│   ├── utils.ts        # Utility functions
│   └── [Systems]       # Individual game systems
├── configs/            # Configuration files
├── constants/          # Game constants
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
└── pages/              # Route components
```

## Core Game Systems Architecture

### 1. Character Management System (`CharacterManager.ts`)

**Purpose**: Manages all character entities, spawning, lifecycle, and state tracking.

**Key Responsibilities**:
- Generate selectable character candidates
- Spawn combatants in arena with collision detection
- Track character states (alive/dead, positions, stats)
- Calculate player placement based on death order
- Emit character-related events

**Implementation Approach**:
```typescript
class CharacterManager {
  private characters: Map<string, Character> = new Map();
  private deathTracker: string[] = [];
  
  // Character generation with fixed starter templates
  generateCandidates(count: number): Character[]
  
  // Arena spawning with position validation
  spawnCombatants(playerCharacter: Character, existingEnemies?: Character[]): void
  
  // Damage handling with event emission
  takeDamage(characterId: string, damage: number, attackerId?: string): void
}
```

### 2. AI Controller System (`AIController.ts`)

**Purpose**: Manages NPC behavior, movement, and targeting decisions.

**Key Responsibilities**:
- Implement movement behaviors based on planetary houses
- Handle target selection and acquisition
- Manage aggression states and retreat conditions
- Process special behaviors (Jupiter house retreat timing)

**Implementation Approach**:
```typescript
class AIController {
  // Main update loop for all AI behaviors
  update(characters: Character[], dt: number): void
  
  // Individual behavior systems
  private updateMovement(character: Character, dt: number): void
  private findTarget(character: Character, allCharacters: Character[]): Character | null
  private updateBehavior(character: Character, allCharacters: Character[]): void
}
```

### 3. Combat System (`CombatSystem.ts`)

**Purpose**: Handles all combat mechanics, damage calculation, and attack resolution.

**Key Responsibilities**:
- Process attack timings and cooldowns
- Perform AOE attack calculations
- Apply elemental damage modifiers
- Emit combat events for visual/audio feedback

**Implementation Approach**:
```typescript
class CombatSystem {
  // Main combat update loop
  update(dt: number): void
  
  // AOE attack processing
  private performAOEAttack(attacker: Character, direction: Vec2, targets: Character[]): void
  
  // Integration with damage calculation utilities
  // Uses external calculateDamage() function with elemental system
}
```

### 4. Visual Systems

#### Particle System (`ParticleSystem.ts`)
- Renders hit effects, death animations, and attack visuals
- Manages particle lifecycle and physics
- Handles different particle types (hit, death, death_icon)

#### Damage Indicator System (`DamageIndicatorSystem.ts`)
- Shows floating damage numbers
- Color-codes based on elemental effectiveness
- Animated movement and fading

#### AOE System (`AOESystem.ts`)
- Visualizes attack areas and ranges
- Shows attack telegraphing
- Handles different AOE shapes (circle, line, cone, etc.)

### 5. Game State Management

#### Main Game Component (`ArenaBrawl.tsx`)
Central component managing all game states:
- `CHAR_SELECT`: Character selection phase
- `PLAYING`: Active combat simulation
- `ROUND_END`: Round completion and scoring
- `UPGRADE_PHASE`: Shop/upgrade interface
- `GAME_OVER`: Final scoring and leaderboard
- `LEADERBOARD`: High score display

#### Game Session Management
```typescript
interface GameSession {
  currentRound: number;
  totalRounds: number;
  cumulativeScore: number;
  gold: number;
  roundResults: RoundResult[];
  isComplete: boolean;
  playerCharacter?: Character;
  enemyCharacters?: Character[];
}
```

## Data Models and Type System

### Core Interfaces

#### Character System
```typescript
interface Character {
  id: string;
  stats: Stats;
  currentHP: number;
  position: Vec2;
  velocity: Vec2;
  // Targeting and combat
  currentTargetId: string | null;
  lastAttackTime: number;
  // Visual representation
  emoji: string;
  color: string;
  // Game state
  isPlayer: boolean;
  isDead: boolean;
  // Progression
  level?: number;
  baseStats?: Stats;
  planetaryHouse: PlanetaryHouse;
  equippedAttack: AttackEffect;
  inventory: Item[];
}
```

#### Stats and Combat
```typescript
interface Stats {
  hp: number;              // Base health points
  defense: number;         // Flat damage reduction
  attackPower: number;     // Percentage damage modifier
  speed: number;           // Movement speed multiplier
  element: Element;        // Elemental type
}

interface AttackEffect {
  id: string;
  name: string;
  baseDamage: number;
  cooldown: number;
  element: Element;
  aoeShape: AOEShape;
  aoeSize: number;
  // Visual effects
  particleColor: string;
  particleEffect: string;
}
```

#### Elemental System
```typescript
type Element = 'Fire' | 'Water' | 'Electric' | 'Earth' | 'Air' | 'Ice';

interface ElementMeta {
  name: string;
  strongAgainst: Element[];
  weakAgainst: Element[];
  icon: string;
  color: string;
}
```

## Game Logic Implementation

### 1. Character Selection Flow

1. **Candidate Generation**: Use fixed starter templates from config
2. **Character Customization**: Apply random stats within balanced ranges
3. **Selection Validation**: Ensure selected character has required properties
4. **Session Initialization**: Set up game session with selected character

### 2. Combat Loop Implementation

```typescript
// Main game loop structure
const gameLoop = useCallback((currentTime: number) => {
  const dt = (currentTime - lastTimeRef.current) / 1000;
  
  // Update all systems
  aiController.update(characters, dt);
  combatSystem.update(dt);
  characterManager.removeDead();
  particleSystem.update(dt);
  damageIndicatorSystem.update(dt);
  roundTimerSystem.update(currentTime);
  
  // Check win conditions
  if (combatSystem.checkForGameEnd()) {
    handleGameEnd();
    return;
  }
  
  // Render frame
  render();
  
  // Continue loop
  requestAnimationFrame(gameLoop);
}, [gameState]);
```

### 3. Damage Calculation System

```typescript
function calculateDamage(attacker: Character, target: Character): number {
  const baseDamage = attacker.equippedAttack.baseDamage;
  
  // Apply attacker's attack power as percentage modifier
  const attackPowerModifier = 1 + (attacker.stats.attackPower / 100);
  const modifiedDamage = baseDamage * attackPowerModifier;
  
  // Apply elemental effectiveness
  const elementalModifier = elementRegistry.calculateElementalModifier(
    attacker.equippedAttack.element,
    attacker.stats.element,
    target.stats.element
  );
  
  const elementalDamage = modifiedDamage * elementalModifier;
  
  // Apply defense as flat reduction
  const finalDamage = Math.max(1, elementalDamage - target.stats.defense);
  
  return Math.round(finalDamage);
}
```

### 4. Planetary House Behavior System

Each character has a planetary house that affects AI behavior:

- **Jupiter**: Defensive, retreats when low HP
- **Mars**: Aggressive, seeks closest targets
- **Mercury**: Fast, erratic movement patterns
- **Venus**: Balanced approach with medium aggression
- **Saturn**: Methodical, prefers ranged combat
- **Neptune**: Unpredictable, changes targets frequently
- **Sol**: Leadership behavior, adapts to situation

## Progression and Monetization Systems

### 1. Shop System (`ShopSystem.ts`)

**Purpose**: Provides character upgrades between rounds

**Features**:
- Character replacement cards
- Attack scroll items
- Evolution stones for elemental upgrades
- Stat chip consumables
- Reroll mechanics with gold cost

### 2. Inventory System (`InventorySystem.ts`)

**Purpose**: Manages player item collection and usage

**Implementation**:
- 2-slot inventory limit
- Item usage effects (stat boosts, attack changes)
- Item rarity and cost balancing

### 3. Scoring and Progression

```typescript
// Scoring system based on placement
const score = Math.abs(place - TOTAL_COMBATANTS - 1);
const goldEarned = score; // 1:1 conversion for spending

// Session tracking
interface GameSession {
  cumulativeScore: number;  // Total across all rounds (permanent)
  gold: number;            // Spendable currency for shop
  roundResults: RoundResult[];
}
```

## UI/UX Implementation

### 1. Responsive Design Strategy

**Mobile-First Approach**:
- Touch-optimized controls and sizing
- Collapsible UI elements
- Simplified layouts for small screens
- Canvas size adaptation

**Desktop Enhancements**:
- Side panels for character status
- Detailed tooltips and hover states
- Keyboard shortcuts support
- Multi-column layouts

### 2. Canvas Rendering System

```typescript
const render = useCallback(() => {
  // Clear and setup
  ctx.fillStyle = '#77aa77';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw arena boundaries
  drawArenaBorders(ctx, canvas);
  
  // Render characters with scaling
  const scaleFactor = canvas.width / ARENA_SIZE;
  characters.forEach(character => {
    drawCharacter(ctx, character, scaleFactor);
  });
  
  // Overlay systems
  aoeSystem.render(ctx);
  particleSystem.render(ctx, scaleFactor);
  damageIndicatorSystem.render(ctx);
}, []);
```

### 3. Event System Implementation

**Game Event Architecture**:
```typescript
type GameEventType = 
  | 'character_died' 
  | 'combat_hit' 
  | 'aoe_attack' 
  | 'player_kill'
  | 'timer_warning'
  | 'timer_expired';

// Event emission and handling
systems.forEach(system => {
  system.addEventListener(handleGameEvent);
});
```

## Performance Optimization

### 1. Canvas Optimization
- Object pooling for particles
- Efficient hit detection algorithms
- Conditional rendering based on viewport
- Frame rate limiting and delta time usage

### 2. State Management
- Minimal re-renders through careful dependency arrays
- Memoized calculations for expensive operations
- Efficient character filtering and sorting

### 3. Asset Management
- Emoji-based graphics (no external assets)
- CSS-based UI animations
- Minimal bundle size through tree shaking

## Audio System

### Implementation (`AudioManager.ts`)
- Sound effect management for combat feedback
- Elemental effectiveness audio cues
- Background music support (optional)
- Volume controls and muting

## Testing Strategy

### 1. Game Logic Testing
- Unit tests for damage calculations
- Character behavior validation
- Combat system edge cases
- Progression system accuracy

### 2. Integration Testing
- Full game loop functionality
- Cross-system event handling
- UI state synchronization
- Performance benchmarking

### 3. User Experience Testing
- Mobile responsiveness
- Touch interaction validation
- Accessibility compliance
- Cross-browser compatibility

## Deployment and Build Process

### 1. Build Configuration
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### 2. Production Optimizations
- Asset minification
- Code splitting for faster loads
- Progressive loading of game systems
- CDN deployment for static assets

## Security Considerations

### 1. Client-Side Security
- Input validation for all user data
- XSS prevention in dynamic content
- Safe parsing of JSON data
- Secure random number generation

### 2. Data Protection
- Local storage encryption for scores
- No sensitive data transmission
- Privacy-compliant analytics (if added)

## Future Extensibility

### 1. Planned Features
- Additional character classes
- New elemental types
- Tournament modes
- Social features (leaderboards)

### 2. Architecture Scalability
- Modular system design allows easy additions
- Event-driven architecture supports new features
- Configuration-driven content enables rapid iteration
- Component-based UI supports feature expansion

## Conclusion

This design document provides a comprehensive blueprint for implementing Arena Brawl Royale from scratch. The architecture emphasizes modularity, performance, and user experience while maintaining clean separation of concerns between game logic, visual systems, and user interface components.

The implementation strategy balances modern web development best practices with game-specific requirements, resulting in a maintainable and extensible codebase that delivers engaging real-time combat gameplay in the browser.