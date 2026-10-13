// Zero-dependency Kitchen / Bar & Waiter notification sound generator using Web Audio API

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

/**
 * Initializes and unlocks AudioContext upon user gesture (e.g. login or button click)
 * to satisfy modern browser autoplay policies.
 */
export function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('Could not initialize AudioContext:', err);
  }
  return audioCtx;
}

function getAudioContext(): AudioContext | null {
  return initAudioContext();
}

/**
 * Tiếng bíp dồn dập (Dành cho KDS báo có order mới).
 * 3 xung âm thanh cao độ dồn dập, báo động nhanh cho Bếp & Bar.
 */
export function playNewOrderSound(): void {
  if (isAudioMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Pulse 1 (880Hz - A5)
    createBeep(ctx, 880, now, 0.09, 0.25);

    // Pulse 2 (1108.73Hz - C#6)
    createBeep(ctx, 1108.73, now + 0.12, 0.09, 0.28);

    // Pulse 3 (1318.51Hz - E6, dài hơn và ngân vang)
    createBeep(ctx, 1318.51, now + 0.24, 0.22, 0.32);
  } catch (err) {
    console.warn('playNewOrderSound error:', err);
  }
}

/**
 * Tiếng "Ting" thanh thoát ngân vang (Dành cho FOH / Phục vụ báo món đã làm xong, sẵn sàng ra món).
 * Âm thanh chuông bạc cao trong vắt, độ ngân dài và êm dịu.
 */
export function playReadySound(): void {
  if (isAudioMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Bell chime harmonic 1 (Fundamental: C6 - 1046.50Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.50, now);
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // Glide to E6

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.85); // Long sweet decay

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.85);

    // Bell overtone 2 (High sparkle: 2093Hz - C7)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2093, now);

    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.0005, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('playReadySound error:', err);
  }
}

// Helper function to create sharp responsive beeps
function createBeep(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Alias for existing callers
export const playOrderNotificationSound = playNewOrderSound;

export function toggleAudioMute(muted?: boolean): boolean {
  if (typeof muted === 'boolean') {
    isAudioMuted = muted;
  } else {
    isAudioMuted = !isAudioMuted;
  }
  return isAudioMuted;
}

export function isAudioAlertMuted(): boolean {
  return isAudioMuted;
}
