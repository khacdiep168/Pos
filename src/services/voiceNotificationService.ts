// Smart Voice Notification Engine with VieNeu-TTS AI (48kHz) & Web Speech API Fallback
// Provides Studio-Grade Vietnamese Voice Cloning & Natural Announcements for Kitchen, Bar & Floor

export interface VieNeuVoiceOption {
  id: string;
  name: string;
  gender: 'nam' | 'nữ';
  region: 'Bắc' | 'Trung' | 'Nam';
  description: string;
}

export const VIENEU_PRESET_VOICES: VieNeuVoiceOption[] = [
  { id: 'Hải Đăng', name: 'Hải Đăng', gender: 'nam', region: 'Bắc', description: 'Giọng Nam phát thanh viên, trầm ấm, truyền cảm (Mặc định)' },
  { id: 'Mai Anh', name: 'Mai Anh', gender: 'nữ', region: 'Bắc', description: 'Giọng Nữ dịu dàng, tự nhiên, ngọt ngào' },
  { id: 'Thùy Dung', name: 'Thùy Dung', gender: 'nữ', region: 'Nam', description: 'Giọng Nữ miền Nam thanh thoát, thân thiện' },
  { id: 'Thiện Minh', name: 'Thiện Minh', gender: 'nam', region: 'Bắc', description: 'Giọng Nam dứt khoát, chuẩn phong cách Bếp' },
  { id: 'Trúc Ly', name: 'Trúc Ly', gender: 'nữ', region: 'Bắc', description: 'Giọng Nữ tươi vui, thanh mảnh, nhanh nhẹn' },
  { id: 'Quang Sơn', name: 'Quang Sơn', gender: 'nam', region: 'Trung', description: 'Giọng Nam miền Trung dõng dạc, khỏe khoắn' },
  { id: 'Ngọc Huyền', name: 'Ngọc Huyền', gender: 'nữ', region: 'Bắc', description: 'Giọng Nữ nhẹ nhàng, lịch sự' },
  { id: 'Ngọc Trân', name: 'Ngọc Trân', gender: 'nữ', region: 'Trung', description: 'Giọng Nữ miền Trung trong trẻo' },
];

/**
 * Helper to naturalize text for Vietnamese speech synthesis:
 * - Strips tech IDs (e.g. #ORD-123, ORD-..., tbl-..., item-...)
 * - Replaces hyphens/dashes with natural comma pauses (avoiding TTS reading "gạch nối" or "trừ")
 * - Removes brackets, hashes, technical symbols
 * - Cleans duplicate table prefixes (e.g. "Bàn Bàn 01" -> "Bàn 1")
 * - Converts leading zero table numbers (e.g. "Bàn 01" -> "Bàn 1")
 * - Naturalizes small quantities ("số lượng 1" -> "số lượng một", "số lượng 2" -> "số lượng hai", etc.)
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove technical identifiers like #ORD-1234, ORD-99, item-cafe-da, tbl-01
  cleaned = cleaned.replace(/#?[a-zA-Z0-9_\-]+(?:-[a-zA-Z0-9_\-]+)+/g, (match) => {
    // If it looks like a tech ID (starts with ord, tbl, item, zone, pos, cat, usr, shift, etc.)
    if (/^(#?)(ord|tbl|item|zone|pos|cat|usr|shift|vnd)/i.test(match)) {
      return '';
    }
    return match;
  });

  // Remove standalone hashes and IDs: #ORD-123, #123, #ABC
  cleaned = cleaned.replace(/#[a-zA-Z0-9_\-]+/g, '');

  // 2. Remove brackets and parentheses but keep inside text with gentle comma pauses
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, ', $1, ');
  cleaned = cleaned.replace(/\(([^)]+)\)/g, ', $1, ');

  // 3. Replace hyphens, dashes, slashes, underscores with commas/spaces for natural breathing pause
  cleaned = cleaned.replace(/[-–—]/g, ', ');
  cleaned = cleaned.replace(/[/\\_#@*~^|]/g, ' ');

  // 4. Fix duplicated prefixes (e.g. "Bàn Bàn 01" -> "Bàn 01")
  cleaned = cleaned.replace(/\bBàn\s+Bàn\b/gi, 'Bàn');

  // 5. Convert leading zero table numbers: "Bàn 01" -> "Bàn 1", "Bàn 02" -> "Bàn 2"
  cleaned = cleaned.replace(/\bBàn\s+0([1-9])\b/gi, 'Bàn $1');

  // 6. Naturalize Vietnamese numbers for quantities: "số lượng 1" -> "số lượng một"
  const numberWords: Record<string, string> = {
    '1': 'một',
    '2': 'hai',
    '3': 'ba',
    '4': 'bốn',
    '5': 'năm',
    '6': 'sáu',
    '7': 'bảy',
    '8': 'tám',
    '9': 'chín',
    '10': 'mười',
  };

  cleaned = cleaned.replace(/\bsố lượng\s+(\d+)\b/gi, (match, num) => {
    if (numberWords[num]) {
      return `số lượng ${numberWords[num]}`;
    }
    return match;
  });

  // 7. Clean punctuation & redundant spaces
  cleaned = cleaned.replace(/\s+([,.:!?])/g, '$1');
  cleaned = cleaned.replace(/,+/g, ',');
  cleaned = cleaned.replace(/,\s*,+/g, ',');
  cleaned = cleaned.replace(/\s*,\s*/g, ', ');
  cleaned = cleaned.replace(/,\s*\./g, '.');
  cleaned = cleaned.replace(/\.\s*,/g, '.');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/^[\s,.]+/, '');
  cleaned = cleaned.trim();
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

