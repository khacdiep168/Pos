// Smart Voice Notification Engine for Kitchen/Bar & Waiter Orders
// Uses Web Speech API (window.speechSynthesis) with Vietnamese Voice Prioritization & Queue Management

class VoiceNotificationService {
  private queue: string[] = [];
  private isSpeaking: boolean = false;
  private isEnabledState: boolean = true;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  private voicesLoaded: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load persisted state (defaults to true)
    try {
      const saved = localStorage.getItem('vibe_pos_voice_alert');
      if (saved !== null) {
        this.isEnabledState = saved !== 'false';
      }
    } catch {
      this.isEnabledState = true;
    }

    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findViVoice = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          // Prioritize Vietnamese voices: e.g. Google Tiếng Việt, Microsoft HoaiMy/NamMinh, Apple Linh
          const viVoice =
            voices.find((v) => v.lang === 'vi-VN' || v.lang === 'vi_VN') ||
            voices.find((v) => v.lang.toLowerCase().startsWith('vi')) ||
            null;

          this.selectedVoice = viVoice;
          this.voicesLoaded = true;
        }
      } catch (err) {
        console.warn('[VoiceNotificationService] Error loading voices:', err);
      }
    };

    findViVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = findViVoice;
    }
  }

  /**
   * Check if voice notifications are currently enabled
   */
  public isEnabled(): boolean {
    return this.isEnabledState;
  }

  /**
   * Set voice notification enabled state and persist to localStorage
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabledState = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vibe_pos_voice_alert', enabled ? 'true' : 'false');
      } catch {}

      if (!enabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        this.queue = [];
        this.isSpeaking = false;
      }
    }
    this.notifyListeners();
  }

  /**
   * Toggle voice notification on/off
   */
  public toggle(): boolean {
    const next = !this.isEnabledState;
    this.setEnabled(next);
    return next;
  }

  /**
   * Subscribe to toggle changes for real-time header UI syncing
   */
  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.isEnabledState);
      } catch (err) {
        console.warn('[VoiceNotificationService] Listener error:', err);
      }
    });
  }

  /**
   * Speak a text sentence using Web Speech API with sequential queue management and deduplication
   */
  public speakText(text: string, lang = 'vi-VN'): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!this.isEnabledState) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    // Deduplication check: ignore identical text within 2 seconds
    const now = Date.now();
    if (trimmed === this.lastSpokenText && now - this.lastSpokenTime < 2000) {
      return;
    }

    this.lastSpokenText = trimmed;
    this.lastSpokenTime = now;

    // Enqueue message
    this.queue.push(trimmed);
    this.processQueue(lang);
  }

  /**
   * Process the speech queue sequentially to prevent voice overlap or chaos
   */
  private processQueue(lang: string) {
    if (this.isSpeaking || this.queue.length === 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const textToSpeak = this.queue.shift();
    if (!textToSpeak) return;

    this.isSpeaking = true;

    try {
      // Re-scan for Vietnamese voice if not loaded earlier
      if (!this.selectedVoice) {
        const voices = window.speechSynthesis.getVoices();
        this.selectedVoice =
          voices.find((v) => v.lang === 'vi-VN' || v.lang === 'vi_VN') ||
          voices.find((v) => v.lang.toLowerCase().startsWith('vi')) ||
          null;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang;
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 1.05; // Slightly brisk, clear pace for busy kitchen/floor
      utterance.pitch = 1.0; // Natural pitch

      utterance.onend = () => {
        this.isSpeaking = false;
        // 250ms breathing gap between multiple items in queue
        setTimeout(() => {
          this.processQueue(lang);
        }, 250);
      };

      utterance.onerror = (event) => {
        console.warn('[VoiceNotificationService] Speech error:', event);
        this.isSpeaking = false;
        setTimeout(() => {
          this.processQueue(lang);
        }, 150);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VoiceNotificationService] speak error:', err);
      this.isSpeaking = false;
    }
  }

  /**
   * Cancel any pending or current speech immediately
   */
  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isSpeaking = false;
  }
}

export const voiceNotificationService = new VoiceNotificationService();
