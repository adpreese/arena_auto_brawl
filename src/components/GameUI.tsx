import React from 'react';
import { Card } from '@/components/ui/card';
import { Character, GameSession, ZoneState } from '@/game/types';
import { RoundTimerState } from '@/game/RoundTimerSystem';
import { GAME_CONFIG } from '@/game/config';
import { getPlanetaryHouseSymbol, getPlanetaryHouseColor } from '@/game/utils';

interface GameUIProps {
  gameSession: GameSession;
  livingCharacters: Character[];
  zoneState: ZoneState | null;
  timerState: RoundTimerState | null;
  roundTimerSystemRef: React.RefObject<any>;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameSession,
  livingCharacters,
  zoneState,
  timerState,
  roundTimerSystemRef,
}) => {
  const getHPBarColor = (currentHP: number, maxHP: number) => {
    const ratio = currentHP / maxHP;
    if (ratio > 0.6) return '#22b222';
    if (ratio > 0.3) return '#a1a122';
    return '#b22222';
  };

  const sortedCharacters = livingCharacters.sort((a, b) => {
    // Player always comes first
    if (a.isPlayer && !b.isPlayer) return -1;
    if (!a.isPlayer && b.isPlayer) return 1;
    // Then sort by HP (highest to lowest)
    return b.currentHP - a.currentHP;
  });

  return (
    <div className="w-60 bg-ui-panel border-l-2 border-ui-border p-4">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-primary">Combatants</h3>
        <div className="text-sm text-muted-foreground mt-1">
          Round {gameSession.currentRound}/{gameSession.totalRounds}
        </div>
        {gameSession.cumulativeScore > 0 && (
          <div className="text-sm text-neon-cyan">
            Total Score: {gameSession.cumulativeScore}
          </div>
        )}
        {gameSession.gold > 0 && (
          <div className="text-sm text-gold">
            Gold: {gameSession.gold}
          </div>
        )}
        {gameSession.playerCharacter && gameSession.playerCharacter.level && (
          <div className="text-sm text-neon-yellow mt-1">
            Level {gameSession.playerCharacter.level}
          </div>
        )}
        {zoneState && zoneState.isActive && (
          <div className="text-sm text-neon-red mt-1">
            Zone: {Math.round(zoneState.radius)}px
          </div>
        )}
        {timerState && timerState.isActive && (
          <div className={`text-sm mt-1 font-bold ${
            timerState.isInOvertime 
              ? 'text-red-500 animate-pulse' 
              : timerState.isWarning 
                ? 'text-yellow-500' 
                : 'text-neon-cyan'
          }`}>
            Timer: {roundTimerSystemRef.current?.getFormattedTime()}
          </div>
        )}
      </div>
      
      <div className="space-y-2 overflow-y-auto" style={{ height: `${GAME_CONFIG.ARENA_SIZE}px` }}>
        {sortedCharacters.map((character) => (
          <Card key={character.id} className="p-3 bg-card/50 border-ui-border/50">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: character.color }}
              >
                {character.emoji}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">
                      {character.isPlayer ? (
                        <span className="text-neon-yellow">
                          YOU {character.level ? `(Lv${character.level})` : ''}
                        </span>
                      ) : (
                        <span className="text-neon-red">
                          NPC {character.level ? `(Lv${character.level})` : ''}
                        </span>
                      )}
                    </span>
                    <span 
                      className="text-xs font-bold"
                      style={{ color: getPlanetaryHouseColor(character.planetaryHouse) }}
                    >
                      {getPlanetaryHouseSymbol(character.planetaryHouse)}
                    </span>
                    <span className="text-xs">
                      {character.equippedAttack.icon}
                    </span>
                  </div>
                  <span className="text-xs">
                    {character.currentHP}/{character.stats.hp}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(character.currentHP / character.stats.hp) * 100}%`,
                      backgroundColor: getHPBarColor(character.currentHP, character.stats.hp)
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};