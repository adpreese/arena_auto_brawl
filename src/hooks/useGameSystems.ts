import { useRef } from 'react';
import { CharacterManager } from '@/game/CharacterManager';
import { AIController } from '@/game/AIController';
import { CombatSystem } from '@/game/CombatSystem';
import { ParticleSystem } from '@/game/ParticleSystem';
import { AOESystem } from '@/game/AOESystem';
import { DamageIndicatorSystem } from '@/game/DamageIndicatorSystem';
import { RoundTimerSystem } from '@/game/RoundTimerSystem';
import { ShopSystem } from '@/game/ShopSystem';
import { InventorySystem } from '@/game/InventorySystem';

export interface GameSystems {
  characterManager: CharacterManager;
  aiController: AIController;
  combatSystem: CombatSystem;
  particleSystem: ParticleSystem;
  aoeSystem: AOESystem;
  damageIndicatorSystem: DamageIndicatorSystem;
  roundTimerSystem: RoundTimerSystem;
  shopSystem: ShopSystem;
  inventorySystem: InventorySystem;
}

export function useGameSystems(): GameSystems {
  // Initialize all game systems once
  const characterManagerRef = useRef<CharacterManager>(new CharacterManager());
  const aiControllerRef = useRef<AIController>(new AIController());
  const combatSystemRef = useRef<CombatSystem>(new CombatSystem(characterManagerRef.current));
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const aoeSystemRef = useRef<AOESystem>(new AOESystem());
  const damageIndicatorSystemRef = useRef<DamageIndicatorSystem>(new DamageIndicatorSystem());
  const roundTimerSystemRef = useRef<RoundTimerSystem>(new RoundTimerSystem());
  const shopSystemRef = useRef<ShopSystem>(new ShopSystem());
  const inventorySystemRef = useRef<InventorySystem>(new InventorySystem());

  return {
    characterManager: characterManagerRef.current,
    aiController: aiControllerRef.current,
    combatSystem: combatSystemRef.current,
    particleSystem: particleSystemRef.current,
    aoeSystem: aoeSystemRef.current,
    damageIndicatorSystem: damageIndicatorSystemRef.current,
    roundTimerSystem: roundTimerSystemRef.current,
    shopSystem: shopSystemRef.current,
    inventorySystem: inventorySystemRef.current,
  };
}