class VoiceNotificationService {
  private queue: string[] = [];
  private isSpeaking: boolean = false;
  private isEnabledState: boolean = true;
  private ttsEngineState: 'vieneu' | 'browser' = 'vieneu';
  private vieneuVoiceState: string = 'Hải Đăng';
  private vieneuApiUrlState: string = 'http://127.0.0.1:8000/v1';

  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  private voicesLoaded: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load persisted state (defaults to enabled, VieNeu-TTS engine)
    try {
      const savedAlert = localStorage.getItem('vibe_pos_voice_alert');
      if (savedAlert !== null) {
        this.isEnabledState = savedAlert !== 'false';
      }

      const savedEngine = localStorage.getItem('vibe_pos_tts_engine');
      if (savedEngine === 'browser' || savedEngine === 'vieneu') {
        this.ttsEngineState = savedEngine;
      }

      const savedVoice = localStorage.getItem('vibe_pos_vieneu_voice');
      if (savedVoice) {
        this.vieneuVoiceState = savedVoice;
      }

      const savedUrl = localStorage.getItem('vibe_pos_vieneu_api_url');
      if (savedUrl) {
        this.vieneuApiUrlState = savedUrl;
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

  public isEnabled(): boolean {
    return this.isEnabledState;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabledState = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vibe_pos_voice_alert', enabled ? 'true' : 'false');
      } catch {}

      if (!enabled) {
        this.cancel();
      }
    }
    this.notifyListeners();
  }

  public toggle(): boolean {
    const next = !this.isEnabledState;
    this.setEnabled(next);
    return next;
  }

  public getEngine(): 'vieneu' | 'browser' {
    return this.ttsEngineState;
  }

