'use client';

import React, { useEffect } from 'react';
import { KDSTicket } from './KDSTicketCard';
import { Printer, X, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface KitchenReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: KDSTicket | null;
  autoPrint?: boolean;
}

export const KitchenReceiptModal: React.FC<KitchenReceiptModalProps> = ({
  isOpen,
  onClose,
  ticket,
  autoPrint = true,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && autoPrint && ticket) {
      // Delay slight moment to let DOM render before opening print dialog
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, ticket]);

  if (!isOpen || !ticket) return null;

  const nowFormatted = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateFormatted = new Date().toLocaleDateString('vi-VN');
  const staffName = user?.full_name || (ticket.station === 'kitchen' ? 'Bếp Chính' : 'Pha Chế');
  const stationLabel = ticket.station === 'kitchen' ? 'PHIẾU BẾP (KITCHEN)' : 'PHIẾU BAR (BEVERAGE)';
  const zoneTableTitle = `${ticket.zoneName ? ticket.zoneName.toUpperCase() : 'KHU VỰC'} - BÀN ${ticket.tableNumber}`;

  const handleManualPrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal Preview on Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
        <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tem Ra Món & Phục Vụ</h3>
                <p className="text-[11px] text-stone-400">Khổ nhiệt tiêu chuẩn K80 / K50</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Body (White thermal paper preview) */}
          <div className="p-4 bg-stone-950 overflow-y-auto flex justify-center">
            <div className="w-[80mm] max-w-full bg-white text-black p-4 font-mono shadow-xl rounded-sm border border-stone-300">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-dashed border-black pb-3">
                <div className="text-xs font-bold uppercase tracking-wider">{stationLabel}</div>
                {/* BIG TABLE TITLE */}
                <div className="text-2xl font-black tracking-tight my-1 py-1 bg-black text-white px-1">
                  [{zoneTableTitle}]
                </div>
                <div className="text-[11px] flex justify-between mt-1 text-black font-semibold">
                  <span>Mã: #{ticket.orderId.slice(-6).toUpperCase()}</span>
                  <span>{nowFormatted}</span>
                </div>
              </div>

              {/* Items List - Large Font Optimized for Kitchen / Runner */}
              <div className="py-3 space-y-3 border-b-2 border-dashed border-black">
                {ticket.items.map((item, idx) => (
                  <div key={item.id || idx} className="border-b border-dotted border-gray-400 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base font-black leading-tight flex-1">
                        {idx + 1}. {item.menu_item_name}
                      </span>
                      <span className="text-xl font-black border-2 border-black px-1.5 py-0.5 leading-none shrink-0">
                        x{item.quantity}
                      </span>
                    </div>

                    {/* Modifiers / Options */}
                    {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                      <div className="mt-1 pl-2 text-xs font-bold text-gray-800 space-y-0.5">
                        {item.selected_modifiers.map((mod, mIdx) => (
                          <div key={mIdx}>+ {mod.name}</div>
                        ))}
                      </div>
                    )}

                    {/* Customer Notes */}
                    {item.notes && (
                      <div className="mt-1.5 p-1 bg-gray-100 border border-black text-xs font-black uppercase">
                        GHI CHÚ: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="pt-3 text-[11px] leading-tight text-center space-y-1 font-sans">
                <div className="flex justify-between font-mono text-xs font-bold">
                  <span>Người làm: {staffName}</span>
                  <span>{dateFormatted}</span>
                </div>
                <div className="pt-2 text-xs font-black uppercase border-t border-black">
                  *** KẸP DĨA / DÁN LY - BƯNG RA BÀN ***
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Đã sẵn sàng in nhiệt
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={handleManualPrint}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Lại Tem</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Thermal Print Sheet triggered via @media print */}
      <div id="kitchen-receipt-print-area" className="hidden print:block text-black bg-white">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #kitchen-receipt-print-area, #kitchen-receipt-print-area * {
              visibility: visible !important;
            }
            #kitchen-receipt-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              padding: 4mm !important;
              margin: 0 !important;
              background: white !important;
              color: black !important;
              font-family: monospace, sans-serif !important;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}} />

        <div className="w-[80mm] max-w-full text-black font-mono">
          <div className="text-center border-b-2 border-dashed border-black pb-2 mb-2">
            <div className="text-xs font-bold uppercase">{stationLabel}</div>
            <div className="text-2xl font-black tracking-tight my-1 py-1 bg-black text-white">
              [{zoneTableTitle}]
            </div>
            <div className="text-xs flex justify-between font-bold">
              <span>ĐƠN: #{ticket.orderId.slice(-6).toUpperCase()}</span>
              <span>{nowFormatted}</span>
            </div>
          </div>

          <div className="py-2 space-y-3 border-b-2 border-dashed border-black">
            {ticket.items.map((item, idx) => (
              <div key={item.id || idx} className="border-b border-dotted border-black pb-2 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <span className="text-lg font-black leading-tight flex-1">
                    {idx + 1}. {item.menu_item_name}
                  </span>
                  <span className="text-2xl font-black border-2 border-black px-1.5 ml-2 leading-none">
                    x{item.quantity}
                  </span>
                </div>

                {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                  <div className="mt-1 pl-2 text-xs font-bold space-y-0.5">
                    {item.selected_modifiers.map((mod, mIdx) => (
                      <div key={mIdx}>+ {mod.name}</div>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className="mt-1 p-1 border border-black text-xs font-black uppercase">
                    GHI CHÚ: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-center space-y-1">
            <div className="flex justify-between font-bold">
              <span>NV: {staffName}</span>
              <span>{dateFormatted}</span>
            </div>
            <div className="pt-2 text-xs font-black uppercase border-t border-black">
              *** KẸP DĨA / DÁN LY - BƯNG RA BÀN ***
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
