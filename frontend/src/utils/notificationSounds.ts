// Notification sound utility with different sound types
export class NotificationSounds {
  private static audioContext: AudioContext | null = null;
  private static soundCache: Map<string, AudioBuffer> = new Map();

  // Initialize Web Audio API
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate notification sound using Web Audio API
  private static generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ): void {
    try {
      const audioContext = this.getAudioContext();
      
      // Create oscillator and gain nodes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure oscillator
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Configure gain with fade out
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      // Start and stop
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Generate complex notification sound with multiple tones
  private static generateComplexTone(
    frequencies: number[],
    duration: number,
    volume: number = 0.2
  ): void {
    try {
      const audioContext = this.getAudioContext();
      
      frequencies.forEach((frequency, index) => {
        setTimeout(() => {
          this.generateTone(frequency, duration / frequencies.length, 'sine', volume);
        }, (duration * 1000 / frequencies.length) * index);
      });
    } catch (error) {
      console.warn('Could not play complex notification sound:', error);
    }
  }

  // Different notification sounds for different types
  public static playNotificationSound(type: string): void {
    // Check if audio is enabled
    if (!this.isAudioEnabled()) {
      return;
    }

    switch (type) {
      case 'assignment_new':
      case 'assignment_due':
        // Higher pitched, urgent sound
        this.generateComplexTone([800, 1000], 0.4, 0.25);
        break;
      
      case 'assignment_graded':
        // Pleasant success sound
        this.generateComplexTone([523, 659, 784], 0.6, 0.2);
        break;
      
      case 'announcement':
        // Important announcement sound
        this.generateComplexTone([440, 880], 0.5, 0.3);
        break;
      
      case 'forum_reply':
        // Gentle notification
        this.generateTone(660, 0.3, 'sine', 0.2);
        break;
      
      case 'course_enrollment':
        // Success confirmation sound
        this.generateComplexTone([523, 659, 784, 1047], 0.8, 0.2);
        break;
      
      case 'general':
      default:
        // Default notification sound
        this.generateTone(800, 0.3, 'sine', 0.25);
        break;
    }
  }

  // Play system sounds using built-in audio files
  public static playSystemSound(type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    if (!this.isAudioEnabled()) {
      return;
    }

    // Try to use system sounds first, fallback to generated tones
    try {
      const audio = new Audio();
      
      switch (type) {
        case 'success':
          // Try to play a success sound or generate one
          this.generateComplexTone([523, 659, 784], 0.5, 0.2);
          break;
        case 'error':
          // Error sound - lower frequency
          this.generateComplexTone([220, 196], 0.4, 0.3);
          break;
        case 'warning':
          // Warning sound - medium frequency
          this.generateComplexTone([440, 440, 440], 0.6, 0.25);
          break;
        case 'info':
        default:
          // Info sound - gentle
          this.generateTone(660, 0.3, 'sine', 0.2);
          break;
      }
    } catch (error) {
      console.warn('Could not play system sound:', error);
    }
  }

  // Check if audio is enabled in browser and settings
  private static isAudioEnabled(): boolean {
    // Check if Web Audio API is available
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      return false;
    }

    // Check if user has enabled sound in notification settings
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.soundAlerts !== false;
      } catch {
        return true; // Default to enabled if settings can't be parsed
      }
    }

    return true; // Default to enabled
  }

  // Request audio permission (for browsers that require user interaction)
  public static async requestAudioPermission(): Promise<boolean> {
    try {
      const audioContext = this.getAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      return audioContext.state === 'running';
    } catch (error) {
      console.warn('Could not request audio permission:', error);
      return false;
    }
  }

  // Test sound for settings
  public static testSound(): void {
    this.generateComplexTone([523, 659, 784], 0.5, 0.3);
  }

  // Cleanup
  public static cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCache.clear();
  }
}

// Export default sound player function
export const playNotificationSound = (type: string) => {
  NotificationSounds.playNotificationSound(type);
};

export const playSystemSound = (type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  NotificationSounds.playSystemSound(type);
};

export const testNotificationSound = () => {
  NotificationSounds.testSound();
};

export const requestNotificationAudioPermission = () => {
  return NotificationSounds.requestAudioPermission();
};
