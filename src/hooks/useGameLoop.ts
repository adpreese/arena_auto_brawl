import { useRef, useCallback, useEffect } from 'react';
import { GameSystems, updateAllSystems } from './useGameSystems';
import { GameStateData, GameStateActions } from './useGameState';
import { GAME_CONFIG } from '@/game/config';

export interface GameLoopOptions {
  systems: GameSystems;
  gameState: GameStateData;
  actions: GameStateActions;
}

export function useGameLoop({ systems, gameState, actions }: GameLoopOptions) {
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const gameLoop = useCallback((currentTime: number) => {
    if (gameState.gameState !== 'PLAYING') return;
    
    const dt = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = currentTime;
    
    // Skip frame if too much time has passed (prevents large jumps)
    if (dt > 0.05) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Update all game systems
    updateAllSystems(systems, currentTime, dt);
    
    // Update UI state
    actions.setZoneState(systems.zoneSystem.getZoneState());
    actions.setTimerState(systems.roundTimerSystem.getState());
    actions.setLivingCharacters(systems.characterManager.getLivingCharacters());
    
    // Check for game end
    if (systems.combatSystem.checkForGameEnd()) {
      const player = systems.characterManager.getPlayerCharacter();
      const place = systems.characterManager.getPlayerPlace();
      const score = Math.abs(place - GAME_CONFIG.TOTAL_COMBATANTS - 1);
      systems.characterManager.clearDeathTracker();
      
      const result = {
        place,
        score,
        survived: !player?.isDead || false
      };
      
      actions.setGameResult(result);
      actions.setGameState('ROUND_END');
      
      // Stop the timer
      systems.roundTimerSystem.stop();
      
      return; // Don't continue the loop
    }
    
    // Continue the game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [systems, gameState.gameState, actions]);

  const startGameLoop = useCallback(() => {
    if (gameState.gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.gameState, gameLoop]);

  const stopGameLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Auto-start/stop game loop based on game state
  useEffect(() => {
    if (gameState.gameState === 'PLAYING') {
      startGameLoop();
    } else {
      stopGameLoop();
    }

    return stopGameLoop;
  }, [gameState.gameState, startGameLoop, stopGameLoop]);

  return {
    startGameLoop,
    stopGameLoop,
  };
}