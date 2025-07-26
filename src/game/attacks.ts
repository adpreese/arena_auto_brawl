// Centralized Attack Effects Configuration
import { AttackEffect } from './types';

export const ATTACKS: Record<string, AttackEffect> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    baseDamage: 3,
    cooldown: 667, // ~1.5 attacks per second
    element: 'Fire',
    aoeShape: 'circle',
    aoeSize: 60,
    particleColor: '255, 69, 0',
    particleEffect: 'explosion'
  },
  
  lightning_bolt: {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    icon: '⚡',
    baseDamage: 2,
    cooldown: 500, // 2 attacks per second
    element: 'Electric',
    aoeShape: 'line',
    aoeSize: 120, // length
    aoeWidth: 20, // width
    particleColor: '255, 255, 0',
    particleEffect: 'spark'
  },
  
  ice_shard: {
    id: 'ice_shard',
    name: 'Ice Shard',
    icon: '❄️',
    baseDamage: 4,
    cooldown: 833, // ~1.2 attacks per second
    element: 'Ice',
    aoeShape: 'cone',
    aoeSize: 80, // range
    aoeAngle: 45, // 45 degree cone
    particleColor: '173, 216, 230',
    particleEffect: 'crystals'
  },
  
  water_wave: {
    id: 'water_wave',
    name: 'Water Wave',
    icon: '💧',
    baseDamage: 2,
    cooldown: 1250, // 0.8 attacks per second
    element: 'Water',
    aoeShape: 'arc',
    aoeSize: 90,
    aoeAngle: 120, // 120 degree arc
    particleColor: '50, 205, 50',
    particleEffect: 'splash'
  },
  
  earth_spikes: {
    id: 'earth_spikes',
    name: 'Earth Spikes',
    icon: '🌍',
    baseDamage: 3,
    cooldown: 600, // ~1.7 attacks per second
    element: 'Earth',
    aoeShape: 'rectangle',
    aoeSize: 70, // length
    aoeWidth: 30, // width
    particleColor: '139, 69, 19',
    particleEffect: 'crystals'
  },
  
  air_slash: {
    id: 'air_slash',
    name: 'Air Slash',
    icon: '💨',
    baseDamage: 2,
    cooldown: 400, // 2.5 attacks per second
    element: 'Air',
    aoeShape: 'line',
    aoeSize: 100,
    aoeWidth: 15,
    particleColor: '135, 206, 235',
    particleEffect: 'wind'
  }
};

// Helper functions for easier access
export function getAttackEffects(): AttackEffect[] {
  return Object.values(ATTACKS);
}

export function getAttackById(id: string): AttackEffect | undefined {
  return ATTACKS[id];
}

export function randomAttackEffect(): AttackEffect {
  const attacks = getAttackEffects();
  return attacks[Math.floor(Math.random() * attacks.length)];
}

// Attack categories for easier management
export const ATTACK_CATEGORIES = {
  FIRE: ['fireball'],
  ELECTRIC: ['lightning_bolt'],
  ICE: ['ice_shard'],
  WATER: ['water_wave'],
  EARTH: ['earth_spikes'],
  AIR: ['air_slash']
} as const;

export function getAttacksByElement(element: string): AttackEffect[] {
  return getAttackEffects().filter(attack => attack.element === element);
}