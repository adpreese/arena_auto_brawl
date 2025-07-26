import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Character } from '@/game/types';
import { getPlanetaryHouseSymbol, getPlanetaryHouseColor } from '@/game/utils';

interface CharacterSelectionProps {
  candidates: Character[];
  onCharacterSelect: (character: Character) => void;
  onRandomizeStats: () => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  candidates,
  onCharacterSelect,
  onRandomizeStats,
}) => {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">Choose Your Fighter</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Select a character to begin your arena brawl journey
          </p>
          <Button 
            onClick={onRandomizeStats} 
            variant="outline" 
            size="sm"
            className="mb-4"
          >
            🎲 Randomize All Stats
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <Card
              key={candidate.id}
              className="p-4 cursor-pointer hover:bg-secondary/50 border-ui-border transition-all hover:scale-105 hover:shadow-[var(--glow-effect)]"
              onClick={() => onCharacterSelect(candidate)}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: candidate.color }}
                >
                  {candidate.emoji}
                </div>
                {candidate.name && (
                  <div className="text-lg font-bold text-primary mb-2">
                    {candidate.name}
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span 
                        className="font-bold text-lg"
                        style={{ color: getPlanetaryHouseColor(candidate.planetaryHouse) }}
                      >
                        {getPlanetaryHouseSymbol(candidate.planetaryHouse)}
                      </span>
                      <span 
                        className="font-medium"
                        style={{ color: getPlanetaryHouseColor(candidate.planetaryHouse) }}
                      >
                        {candidate.planetaryHouse}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-lg">{candidate.equippedAttack.icon}</span>
                      <span className="font-medium text-muted-foreground">
                        {candidate.equippedAttack.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="text-neon-green">{candidate.stats.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attack Power:</span>
                    <span className="text-neon-red">{candidate.stats.attackPower}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Defense:</span>
                    <span className="text-neon-blue">{candidate.stats.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="text-neon-yellow">{candidate.stats.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Element:</span>
                    <span className="text-neon-purple">{candidate.stats.element}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};