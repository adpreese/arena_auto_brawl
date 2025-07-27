import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasSize } from '@/hooks/useResponsive';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CharacterManager } from '@/game/CharacterManager';
import { AIController } from '@/game/AIController';
import { CombatSystem } from '@/game/CombatSystem';
import { ParticleSystem } from '@/game/ParticleSystem';
import { AOESystem } from '@/game/AOESystem';
import { DamageIndicatorSystem } from '@/game/DamageIndicatorSystem';
import { RoundTimerSystem, RoundTimerState } from '@/game/RoundTimerSystem';
import { Character, GameResult, GameSession, RoundResult, LeaderboardEntry, ShopState, ShopCard } from '@/game/types';
import { GAME_CONFIG } from '@/game/config';
import { getLeaderboard, addLeaderboardEntry, isHighScore } from '@/lib/leaderboard';
import { upgradeEnemyCharacter, randomPlanetaryHouse, getPlanetaryHouseSymbol, getPlanetaryHouseColor, randomAttackEffect, createRandomStats } from '@/game/utils';
import { ShopSystem } from '@/game/ShopSystem';
import { InventorySystem } from '@/game/InventorySystem';
import { elementRegistry } from '@/game/ElementRegistry';
import { audioManager } from '@/game/AudioManager';
import Leaderboard from '@/components/Leaderboard';

type GameState = 'CHAR_SELECT' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER' | 'LEADERBOARD' | 'UPGRADE_PHASE';