  public setEngine(engine: 'vieneu' | 'browser'): void {
    this.ttsEngineState = engine;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vibe_pos_tts_engine', engine);
      } catch {}
    }
    this.notifyListeners();
  }

  public getVieNeuVoice(): string {
    return this.vieneuVoiceState;
  }

  public setVieNeuVoice(voice: string): void {
    this.vieneuVoiceState = voice;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vibe_pos_vieneu_voice', voice);
      } catch {}
    }
    this.notifyListeners();
  }

  public getVieNeuApiUrl(): string {
    return this.vieneuApiUrlState;
  }

  public setVieNeuApiUrl(url: string): void {
    this.vieneuApiUrlState = url;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vibe_pos_vieneu_api_url', url);
      } catch {}
    }
    this.notifyListeners();
  }

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

  public cleanText(text: string): string {
    return cleanTextForSpeech(text);
  }

  /**
   * Check connection to VieNeu-TTS API
   */
  public async checkVieNeuConnection(): Promise<{ online: boolean; message: string }> {
    if (typeof window === 'undefined') return { online: false, message: 'SSR environment' };
    try {
      const res = await fetch(`/api/tts?apiUrl=${encodeURIComponent(this.vieneuApiUrlState)}`);
      const data = await res.json();
      if (data.online) {
        return { online: true, message: data.message || `Kết nối VieNeu-TTS v3 Turbo thành công` };
      }
      return { online: false, message: data.message || `Chưa phát hiện server VieNeu-TTS. Sẽ sử dụng giọng đọc trình duyệt tự nhiên.` };
    } catch {
      return { online: false, message: `Không thể kết nối tới server TTS` };
    }
  }

  /**
   * Unlock mobile browser audio autoplay policy
   */
  public async unlockMobileAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const tempCtx = new AudioCtxClass();
        if (tempCtx.state === 'suspended') {
          await tempCtx.resume();
        }
        const buffer = tempCtx.createBuffer(1, 1, 22050);
        const source = tempCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(tempCtx.destination);
        source.start(0);
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0.01;
        silentUtterance.rate = 2;
        window.speechSynthesis.speak(silentUtterance);
      }

      try {
        sessionStorage.setItem('vibe_pos_mobile_audio_unlocked', 'true');
      } catch {}

      return true;
    } catch (err) {
      console.warn('[VoiceNotificationService] unlockMobileAudio error:', err);
      return false;
    }
  }

  public isMobileAudioUnlocked(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem('vibe_pos_mobile_audio_unlocked') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Speak a text sentence using VieNeu-TTS AI (with Web Speech API fallback)
   */
  public speakText(text: string, lang = 'vi-VN'): void {
    if (typeof window === 'undefined') return;
    if (!this.isEnabledState) return;

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    // Deduplication check: ignore identical text within 2 seconds
    const now = Date.now();
    if (cleaned === this.lastSpokenText && now - this.lastSpokenTime < 2000) {
      return;
    }

    this.lastSpokenText = cleaned;
    this.lastSpokenTime = now;

    this.queue.push(cleaned);
    this.processQueue(lang);
  }

  /**
   * Process the speech queue sequentially
   */
  private async processQueue(lang: string) {
    if (this.isSpeaking || this.queue.length === 0) return;
    if (typeof window === 'undefined') return;

    const textToSpeak = this.queue.shift();
    if (!textToSpeak) return;

    this.isSpeaking = true;

    // Try VieNeu-TTS first if configured
    if (this.ttsEngineState === 'vieneu') {
      const synthesized = await this.playVieNeuAudio(textToSpeak, lang);
      if (synthesized) {
        return; // Successfully played through VieNeu-TTS
      }
      // If VieNeu-TTS is unreachable, seamlessly fall back to browser speech
    }

    // Browser Web Speech API fallback
    this.speakBrowser(textToSpeak, lang);
  }

  /**
   * Synthesize & play speech via VieNeu-TTS
   */
  private async playVieNeuAudio(text: string, lang: string): Promise<boolean> {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: this.vieneuVoiceState,
          apiUrl: this.vieneuApiUrlState,
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise<boolean>((resolve) => {
          const audio = new Audio(audioUrl);
          this.currentAudioElement = audio;
          audio.volume = 1.0;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioElement = null;
            this.isSpeaking = false;
            setTimeout(() => this.processQueue(lang), 250);
            resolve(true);
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioElement = null;
            resolve(false);
          };

          audio.play().catch(() => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioElement = null;
            resolve(false);
          });
        });
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Fallback using Web Speech API (speechSynthesis)
   */
  private speakBrowser(textToSpeak: string, lang: string) {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      return;
    }

    try {
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
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        this.isSpeaking = false;
        setTimeout(() => {
          this.processQueue(lang);
        }, 250);
      };

      utterance.onerror = (event) => {
        console.warn('[VoiceNotificationService] Browser speech error:', event);
        this.isSpeaking = false;
        setTimeout(() => {
          this.processQueue(lang);
        }, 150);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VoiceNotificationService] Browser speak error:', err);
      this.isSpeaking = false;
    }
  }

  /**
   * Cancel any pending speech or active audio playback
   */
  public cancel(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement = null;
      } catch {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.queue = [];
    this.isSpeaking = false;
  }
}

export const voiceNotificationService = new VoiceNotificationService();
