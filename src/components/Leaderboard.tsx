import React from 'react';
import { Card } from '@/components/ui/card';
import { LeaderboardEntry } from '@/game/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightEntry?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, highlightEntry }) => {
  return (
    <Card className="p-6 bg-ui-panel border-ui-border">
      <h3 className="text-2xl font-bold mb-4 text-primary text-center">🏆 Leaderboard</h3>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground">No scores yet!</p>
        ) : (
          entries.map((entry, index) => (
            <Card 
              key={entry.id} 
              className={`p-3 border-ui-border/50 ${
                entry.id === highlightEntry ? 'bg-primary/20 border-primary' : 'bg-card/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{entry.playerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-neon-cyan">{entry.totalScore}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.roundResults.length} rounds
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};

export default Leaderboard;