const ArenaBrawl: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Responsive state
  const { isMobile, isTablet, isDesktop, canvasSize } = useCanvasSize();
  
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
  const [hoveredInventoryItem, setHoveredInventoryItem] = useState<{ item: any; position: { x: number; y: number } } | null>(null);
  const [timerState, setTimerState] = useState<RoundTimerState | null>(null);
  
  // Game systems
  const characterManagerRef = useRef<CharacterManager>(new CharacterManager());
  const aiControllerRef = useRef<AIController>(new AIController());
  const combatSystemRef = useRef<CombatSystem>(new CombatSystem(characterManagerRef.current));
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const aoeSystemRef = useRef<AOESystem>(new AOESystem());
  const shopSystemRef = useRef<ShopSystem>(new ShopSystem());
  const inventorySystemRef = useRef<InventorySystem>(new InventorySystem());
  const damageIndicatorSystemRef = useRef<DamageIndicatorSystem>(new DamageIndicatorSystem());
  const roundTimerSystemRef = useRef<RoundTimerSystem>(new RoundTimerSystem());
  
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
    aiControllerRef.current.update(characterManagerRef.current.getLivingCharacters(), dt);
    combatSystemRef.current.update(dt);
    characterManagerRef.current.removeDead();
    particleSystemRef.current.update(dt);
    aoeSystemRef.current.update(dt);
    damageIndicatorSystemRef.current.update(dt);
    roundTimerSystemRef.current.update(currentTime);
    
    
    // Update timer state for UI
    setTimerState(roundTimerSystemRef.current.getState());
    
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

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      // Note: We don't destroy the audio manager here since it's a singleton
      // and might be used across page navigations
    };
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    const handleGameEvent = (event: any) => {
      switch (event.type) {
        case 'combat_hit':
          if (event.data.attackEffect) {
            particleSystemRef.current.spawnAttackEffect(
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
            particleSystemRef.current.spawnHitEffect(event.data.position);
            // Play regular attack sound for non-elemental hits
            audioManager.playAttackSound('regular-attack');
          }
          
          // Spawn damage indicator
          if (event.data.damageIndicator) {
            const indicatorData = event.data.damageIndicator;
            damageIndicatorSystemRef.current.spawnDamageIndicator(
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
          const livingChars = characterManagerRef.current.getLivingCharacters();
          for (const character of livingChars) {
            characterManagerRef.current.takeDamage(
              character.id, 
              event.data.damage, 
              'timer' // attacker ID for overtime damage
            );
          }
          break;
      }
    };
    
    combatSystemRef.current.addEventListener(handleGameEvent);
    characterManagerRef.current.addEventListener(handleGameEvent);
    roundTimerSystemRef.current.addEventListener(handleGameEvent);
    
    return () => {
      combatSystemRef.current.removeEventListener(handleGameEvent);
      characterManagerRef.current.removeEventListener(handleGameEvent);
      roundTimerSystemRef.current.removeEventListener(handleGameEvent);
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
    
    // Draw arena border - clear boundary definition
    ctx.save();
    
    // Draw outer arena boundary (main border)
    ctx.strokeStyle = '#1a1a1a'; // Dark gray for clear boundary
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw inner arena boundary for better definition
    ctx.strokeStyle = '#333333'; // Slightly lighter for contrast
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Draw corner markers to emphasize square boundaries
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    const cornerSize = Math.min(20, canvas.width * 0.05);
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(cornerSize, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, cornerSize);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - cornerSize, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - cornerSize);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(cornerSize, canvas.height);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - cornerSize, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - cornerSize);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw characters
    const characters = characterManagerRef.current.getAllCharacters();
    const scaleFactor = canvas.width / GAME_CONFIG.ARENA_SIZE;
    const characterSize = GAME_CONFIG.CHARACTER_SIZE * scaleFactor;
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      ctx.save();
      
      // Scale character position
      const scaledX = character.position.x * scaleFactor;
      const scaledY = character.position.y * scaleFactor;
      
      // Character background
      ctx.fillStyle = character.color;
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, characterSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Character emoji
      ctx.font = `${characterSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(character.emoji, scaledX, scaledY);
      
      // Player indicator - bright yellow circle
      if (character.isPlayer) {
        ctx.strokeStyle = '#FFD700'; // Bright yellow/gold color
        ctx.lineWidth = Math.max(1, 2 * scaleFactor);
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, characterSize / 2 + (8 * scaleFactor), 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw AOE indicators (before particles so particles render on top)
    aoeSystemRef.current.render(ctx);
    
    
    // Draw particles
    particleSystemRef.current.render(ctx, scaleFactor);
    
    // Draw damage indicators
    damageIndicatorSystemRef.current.render(ctx);
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
    
    
    // Spawn combatants and store enemy characters for later rounds
    characterManagerRef.current.spawnCombatants(playerCharacter);
    const enemyCharacters = characterManagerRef.current.getEnemyCharacters();
    
    setGameSession(prev => ({ 
      ...prev, 
      playerCharacter,
      enemyCharacters 
    }));
    setLivingCharacters(characterManagerRef.current.getLivingCharacters());
    roundTimerSystemRef.current.start();
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
      damageIndicatorSystemRef.current.clear();
      roundTimerSystemRef.current.reset();
      
      
      // Start the next round with upgraded characters
      characterManagerRef.current.spawnCombatants(gameSession.playerCharacter, upgradedEnemies);
      setLivingCharacters(characterManagerRef.current.getLivingCharacters());
      roundTimerSystemRef.current.start();
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
    particleSystemRef.current.clear();
    damageIndicatorSystemRef.current.clear();
    roundTimerSystemRef.current.reset();
  };
  
  const getHPBarColor = (currentHP: number, maxHP: number) => {
    const ratio = currentHP / maxHP;
    if (ratio > 0.6) return '#22b222';
    if (ratio > 0.3) return '#a1a122';
    return '#a14444';
  };

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    // Handle both mouse and touch events
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return;
    }
    
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    // Store mouse position for tooltip
    setMousePosition({ x: clientX, y: clientY });
    
    // Check if mouse is over any character
    const characters = characterManagerRef.current.getAllCharacters();
    const scaleFactor = canvas.width / GAME_CONFIG.ARENA_SIZE;
    const characterSize = GAME_CONFIG.CHARACTER_SIZE * scaleFactor;
    let foundCharacter: Character | null = null;
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      // Scale character position for hit detection
      const scaledX = character.position.x * scaleFactor;
      const scaledY = character.position.y * scaleFactor;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - scaledX, 2) + 
        Math.pow(mouseY - scaledY, 2)
      );
      
      if (distance <= characterSize / 2) {
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
    <div className="min-h-screen-mobile bg-background mobile-stack safe-area-inset">
      {/* Game Canvas */}
      <div className={`flex-1 flex items-center justify-center ${isMobile ? 'p-2 overflow-auto' : 'p-2 mobile:p-4'}`}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border-4 border-arena-border bg-arena-bg rounded-sm shadow-[var(--arena-glow)] max-w-full max-h-full ring-2 ring-gray-400/30"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            onTouchStart={isMobile ? handleCanvasMouseMove : undefined}
            onTouchMove={isMobile ? handleCanvasMouseMove : undefined}
            onTouchEnd={isMobile ? handleCanvasMouseLeave : undefined}
          />
          
          {/* Character Stats Tooltip */}
          {hoveredCharacter && gameState === 'PLAYING' && (
            <div 
              className={`fixed z-50 bg-ui-panel border border-ui-border rounded-lg shadow-lg pointer-events-none ${
                isMobile ? 'p-2 text-xs max-w-xs' : 'p-3 max-w-sm'
              }`}
              style={{
                left: isMobile 
                  ? Math.min(mousePosition.x + 10, window.innerWidth - 200)
                  : mousePosition.x + 10,
                top: isMobile 
                  ? Math.max(mousePosition.y - 80, 10)
                  : mousePosition.y - 10,
                transform: mousePosition.x > window.innerWidth - 200 ? 'translateX(-100%) translateX(-20px)' : ''
              }}
            >
              <div className={`flex items-center gap-2 mb-2 ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <div 
                  className={`rounded-full flex items-center justify-center ${
                    isMobile ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-sm'
                  }`}
                  style={{ backgroundColor: hoveredCharacter.color }}
                >
                  {hoveredCharacter.emoji}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
                  <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    HP: {hoveredCharacter.currentHP}/{hoveredCharacter.stats.hp}
                  </div>
                  {!isMobile && (
                    <>
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
                    </>
                  )}
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
            <div className={`mobile-overlay ${!isMobile && 'absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg'}`}>
              <Card className={`bg-ui-panel border-ui-border ${isMobile ? 'w-full max-w-none border-none' : 'p-8'} ${isMobile && 'bg-transparent'}`}>
                <div className={`text-center ${isMobile ? 'mb-6' : 'mb-4'}`}>
                  <h2 className={`font-bold text-primary mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                    Choose Your Fighter
                  </h2>
                  <div className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
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
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3 gap-6'}`}>
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      className={`cursor-pointer hover:bg-secondary/50 border-ui-border transition-all touch-target ${
                        isMobile 
                          ? 'p-4 hover:scale-102' 
                          : 'p-4 hover:scale-105 hover:shadow-[var(--glow-effect)]'
                      }`}
                      onClick={() => handleCharacterSelect(candidate)}
                    >
                      <div className={`${isMobile ? 'flex items-center gap-4' : 'text-center'}`}>
                        <div 
                          className={`rounded-full flex items-center justify-center flex-shrink-0 ${
                            isMobile 
                              ? 'w-12 h-12 text-xl' 
                              : 'w-16 h-16 mx-auto mb-3 text-2xl'
                          }`}
                          style={{ backgroundColor: candidate.color }}
                        >
                          {candidate.emoji}
                        </div>
                        <div className="flex-1">
                          {candidate.name && (
                            <div className={`font-bold text-primary mb-2 ${
                              isMobile ? 'text-base text-left' : 'text-lg text-center'
                            }`}>
                              {candidate.name}
                            </div>
                          )}
                          <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            <div className={`flex gap-2 mb-2 ${isMobile ? 'justify-start flex-wrap' : 'justify-center items-center'}`}>
                              <div className="flex items-center gap-1 text-xs">
                                <span 
                                  className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}
                                  style={{ color: getPlanetaryHouseColor(candidate.planetaryHouse) }}
                                >
                                  {getPlanetaryHouseSymbol(candidate.planetaryHouse)}
                                </span>
                                <span 
                                  className="font-medium"
                                  style={{ color: getPlanetaryHouseColor(candidate.planetaryHouse) }}
                                >
                                  {isMobile ? candidate.planetaryHouse.slice(0, 4) : candidate.planetaryHouse}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <span className={isMobile ? 'text-base' : 'text-lg'}>{candidate.equippedAttack.icon}</span>
                                <span className="font-medium text-muted-foreground">
                                  {isMobile ? candidate.equippedAttack.name.slice(0, 8) : candidate.equippedAttack.name}
                                </span>
                              </div>
                            </div>
                            {isMobile ? (
                              // Mobile: Compact grid layout
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                <div className="flex justify-between">
                                  <span>ATK:</span>
                                  <span className="text-neon-red">{candidate.stats.attackPower}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>DEF:</span>
                                  <span className="text-neon-blue">{candidate.stats.defense}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SPD:</span>
                                  <span className="text-neon-yellow">{candidate.stats.speed}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>HP:</span>
                                  <span className="text-neon-green">{candidate.stats.hp}</span>
                                </div>
                                <div className="col-span-2 flex justify-between">
                                  <span>Element:</span>
                                  <span 
                                    className="text-xs"
                                    style={{ color: elementRegistry.getElementColor(candidate.stats.element) }}
                                  >
                                    {elementRegistry.getElementIcon(candidate.stats.element)} {candidate.stats.element}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Desktop: Full layout
                              <>
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
                              </>
                            )}
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
            <div className={`mobile-overlay ${!isMobile && 'absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg'}`}>
              <Card className={`bg-ui-panel border-ui-border text-center ${isMobile ? 'w-full max-w-none border-none bg-transparent' : 'p-8'}`}>
                <h2 className={`font-bold mb-4 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                  {gameResult.place === 1 ? (
                    <span className="text-neon-yellow">🏆 VICTORY! 🏆</span>
                  ) : (
                    <span className="text-neon-red">DEFEATED</span>
                  )}
                </h2>
                <div className={`space-y-2 mb-6 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  <div>Round {gameSession.currentRound} of {gameSession.totalRounds}</div>
                  <div>Place: <span className="text-primary font-bold">#{gameResult.place}</span></div>
                  <div className="text-xl font-bold text-neon-yellow mt-4">
                    Total Score: {gameSession.cumulativeScore}
                  </div>
                  <div className="text-lg font-bold text-gold mt-2">
                    Gold: {gameSession.gold}
                  </div>
                </div>
                <Button 
                  onClick={handleContinue}
                  className={`bg-primary hover:bg-primary/80 text-primary-foreground touch-target ${
                    isMobile ? 'w-full py-4 text-lg' : 'px-8 py-3 text-lg'
                  }`}
                >
                  {gameSession.isComplete ? 'Finish Game' : 'Next Round'}
                </Button>
              </Card>
            </div>
          )}
          
          {/* Shop/Upgrade Phase Overlay */}
          {gameState === 'UPGRADE_PHASE' && shopState && gameSession.playerCharacter && (
            <div className={`${isMobile ? 'mobile-overlay' : 'absolute inset-0 bg-background/95 flex justify-start items-start rounded-lg overflow-y-auto p-4'}`}>
              <div className={`w-full ${isMobile ? 'px-2' : 'max-w-6xl p-6 h-fit'}`}>
                <div className={`text-center mb-4 ${isMobile ? 'mb-6' : 'mb-6'}`}>
                  <h2 className={`font-bold text-primary mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Shop</h2>
                  <div className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    Round {gameSession.currentRound} Complete - Prepare for Round {gameSession.currentRound + 1}
                  </div>
                  <div className={`flex gap-4 mt-2 ${isMobile ? 'justify-center flex-wrap text-sm' : 'justify-center gap-6'}`}>
                    <div className={`font-bold text-neon-cyan ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      {isMobile ? `Score: ${gameSession.cumulativeScore}` : `Total Score: ${gameSession.cumulativeScore}`}
                    </div>
                    <div className={`font-bold text-gold ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      Gold: {gameSession.gold}
                    </div>
                  </div>
                </div>
                
                {/* Character & Inventory Display */}
                <div className={`flex items-center mb-4 ${
                  isMobile 
                    ? 'flex-col gap-4' 
                    : 'justify-center gap-6 mb-6'
                }`}>
                  <div className={`flex items-center gap-3 ${isMobile ? 'w-full justify-center' : 'gap-4'}`}>
                    <div 
                      className={`rounded-full flex items-center justify-center ${
                        isMobile ? 'w-12 h-12 text-xl' : 'w-16 h-16 text-2xl'
                      }`}
                      style={{ backgroundColor: gameSession.playerCharacter.color }}
                    >
                      {gameSession.playerCharacter.emoji}
                    </div>
                    <div className={`${isMobile ? 'text-center' : 'text-left'}`}>
                      <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                        Level {gameSession.playerCharacter.level || 1}
                      </div>
                      <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {isMobile ? (
                          // Mobile: Compact stats
                          <>
                            <div>HP: {gameSession.playerCharacter.stats.hp} | ATK: {gameSession.playerCharacter.stats.attackPower}</div>
                            <div>DEF: {gameSession.playerCharacter.stats.defense} | SPD: {gameSession.playerCharacter.stats.speed}</div>
                          </>
                        ) : (
                          // Desktop: Single line
                          `HP: ${gameSession.playerCharacter.stats.hp} | ATK: ${gameSession.playerCharacter.stats.attackPower} | DEF: ${gameSession.playerCharacter.stats.defense} | SPD: ${gameSession.playerCharacter.stats.speed}`
                        )}
                      </div>
                      {!isMobile && (
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
                      )}
                    </div>
                  </div>
                  
                  {/* Inventory */}
                  <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                    <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Inventory:</div>
                    {[0, 1].map(slot => {
                      const item = gameSession.playerCharacter!.inventory[slot];
                      return (
                        <div 
                          key={slot}
                          className={`border-2 rounded-lg flex items-center justify-center touch-target ${
                            isMobile ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg'
                          } ${
                            item 
                              ? 'border-primary bg-primary/10 cursor-pointer hover:bg-primary/20' 
                              : 'border-muted bg-muted/10'
                          }`}
                          onClick={() => item && handleUseItem(item.id)}
                          onMouseEnter={(e) => {
                            if (item && !isMobile) {
                              setHoveredInventoryItem({
                                item,
                                position: { x: e.clientX, y: e.clientY }
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredInventoryItem(null)}
                          onMouseMove={(e) => {
                            if (item && !isMobile) {
                              setHoveredInventoryItem({
                                item,
                                position: { x: e.clientX, y: e.clientY }
                              });
                            }
                          }}
                          onTouchStart={(e) => {
                            if (item && isMobile) {
                              setHoveredInventoryItem({
                                item,
                                position: { x: e.touches[0].clientX, y: e.touches[0].clientY }
                              });
                            }
                          }}
                          onTouchEnd={() => isMobile && setHoveredInventoryItem(null)}
                        >
                          {item ? item.icon : '+'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Shop Cards */}
                <div className={`grid gap-3 mb-4 ${
                  isMobile ? 'grid-cols-1' : 'grid-cols-3 gap-4 mb-6'
                }`}>
                  {shopState.cards.map((card) => (
                    <Card
                      key={card.id}
                      className={`cursor-pointer hover:bg-secondary/50 border-ui-border transition-all touch-target ${
                        isMobile 
                          ? 'p-3 hover:scale-102' 
                          : 'p-4 hover:scale-105'
                      } ${
                        gameSession.gold >= card.cost 
                          ? 'hover:shadow-[var(--glow-effect)]' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => gameSession.gold >= card.cost && handleShopPurchase(card)}
                    >
                      <div className={`${isMobile ? 'flex items-center gap-3' : 'text-center'}`}>
                        {isMobile && (
                          <div className="flex-shrink-0">
                            <div className="text-2xl mb-1">
                              {card.type === 'character' ? card.character?.emoji : card.item?.icon}
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className={`font-bold mb-1 text-primary ${isMobile ? 'text-sm text-left' : 'text-lg mb-2'}`}>
                            {card.type === 'character' ? 'Character' : card.item?.type === 'attack' ? 'Attack' : card.item?.type === 'evolve' ? 'Evolution' : 'Stat Chip'}
                          </div>
                          {!isMobile && (
                            <div className="text-2xl mb-2">
                              {card.type === 'character' ? card.character?.emoji : card.item?.icon}
                            </div>
                          )}
                          <div className={`font-medium mb-1 ${isMobile ? 'text-xs text-left' : 'text-sm'}`}>
                            {card.type === 'character' ? 'New Fighter' : card.item?.name}
                          </div>
                          <div className={`text-muted-foreground mb-2 ${isMobile ? 'text-xs text-left' : 'text-xs mb-3'}`}>
                            {card.type === 'character' 
                              ? `Level 1 - ${card.character?.stats.element} element` 
                              : card.item?.description
                            }
                          </div>
                        
                          {/* Character Stats */}
                          {card.type === 'character' && card.character && (
                            <div className={`space-y-1 mb-2 ${isMobile ? 'text-xs' : 'text-xs mb-3'}`}>
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
                        
                          <div className={`font-bold text-neon-yellow ${
                            isMobile ? 'text-right text-sm' : 'text-sm'
                          }`}>
                            {card.cost} Gold
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Shop Controls */}
                <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'justify-center gap-4'}`}>
                  <Button 
                    onClick={handleShopReroll}
                    disabled={gameSession.gold < shopState.rerollCost}
                    variant="outline"
                    className={`touch-target ${
                      isMobile ? 'w-full py-3' : 'px-6 py-2'
                    }`}
                  >
                    Reroll ({shopState.rerollCost} Gold)
                  </Button>
                  <Button 
                    onClick={handleShopContinue}
                    className={`bg-primary hover:bg-primary/80 text-primary-foreground touch-target ${
                      isMobile ? 'w-full py-3' : 'px-8 py-2'
                    }`}
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
                <h2 className="text-4xl font-bold mb-4 text-gray-700">🎉 HIGH SCORE! 🎉</h2>
                <div className="space-y-2 mb-6 text-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    Final Score: {gameSession.cumulativeScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completed {gameSession.totalRounds} rounds
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Enter your name:</label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your name"
                      className="text-center text-gray-700"
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
      
      {/* Mobile HP Bar and Character Summary */}
      {gameState === 'PLAYING' && isMobile && (
        <div className="w-full bg-ui-panel border-t-2 border-ui-border p-3">
          {/* Player HP Bar */}
          {livingCharacters.find(c => c.isPlayer) && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: livingCharacters.find(c => c.isPlayer)!.color }}
                  >
                    {livingCharacters.find(c => c.isPlayer)!.emoji}
                  </div>
                  <span className="text-sm font-medium text-neon-yellow">YOU</span>
                </div>
                <span className="text-xs">
                  {livingCharacters.find(c => c.isPlayer)!.currentHP}/{livingCharacters.find(c => c.isPlayer)!.stats.hp}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(livingCharacters.find(c => c.isPlayer)!.currentHP / livingCharacters.find(c => c.isPlayer)!.stats.hp) * 100}%`,
                    backgroundColor: getHPBarColor(livingCharacters.find(c => c.isPlayer)!.currentHP, livingCharacters.find(c => c.isPlayer)!.stats.hp)
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Other Characters Summary */}
          <div className="flex flex-wrap gap-2">
            {livingCharacters
              .filter(c => !c.isPlayer)
              .sort((a, b) => b.currentHP - a.currentHP)
              .map((character) => {
                const hpRatio = character.currentHP / character.stats.hp;
                const ringColor = hpRatio > 0.6 ? '#22b222' : hpRatio > 0.3 ? '#a1a122' : '#a14444';
                
                return (
                  <div key={character.id} className="relative">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm relative"
                      style={{ backgroundColor: character.color }}
                    >
                      {character.emoji}
                      {/* HP Ring */}
                      <svg 
                        className="absolute inset-0 w-8 h-8 -rotate-90"
                        viewBox="0 0 32 32"
                      >
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="rgba(0,0,0,0.2)"
                          strokeWidth="2"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="2"
                          strokeDasharray={`${hpRatio * 87.96} 87.96`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* Compact Game Info */}
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>Round {gameSession.currentRound}/{gameSession.totalRounds}</span>
            {gameSession.cumulativeScore > 0 && (
              <span className="text-neon-cyan">Score: {gameSession.cumulativeScore}</span>
            )}
            {timerState && timerState.isActive && (
              <span className={`font-bold ${
                timerState.isInOvertime 
                  ? 'text-red-500 animate-pulse' 
                  : timerState.isWarning 
                    ? 'text-yellow-500' 
                    : 'text-neon-cyan'
              }`}>
                {roundTimerSystemRef.current.getFormattedTime()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Desktop Character Status Panel */}
      {gameState === 'PLAYING' && !isMobile && (
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
            {timerState && timerState.isActive && (
              <div className={`text-sm mt-1 font-bold ${
                timerState.isInOvertime 
                  ? 'text-red-500 animate-pulse' 
                  : timerState.isWarning 
                    ? 'text-yellow-500' 
                    : 'text-neon-cyan'
              }`}>
                Timer: {roundTimerSystemRef.current.getFormattedTime()}
              </div>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ height: `${canvasSize.height}px` }}>
            {livingCharacters
              .sort((a, b) => {
                // Player always comes first
                if (a.isPlayer && !b.isPlayer) return -1;
                if (!a.isPlayer && b.isPlayer) return 1;
                // Then sort by HP (highest to lowest)
                return b.currentHP - a.currentHP;
              })
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