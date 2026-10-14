'use client';

import React, { useRef } from 'react';
import { RestaurantTable, Zone, StoreSettings } from '@/types';
import {
  X,
  Printer,
  QrCode,
  Wifi,
  Sparkles,
  Utensils,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface TableQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  zones: Zone[];
  settings: StoreSettings;
  title?: string;
}

export const TableQRCodeModal: React.FC<TableQRCodeModalProps> = ({
  isOpen,
  onClose,
  tables,
  zones,
  settings,
  title = 'Mã QR Đặt Món Tại Bàn',
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || tables.length === 0) return null;

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://pos-kd.vercel.app';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Header - Hidden when printing */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-base">
                {title} ({tables.length} bàn)
              </h3>
              <p className="text-xs text-stone-400">
                Khách quét QR bằng camera điện thoại để xem menu & tự gọi món
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In {tables.length > 1 ? 'Tất Cả QR' : 'Tem QR'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable QR Cards */}
        <div
          ref={printContainerRef}
          className="p-4 sm:p-6 overflow-y-auto space-y-6 print:p-0 print:overflow-visible print:space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {tables.map((table) => {
              const zone = zones.find((z) => z.id === table.zone_id);
              const menuUrl = `${origin}/menu/${table.id}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                menuUrl
              )}&margin=10`;

              return (
                <div
                  key={table.id}
                  className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200 dark:border-stone-700 p-5 flex flex-col items-center text-center shadow-lg print:border-2 print:border-black print:rounded-2xl print:shadow-none print:break-inside-avoid"
                >
                  {/* Store Name & Header */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {settings.store_name || 'VIBE TASTE RESTAURANT'}
                    </span>
                    <h4 className="text-xl font-black text-stone-900 dark:text-white">
                      {table.table_number}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {zone ? zone.name : 'Khu vực chung'} • Sức chứa: {table.capacity} khách
                    </p>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-3 bg-white rounded-2xl shadow-inner border border-stone-200 inline-block mb-3">
                    <img
                      src={qrImageUrl}
                      alt={`QR Bàn ${table.table_number}`}
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Instruction */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 mb-2">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Quét camera để xem thực đơn & gọi món</span>
                  </div>

                  {/* Wi-Fi Details */}
                  {(settings.wifi_ssid || settings.wifi_password) && (
                    <div className="w-full bg-stone-50 dark:bg-stone-800/80 rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-around">
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold">Wifi:</span>
                        <span className="font-mono">{settings.wifi_ssid || 'VIBE TASTE'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Mật khẩu:</span>
                        <span className="font-mono font-bold text-stone-900 dark:text-white">
                          {settings.wifi_password || 'vibetaste'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Direct Link - Screen only */}
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 w-full flex items-center justify-between text-[11px] text-stone-400 print:hidden">
                    <span className="truncate max-w-[200px] font-mono text-[10px]">{menuUrl}</span>
                    <a
                      href={menuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Mở thử</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info - Hidden when printing */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0 print:hidden">
          <span>💡 Mẹo: Dùng máy in nhiệt hoặc máy in màu khổ A4 / Decal để in tem dán góc bàn.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-xl font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
