import { describe, it, expect, vi, beforeEach } from 'vitest';
import { voiceNotificationService, cleanTextForSpeech } from '../voiceNotificationService';

describe('VoiceNotificationService - Smart Voice Notification Engine (Phase 2.6 & 2.7)', () => {
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

    // Mock sessionStorage
    const storage: Record<string, string> = {};
    (global as any).sessionStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, val: string) => { storage[key] = val; },
      removeItem: (key: string) => { delete storage[key]; },
    };

    // Mock SpeechSynthesisUtterance
    (global as any).SpeechSynthesisUtterance = class {
      public text: string;
      public lang: string = 'vi-VN';
      public voice: any = null;
      public rate: number = 1.0;
      public pitch: number = 1.0;
      public volume: number = 1.0;
      public onend: (() => void) | null = null;
      public onerror: ((err: any) => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    };

    voiceNotificationService.cancel();
    voiceNotificationService.setEnabled(true);
    voiceNotificationService.setEngine('browser');
  });

  describe('cleanTextForSpeech - Làm sạch chuỗi văn bản tự nhiên (Natural Vietnamese Speech)', () => {
    it('loại bỏ mã kỹ thuật và dấu thăng (#ORD-123)', () => {
      const input = 'Món #ORD-123 bàn Tầng 1 - Bàn 02';
      const output = cleanTextForSpeech(input);
      expect(output).not.toContain('#ORD-123');
      expect(output).not.toContain('#');
      expect(output).toContain('Tầng 1, Bàn 2');
    });

    it('loại bỏ dấu gạch ngang (-) và chuyển thành dấu phẩy (ngắt nghỉ tự nhiên)', () => {
      const input = 'Khách Tầng 1 - Bàn 04 đặt món: Cà phê sữa';
      const output = cleanTextForSpeech(input);
      expect(output).not.toContain('-');
      expect(output).toContain('Tầng 1, Bàn 4 đặt món: Cà phê sữa');
    });

    it('xóa dấu ngoặc vuông và ngoặc đơn, giữ nội dung mạch lạc', () => {
      const input = 'Khách [Khu Trệt] (Bàn 01) đặt món: Cà phê đá';
      const output = cleanTextForSpeech(input);
      expect(output).not.toContain('[');
      expect(output).not.toContain(']');
      expect(output).not.toContain('(');
      expect(output).not.toContain(')');
      expect(output).toContain('Khu Trệt, Bàn 1');
    });

    it('khắc phục lỗi lặp từ "Bàn Bàn 01" thành "Bàn 1"', () => {
      const input = 'Khách Tầng 1 - Bàn Bàn 01 đặt món';
      const output = cleanTextForSpeech(input);
      expect(output).not.toContain('Bàn Bàn');
      expect(output).toContain('Bàn 1');
    });

    it('chuyển đổi số lượng thành từ ngữ tiếng Việt tự nhiên (1 -> một, 2 -> hai)', () => {
      const input = 'Món Cà phê sữa, số lượng 1. Trà đào, số lượng 2.';
      const output = cleanTextForSpeech(input);
      expect(output).toContain('số lượng một');
      expect(output).toContain('số lượng hai');
    });
  });

  describe('Phát giọng nói & Quản lý hàng đợi', () => {
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

    it('phát âm thanh thông báo với giọng Tiếng Việt, tốc độ 1.05 và âm lượng tối đa 1.0', () => {
      const message = 'Khách Sân Vườn - Bàn 04 đặt món: Cà phê sữa, số lượng 2.';
      voiceNotificationService.speakText(message);

      expect(mockSpeak).toHaveBeenCalledTimes(1);
      expect(createdUtterances.length).toBe(1);

      const utt = createdUtterances[0];
      expect(utt.text).toContain('Khách Sân Vườn, Bàn 4 đặt món: Cà phê sữa, số lượng hai');
      expect(utt.lang).toBe('vi-VN');
      expect(utt.rate).toBe(1.05);
      expect(utt.pitch).toBe(1.0);
      expect(utt.volume).toBe(1.0);
    });

    it('chống đè tiếng: xếp hàng tuần tự (Queue) khi có nhiều món gửi dồn dập', () => {
      vi.useFakeTimers();

      const msg1 = 'Khách Tầng 1 - Bàn 01 đặt món: Trà đào, số lượng 1.';
      const msg2 = 'Khách Tầng 1 - Bàn 02 đặt món: Trà vải, số lượng 2.';

      voiceNotificationService.speakText(msg1);
      voiceNotificationService.speakText(msg2);

      // First utterance speaks immediately
      expect(mockSpeak).toHaveBeenCalledTimes(1);
      expect(createdUtterances[0].text).toContain('Trà đào, số lượng một');

      // When first finishes, queue advances after pause
      createdUtterances[0].onend();
      vi.advanceTimersByTime(300);

      expect(mockSpeak).toHaveBeenCalledTimes(2);
      expect(createdUtterances[1].text).toContain('Trà vải, số lượng hai');

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

  describe('VieNeu-TTS AI Engine Integration (Phase 2.7)', () => {
    it('lưu và truy xuất cấu hình engine, giọng đọc và API url', () => {
      voiceNotificationService.setEngine('vieneu');
      expect(voiceNotificationService.getEngine()).toBe('vieneu');

      voiceNotificationService.setVieNeuVoice('Mai Anh');
      expect(voiceNotificationService.getVieNeuVoice()).toBe('Mai Anh');

      voiceNotificationService.setVieNeuApiUrl('http://127.0.0.1:8000/v1');
      expect(voiceNotificationService.getVieNeuApiUrl()).toBe('http://127.0.0.1:8000/v1');
    });

    it('kiểm tra trạng thái kết nối VieNeu-TTS qua /api/tts', async () => {
      (global as any).fetch = vi.fn().mockResolvedValue({
        json: async () => ({ online: true }),
      });

      const res = await voiceNotificationService.checkVieNeuConnection();
      expect(res.online).toBe(true);
      expect(res.message).toContain('Kết nối VieNeu-TTS');
    });
  });
});
