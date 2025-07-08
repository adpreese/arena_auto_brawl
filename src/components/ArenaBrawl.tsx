import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CharacterManager } from '@/game/CharacterManager';
import { AIController } from '@/game/AIController';
import { CombatSystem } from '@/game/CombatSystem';
import { ParticleSystem } from '@/game/ParticleSystem';
import { Character, GameResult } from '@/game/types';
import { GAME_CONFIG } from '@/game/config';

type GameState = 'CHAR_SELECT' | 'PLAYING' | 'ROUND_END';

const ArenaBrawl: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<GameState>('CHAR_SELECT');
  const [candidates, setCandidates] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [livingCharacters, setLivingCharacters] = useState<Character[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  
  // Game systems
  const characterManagerRef = useRef<CharacterManager>(new CharacterManager());
  const aiControllerRef = useRef<AIController>(new AIController());
  const combatSystemRef = useRef<CombatSystem>(new CombatSystem(characterManagerRef.current));
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  
  // Initialize character selection
  useEffect(() => {
    if (gameState === 'CHAR_SELECT') {
      const newCandidates = characterManagerRef.current.generateCandidates(3);
      setCandidates(newCandidates);
    }
  }, [gameState]);
  
  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'PLAYING') return;
    
    const dt = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = currentTime;
    
    //if (dt > 0.05) return; // Skip frame if too much time has passed
    
    // Update game systems
    aiControllerRef.current.update(characterManagerRef.current.getAllCharacters(), dt);
    combatSystemRef.current.update(dt);
    characterManagerRef.current.removeDead();
    particleSystemRef.current.update(dt);
    
    // Update living characters for UI
    setLivingCharacters(characterManagerRef.current.getLivingCharacters());
    
    // Check for game end
    if (combatSystemRef.current.checkForGameEnd()) {
      const player = characterManagerRef.current.getPlayerCharacter();
      const place = characterManagerRef.current.getPlayerPlace();
      const score = 20 - place;
      
      setGameResult({
        place,
        score,
        survived: player ? !player.isDead : false
      });
      setGameState('ROUND_END');
      return;
    }
    
    // Render
    render();
    
    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);
  
  // Start game loop when playing
  useEffect(() => {
    if (gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  // Set up event listeners
  useEffect(() => {
    const handleCombatHit = (event: any) => {
      particleSystemRef.current.spawnHitEffect(event.data.position);
    };
    
    const handleCharacterDied = (event: any) => {
      particleSystemRef.current.spawnDeathEffect(event.data.character.position);
      characterManagerRef.current.addDeadCharacterByID(event.data.character.id)
    };
    
    combatSystemRef.current.addEventListener(handleCombatHit);
    characterManagerRef.current.addEventListener(handleCharacterDied);
    
    return () => {
      combatSystemRef.current.removeEventListener(handleCombatHit);
      characterManagerRef.current.removeEventListener(handleCharacterDied);
    };
  }, []);
  
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#f2f200';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw arena border
    ctx.strokeStyle = '#f133f1';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, GAME_CONFIG.ARENA_SIZE - 2, GAME_CONFIG.ARENA_SIZE - 2);
    
    // Draw characters
    const characters = characterManagerRef.current.getAllCharacters();
    for (const character of characters) {
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
      
      // Player indicator
      if (character.isPlayer) {
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(character.position.x, character.position.y, GAME_CONFIG.CHARACTER_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw particles
    particleSystemRef.current.render(ctx);
  }, []);
  
  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    characterManagerRef.current.spawnCombatants(character);
    setLivingCharacters(characterManagerRef.current.getLivingCharacters());
    setGameState('PLAYING');
  };
  
  const handleContinue = () => {
    setGameState('CHAR_SELECT');
    setSelectedCharacter(null);
    setGameResult(null);
    particleSystemRef.current.clear();
  };
  
  const getHPBarColor = (currentHP: number, maxHP: number) => {
    const ratio = currentHP / maxHP;
    if (ratio > 0.6) return '#22b222';
    if (ratio > 0.3) return '#a1a122';
    return '#a14444';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={GAME_CONFIG.ARENA_SIZE}
            height={GAME_CONFIG.ARENA_SIZE}
            className="border-4 border-arena-border bg-arena-bg rounded-lg shadow-[var(--arena-glow)]"
          />
          
          {/* Character Selection Overlay */}
          {gameState === 'CHAR_SELECT' && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
              <Card className="p-8 bg-ui-panel border-ui-border">
                <h2 className="text-3xl font-bold text-center mb-6 text-primary">Choose Your Fighter</h2>
                <div className="grid grid-cols-3 gap-6">
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      className="p-4 cursor-pointer hover:bg-secondary/50 border-ui-border transition-all hover:scale-105 hover:shadow-[var(--glow-effect)]"
                      onClick={() => handleCharacterSelect(candidate)}
                    >
                      <div className="text-center">
                        <div 
                          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                          style={{ backgroundColor: candidate.color }}
                        >
                          {candidate.emoji}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Attack:</span>
                            <span className="text-neon-red">{candidate.stats.attack}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Defense:</span>
                            <span className="text-neon-blue">{candidate.stats.defense}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Special:</span>
                            <span className="text-neon-purple">{candidate.stats.special}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HP:</span>
                            <span className="text-neon-green">{candidate.stats.hp}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          )}
          
          {/* Game End Overlay */}
          {gameState === 'ROUND_END' && gameResult && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
              <Card className="p-8 bg-ui-panel border-ui-border text-center">
                <h2 className="text-4xl font-bold mb-4">
                  {gameResult.place === 1 ? (
                    <span className="text-neon-yellow">🏆 VICTORY! 🏆</span>
                  ) : (
                    <span className="text-neon-red">DEFEATED</span>
                  )}
                </h2>
                <div className="space-y-2 mb-6 text-lg">
                  <div>Place: <span className="text-primary font-bold">#{gameResult.place}</span></div>
                  <div>Score: <span className="text-neon-cyan font-bold">{gameResult.score}</span></div>
                </div>
                <Button 
                  onClick={handleContinue}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3 text-lg"
                >
                  Continue
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Character Status Panel */}
      {gameState === 'PLAYING' && (
        <div className="w-60 bg-ui-panel border-l-2 border-ui-border p-4">
          <h3 className="text-xl font-bold mb-4 text-primary">Combatants</h3>
          <div className="space-y-2">
            {livingCharacters
              .sort((a, b) => b.currentHP - a.currentHP)
              .map((character) => (
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
                        <span className="text-sm font-medium">
                          {character.isPlayer ? 'YOU' : 'NPC'}
                        </span>
                        <span className="text-xs">
                          {character.currentHP}/{GAME_CONFIG.MAX_HP}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(character.currentHP / GAME_CONFIG.MAX_HP) * 100}%`,
                            backgroundColor: getHPBarColor(character.currentHP, GAME_CONFIG.MAX_HP)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaBrawl;