import { LeaderboardEntry } from '@/game/types';

const LEADERBOARD_KEY = 'arena-brawl-leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    return [];
  }
};

export const addLeaderboardEntry = (entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry => {
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };

  const leaderboard = getLeaderboard();
  leaderboard.push(newEntry);
  
  // Sort by total score (descending) and keep only top 10
  const sortedLeaderboard = leaderboard
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, MAX_LEADERBOARD_ENTRIES);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sortedLeaderboard));
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }

  return newEntry;
};

export const isHighScore = (score: number): boolean => {
  const leaderboard = getLeaderboard();
  return leaderboard.length < MAX_LEADERBOARD_ENTRIES || 
         score > (leaderboard[leaderboard.length - 1]?.totalScore || 0);
};