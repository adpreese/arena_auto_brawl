// Centralized system lifecycle management
import { CharacterManager } from './CharacterManager';
import { AIController } from './AIController';
import { CombatSystem } from './CombatSystem';
import { ParticleSystem } from './ParticleSystem';
import { AOESystem } from './AOESystem';
import { DamageIndicatorSystem } from './DamageIndicatorSystem';
import { RoundTimerSystem } from './RoundTimerSystem';
import { ShopSystem } from './ShopSystem';
import { InventorySystem } from './InventorySystem';
import { GameEvent } from './eventTypes';
import { validateSystemReferences, ValidationError } from './validation';

export interface SystemHealth {
  name: string;
  isHealthy: boolean;
  lastUpdate: number;
  errorCount: number;
  lastError?: Error;
}

export interface SystemMetrics {
  updateCount: number;
  totalUpdateTime: number;
  averageUpdateTime: number;
  lastUpdateDuration: number;
}

export class SystemManager {
  private systems: Map<string, any> = new Map();
  private eventListeners: Map<string, ((event: GameEvent) => void)[]> = new Map();
  private systemHealth: Map<string, SystemHealth> = new Map();
  private systemMetrics: Map<string, SystemMetrics> = new Map();
  private isInitialized = false;
  private isShutdown = false;

  constructor() {
    this.initializeSystems();
  }

