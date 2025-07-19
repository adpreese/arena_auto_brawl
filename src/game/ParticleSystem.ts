// Particle System for Visual Effects
import { Particle, Vec2, AttackEffect, Character } from './types';
import { GAME_CONFIG } from './config';
import { generateUniqueId } from './utils';
import { elementRegistry } from './ElementRegistry';

export class ParticleSystem {
  private particles: Map<string, Particle> = new Map();
  private particlePool: Particle[] = [];
  
  constructor() {
    // Initialize particle pool
    for (let i = 0; i < GAME_CONFIG.PARTICLE_POOL_SIZE; i++) {
      this.particlePool.push(this.createParticle());
    }
  }
  
  private createParticle(): Particle {
    return {
      id: generateUniqueId(),
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      life: 0,
      maxLife: 1000,
      size: 4,
      color: '255, 221, 51',
      type: 'hit'
    };
  }
  
  spawnHitEffect(position: Vec2): void {
    // Spawn 6 particles for hit effect
    for (let i = 0; i < 6; i++) {
      const particle = this.getParticleFromPool();
      if (!particle) continue;
      
      const angle = (i / 6) * Math.PI * 2;
      const speed = 50 + Math.random() * 30;
      
      particle.position = { ...position };
      particle.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      particle.life = 0;
      particle.maxLife = 1000; // 1 second
      particle.size = 0;
      particle.color = '255, 221, 51';
      particle.type = 'hit';
      
      this.particles.set(particle.id, particle);
    }
  }
  
