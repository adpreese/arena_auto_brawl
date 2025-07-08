// Particle System for Visual Effects
import { Particle, Vec2 } from './types';
import { GAME_CONFIG } from './config';
import { generateUniqueId } from './utils';

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
      particle.size = 4 + Math.random() * 8;
      particle.color = '255, 221, 51';
      particle.type = 'hit';
      
      this.particles.set(particle.id, particle);
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
      particle.color = 'rgb(var(--particle-death))';
      particle.type = 'death';
      
      this.particles.set(particle.id, particle);
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
      
      // Apply friction
      particle.velocity.x *= 0.95;
      particle.velocity.y *= 0.95;
      
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
      const size = particle.size * (0.5 + lifeRatio * 0.5);
      
      // Set particle color with alpha
      const colorMatch = particle.color.match(/rgb\(var\(([^)]+)\)\)/);
      if (colorMatch) {
        ctx.fillStyle = `rgb(var(${colorMatch[1]}) / ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect for certain particles
      if (particle.type === 'death') {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = size * 2;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
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
  
  clear(): void {
    // Return all active particles to pool
    for (const particle of this.particles.values()) {
      this.returnParticleToPool(particle);
    }
    this.particles.clear();
  }
}