  private initializeSystems(): void {
    try {
      // Initialize systems in dependency order
      const characterManager = new CharacterManager();
      const aiController = new AIController();
      const combatSystem = new CombatSystem(characterManager);
      const particleSystem = new ParticleSystem();
      const aoeSystem = new AOESystem();
      const damageIndicatorSystem = new DamageIndicatorSystem();
      const roundTimerSystem = new RoundTimerSystem();
      const shopSystem = new ShopSystem();
      const inventorySystem = new InventorySystem();

      // Register systems
      this.registerSystem('characterManager', characterManager);
      this.registerSystem('aiController', aiController);
      this.registerSystem('combatSystem', combatSystem);
      this.registerSystem('particleSystem', particleSystem);
      this.registerSystem('aoeSystem', aoeSystem);
      this.registerSystem('damageIndicatorSystem', damageIndicatorSystem);
      this.registerSystem('roundTimerSystem', roundTimerSystem);
      this.registerSystem('shopSystem', shopSystem);
      this.registerSystem('inventorySystem', inventorySystem);

      // Validate all systems
      const validation = validateSystemReferences(this.getAllSystems());
      if (!validation.isValid) {
        throw new ValidationError(`System validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize systems:', error);
      throw error;
    }
  }

  private registerSystem(name: string, system: any): void {
    this.systems.set(name, system);
    this.systemHealth.set(name, {
      name,
      isHealthy: true,
      lastUpdate: Date.now(),
      errorCount: 0,
    });
    this.systemMetrics.set(name, {
      updateCount: 0,
      totalUpdateTime: 0,
      averageUpdateTime: 0,
      lastUpdateDuration: 0,
    });
    this.eventListeners.set(name, []);
  }

  // Get a specific system with type safety
  getSystem<T>(name: string): T | null {
    if (this.isShutdown) {
      console.warn(`Attempted to access system '${name}' after shutdown`);
      return null;
    }

    const system = this.systems.get(name);
    if (!system) {
      console.warn(`System '${name}' not found`);
      return null;
    }

    return system as T;
  }

  // Get all systems as a typed object
  getAllSystems() {
    return {
      characterManager: this.getSystem<CharacterManager>('characterManager'),
      aiController: this.getSystem<AIController>('aiController'),
      combatSystem: this.getSystem<CombatSystem>('combatSystem'),
      particleSystem: this.getSystem<ParticleSystem>('particleSystem'),
      aoeSystem: this.getSystem<AOESystem>('aoeSystem'),
      damageIndicatorSystem: this.getSystem<DamageIndicatorSystem>('damageIndicatorSystem'),
      roundTimerSystem: this.getSystem<RoundTimerSystem>('roundTimerSystem'),
      shopSystem: this.getSystem<ShopSystem>('shopSystem'),
      inventorySystem: this.getSystem<InventorySystem>('inventorySystem'),
    };
  }

  // Update all systems with performance monitoring
  update(currentTime: number, deltaTime: number): void {
    if (!this.isInitialized || this.isShutdown) return;

    const updateOrder = [
      'zoneSystem',
      'aiController',
      'combatSystem',
      'characterManager',
      'particleSystem',
      'aoeSystem',
      'damageIndicatorSystem',
      'roundTimerSystem',
    ];

    for (const systemName of updateOrder) {
      this.updateSystem(systemName, currentTime, deltaTime);
    }
  }

  private updateSystem(systemName: string, currentTime: number, deltaTime: number): void {
    const system = this.systems.get(systemName);
    if (!system || !system.update) return;

    const health = this.systemHealth.get(systemName)!;
    const metrics = this.systemMetrics.get(systemName)!;

    try {
      const startTime = performance.now();
      
      // Call the appropriate update method based on system requirements
      if (systemName === 'zoneSystem') {
        const characterManager = this.getSystem<CharacterManager>('characterManager');
        system.update(currentTime, characterManager?.getAllCharacters() || []);
      } else if (systemName === 'aiController') {
        const characterManager = this.getSystem<CharacterManager>('characterManager');
        system.update(characterManager?.getAllCharacters() || [], deltaTime);
      } else if (systemName === 'characterManager') {
        system.removeDead();
      } else {
        system.update(deltaTime);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update metrics
      metrics.updateCount++;
      metrics.totalUpdateTime += duration;
      metrics.averageUpdateTime = metrics.totalUpdateTime / metrics.updateCount;
      metrics.lastUpdateDuration = duration;

      // Update health
      health.isHealthy = true;
      health.lastUpdate = currentTime;

      // Warn about performance issues
      if (duration > 16) { // More than one frame at 60 FPS
        console.warn(`System '${systemName}' took ${duration.toFixed(2)}ms to update`);
      }

    } catch (error) {
      console.error(`Error updating system '${systemName}':`, error);
      health.isHealthy = false;
      health.errorCount++;
      health.lastError = error as Error;
    }
  }

  // Add event listener to a system
  addEventListener(systemName: string, listener: (event: GameEvent) => void): void {
    const system = this.systems.get(systemName);
    if (system && system.addEventListener) {
      system.addEventListener(listener);
      this.eventListeners.get(systemName)?.push(listener);
    }
  }

  // Remove event listener from a system
  removeEventListener(systemName: string, listener: (event: GameEvent) => void): void {
    const system = this.systems.get(systemName);
    if (system && system.removeEventListener) {
      system.removeEventListener(listener);
      const listeners = this.eventListeners.get(systemName);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  // Clear all systems
  clearAllSystems(): void {
    const systems = this.getAllSystems();
    
    try {
      systems.particleSystem?.clear();
      systems.damageIndicatorSystem?.clear();
      systems.roundTimerSystem?.reset();
      systems.zoneSystem?.clear();
    } catch (error) {
      console.error('Error clearing systems:', error);
    }
  }

  // Get system health status
  getSystemHealth(): SystemHealth[] {
    return Array.from(this.systemHealth.values());
  }

  // Get system performance metrics
  getSystemMetrics(): Map<string, SystemMetrics> {
    return new Map(this.systemMetrics);
  }

  // Check if all systems are healthy
  areAllSystemsHealthy(): boolean {
    return Array.from(this.systemHealth.values()).every(health => health.isHealthy);
  }

  // Get systems that are not healthy
  getUnhealthySystems(): SystemHealth[] {
    return Array.from(this.systemHealth.values()).filter(health => !health.isHealthy);
  }

  // Graceful shutdown
  shutdown(): void {
    if (this.isShutdown) return;

    try {
      // Clear all systems
      this.clearAllSystems();

      // Remove all event listeners
      for (const [systemName, listeners] of this.eventListeners) {
        for (const listener of listeners) {
          this.removeEventListener(systemName, listener);
        }
      }

      // Clear maps
      this.systems.clear();
      this.eventListeners.clear();
      this.systemHealth.clear();
      this.systemMetrics.clear();

      this.isShutdown = true;
      console.log('SystemManager shutdown complete');
    } catch (error) {
      console.error('Error during system shutdown:', error);
    }
  }

  // Check if systems are initialized and ready
  isReady(): boolean {
    return this.isInitialized && !this.isShutdown && this.areAllSystemsHealthy();
  }
}