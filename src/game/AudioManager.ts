// Audio Manager for Dynamic Sound Effects
export type SoundEffectType = 'super-effective' | 'not-very-effective' | 'regular-attack';

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.7;
  private soundEnabled: boolean = true;

  private constructor() {
    this.initializeAudio();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initializeAudio(): void {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Handle browser autoplay policies
      if (this.audioContext.state === 'suspended') {
        // We'll resume on first user interaction
        document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
        document.addEventListener('keydown', () => this.resumeAudioContext(), { once: true });
      }
    } catch (error) {
      console.warn('Web Audio API not supported, audio disabled:', error);
      this.audioContext = null;
    }
  }

  private resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  playAttackSound(effectType: SoundEffectType): void {
    if (!this.soundEnabled || !this.audioContext) {
      return;
    }

    this.resumeAudioContext();

    switch (effectType) {
      case 'super-effective':
        this.playSuperEffectiveSound();
        break;
      case 'not-very-effective':
        this.playNotVeryEffectiveSound();
        break;
      case 'regular-attack':
        this.playRegularAttackSound();
        break;
    }
  }

  private playSuperEffectiveSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create a satisfying, sharp impact sound
    // Main impact tone (higher frequency for satisfaction)
    const oscillator1 = this.audioContext.createOscillator();
    const gainNode1 = this.audioContext.createGain();
    
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(800, now);
    oscillator1.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.exponentialRampToValueAtTime(this.masterVolume * 0.3, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    // Add a higher harmonic for brightness
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode2 = this.audioContext.createGain();
    
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(1600, now);
    oscillator2.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.exponentialRampToValueAtTime(this.masterVolume * 0.15, now + 0.005);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Connect and start
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(this.audioContext.destination);
    gainNode2.connect(this.audioContext.destination);
    
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.2);
    oscillator2.stop(now + 0.15);
  }

  private playNotVeryEffectiveSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create a dull, muted impact sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    
    // Low-pass filter for muted effect
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.Q.setValueAtTime(1, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.exponentialRampToValueAtTime(this.masterVolume * 0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    // Connect with filtering
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  private playRegularAttackSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create a balanced, standard impact sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.exponentialRampToValueAtTime(this.masterVolume * 0.25, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    // Add a brief noise burst for impact
    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const noiseFilter = this.audioContext.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    // Connect everything
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    
    oscillator.start(now);
    noiseSource.start(now);
    oscillator.stop(now + 0.18);
    noiseSource.stop(now + 0.05);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not available');
    
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  // Cleanup method
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();