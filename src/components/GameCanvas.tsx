import React, { useRef, useCallback, useEffect } from 'react';
import { GameSystems } from '@/hooks';
import { Character } from '@/game/types';
import { GAME_CONFIG } from '@/game/config';
import { getPlanetaryHouseColor } from '@/game/utils';

interface GameCanvasProps {
  systems: GameSystems;
  livingCharacters: Character[];
  hoveredCharacter: Character | null;
  onCharacterHover: (character: Character | null) => void;
  onMouseMove: (position: { x: number; y: number }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  systems,
  livingCharacters,
  hoveredCharacter,
  onCharacterHover,
  onMouseMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#77aa77';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw arena border
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, GAME_CONFIG.ARENA_SIZE - 2, GAME_CONFIG.ARENA_SIZE - 2);

    // Draw characters
    for (const character of livingCharacters) {
      if (character.isDead) continue;
      
      ctx.save();
      
      // Character background
      ctx.fillStyle = character.color;
      ctx.beginPath();
      ctx.arc(character.position.x, character.position.y, GAME_CONFIG.CHARACTER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Character emoji
      ctx.font = `${GAME_CONFIG.CHARACTER_SIZE * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(character.emoji, character.position.x, character.position.y);
      
      // Player indicator - bright yellow circle
      if (character.isPlayer) {
        ctx.strokeStyle = '#FFD700'; // Bright yellow/gold color
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(character.position.x, character.position.y, GAME_CONFIG.CHARACTER_SIZE / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw AOE indicators (before particles so particles render on top)
    systems.aoeSystem.render(ctx);
    
    // Draw particles
    systems.particleSystem.render(ctx);
    
    // Draw damage indicators
    systems.damageIndicatorSystem.render(ctx);
  }, [systems, livingCharacters]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    onMouseMove({ x, y });

    // Check if mouse is over any character
    let foundCharacter: Character | null = null;
    for (const character of livingCharacters) {
      const distance = Math.sqrt(
        Math.pow(x - character.position.x, 2) + Math.pow(y - character.position.y, 2)
      );
      if (distance <= GAME_CONFIG.CHARACTER_SIZE / 2) {
        foundCharacter = character;
        break;
      }
    }
    
    onCharacterHover(foundCharacter);
  }, [livingCharacters, onCharacterHover, onMouseMove]);

  const handleMouseLeave = useCallback(() => {
    onCharacterHover(null);
  }, [onCharacterHover]);

  // Render loop
  useEffect(() => {
    const renderLoop = () => {
      render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [render]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.ARENA_SIZE}
        height={GAME_CONFIG.ARENA_SIZE}
        className="border-2 border-ui-border rounded-lg bg-game-bg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Character tooltip */}
      {hoveredCharacter && (
        <div 
          className="absolute pointer-events-none bg-ui-panel border border-ui-border rounded-lg p-3 shadow-lg z-50"
          style={{
            left: hoveredCharacter.position.x + 30,
            top: hoveredCharacter.position.y - 50,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: hoveredCharacter.color }}
            >
              {hoveredCharacter.emoji}
            </div>
            <span className="font-medium">
              {hoveredCharacter.isPlayer ? 'YOU' : 'NPC'}
              {hoveredCharacter.level ? ` (Lv${hoveredCharacter.level})` : ''}
            </span>
            <span 
              className="text-xs font-bold"
              style={{ color: getPlanetaryHouseColor(hoveredCharacter.planetaryHouse) }}
            >
              {hoveredCharacter.planetaryHouse}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div>HP: {hoveredCharacter.currentHP}/{hoveredCharacter.stats.hp}</div>
            <div>Attack: {hoveredCharacter.stats.attackPower}</div>
            <div>Defense: {hoveredCharacter.stats.defense}</div>
            <div>Speed: {hoveredCharacter.stats.speed}</div>
          </div>
        </div>
      )}
    </div>
  );
};