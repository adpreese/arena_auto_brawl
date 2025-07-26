import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Character, ShopState, ShopCard } from '@/game/types';
import { getPlanetaryHouseSymbol, getPlanetaryHouseColor } from '@/game/utils';

interface ShopInterfaceProps {
  gameSession: any;
  shopState: ShopState | null;
  onPurchase: (cardId: string) => void;
  onReroll: () => void;
  onSkipShop: () => void;
  onUseItem: (itemId: string) => void;
  hoveredInventoryItem: any;
  onInventoryItemHover: (item: any, position: { x: number; y: number }) => void;
}

export const ShopInterface: React.FC<ShopInterfaceProps> = ({
  gameSession,
  shopState,
  onPurchase,
  onReroll,
  onSkipShop,
  onUseItem,
  hoveredInventoryItem,
  onInventoryItemHover,
}) => {
  if (!shopState) return null;

  return (
    <div className="absolute inset-0 bg-background/90 flex justify-center rounded-lg overflow-y-auto p-4">
      <div className="max-w-4xl w-full bg-ui-panel rounded-lg p-6 border-2 border-ui-border h-fit">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Shop</h2>
            <div className="text-sm text-muted-foreground">
              Round {gameSession.currentRound} Complete - Choose upgrades
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg text-gold">Gold: {gameSession.gold}</div>
            <div className="text-sm text-muted-foreground">
              Rerolls: {shopState.rerollCount} (Cost: {shopState.rerollCost})
            </div>
          </div>
        </div>

        {/* Player Inventory */}
        {gameSession.playerCharacter && gameSession.playerCharacter.inventory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-primary">Your Items</h3>
            <div className="flex gap-2 flex-wrap">
              {gameSession.playerCharacter.inventory.map((item: any) => (
                <Card 
                  key={item.id} 
                  className="p-2 bg-card/50 border-ui-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => onUseItem(item.id)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onInventoryItemHover(item, { x: rect.right + 10, y: rect.top });
                  }}
                  onMouseLeave={() => onInventoryItemHover(null, { x: 0, y: 0 })}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-xs font-medium">{item.name}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Shop Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {shopState.cards.map((card: ShopCard) => (
            <Card 
              key={card.id} 
              className={`p-4 cursor-pointer border-ui-border transition-all hover:scale-105 ${
                gameSession.gold >= card.cost 
                  ? 'hover:bg-secondary/50 hover:shadow-[var(--glow-effect)]' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => gameSession.gold >= card.cost && onPurchase(card.id)}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-gold mb-2">{card.cost} Gold</div>
                
                {card.type === 'character' && card.character && (
                  <>
                    <div 
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg"
                      style={{ backgroundColor: card.character.color }}
                    >
                      {card.character.emoji}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium text-primary">
                        {card.type === 'character' ? 'New Fighter' : card.item?.name}
                      </div>
                      <div className="flex justify-center items-center gap-1 text-xs">
                        <span 
                          className="font-bold"
                          style={{ color: getPlanetaryHouseColor(card.character.planetaryHouse) }}
                        >
                          {getPlanetaryHouseSymbol(card.character.planetaryHouse)}
                        </span>
                        <span className="text-muted-foreground">{card.character.planetaryHouse}</span>
                      </div>
                      <div className="flex justify-center items-center gap-1 text-xs">
                        <span className="text-lg">{card.character.equippedAttack.icon}</span>
                        <span className="text-neon-purple">{card.character.equippedAttack.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        HP: {card.character.stats.hp} | ATK: {card.character.stats.attackPower} | 
                        DEF: {card.character.stats.defense} | SPD: {card.character.stats.speed}
                      </div>
                    </div>
                  </>
                )}
                
                {card.type === 'item' && card.item && (
                  <>
                    <div className="text-2xl mb-2">{card.item.icon}</div>
                    <div className="font-medium text-primary mb-1">{card.item.name}</div>
                    <div className="text-xs text-muted-foreground">{card.item.description}</div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Shop Actions */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={onReroll}
            disabled={gameSession.gold < shopState.rerollCost}
            variant="outline"
          >
            Reroll ({shopState.rerollCost} Gold)
          </Button>
          <Button 
            onClick={onSkipShop}
            className="bg-primary hover:bg-primary/80"
          >
            Continue to Next Round
          </Button>
        </div>

        {/* Inventory Item Tooltip */}
        {hoveredInventoryItem && (
          <div 
            className="absolute pointer-events-none bg-ui-panel border border-ui-border rounded-lg p-3 shadow-lg z-50"
            style={{
              left: hoveredInventoryItem.position.x,
              top: hoveredInventoryItem.position.y,
            }}
          >
            <div className="text-sm">
              <div className="font-medium text-primary">{hoveredInventoryItem.item.name}</div>
              <div className="text-muted-foreground">{hoveredInventoryItem.item.description}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};