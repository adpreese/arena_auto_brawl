import { GAME_CONFIG } from './config';

export interface RoundTimerState {
  isActive: boolean;
  timeRemaining: number; // milliseconds
  isInOvertime: boolean;
  lastOvertimeDamage: number; // timestamp of last overtime damage
  isWarning: boolean; // true when timer is in warning phase
}

export class RoundTimerSystem {
  private state: RoundTimerState = {
    isActive: false,
    timeRemaining: 0,
    isInOvertime: false,
    lastOvertimeDamage: 0,
    isWarning: false
  };
  
  private gameEventListeners: ((event: any) => void)[] = [];

  constructor() {
    this.reset();
  }

  start(): void {
    this.state.isActive = true;
    this.state.timeRemaining = GAME_CONFIG.ROUND_TIMER.DURATION;
    this.state.isInOvertime = false;
    this.state.lastOvertimeDamage = 0;
    this.state.isWarning = false;
  }

  stop(): void {
    this.state.isActive = false;
    this.state.isInOvertime = false;
  }

  reset(): void {
    this.state = {
      isActive: false,
      timeRemaining: GAME_CONFIG.ROUND_TIMER.DURATION,
      isInOvertime: false,
      lastOvertimeDamage: 0,
      isWarning: false
    };
  }

  update(currentTime: number): void {
    if (!this.state.isActive) return;

    // Reduce time remaining
    const deltaTime = 16; // Approximate frame time (60 FPS)
    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - deltaTime);

    // Check for warning phase
    const wasWarning = this.state.isWarning;
    this.state.isWarning = this.state.timeRemaining <= GAME_CONFIG.ROUND_TIMER.WARNING_TIME && this.state.timeRemaining > 0;
    
    // Emit warning event when entering warning phase
    if (this.state.isWarning && !wasWarning) {
      this.emitEvent({
        type: 'timer_warning',
        data: {
          timeRemaining: this.state.timeRemaining
        }
      });
    }

    // Handle overtime
    if (this.state.timeRemaining <= 0) {
      if (!this.state.isInOvertime) {
        // Just entered overtime
        this.state.isInOvertime = true;
        this.state.lastOvertimeDamage = currentTime;
        
        this.emitEvent({
          type: 'timer_expired',
          data: {
            message: 'Time\'s up! Overtime damage begins!'
          }
        });
      }

      // Deal overtime damage at intervals
      if (currentTime - this.state.lastOvertimeDamage >= GAME_CONFIG.ROUND_TIMER.OVERTIME_INTERVAL) {
        this.state.lastOvertimeDamage = currentTime;
        
        this.emitEvent({
          type: 'overtime_damage',
          data: {
            damage: GAME_CONFIG.ROUND_TIMER.OVERTIME_DAMAGE
          }
        });
      }
    }
  }

  getState(): RoundTimerState {
    return { ...this.state };
  }

  getTimeRemainingSeconds(): number {
    return Math.ceil(this.state.timeRemaining / 1000);
  }

  getFormattedTime(): string {
    if (this.state.isInOvertime) {
      return 'OVERTIME';
    }
    
    const seconds = this.getTimeRemainingSeconds();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return seconds.toString();
  }

  addEventListener(listener: (event: any) => void): void {
    this.gameEventListeners.push(listener);
  }

  removeEventListener(listener: (event: any) => void): void {
    const index = this.gameEventListeners.indexOf(listener);
    if (index > -1) {
      this.gameEventListeners.splice(index, 1);
    }
  }

  private emitEvent(event: any): void {
    this.gameEventListeners.forEach(listener => listener(event));
  }
}