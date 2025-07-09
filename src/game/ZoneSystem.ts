// Zone Constriction System
import { ZoneState, Character, Vec2 } from './types';
import { GAME_CONFIG } from './config';

export class ZoneSystem {
  private zone: ZoneState;
  private gameEventListeners: ((event: any) => void)[] = [];
  private readonly ZONE_SPAWN_DELAY = 14000; // 8 seconds
  private readonly ZONE_CONSTRICTION_DURATION = 20000; // 60 seconds to fully constrict

  constructor() {
    this.zone = this.createInitialZone();
  }

  private createInitialZone(): ZoneState {
    const centerX = GAME_CONFIG.ARENA_SIZE / 2;
    const centerY = GAME_CONFIG.ARENA_SIZE / 2;
    const initialRadius = GAME_CONFIG.ARENA_SIZE * Math.sqrt(2) / 2;
    const minRadius = 100;

    return {
      isActive: false,
      radius: initialRadius,
      centerX,
      centerY,
      startTime: 0,
      duration: this.ZONE_CONSTRICTION_DURATION,
      initialRadius,
      minRadius
    };
  }

  /**
   * Reset the zone for a new round
   */
  reset(): void {
    this.zone = this.createInitialZone();
  }

  /**
   * Start the zone constriction
   */
  startZone(currentTime: number): void {
    if (!this.zone.isActive) {
      this.zone.isActive = true;
      this.zone.startTime = currentTime;
      
      // Emit zone spawned event
      this.emitEvent({
        type: 'zone_spawned',
        data: {
          zone: { ...this.zone }
        }
      });
    }
  }

  /**
   * Update the zone system
   */
  update(currentTime: number, characters: Character[]): void {
    // Check if zone should spawn (8 seconds into round)
    if (!this.zone.isActive && currentTime >= this.ZONE_SPAWN_DELAY) {
      this.startZone(currentTime);
    }

    // Update zone size if active
    if (this.zone.isActive) {
      this.updateZoneSize(currentTime);
      this.constrainCharactersToZone(characters);
    }
  }

  private updateZoneSize(currentTime: number): void {
    const elapsed = currentTime - this.zone.startTime;
    const progress = Math.min(elapsed / this.zone.duration, 1.0);
    
    // Smooth constriction using ease-in-out curve
    const smoothProgress = this.easeInOutCubic(progress);
    
    this.zone.radius = this.zone.initialRadius - 
      (this.zone.initialRadius - this.zone.minRadius) * smoothProgress;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  private constrainCharactersToZone(characters: Character[]): void {
    for (const character of characters) {
      if (character.isDead) continue;
      this.constrainToZone(character);
    }
  }

  /**
   * Check if a position is within the zone
   */
  isInZone(position: Vec2): boolean {
    if (!this.zone.isActive) {
      return true; // No zone restriction before it spawns
    }

    const dx = position.x - this.zone.centerX;
    const dy = position.y - this.zone.centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    
    return distanceFromCenter <= this.zone.radius;
  }

  /**
   * Constrain a character's position to stay within the zone
   */
  constrainToZone(character: Character): void {
    if (!this.zone.isActive) {
      return; // No constraint before zone spawns
    }

    const dx = character.position.x - this.zone.centerX;
    const dy = character.position.y - this.zone.centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    if (distanceFromCenter > this.zone.radius) {
      // Push character back to zone edge
      const angle = Math.atan2(dy, dx);
      const targetRadius = this.zone.radius - 5; // Keep slightly inside to prevent edge bouncing
      
      character.position.x = this.zone.centerX + Math.cos(angle) * targetRadius;
      character.position.y = this.zone.centerY + Math.sin(angle) * targetRadius;
      
      // Redirect velocity toward center to prevent bouncing
      const centerDirection = {
        x: this.zone.centerX - character.position.x,
        y: this.zone.centerY - character.position.y
      };
      const centerDistance = Math.sqrt(centerDirection.x * centerDirection.x + centerDirection.y * centerDirection.y);
      
      if (centerDistance > 0) {
        centerDirection.x /= centerDistance;
        centerDirection.y /= centerDistance;
        
        // Redirect velocity toward center
        const speed = Math.sqrt(character.velocity.x * character.velocity.x + character.velocity.y * character.velocity.y);
        character.velocity.x = centerDirection.x * speed * 0.5;
        character.velocity.y = centerDirection.y * speed * 0.5;
      }
    }
  }

  /**
   * Get the current zone state
   */
  getZoneState(): ZoneState {
    return { ...this.zone };
  }

  /**
   * Render the zone circle
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.zone.isActive) {
      return;
    }

    ctx.save();
    
    // Draw zone boundary
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(this.zone.centerX, this.zone.centerY, this.zone.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw danger zone (outside the circle)
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';
    ctx.beginPath();
    ctx.rect(0, 0, GAME_CONFIG.ARENA_SIZE, GAME_CONFIG.ARENA_SIZE);
    ctx.arc(this.zone.centerX, this.zone.centerY, this.zone.radius, 0, Math.PI * 2, true);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: any) => void): void {
    this.gameEventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: any) => void): void {
    const index = this.gameEventListeners.indexOf(listener);
    if (index > -1) {
      this.gameEventListeners.splice(index, 1);
    }
  }

  private emitEvent(event: any): void {
    this.gameEventListeners.forEach(listener => listener(event));
  }

  /**
   * Clear the zone system
   */
  clear(): void {
    this.reset();
  }
}