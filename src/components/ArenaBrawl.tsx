import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CharacterManager } from '@/game/CharacterManager';
import { AIController } from '@/game/AIController';
import { CombatSystem } from '@/game/CombatSystem';
import { ParticleSystem } from '@/game/ParticleSystem';
import { AOESystem } from '@/game/AOESystem';
import { ZoneSystem } from '@/game/ZoneSystem';
import { Character, GameResult, GameSession, RoundResult, LeaderboardEntry, ShopState, ShopCard, ZoneState } from '@/game/types';
import { GAME_CONFIG } from '@/game/config';
import { getLeaderboard, addLeaderboardEntry, isHighScore } from '@/lib/leaderboard';
import { upgradeEnemyCharacter, randomPlanetaryHouse, getPlanetaryHouseSymbol, getPlanetaryHouseColor, randomAttackEffect, createRandomStats } from '@/game/utils';
import { ShopSystem } from '@/game/ShopSystem';
import { InventorySystem } from '@/game/InventorySystem';
import { elementRegistry } from '@/game/ElementRegistry';
import Leaderboard from '@/components/Leaderboard';

type GameState = 'CHAR_SELECT' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER' | 'LEADERBOARD' | 'UPGRADE_PHASE';

const ArenaBrawl: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<GameState>('CHAR_SELECT');
  const [candidates, setCandidates] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [livingCharacters, setLivingCharacters] = useState<Character[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameSession, setGameSession] = useState<GameSession>({
    currentRound: 1,
    totalRounds: 3,
    cumulativeScore: 0,
    gold: 0,
    roundResults: [],
    isComplete: false
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [newLeaderboardEntry, setNewLeaderboardEntry] = useState<string | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [shopState, setShopState] = useState<ShopState | null>(null);
  const [zoneState, setZoneState] = useState<ZoneState | null>(null);
  const [hoveredInventoryItem, setHoveredInventoryItem] = useState<{ item: any; position: { x: number; y: number } } | null>(null);
  
  // Game systems
  const characterManagerRef = useRef<CharacterManager>(new CharacterManager());
  const aiControllerRef = useRef<AIController>(new AIController());
  const combatSystemRef = useRef<CombatSystem>(new CombatSystem(characterManagerRef.current));
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const aoeSystemRef = useRef<AOESystem>(new AOESystem());
  const shopSystemRef = useRef<ShopSystem>(new ShopSystem());
  const inventorySystemRef = useRef<InventorySystem>(new InventorySystem());
  const zoneSystemRef = useRef<ZoneSystem>(new ZoneSystem());
  
  // Initialize character selection
  useEffect(() => {
    if (gameState === 'CHAR_SELECT' && gameSession.currentRound === 1) {
      // First round - generate new candidates
      const newCandidates = characterManagerRef.current.generateCandidates(3);
      setCandidates(newCandidates);
    }
  }, [gameState, gameSession.currentRound]);
  
  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'PLAYING') return;
    
    const dt = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = currentTime;
    
    //if (dt > 0.05) return; // Skip frame if too much time has passed
    
    // Update game systems
    zoneSystemRef.current.update(currentTime, characterManagerRef.current.getAllCharacters());
    aiControllerRef.current.update(characterManagerRef.current.getAllCharacters(), dt);
    combatSystemRef.current.update(dt);
    characterManagerRef.current.removeDead();
    particleSystemRef.current.update(dt);
    aoeSystemRef.current.update(dt);
    
    // Update zone state for UI
    setZoneState(zoneSystemRef.current.getZoneState());
    
    // Update living characters for UI
    setLivingCharacters(characterManagerRef.current.getLivingCharacters());
    
    // Check for game end
    if (combatSystemRef.current.checkForGameEnd()) {
      const player = characterManagerRef.current.getPlayerCharacter();
      const place = characterManagerRef.current.getPlayerPlace();
      const score = Math.abs(place - GAME_CONFIG.TOTAL_COMBATANTS - 1);
      characterManagerRef.current.clearDeathTracker()
      
      const result: GameResult = {
        place,
        score,
        survived: player ? !player.isDead : false
      };
      
      setGameResult(result);
      
      // Update game session
      setGameSession(prev => {
        const roundResult: RoundResult = {
          ...result,
          roundNumber: prev.currentRound
        };
        
        const newSession = {
          ...prev,
          cumulativeScore: prev.cumulativeScore + score, // Running total of all scores
          gold: prev.gold + score, // Add score as spendable gold
          roundResults: [...prev.roundResults, roundResult],
          isComplete: prev.currentRound >= prev.totalRounds
        };
        
        return newSession;
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
    const handleGameEvent = (event: any) => {
      switch (event.type) {
        case 'combat_hit':
          if (event.data.attackEffect) {
            particleSystemRef.current.spawnAttackEffect(event.data.position, event.data.attackEffect);
          } else {
            particleSystemRef.current.spawnHitEffect(event.data.position);
          }
          break;
        
        case 'aoe_attack':
          // Show AOE area visualization
          aoeSystemRef.current.spawnAOEIndicator(
            event.data.position,
            event.data.direction,
            event.data.attackEffect
          );
          break;
        
        case 'character_died':
          particleSystemRef.current.spawnDeathEffect(event.data.character.position);
          characterManagerRef.current.addDeadCharacterByID(event.data.character.id);
          break;
        
        case 'player_kill':
          // Award bonus score and gold for player kills
          setGameSession(prev => ({
            ...prev,
            cumulativeScore: prev.cumulativeScore + event.data.scoreAwarded,
            gold: prev.gold + event.data.scoreAwarded
          }));
          break;
      }
    };
    
    combatSystemRef.current.addEventListener(handleGameEvent);
    characterManagerRef.current.addEventListener(handleGameEvent);
    
    return () => {
      combatSystemRef.current.removeEventListener(handleGameEvent);
      characterManagerRef.current.removeEventListener(handleGameEvent);
    };
  }, []);
  
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
    
    // Draw AOE indicators (before particles so particles render on top)
    aoeSystemRef.current.render(ctx);
    
    // Draw zone
    zoneSystemRef.current.render(ctx);
    
    // Draw particles
    particleSystemRef.current.render(ctx);
  }, []);
  
  const handleCharacterSelect = (character: Character) => {
    // Initialize character properties for progression
    const playerCharacter = {
      ...character,
      level: 1,
      baseStats: { ...character.stats },
      planetaryHouse: character.planetaryHouse || randomPlanetaryHouse(),
      equippedAttack: character.equippedAttack || randomAttackEffect(),
      inventory: []
    };
    
    setSelectedCharacter(playerCharacter);
    
    // Reset zone for new game
    zoneSystemRef.current.reset();
    
    // Spawn combatants and store enemy characters for later rounds
    characterManagerRef.current.spawnCombatants(playerCharacter);
    const enemyCharacters = characterManagerRef.current.getEnemyCharacters();
    
    setGameSession(prev => ({ 
      ...prev, 
      playerCharacter,
      enemyCharacters 
    }));
    setLivingCharacters(characterManagerRef.current.getLivingCharacters());
    setGameState('PLAYING');
  };
  
  const handleContinue = () => {
    if (gameSession.isComplete) {
      // Game is complete, check for high score
      if (isHighScore(gameSession.cumulativeScore)) {
        setGameState('GAME_OVER');
      } else {
        setGameState('LEADERBOARD');
        setLeaderboard(getLeaderboard());
      }
    } else {
      // Continue to next round - show shop first
      const newShopState = shopSystemRef.current.generateShop(gameSession.currentRound);
      setShopState(newShopState);
      setGameState('UPGRADE_PHASE');
    }
  };


  const handleShopPurchase = (card: ShopCard) => {
    if (!gameSession.playerCharacter || !shopState) return;
    
    const result = shopSystemRef.current.purchaseCard(
      card,
      gameSession.playerCharacter,
      gameSession.gold
    );
    
    if (result.success) {
      // Update gold
      setGameSession(prev => ({
        ...prev,
        gold: result.newScore,
        playerCharacter: gameSession.playerCharacter // Updated by reference
      }));
      
      // Remove purchased card from shop
      setShopState(prev => ({
        ...prev!,
        cards: prev!.cards.filter(c => c.id !== card.id)
      }));
      
      // Update selected character if it was replaced
      if (card.type === 'character') {
        setSelectedCharacter(gameSession.playerCharacter);
      }
    }
  };

  const handleShopReroll = () => {
    if (!shopState || gameSession.gold < shopState.rerollCost) return;
    
    const newShopState = shopSystemRef.current.rerollShop(shopState, gameSession.currentRound);
    setShopState(newShopState);
    
    // Deduct reroll cost from gold
    setGameSession(prev => ({
      ...prev,
      gold: prev.gold - shopState.rerollCost
    }));
  };

  const handleShopContinue = () => {
    if (gameSession.playerCharacter && gameSession.enemyCharacters) {
      // Upgrade all enemy characters with random stats
      const upgradedEnemies = gameSession.enemyCharacters.map(enemy => upgradeEnemyCharacter(enemy));
      
      setGameSession(prev => ({ 
        ...prev, 
        currentRound: prev.currentRound + 1,
        enemyCharacters: upgradedEnemies
      }));
      setGameResult(null);
      particleSystemRef.current.clear();
      
      // Reset zone for new round
      zoneSystemRef.current.reset();
      
      // Start the next round with upgraded characters
      characterManagerRef.current.spawnCombatants(gameSession.playerCharacter, upgradedEnemies);
      setLivingCharacters(characterManagerRef.current.getLivingCharacters());
      setGameState('PLAYING');
    }
  };

  const handleUseItem = (itemId: string) => {
    if (!gameSession.playerCharacter) return;
    
    const success = inventorySystemRef.current.useItem(gameSession.playerCharacter, itemId);
    if (success) {
      // Force re-render by updating the game session
      setGameSession(prev => ({ ...prev }));
    }
  };
  
  const handleSubmitScore = () => {
    if (playerName.trim()) {
      const entry = addLeaderboardEntry({
        playerName: playerName.trim(),
        totalScore: gameSession.cumulativeScore,
        date: new Date().toISOString(),
        roundResults: gameSession.roundResults
      });
      setNewLeaderboardEntry(entry.id);
      setLeaderboard(getLeaderboard());
      setGameState('LEADERBOARD');
    }
  };
  
  const handleNewGame = () => {
    setGameSession({
      currentRound: 1,
      totalRounds: 3,
      cumulativeScore: 0,
      gold: 0,
      roundResults: [],
      isComplete: false,
      playerCharacter: undefined,
      enemyCharacters: undefined
    });
    setGameState('CHAR_SELECT');
    setSelectedCharacter(null);
    setGameResult(null);
    setPlayerName('');
    setNewLeaderboardEntry(null);
    setShopState(null);
    setZoneState(null);
    particleSystemRef.current.clear();
    zoneSystemRef.current.clear();
  };
  
  const getHPBarColor = (currentHP: number, maxHP: number) => {
    const ratio = currentHP / maxHP;
    if (ratio > 0.6) return '#22b222';
    if (ratio > 0.3) return '#a1a122';
    return '#a14444';
  };

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Store mouse position for tooltip
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    // Check if mouse is over any character
    const characters = characterManagerRef.current.getAllCharacters();
    let foundCharacter: Character | null = null;
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - character.position.x, 2) + 
        Math.pow(mouseY - character.position.y, 2)
      );
      
      if (distance <= GAME_CONFIG.CHARACTER_SIZE / 2) {
        foundCharacter = character;
        break;
      }
    }
    
    setHoveredCharacter(foundCharacter);
  }, [gameState]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredCharacter(null);
  }, []);

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
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
          
          {/* Character Stats Tooltip */}
          {hoveredCharacter && gameState === 'PLAYING' && (
            <div 
              className="fixed z-50 bg-ui-panel border border-ui-border rounded-lg p-3 shadow-lg pointer-events-none"
              style={{
                left: mousePosition.x + 10,
                top: mousePosition.y - 10,
                transform: mousePosition.x > window.innerWidth - 200 ? 'translateX(-100%) translateX(-20px)' : ''
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: hoveredCharacter.color }}
                >
                  {hoveredCharacter.emoji}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {hoveredCharacter.isPlayer ? (
                      <span className="text-neon-yellow">
                        YOU {hoveredCharacter.level ? `(Lv${hoveredCharacter.level})` : ''}
                      </span>
                    ) : (
                      <span className="text-neon-red">
                        NPC {hoveredCharacter.level ? `(Lv${hoveredCharacter.level})` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    HP: {hoveredCharacter.currentHP}/{hoveredCharacter.stats.hp}
                  </div>
                  <div className="text-xs flex items-center gap-1">
                    <span 
                      className="font-bold"
                      style={{ color: elementRegistry.getElementColor(hoveredCharacter.stats.element) }}
                    >
                      {elementRegistry.getElementIcon(hoveredCharacter.stats.element)}
                    </span>
                    <span style={{ color: elementRegistry.getElementColor(hoveredCharacter.stats.element) }}>
                      {hoveredCharacter.stats.element}
                    </span>
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span 
                        className="font-bold"
                        style={{ color: getPlanetaryHouseColor(hoveredCharacter.planetaryHouse) }}
                      >
                        {getPlanetaryHouseSymbol(hoveredCharacter.planetaryHouse)}
                      </span>
                      <span style={{ color: getPlanetaryHouseColor(hoveredCharacter.planetaryHouse) }}>
                        {hoveredCharacter.planetaryHouse}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{hoveredCharacter.equippedAttack.icon}</span>
                      <span className="text-muted-foreground">
                        {hoveredCharacter.equippedAttack.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Attack Power:</span>
                  <span className="text-neon-red">{hoveredCharacter.stats.attackPower}</span>
                </div>
                <div className="flex justify-between">
                  <span>Defense:</span>
                  <span className="text-neon-blue">{hoveredCharacter.stats.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attack Range:</span>
                  <span className="text-neon-purple">{hoveredCharacter.equippedAttack.aoeSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="text-neon-yellow">{hoveredCharacter.stats.speed}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Character Selection Overlay */}
          {gameState === 'CHAR_SELECT' && gameSession.currentRound === 1 && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
              <Card className="p-8 bg-ui-panel border-ui-border">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-primary mb-2">Choose Your Fighter</h2>
                  <div className="text-lg text-muted-foreground">
                    Round {gameSession.currentRound} of {gameSession.totalRounds}
                  </div>
                  {gameSession.cumulativeScore > 0 && (
                    <div className="text-sm text-neon-cyan mt-1">
                      Total Score: {gameSession.cumulativeScore}
                    </div>
                  )}
                  {gameSession.gold > 0 && (
                    <div className="text-sm text-gold mt-1">
                      Gold: {gameSession.gold}
                    </div>
                  )}
                </div>
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
                            <span>Attack Power:</span>
                            <span className="text-neon-red">{candidate.stats.attackPower}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Defense:</span>
                            <span className="text-neon-blue">{candidate.stats.defense}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Element:</span>
                            <span 
                              className="text-xs"
                              style={{ color: elementRegistry.getElementColor(candidate.stats.element) }}
                            >
                              {elementRegistry.getElementIcon(candidate.stats.element)} {candidate.stats.element}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Speed:</span>
                            <span className="text-neon-yellow">{candidate.stats.speed}</span>
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
          
          {/* Round End Overlay */}
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
                  <div>Round {gameSession.currentRound} of {gameSession.totalRounds}</div>
                  <div>Place: <span className="text-primary font-bold">#{gameResult.place}</span></div>
                  <div>Score: <span className="text-neon-cyan font-bold">{gameResult.score}</span></div>
                  <div className="text-xl font-bold text-neon-yellow mt-4">
                    Total Score: {gameSession.cumulativeScore}
                  </div>
                  <div className="text-lg font-bold text-gold mt-2">
                    Gold: {gameSession.gold}
                  </div>
                </div>
                <Button 
                  onClick={handleContinue}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3 text-lg"
                >
                  {gameSession.isComplete ? 'Finish Game' : 'Next Round'}
                </Button>
              </Card>
            </div>
          )}
          
          {/* Shop/Upgrade Phase Overlay */}
          {gameState === 'UPGRADE_PHASE' && shopState && gameSession.playerCharacter && (
            <div className="absolute inset-0 bg-background/95 flex items-center justify-center rounded-lg overflow-y-auto">
              <div className="max-w-6xl w-full p-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-primary mb-2">Shop</h2>
                  <div className="text-lg text-muted-foreground">
                    Round {gameSession.currentRound} Complete - Prepare for Round {gameSession.currentRound + 1}
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="text-lg font-bold text-neon-cyan">
                      Total Score: {gameSession.cumulativeScore}
                    </div>
                    <div className="text-lg font-bold text-gold">
                      Gold: {gameSession.gold}
                    </div>
                  </div>
                </div>
                
                {/* Character & Inventory Display */}
                <div className="flex justify-center items-center gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: gameSession.playerCharacter.color }}
                    >
                      {gameSession.playerCharacter.emoji}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Level {gameSession.playerCharacter.level || 1}</div>
                      <div className="text-xs text-muted-foreground">
                        HP: {gameSession.playerCharacter.stats.hp} | ATK: {gameSession.playerCharacter.stats.attackPower} | DEF: {gameSession.playerCharacter.stats.defense} | SPD: {gameSession.playerCharacter.stats.speed}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-3">
                        <span 
                          className="flex items-center gap-1"
                          style={{ color: elementRegistry.getElementColor(gameSession.playerCharacter.stats.element) }}
                        >
                          {elementRegistry.getElementIcon(gameSession.playerCharacter.stats.element)} {gameSession.playerCharacter.stats.element}
                        </span>
                        <span 
                          className="flex items-center gap-1"
                          style={{ color: getPlanetaryHouseColor(gameSession.playerCharacter.planetaryHouse) }}
                        >
                          {getPlanetaryHouseSymbol(gameSession.playerCharacter.planetaryHouse)} {gameSession.playerCharacter.planetaryHouse}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Inventory */}
                  <div className="flex gap-2">
                    <div className="text-sm font-medium">Inventory:</div>
                    {[0, 1].map(slot => {
                      const item = gameSession.playerCharacter!.inventory[slot];
                      return (
                        <div 
                          key={slot}
                          className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-lg ${
                            item 
                              ? 'border-primary bg-primary/10 cursor-pointer hover:bg-primary/20' 
                              : 'border-muted bg-muted/10'
                          }`}
                          onClick={() => item && handleUseItem(item.id)}
                          onMouseEnter={(e) => {
                            if (item) {
                              setHoveredInventoryItem({
                                item,
                                position: { x: e.clientX, y: e.clientY }
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredInventoryItem(null)}
                          onMouseMove={(e) => {
                            if (item) {
                              setHoveredInventoryItem({
                                item,
                                position: { x: e.clientX, y: e.clientY }
                              });
                            }
                          }}
                        >
                          {item ? item.icon : '+'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Shop Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {shopState.cards.map((card) => (
                    <Card
                      key={card.id}
                      className={`p-4 cursor-pointer hover:bg-secondary/50 border-ui-border transition-all hover:scale-105 ${
                        gameSession.gold >= card.cost 
                          ? 'hover:shadow-[var(--glow-effect)]' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => gameSession.gold >= card.cost && handleShopPurchase(card)}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold mb-2 text-primary">
                          {card.type === 'character' ? 'Character' : card.item?.type === 'attack' ? 'Attack' : card.item?.type === 'evolve' ? 'Evolution' : 'Stat Chip'}
                        </div>
                        <div className="text-2xl mb-2">
                          {card.type === 'character' ? card.character?.emoji : card.item?.icon}
                        </div>
                        <div className="text-sm font-medium mb-1">
                          {card.type === 'character' ? 'New Fighter' : card.item?.name}
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          {card.type === 'character' 
                            ? `Level 1 - ${card.character?.stats.element} element` 
                            : card.item?.description
                          }
                        </div>
                        
                        {/* Character Stats */}
                        {card.type === 'character' && card.character && (
                          <div className="space-y-1 text-xs mb-3">
                            <div className="flex justify-between">
                              <span>HP:</span>
                              <span className="text-neon-green">{card.character.stats.hp}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attack Power:</span>
                              <span className="text-neon-red">{card.character.stats.attackPower}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Defense:</span>
                              <span className="text-neon-blue">{card.character.stats.defense}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Speed:</span>
                              <span className="text-neon-yellow">{card.character.stats.speed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Element:</span>
                              <span 
                                className="text-xs"
                                style={{ color: elementRegistry.getElementColor(card.character.stats.element) }}
                              >
                                {elementRegistry.getElementIcon(card.character.stats.element)} {card.character.stats.element}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attack:</span>
                              <span className="text-neon-purple">{card.character.equippedAttack.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>House:</span>
                              <span 
                                className="text-xs"
                                style={{ color: getPlanetaryHouseColor(card.character.planetaryHouse) }}
                              >
                                {getPlanetaryHouseSymbol(card.character.planetaryHouse)} {card.character.planetaryHouse}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Attack Item Stats */}
                        {card.item?.type === 'attack' && (
                          <div className="space-y-1 text-xs mb-3">
                            {(() => {
                              const attackScroll = card.item as any;
                              const attack = attackScroll.attackEffect;
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span>Damage:</span>
                                    <span className="text-neon-red">{attack.baseDamage}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Cooldown:</span>
                                    <span className="text-neon-yellow">{attack.cooldown}ms</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Element:</span>
                                    <span 
                                      className="text-xs"
                                      style={{ color: elementRegistry.getElementColor(attack.element) }}
                                    >
                                      {elementRegistry.getElementIcon(attack.element)} {attack.element}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Shape:</span>
                                    <span className="text-neon-purple">{attack.aoeShape}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Range:</span>
                                    <span className="text-neon-cyan">{attack.aoeSize}px</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Evolution Stone Stats */}
                        {card.item?.type === 'evolve' && (
                          <div className="space-y-1 text-xs mb-3">
                            {(() => {
                              const evolveStone = card.item as any;
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span>Target:</span>
                                    <span 
                                      className="text-xs"
                                      style={{ color: elementRegistry.getElementColor(evolveStone.targetElement) }}
                                    >
                                      {elementRegistry.getElementIcon(evolveStone.targetElement)} {evolveStone.targetElement}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>HP Mult:</span>
                                    <span className="text-neon-green">×{evolveStone.statMultipliers.hp}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ATK Mult:</span>
                                    <span className="text-neon-red">×{evolveStone.statMultipliers.attackPower}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>DEF Mult:</span>
                                    <span className="text-neon-blue">×{evolveStone.statMultipliers.defense}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>SPD Mult:</span>
                                    <span className="text-neon-yellow">×{evolveStone.statMultipliers.speed}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Stat Chip Stats */}
                        {card.item?.type === 'stat' && (
                          <div className="space-y-1 text-xs mb-3">
                            {(() => {
                              const statChip = card.item as any;
                              return (
                                <div className="flex justify-between">
                                  <span>Bonus:</span>
                                  <span className="text-neon-green">+{statChip.bonus} {statChip.statType}</span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        <div className="text-sm font-bold text-neon-yellow">
                          {card.cost} Gold
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Shop Controls */}
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={handleShopReroll}
                    disabled={gameSession.gold < shopState.rerollCost}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    Reroll ({shopState.rerollCost} Gold)
                  </Button>
                  <Button 
                    onClick={handleShopContinue}
                    className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-2"
                  >
                    Start Next Round
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Inventory Item Tooltip */}
          {hoveredInventoryItem && (
            <div 
              className="fixed z-50 bg-ui-panel border border-ui-border rounded-lg p-3 shadow-lg pointer-events-none"
              style={{
                left: hoveredInventoryItem.position.x + 10,
                top: hoveredInventoryItem.position.y - 10,
                transform: hoveredInventoryItem.position.x > window.innerWidth - 250 ? 'translateX(-100%) translateX(-20px)' : ''
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{hoveredInventoryItem.item.icon}</span>
                <div>
                  <div className="text-sm font-medium">{hoveredInventoryItem.item.name}</div>
                  <div className="text-xs text-muted-foreground">{hoveredInventoryItem.item.description}</div>
                </div>
              </div>
              
              {/* Attack Item Stats */}
              {hoveredInventoryItem.item.type === 'attack' && (
                <div className="space-y-1 text-xs">
                  {(() => {
                    const attack = hoveredInventoryItem.item.attackEffect;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Damage:</span>
                          <span className="text-neon-red">{attack.baseDamage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cooldown:</span>
                          <span className="text-neon-yellow">{attack.cooldown}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Element:</span>
                          <span 
                            className="text-xs"
                            style={{ color: elementRegistry.getElementColor(attack.element) }}
                          >
                            {elementRegistry.getElementIcon(attack.element)} {attack.element}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shape:</span>
                          <span className="text-neon-purple">{attack.aoeShape}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="text-neon-cyan">{attack.aoeSize}px</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {/* Evolution Stone Stats */}
              {hoveredInventoryItem.item.type === 'evolve' && (
                <div className="space-y-1 text-xs">
                  {(() => {
                    const evolveStone = hoveredInventoryItem.item;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Target:</span>
                          <span 
                            className="text-xs"
                            style={{ color: elementRegistry.getElementColor(evolveStone.targetElement) }}
                          >
                            {elementRegistry.getElementIcon(evolveStone.targetElement)} {evolveStone.targetElement}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>HP Mult:</span>
                          <span className="text-neon-green">×{evolveStone.statMultipliers.hp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ATK Mult:</span>
                          <span className="text-neon-red">×{evolveStone.statMultipliers.attackPower}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>DEF Mult:</span>
                          <span className="text-neon-blue">×{evolveStone.statMultipliers.defense}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SPD Mult:</span>
                          <span className="text-neon-yellow">×{evolveStone.statMultipliers.speed}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {/* Stat Chip Stats */}
              {hoveredInventoryItem.item.type === 'stat' && (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Bonus:</span>
                    <span className="text-neon-green">+{hoveredInventoryItem.item.bonus} {hoveredInventoryItem.item.statType}</span>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground mt-2">
                Click to use
              </div>
            </div>
          )}
          
          {/* Final Game Over Overlay */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
              <Card className="p-8 bg-ui-panel border-ui-border text-center max-w-md">
                <h2 className="text-4xl font-bold mb-4 text-neon-yellow">🎉 HIGH SCORE! 🎉</h2>
                <div className="space-y-2 mb-6 text-lg">
                  <div className="text-2xl font-bold text-neon-cyan">
                    Final Score: {gameSession.cumulativeScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completed {gameSession.totalRounds} rounds
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter your name:</label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your name"
                      className="text-center"
                      maxLength={20}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitScore()}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSubmitScore}
                      disabled={!playerName.trim()}
                      className="bg-primary hover:bg-primary/80 text-primary-foreground flex-1"
                    >
                      Submit Score
                    </Button>
                    <Button 
                      onClick={handleNewGame}
                      variant="outline"
                      className="flex-1"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Leaderboard Overlay */}
          {gameState === 'LEADERBOARD' && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
              <div className="max-w-md w-full mx-4">
                <Leaderboard entries={leaderboard} highlightEntry={newLeaderboardEntry} />
                <div className="mt-4 text-center">
                  <Button 
                    onClick={handleNewGame}
                    className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3 text-lg"
                  >
                    Play Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Character Status Panel */}
      {gameState === 'PLAYING' && (
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
          </div>
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
      )}
    </div>
  );
};

export default ArenaBrawl;