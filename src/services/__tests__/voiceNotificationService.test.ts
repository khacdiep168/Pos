import { describe, it, expect, vi, beforeEach } from 'vitest';
import { voiceNotificationService } from '../voiceNotificationService';

describe('VoiceNotificationService - Smart Voice Notification Engine (Phase 2.6)', () => {
  let mockSpeak: any;
  let mockCancel: any;
  let mockGetVoices: any;
  let createdUtterances: any[] = [];

  beforeEach(() => {
    createdUtterances = [];
    mockSpeak = vi.fn().mockImplementation((utt) => {
      createdUtterances.push(utt);
    });
    mockCancel = vi.fn();
    mockGetVoices = vi.fn().mockReturnValue([
      { name: 'Google Tiếng Việt', lang: 'vi-VN', default: true },
      { name: 'Microsoft David', lang: 'en-US', default: false },
    ]);

    // Mock window.speechSynthesis
    (global as any).window = (global as any).window || {};
    (global as any).window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: mockGetVoices,
      onvoiceschanged: null,
    };

    // Mock SpeechSynthesisUtterance
    (global as any).SpeechSynthesisUtterance = class {
      public text: string;
      public lang: string = 'vi-VN';
      public voice: any = null;
      public rate: number = 1.0;
      public pitch: number = 1.0;
      public onend: (() => void) | null = null;
      public onerror: ((err: any) => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    };

    voiceNotificationService.cancel();
    voiceNotificationService.setEnabled(true);
  });

  it('bật/tắt trạng thái loa và phát tín hiệu cho subscriber', () => {
    const subscriber = vi.fn();
    const unsub = voiceNotificationService.subscribe(subscriber);

    expect(voiceNotificationService.isEnabled()).toBe(true);

    const toggled = voiceNotificationService.toggle();
    expect(toggled).toBe(false);
    expect(voiceNotificationService.isEnabled()).toBe(false);
    expect(subscriber).toHaveBeenCalledWith(false);

    voiceNotificationService.setEnabled(true);
    expect(voiceNotificationService.isEnabled()).toBe(true);
    expect(subscriber).toHaveBeenCalledWith(true);

    unsub();
  });

  it('phát âm thanh thông báo với giọng Tiếng Việt, tốc độ 1.05 chuẩn', () => {
    const message = 'Khách Sân Vườn - Bàn 04 đặt món: Cà phê sữa, số lượng 2.';
    voiceNotificationService.speakText(message);

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(createdUtterances.length).toBe(1);

    const utt = createdUtterances[0];
    expect(utt.text).toBe(message);
    expect(utt.lang).toBe('vi-VN');
    expect(utt.rate).toBe(1.05);
    expect(utt.pitch).toBe(1.0);
  });

  it('chống đè tiếng: xếp hàng tuần tự (Queue) khi có nhiều món gửi dồn dập', () => {
    vi.useFakeTimers();

    const msg1 = 'Khách Tầng 1 - Bàn 01 đặt món: Trà đào, số lượng 1.';
    const msg2 = 'Khách Tầng 1 - Bàn 02 đặt món: Trà vải, số lượng 2.';

    voiceNotificationService.speakText(msg1);
    voiceNotificationService.speakText(msg2);

    // First utterance speaks immediately
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(createdUtterances[0].text).toBe(msg1);

    // When first finishes, queue advances after pause
    createdUtterances[0].onend();
    vi.advanceTimersByTime(300);

    expect(mockSpeak).toHaveBeenCalledTimes(2);
    expect(createdUtterances[1].text).toBe(msg2);

    vi.useRealTimers();
  });

  it('chặn phát giọng nói khi loa ở trạng thái tắt (Muted)', () => {
    voiceNotificationService.setEnabled(false);

    voiceNotificationService.speakText('Khách đặt món khi loa đã tắt');
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('cơ chế chống lặp âm (Deduplication) trong cửa sổ 2 giây', () => {
    const message = 'Món Trà Đào Cam Sả, Tầng 1 - Bàn 03 đã hoàn thành.';

    voiceNotificationService.speakText(message);
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    // Call identical message immediately
    voiceNotificationService.speakText(message);
    expect(mockSpeak).toHaveBeenCalledTimes(1); // Still 1, not duplicated
  });
});
