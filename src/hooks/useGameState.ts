import { useState, useCallback } from 'react';
import { Character, GameResult, GameSession, RoundResult, LeaderboardEntry, ShopState, ZoneState } from '@/game/types';
import { RoundTimerState } from '@/game/RoundTimerSystem';
import { GAME_CONFIG } from '@/game/config';

type GameState = 'CHAR_SELECT' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER' | 'LEADERBOARD' | 'UPGRADE_PHASE';

export interface GameStateData {
  gameState: GameState;
  candidates: Character[];
  selectedCharacter: Character | null;
  livingCharacters: Character[];
  gameResult: GameResult | null;
  gameSession: GameSession;
  leaderboard: LeaderboardEntry[];
  playerName: string;
  newLeaderboardEntry: string | null;
  hoveredCharacter: Character | null;
  mousePosition: { x: number; y: number };
  shopState: ShopState | null;
  zoneState: ZoneState | null;
  hoveredInventoryItem: { item: any; position: { x: number; y: number } } | null;
  timerState: RoundTimerState | null;
}

export interface GameStateActions {
  setGameState: (state: GameState) => void;
  setCandidates: (candidates: Character[]) => void;
  setSelectedCharacter: (character: Character | null) => void;
  setLivingCharacters: (characters: Character[]) => void;
  setGameResult: (result: GameResult | null) => void;
  setGameSession: (session: GameSession | ((prev: GameSession) => GameSession)) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setPlayerName: (name: string) => void;
  setNewLeaderboardEntry: (entry: string | null) => void;
  setHoveredCharacter: (character: Character | null) => void;
  setMousePosition: (position: { x: number; y: number }) => void;
  setShopState: (state: ShopState | null) => void;
  setZoneState: (state: ZoneState | null) => void;
  setHoveredInventoryItem: (item: { item: any; position: { x: number; y: number } } | null) => void;
  setTimerState: (state: RoundTimerState | null) => void;
  resetGameState: () => void;
}

const initialGameSession: GameSession = {
  currentRound: 1,
  totalRounds: GAME_CONFIG.TOTAL_ROUNDS,
  cumulativeScore: 0,
  gold: 0,
  roundResults: [],
  isComplete: false
};

export function useGameState(): GameStateData & GameStateActions {
  const [gameState, setGameState] = useState<GameState>('CHAR_SELECT');
  const [candidates, setCandidates] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [livingCharacters, setLivingCharacters] = useState<Character[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameSession, setGameSession] = useState<GameSession>(initialGameSession);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [newLeaderboardEntry, setNewLeaderboardEntry] = useState<string | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [shopState, setShopState] = useState<ShopState | null>(null);
  const [zoneState, setZoneState] = useState<ZoneState | null>(null);
  const [hoveredInventoryItem, setHoveredInventoryItem] = useState<{ item: any; position: { x: number; y: number } } | null>(null);
  const [timerState, setTimerState] = useState<RoundTimerState | null>(null);

  const resetGameState = useCallback(() => {
    setGameState('CHAR_SELECT');
    setCandidates([]);
    setSelectedCharacter(null);
    setLivingCharacters([]);
    setGameResult(null);
    setGameSession(initialGameSession);
    setPlayerName('');
    setNewLeaderboardEntry(null);
    setShopState(null);
    setZoneState(null);
    setHoveredInventoryItem(null);
    setTimerState(null);
  }, []);

  return {
    // State
    gameState,
    candidates,
    selectedCharacter,
    livingCharacters,
    gameResult,
    gameSession,
    leaderboard,
    playerName,
    newLeaderboardEntry,
    hoveredCharacter,
    mousePosition,
    shopState,
    zoneState,
    hoveredInventoryItem,
    timerState,
    // Actions
    setGameState,
    setCandidates,
    setSelectedCharacter,
    setLivingCharacters,
    setGameResult,
    setGameSession,
    setLeaderboard,
    setPlayerName,
    setNewLeaderboardEntry,
    setHoveredCharacter,
    setMousePosition,
    setShopState,
    setZoneState,
    setHoveredInventoryItem,
    setTimerState,
    resetGameState,
  };
}