  spawnAttackEffect(position: Vec2, attackEffect: AttackEffect, attacker?: Character, target?: Character): void {
    const particleCount = this.getParticleCountForAttack(attackEffect);
    
    // Check if attack is super effective
    const isSuperEffective = attacker && target ? 
      elementRegistry.isSuperEffective(attackEffect.element, target.stats.element) : false;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticleFromPool();
      if (!particle) continue;
      
      this.configureAttackParticle(particle, position, attackEffect, i, particleCount, isSuperEffective);
      this.particles.set(particle.id, particle);
    }
  }

  private getParticleCountForAttack(attackEffect: AttackEffect): number {
    switch (attackEffect.particleEffect) {
      case 'explosion': return 12;
      case 'spark': return 8;
      case 'crystals': return 6;
      case 'cloud': return 20;
      case 'slash': return 4;
      default: return 8;
    }
  }

  private configureAttackParticle(particle: Particle, position: Vec2, attackEffect: AttackEffect, index: number, total: number, isSuperEffective: boolean = false): void {
    particle.position = { ...position };
    particle.life = 0;
    particle.type = 'hit';
    particle.hasGoldOutline = isSuperEffective;
    
    // Use element-specific color instead of hardcoded colors
    const elementColor = this.getElementColorRGB(attackEffect.element);
    particle.color = elementColor;

    switch (attackEffect.particleEffect) {
      case 'explosion':
        const explosionAngle = (index / total) * Math.PI * 2;
        const explosionSpeed = 60 + Math.random() * 40;
        particle.velocity = {
          x: Math.cos(explosionAngle) * explosionSpeed,
          y: Math.sin(explosionAngle) * explosionSpeed
        };
        particle.maxLife = 800;
        particle.size = 8 + Math.random() * 6;
        // Add intensity for super effective attacks
        if (isSuperEffective) {
          particle.size *= 1.3;
          particle.maxLife *= 1.2;
        }
        break;

      case 'spark':
        const sparkAngle = (index / total) * Math.PI * 2;
        const sparkSpeed = 80 + Math.random() * 50;
        particle.velocity = {
          x: Math.cos(sparkAngle) * sparkSpeed,
          y: Math.sin(sparkAngle) * sparkSpeed
        };
        particle.maxLife = 600;
        particle.size = 3 + Math.random() * 4;
        if (isSuperEffective) {
          particle.size *= 1.3;
          particle.maxLife *= 1.2;
        }
        break;

      case 'crystals':
        const crystalAngle = (index / total) * Math.PI * 2;
        const crystalSpeed = 40 + Math.random() * 30;
        particle.velocity = {
          x: Math.cos(crystalAngle) * crystalSpeed,
          y: Math.sin(crystalAngle) * crystalSpeed
        };
        particle.maxLife = 1200;
        particle.size = 6 + Math.random() * 8;
        if (isSuperEffective) {
          particle.size *= 1.3;
          particle.maxLife *= 1.2;
        }
        break;

      case 'cloud':
        const cloudAngle = Math.random() * Math.PI * 2;
        const cloudSpeed = 20 + Math.random() * 30;
        particle.velocity = {
          x: Math.cos(cloudAngle) * cloudSpeed,
          y: Math.sin(cloudAngle) * cloudSpeed
        };
        particle.maxLife = 2000;
        particle.size = 4 + Math.random() * 6;
        if (isSuperEffective) {
          particle.size *= 1.3;
          particle.maxLife *= 1.2;
        }
        break;

      case 'slash':
        const slashAngle = (index / total) * Math.PI * 0.5 - Math.PI * 0.25; // 90 degree spread
        const slashSpeed = 70 + Math.random() * 40;
        particle.velocity = {
          x: Math.cos(slashAngle) * slashSpeed,
          y: Math.sin(slashAngle) * slashSpeed
        };
        particle.maxLife = 500;
        particle.size = 5 + Math.random() * 5;
        if (isSuperEffective) {
          particle.size *= 1.3;
          particle.maxLife *= 1.2;
        }
        break;

      default:
        particle.velocity = { x: 0, y: 0 };
        particle.maxLife = 1000;
        particle.size = 5;
    }
  }

  spawnDeathEffect(position: Vec2): void {
    // Spawn 16 particles for death burst
    for (let i = 0; i < 16; i++) {
      const particle = this.getParticleFromPool();
      if (!particle) continue;
      
      const angle = (i / 16) * Math.PI * 2;
      const speed = 80 + Math.random() * 40;
      
      particle.position = { ...position };
      particle.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      particle.life = 0;
      particle.maxLife = 1500; // 1.5 seconds
      particle.size = 6 + Math.random() * 10;
      particle.color = '220, 38, 38'; // Red color for death particles
      particle.type = 'death';
      
      this.particles.set(particle.id, particle);
    }
    
    // Add a death icon that floats upward
    const iconParticle = this.getParticleFromPool();
    if (iconParticle) {
      iconParticle.position = { ...position };
      iconParticle.velocity = {
        x: 0,
        y: -30 // Float upward slowly
      };
      iconParticle.life = 0;
      iconParticle.maxLife = 2000; // 2 seconds
      iconParticle.size = 24; // Larger for the icon
      iconParticle.color = '255, 255, 255'; // White for the skull
      iconParticle.type = 'death_icon';
      
      this.particles.set(iconParticle.id, iconParticle);
    }
  }
  
  update(dt: number): void {
    const particlesToRemove: string[] = [];
    
    for (const [id, particle] of this.particles) {
      // Update particle life
      particle.life += dt * 1000; // Convert to milliseconds
      
      // Update position
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;
      
      // Apply friction (different for death icon)
      if (particle.type === 'death_icon') {
        // Less friction for death icon, it should float smoothly upward
        particle.velocity.x *= 0.98;
        particle.velocity.y *= 0.98;
      } else {
        // Standard friction for other particles
        particle.velocity.x *= 0.95;
        particle.velocity.y *= 0.95;
      }
      
      // Mark for removal if expired
      if (particle.life >= particle.maxLife) {
        particlesToRemove.push(id);
      }
    }
    
    // Remove expired particles
    for (const id of particlesToRemove) {
      const particle = this.particles.get(id);
      if (particle) {
        this.returnParticleToPool(particle);
        this.particles.delete(id);
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const particle of this.particles.values()) {
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      const alpha = lifeRatio;
      
      if (particle.type === 'death_icon') {
        // // Draw death icon (skull emoji)
        // ctx.save();
        // ctx.globalAlpha = alpha;
        // ctx.font = `${particle.size}px Arial`;
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'middle';
        
        // // Add shadow/outline for better visibility
        // ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        // ctx.lineWidth = 2;
        // ctx.strokeText('💀', particle.position.x, particle.position.y);
        
        // // Draw the skull emoji
        // ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        // ctx.fillText('💀', particle.position.x, particle.position.y);
        // ctx.restore();
      } else {
        // Regular particle rendering
        const size = particle.size * (0.5 + lifeRatio * 0.5);
        
        // Draw gold outline for super effective attacks
        if (particle.hasGoldOutline) {
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.8})`; // Gold color
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(particle.position.x, particle.position.y, size + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Set particle color with alpha
        ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect for death particles
        if (particle.type === 'death') {
          ctx.save();
          ctx.shadowColor = `rgb(${particle.color})`;
          ctx.shadowBlur = size * 2;
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(particle.position.x, particle.position.y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
    
    ctx.restore();
  }
  
  private getParticleFromPool(): Particle | null {
    return this.particlePool.pop() || null;
  }
  
  private returnParticleToPool(particle: Particle): void {
    if (this.particlePool.length < GAME_CONFIG.PARTICLE_POOL_SIZE) {
      this.particlePool.push(particle);
    }
  }

  private getElementColorRGB(element: string): string {
    const hexColor = elementRegistry.getElementColor(element);
    return this.hexToRGB(hexColor);
  }

  private hexToRGB(hex: string): string {
    // Remove the hash if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `${r}, ${g}, ${b}`;
  }
  
  clear(): void {
    // Return all active particles to pool
    for (const particle of this.particles.values()) {
      this.returnParticleToPool(particle);
    }
    this.particles.clear();
  }
}