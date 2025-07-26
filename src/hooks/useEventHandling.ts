import { useEffect, useCallback } from 'react';
import { GameSystems } from './useGameSystems';
import { GameStateActions } from './useGameState';
import { audioManager } from '@/game/AudioManager';

export interface EventHandlingOptions {
  systems: GameSystems;
  actions: GameStateActions;
}

export function useEventHandling({ systems, actions }: EventHandlingOptions) {
  const handleGameEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'combat_hit':
        if (event.data.attackEffect) {
          systems.particleSystem.spawnAttackEffect(
            event.data.position, 
            event.data.attackEffect, 
            event.data.attacker, 
            event.data.target
          );
          
          // Play appropriate sound effect based on elemental effectiveness
          if (event.data.effectivenessType) {
            audioManager.playAttackSound(event.data.effectivenessType);
          }
        } else {
          systems.particleSystem.spawnHitEffect(event.data.position);
          // Play regular attack sound for non-elemental hits
          audioManager.playAttackSound('regular-attack');
        }
        
        // Spawn damage indicator
        if (event.data.damageIndicator) {
          const indicatorData = event.data.damageIndicator;
          systems.damageIndicatorSystem.spawnDamageIndicator(
            event.data.position,
            indicatorData.damage,
            indicatorData.elementalModifier,
            indicatorData.effectivenessType,
            indicatorData.attackElement
          );
        }
        break;
      
      case 'aoe_attack':
        // Show AOE area visualization
        systems.aoeSystem.spawnAOEIndicator(
          event.data.position,
          event.data.direction,
          event.data.attackEffect
        );
        break;
      
      case 'character_died':
        systems.particleSystem.spawnDeathEffect(event.data.character.position);
        systems.characterManager.addDeadCharacterByID(event.data.character.id);
        break;
      
      case 'player_kill':
        // Award bonus score and gold for player kills
        actions.setGameSession(prev => ({
          ...prev,
          cumulativeScore: prev.cumulativeScore + event.data.scoreAwarded,
          gold: prev.gold + event.data.scoreAwarded
        }));
        break;
      
      case 'timer_warning':
        // Timer warning - could add audio/visual effects here
        console.log('Timer warning: 5 seconds remaining');
        break;
      
      case 'timer_expired':
        // Timer expired - overtime begins
        console.log('Timer expired! Overtime damage begins!');
        break;
      
      case 'overtime_damage':
        // Deal damage to all living characters
        const livingChars = systems.characterManager.getLivingCharacters();
        for (const character of livingChars) {
          systems.characterManager.takeDamage(
            character.id, 
            event.data.damage, 
            'timer' // attacker ID for overtime damage
          );
        }
        break;
    }
  }, [systems, actions]);

  useEffect(() => {
    // Add event listeners to all systems
    systems.combatSystem.addEventListener(handleGameEvent);
    systems.characterManager.addEventListener(handleGameEvent);
    systems.roundTimerSystem.addEventListener(handleGameEvent);
    
    return () => {
      // Clean up event listeners
      systems.combatSystem.removeEventListener(handleGameEvent);
      systems.characterManager.removeEventListener(handleGameEvent);
      systems.roundTimerSystem.removeEventListener(handleGameEvent);
    };
  }, [systems, handleGameEvent]);

  return {
    handleGameEvent,
  };
}