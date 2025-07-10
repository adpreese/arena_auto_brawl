import charactersData from './characters.json';

export interface CharacterConfig {
  emojis: string[];
  colors: Array<{
    name: string;
    value: string;
    hex: string;
  }>;
  planetaryHouses: Record<string, {
    name: string;
    symbol: string;
    color: string;
    description: string;
  }>;
  statRanges: Record<string, {
    min: number;
    max: number;
    description: string;
  }>;
  characterTypes: Record<string, {
    name: string;
    description: string;
    preferredStats: Record<string, string>;
    suggestedEmojis: string[];
    suggestedElements: string[];
  }>;
}

export class CharacterRegistry {
  private data: CharacterConfig;

  constructor() {
    this.data = charactersData as CharacterConfig;
  }

  getRandomEmoji(): string {
    const emojis = this.data.emojis;
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  getRandomColor(): string {
    const colors = this.data.colors;
    const colorData = colors[Math.floor(Math.random() * colors.length)];
    return colorData.value;
  }

  getEmojis(): string[] {
    return [...this.data.emojis];
  }

  getColors(): Array<{ name: string; value: string; hex: string }> {
    return [...this.data.colors];
  }

  getPlanetaryHouses(): Record<string, { name: string; symbol: string; color: string; description: string }> {
    return { ...this.data.planetaryHouses };
  }

  getPlanetaryHouseNames(): string[] {
    return Object.keys(this.data.planetaryHouses);
  }

  getRandomPlanetaryHouse(): string {
    const houses = this.getPlanetaryHouseNames();
    return houses[Math.floor(Math.random() * houses.length)];
  }

  getPlanetaryHouseSymbol(house: string): string {
    return this.data.planetaryHouses[house]?.symbol || '?';
  }

  getPlanetaryHouseColor(house: string): string {
    return this.data.planetaryHouses[house]?.color || '#FFFFFF';
  }

  getStatRanges(): Record<string, { min: number; max: number; description: string }> {
    return { ...this.data.statRanges };
  }

  getCharacterTypes(): Record<string, {
    name: string;
    description: string;
    preferredStats: Record<string, string>;
    suggestedEmojis: string[];
    suggestedElements: string[];
  }> {
    return { ...this.data.characterTypes };
  }

  getRandomCharacterType(): string {
    const types = Object.keys(this.data.characterTypes);
    return types[Math.floor(Math.random() * types.length)];
  }

  getSuggestedEmojisForType(type: string): string[] {
    return this.data.characterTypes[type]?.suggestedEmojis || [];
  }

  getSuggestedElementsForType(type: string): string[] {
    return this.data.characterTypes[type]?.suggestedElements || [];
  }

  // Get a random emoji that fits a character type
  getRandomEmojiForType(type: string): string {
    const suggestedEmojis = this.getSuggestedEmojisForType(type);
    if (suggestedEmojis.length > 0) {
      return suggestedEmojis[Math.floor(Math.random() * suggestedEmojis.length)];
    }
    return this.getRandomEmoji();
  }

  // Generate random stats based on character type preferences
  createRandomStatsForType(type: string): {
    hp: number;
    defense: number;
    attackPower: number;
    speed: number;
  } {
    const typeData = this.data.characterTypes[type];
    const statRanges = this.data.statRanges;
    
    if (!typeData) {
      // Fallback to default ranges if type not found
      return {
        hp: statRanges.hp.min + Math.floor(Math.random() * (statRanges.hp.max - statRanges.hp.min + 1)),
        defense: statRanges.defense.min + Math.floor(Math.random() * (statRanges.defense.max - statRanges.defense.min + 1)),
        attackPower: statRanges.attackPower.min + Math.floor(Math.random() * (statRanges.attackPower.max - statRanges.attackPower.min + 1)),
        speed: statRanges.speed.min + Math.floor(Math.random() * (statRanges.speed.max - statRanges.speed.min + 1))
      };
    }

    const preferences = typeData.preferredStats;
    const stats: any = {};

    // Generate stats based on preferences
    for (const [stat, preference] of Object.entries(preferences)) {
      const range = statRanges[stat];
      if (!range) continue;

      const totalRange = range.max - range.min + 1;
      let value: number;

      switch (preference) {
        case 'high':
          // Bias towards higher values (top 60% of range)
          value = range.min + Math.floor(totalRange * 0.4) + Math.floor(Math.random() * Math.floor(totalRange * 0.6));
          break;
        case 'low':
          // Bias towards lower values (bottom 60% of range)
          value = range.min + Math.floor(Math.random() * Math.floor(totalRange * 0.6));
          break;
        case 'medium':
        default:
          // Normal distribution around middle
          value = range.min + Math.floor(Math.random() * totalRange);
          break;
      }

      stats[stat] = Math.min(Math.max(value, range.min), range.max);
    }

    return stats;
  }
}

export const characterRegistry = new CharacterRegistry();