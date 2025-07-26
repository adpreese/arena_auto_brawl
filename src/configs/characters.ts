// Character configurations
export const STARTER_CHARACTERS = [
  {
    name: 'Fire Warrior',
    emoji: '🦁',
    color: '#FF4444',
    stats: {
      hp: 18,
      defense: 2,
      attackPower: 110, // 10% bonus attack power
      speed: 65,
      element: 'Fire' as const
    },
    planetaryHouse: 'Mars' as const,
    attackEffect: {
      id: 'fireball',
      name: 'Fireball',
      icon: '🔥',
      baseDamage: 3,
      cooldown: 667,
      element: 'Fire' as const,
      aoeShape: 'circle' as const,
      aoeSize: 60,
      particleColor: '255, 69, 0',
      particleEffect: 'explosion'
    }
  },
  {
    name: 'Ice Mage',
    emoji: '🐧',
    color: '#4444FF',
    stats: {
      hp: 16,
      defense: 1,
      attackPower: 120, // 20% bonus attack power
      speed: 55,
      element: 'Ice' as const
    },
    planetaryHouse: 'Neptune' as const,
    attackEffect: {
      id: 'ice_shard',
      name: 'Ice Shard',
      icon: '❄️',
      baseDamage: 4,
      cooldown: 833,
      element: 'Ice' as const,
      aoeShape: 'cone' as const,
      aoeSize: 80,
      aoeAngle: 45,
      particleColor: '173, 216, 230',
      particleEffect: 'crystals'
    }
  },
  {
    name: 'Storm Ranger',
    emoji: '🦅',
    color: '#FFFF44',
    stats: {
      hp: 20,
      defense: 3,
      attackPower: 100, // baseline attack power
      speed: 75,
      element: 'Electric' as const
    },
    planetaryHouse: 'Jupiter' as const,
    attackEffect: {
      id: 'lightning_bolt',
      name: 'Lightning Bolt',
      icon: '⚡',
      baseDamage: 2,
      cooldown: 500,
      element: 'Electric' as const,
      aoeShape: 'line' as const,
      aoeSize: 120,
      aoeWidth: 20,
      particleColor: '255, 255, 0',
      particleEffect: 'spark'
    }
  }
] as const;