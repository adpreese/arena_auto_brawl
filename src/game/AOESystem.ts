// AOE Visualization System
import { AOEIndicator, Vec2, AttackEffect } from './types';
import { generateUniqueId, normalize } from './utils';

export class AOESystem {
  private indicators: Map<string, AOEIndicator> = new Map();

  spawnAOEIndicator(position: Vec2, direction: Vec2, attackEffect: AttackEffect): void {
    const indicator: AOEIndicator = {
      id: generateUniqueId(),
      position: { ...position },
      direction: normalize(direction),
      attackEffect,
      life: 0,
      maxLife: 400, // 400ms duration
      alpha: 1.0
    };

    this.indicators.set(indicator.id, indicator);
  }

  update(dt: number): void {
    const indicatorsToRemove: string[] = [];

    for (const [id, indicator] of this.indicators) {
      indicator.life += dt * 1000; // Convert to milliseconds

      // Update alpha for fade effect
      const lifeRatio = indicator.life / indicator.maxLife;
      indicator.alpha = Math.max(0, 1 - lifeRatio);

      // Mark for removal if expired
      if (indicator.life >= indicator.maxLife) {
        indicatorsToRemove.push(id);
      }
    }

    // Remove expired indicators
    for (const id of indicatorsToRemove) {
      this.indicators.delete(id);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const indicator of this.indicators.values()) {
      this.renderAOEShape(ctx, indicator);
    }

    ctx.restore();
  }

  private renderAOEShape(ctx: CanvasRenderingContext2D, indicator: AOEIndicator): void {
    const { position, direction, attackEffect, alpha } = indicator;

    // Set up visual style
    ctx.globalAlpha = alpha; // Semi-transparent
    ctx.strokeStyle = `rgba(11, 11, 11, ${alpha})`;
    ctx.fillStyle = `rgba(${attackEffect.particleColor}, ${alpha * 0.1})`;
    ctx.lineWidth = 2;

    switch (attackEffect.aoeShape) {
      case 'circle':
        this.renderCircleAOE(ctx, position, attackEffect.aoeSize);
        break;
      case 'line':
        this.renderLineAOE(ctx, position, direction, attackEffect.aoeSize, attackEffect.aoeWidth || 20);
        break;
      case 'cone':
        this.renderConeAOE(ctx, position, direction, attackEffect.aoeSize, attackEffect.aoeAngle || 45);
        break;
      case 'rectangle':
        this.renderRectangleAOE(ctx, position, direction, attackEffect.aoeSize, attackEffect.aoeWidth || 30);
        break;
      case 'arc':
        this.renderArcAOE(ctx, position, direction, attackEffect.aoeSize, attackEffect.aoeAngle || 60);
        break;
    }
  }

  private renderCircleAOE(ctx: CanvasRenderingContext2D, position: Vec2, radius: number): void {
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private renderLineAOE(ctx: CanvasRenderingContext2D, position: Vec2, direction: Vec2, length: number, width: number): void {
    const halfWidth = width / 2;
    const endX = position.x + direction.x * length;
    const endY = position.y + direction.y * length;

    // Calculate perpendicular direction for width
    const perpX = -direction.y;
    const perpY = direction.x;

    ctx.beginPath();
    ctx.moveTo(position.x + perpX * halfWidth, position.y + perpY * halfWidth);
    ctx.lineTo(position.x - perpX * halfWidth, position.y - perpY * halfWidth);
    ctx.lineTo(endX - perpX * halfWidth, endY - perpY * halfWidth);
    ctx.lineTo(endX + perpX * halfWidth, endY + perpY * halfWidth);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderConeAOE(ctx: CanvasRenderingContext2D, position: Vec2, direction: Vec2, range: number, angleInDegrees: number): void {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    const halfAngle = angleInRadians / 2;
    
    const baseAngle = Math.atan2(direction.y, direction.x);
    const leftAngle = baseAngle - halfAngle;
    const rightAngle = baseAngle + halfAngle;

    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.arc(position.x, position.y, range, leftAngle, rightAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderRectangleAOE(ctx: CanvasRenderingContext2D, position: Vec2, direction: Vec2, length: number, width: number): void {
    // Rectangle AOE is the same as line AOE
    this.renderLineAOE(ctx, position, direction, length, width);
  }

  private renderArcAOE(ctx: CanvasRenderingContext2D, position: Vec2, direction: Vec2, range: number, angleInDegrees: number): void {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    const halfAngle = angleInRadians / 2;
    const innerRadius = 20; // Hollow center
    
    const baseAngle = Math.atan2(direction.y, direction.x);
    const leftAngle = baseAngle - halfAngle;
    const rightAngle = baseAngle + halfAngle;

    // Draw outer arc
    ctx.beginPath();
    ctx.arc(position.x, position.y, range, leftAngle, rightAngle);
    ctx.stroke();

    // Draw inner arc (hollow center)
    ctx.beginPath();
    ctx.arc(position.x, position.y, innerRadius, leftAngle, rightAngle);
    ctx.stroke();

    // Draw connecting lines
    ctx.beginPath();
    ctx.moveTo(
      position.x + Math.cos(leftAngle) * innerRadius,
      position.y + Math.sin(leftAngle) * innerRadius
    );
    ctx.lineTo(
      position.x + Math.cos(leftAngle) * range,
      position.y + Math.sin(leftAngle) * range
    );
    ctx.moveTo(
      position.x + Math.cos(rightAngle) * innerRadius,
      position.y + Math.sin(rightAngle) * innerRadius
    );
    ctx.lineTo(
      position.x + Math.cos(rightAngle) * range,
      position.y + Math.sin(rightAngle) * range
    );
    ctx.stroke();

    // Fill the arc area (excluding center)
    ctx.beginPath();
    ctx.arc(position.x, position.y, range, leftAngle, rightAngle);
    ctx.arc(position.x, position.y, innerRadius, rightAngle, leftAngle, true);
    ctx.closePath();
    ctx.fill();
  }

  clear(): void {
    this.indicators.clear();
  }
}