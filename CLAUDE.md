# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based arena brawl game called "Arena Brawl Royale" built with TypeScript, Vite, and shadcn/ui. The game features character selection, real-time combat simulation, and a particle system for visual effects.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Architecture Overview

### Core Game Systems

The game is built around several key systems in `/src/game/`:

- **CharacterManager** - Handles character creation, spawning, and lifecycle management
- **AIController** - Manages AI behavior for non-player characters
- **CombatSystem** - Handles combat mechanics, hit detection, and damage calculation
- **ParticleSystem** - Renders visual effects for hits and deaths
- **types.ts** - Contains all TypeScript interfaces and types
- **config.ts** - Game configuration constants (arena size, combat stats, etc.)

### UI Architecture

- Built with **shadcn/ui** components and **Tailwind CSS**
- Main game component is `ArenaBrawl.tsx` which manages the entire game state
- Uses HTML5 Canvas for game rendering
- React Router for navigation (currently single page)

### Game States

The game has three main states:
- `CHAR_SELECT` - Character selection screen
- `PLAYING` - Active game with combat simulation
- `ROUND_END` - Game over screen with results

### Key Features

- Character selection with randomized stats and emojis
- Real-time combat simulation with 16 total combatants
- Canvas-based rendering with particle effects
- HP tracking and status display
- Scoring system based on final placement

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for state management
- **Canvas API** for game rendering

## File Structure

- `/src/components/` - React components (primarily shadcn/ui)
- `/src/game/` - Core game logic and systems
- `/src/pages/` - Page components (Index, NotFound)
- `/src/lib/` - Utility functions
- `/src/hooks/` - Custom React hooks

## Development Notes

- The game uses a requestAnimationFrame-based game loop
- Character stats are randomly generated during selection
- Combat is fully automated after character selection
- All visual effects are rendered on HTML5 Canvas
- The codebase uses path aliases (`@/`) for imports