'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, Sparkles, X } from 'lucide-react';
import { voiceNotificationService } from '@/services/voiceNotificationService';
import { playReadySound, unlockAudioContext } from '@/lib/audioAlert';

interface MobileAudioUnlockBannerProps {
  moduleName?: string; // 'Bếp & Bar (KDS)' or 'Phục Vụ (FOH)'
}

export const MobileAudioUnlockBanner: React.FC<MobileAudioUnlockBannerProps> = ({
  moduleName = 'Loa Thông Báo',
}) => {
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const alreadyUnlocked = voiceNotificationService.isMobileAudioUnlocked();
    setIsUnlocked(alreadyUnlocked);

    // Passive unlock listener: Tapping anywhere on the page also unlocks audio transparently
    const handleGlobalInteraction = async () => {
      if (!voiceNotificationService.isMobileAudioUnlocked()) {
        await voiceNotificationService.unlockMobileAudio();
        unlockAudioContext();
        setIsUnlocked(true);
      }
    };

    window.addEventListener('touchstart', handleGlobalInteraction, { once: true, passive: true });
    window.addEventListener('click', handleGlobalInteraction, { once: true });

    return () => {
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('click', handleGlobalInteraction);
    };
  }, []);

  const handleManualUnlock = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await voiceNotificationService.unlockMobileAudio();
    unlockAudioContext();
    setIsUnlocked(true);
    setJustUnlocked(true);

    // Play quick test chime and speak confirmation
    try {
      playReadySound();
      voiceNotificationService.speakText('Loa thông báo đã kích hoạt.');
    } catch {}

    setTimeout(() => {
      setJustUnlocked(false);
    }, 2500);
  };

  if (isDismissed) return null;

  // Temporary success pill right after unlocking
  if (justUnlocked) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-xl border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Đã mở khóa âm thanh & Loa giọng nói thành công!</span>
        </div>
      </div>
    );
  }

  // If already unlocked, do not render banner
  if (isUnlocked) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md animate-fade-in">
      <div className="relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-500/95 dark:bg-amber-600/95 text-white backdrop-blur-md shadow-2xl border border-amber-400/50">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 shrink-0">
            <Volume2 className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>

          <div className="min-w-0 pr-1">
            <h4 className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5 text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Bật âm thanh {moduleName}
            </h4>
            <p className="text-[11px] text-amber-100 font-medium leading-tight line-clamp-1 sm:line-clamp-none">
              Chạm để mở khóa chuông & loa tiếng Việt trên điện thoại
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleManualUnlock}
            className="px-3 py-1.5 bg-white text-amber-800 text-xs font-extrabold rounded-xl shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            🔊 Bật loa
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-white/80 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
