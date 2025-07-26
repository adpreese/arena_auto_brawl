import { DamageIndicator, Vec2 } from './types';
import { GAME_CONFIG } from './config';
import { generateUniqueId } from './utils';
import { elementRegistry } from './ElementRegistry';

export class DamageIndicatorSystem {
  private indicators: Map<string, DamageIndicator> = new Map();
  private indicatorPool: DamageIndicator[] = [];

  constructor() {
    // Initialize indicator pool
    for (let i = 0; i < 50; i++) {
      this.indicatorPool.push(this.createIndicator());
    }
  }

  private createIndicator(): DamageIndicator {
    return {
      id: generateUniqueId(),
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      damage: 0,
      life: 0,
      maxLife: GAME_CONFIG.DAMAGE_INDICATOR.DURATION,
      color: '#FFFFFF',
      fontSize: GAME_CONFIG.DAMAGE_INDICATOR.BASE_FONT_SIZE,
      isBold: false,
      effectivenessType: 'regular-attack'
    };
  }

  spawnDamageIndicator(
    position: Vec2,
    damage: number,
    elementalModifier: number,
    effectivenessType: 'super-effective' | 'not-very-effective' | 'regular-attack',
    attackElement?: string
  ): void {
    const indicator = this.getIndicatorFromPool();
    if (!indicator) return;

    // Set basic properties
    indicator.position = { ...position };
    indicator.velocity = {
      x: (Math.random() - 0.5) * 20, // Small random horizontal drift
      y: GAME_CONFIG.DAMAGE_INDICATOR.FLOAT_SPEED
    };
    indicator.damage = Math.round(damage);
    indicator.life = 0;
    indicator.maxLife = GAME_CONFIG.DAMAGE_INDICATOR.DURATION;
    indicator.effectivenessType = effectivenessType;

    // Set color based on attack element or default to white
    if (attackElement) {
      const hexColor = elementRegistry.getElementColor(attackElement as any);
      indicator.color = hexColor;
    } else {
      indicator.color = '#FFFFFF';
    }

    // Set font size and style based on effectiveness
    let sizeMultiplier = 1;
    indicator.isBold = false;

    switch (effectivenessType) {
      case 'super-effective':
        sizeMultiplier = GAME_CONFIG.DAMAGE_INDICATOR.SUPER_EFFECTIVE_MULTIPLIER;
        indicator.isBold = true;
        break;
      case 'not-very-effective':
        sizeMultiplier = GAME_CONFIG.DAMAGE_INDICATOR.NOT_VERY_EFFECTIVE_MULTIPLIER;
        break;
      default:
        sizeMultiplier = 1;
        break;
    }

    indicator.fontSize = Math.round(GAME_CONFIG.DAMAGE_INDICATOR.BASE_FONT_SIZE * sizeMultiplier);

    this.indicators.set(indicator.id, indicator);
  }

  update(dt: number): void {
    const indicatorsToRemove: string[] = [];

    for (const [id, indicator] of this.indicators) {
      // Update life
      indicator.life += dt * 1000; // Convert to milliseconds

      // Update position
      indicator.position.x += indicator.velocity.x * dt;
      indicator.position.y += indicator.velocity.y * dt;

      // Apply slight deceleration to horizontal movement
      indicator.velocity.x *= 0.98;

      // Mark for removal if expired
      if (indicator.life >= indicator.maxLife) {
        indicatorsToRemove.push(id);
      }
    }

    // Remove expired indicators
    for (const id of indicatorsToRemove) {
      const indicator = this.indicators.get(id);
      if (indicator) {
        this.returnIndicatorToPool(indicator);
        this.indicators.delete(id);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const indicator of this.indicators.values()) {
      const lifeRatio = indicator.life / indicator.maxLife;
      
      // Calculate alpha based on fade settings
      let alpha = 1;
      if (lifeRatio > GAME_CONFIG.DAMAGE_INDICATOR.FADE_START_RATIO) {
        const fadeProgress = (lifeRatio - GAME_CONFIG.DAMAGE_INDICATOR.FADE_START_RATIO) / 
                           (1 - GAME_CONFIG.DAMAGE_INDICATOR.FADE_START_RATIO);
        alpha = 1 - fadeProgress;
      }

      // Calculate scale for slight growth at the beginning
      const scale = Math.min(1, lifeRatio * 3); // Grow to full size in first 1/3 of lifetime

      // Set font properties
      const fontWeight = indicator.isBold ? 'bold' : 'normal';
      const fontSize = Math.round(indicator.fontSize * scale);
      ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw outline for better visibility
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.lineWidth = GAME_CONFIG.DAMAGE_INDICATOR.OUTLINE_WIDTH;
      ctx.strokeText(
        indicator.damage.toString(),
        indicator.position.x,
        indicator.position.y
      );

      // Draw main text
      ctx.fillStyle = this.addAlphaToColor(indicator.color, alpha);
      ctx.fillText(
        indicator.damage.toString(),
        indicator.position.x,
        indicator.position.y
      );
    }

    ctx.restore();
  }

  private addAlphaToColor(hexColor: string, alpha: number): string {
    // Convert hex to rgba
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private getIndicatorFromPool(): DamageIndicator | null {
    return this.indicatorPool.pop() || null;
  }

  private returnIndicatorToPool(indicator: DamageIndicator): void {
    if (this.indicatorPool.length < 50) {
      this.indicatorPool.push(indicator);
    }
  }

  clear(): void {
    // Return all active indicators to pool
    for (const indicator of this.indicators.values()) {
      this.returnIndicatorToPool(indicator);
    }
    this.indicators.clear();
  }
}