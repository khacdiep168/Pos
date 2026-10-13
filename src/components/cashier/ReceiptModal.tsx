'use client';

import React from 'react';
import { Order, PaymentMethod } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { initialStoreSettings } from '@/database/mockData';
import { orderService } from '@/services/orderService';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  cashGiven?: number;
  changeDue?: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  cashGiven,
  changeDue,
}) => {
  if (!isOpen || !order) return null;

  // Lookup Zone info
  const table = orderService
    .getTables()
    .find((t) => t.id === order.table_id || t.table_number === order.table_number);
  const zone = table?.zone_id
    ? orderService.getZones().find((z) => z.id === table.zone_id)
    : undefined;

  const handlePrint = () => {
    window.print();
  };

  const paymentMethodLabel: Record<PaymentMethod, string> = {
    cash: 'Tiền mặt (Cash)',
    transfer_qr: 'Chuyển khoản VietQR',
    card: 'Thẻ POS / Ngân hàng',
    e_wallet: 'Ví điện tử',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-md bg-white text-stone-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-stone-200 print:shadow-none print:border-none print:max-h-full print:w-full">
        {/* Top Controls (Hidden in Print) */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Hóa Đơn Thanh Toán (80mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Hóa Đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 80mm Thermal Receipt Content */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs bg-white text-stone-900 print:p-2">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-400">
            <h2 className="text-base font-black tracking-tight uppercase">
              {initialStoreSettings.store_name}
            </h2>
            <p className="text-[11px] text-stone-600 leading-tight">
              {initialStoreSettings.address}
            </p>
            <p className="text-[11px] text-stone-600">Hotline: {initialStoreSettings.phone}</p>
            <div className="text-[10px] text-stone-500 pt-1">
              Wifi: {initialStoreSettings.wifi_password}
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-stone-400">
            <div className="flex justify-between">
              <span>HÓA ĐƠN:</span>
              <span className="font-bold">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>BÀN:</span>
              <span className="font-bold text-xs uppercase">
                {zone ? `${zone.name} - ` : ''}{order.table_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NGÀY GIỜ:</span>
              <span>{formatDateTime(order.updated_at || order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>THU NGÂN:</span>
              <span>Thu Ngân Ca 1</span>
            </div>
            {order.customer_name && (
              <div className="flex justify-between">
                <span>KHÁCH HÀNG:</span>
                <span className="font-bold">
                  {order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2 pb-3 border-b border-dashed border-stone-400">
            <div className="grid grid-cols-12 font-bold text-[11px] pb-1 border-b border-stone-300">
              <span className="col-span-6">TÊN MÓN</span>
              <span className="col-span-2 text-center">SL</span>
              <span className="col-span-4 text-right">T.TIỀN</span>
            </div>

            {order.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 text-[11px] leading-tight">
                <div className="col-span-6">
                  <div className="font-semibold text-stone-900">{item.menu_item_name}</div>
                  {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                    <div className="text-[9px] text-stone-500">
                      {item.selected_modifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-center font-bold">x{item.quantity}</div>
                <div className="col-span-4 text-right font-medium">
                  {formatCurrencyVND(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Calculations Summary */}
          <div className="space-y-1.5 text-xs pb-3 border-b border-dashed border-stone-400">
            <div className="flex justify-between text-stone-600">
              <span>Tạm tính:</span>
              <span>{formatCurrencyVND(order.subtotal)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Chiết khấu / Giảm giá:</span>
                <span>-{formatCurrencyVND(order.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Thuế VAT (8%):</span>
              <span>{formatCurrencyVND(order.tax_amount)}</span>
            </div>

            <div className="flex justify-between text-sm font-black pt-2 border-t border-stone-900">
              <span>TỔNG THANH TOÁN:</span>
              <span className="text-base">{formatCurrencyVND(order.total_amount)}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-stone-400">
            <div className="flex justify-between">
              <span>Hình thức:</span>
              <span className="font-bold">
                {order.payment_method ? paymentMethodLabel[order.payment_method] : 'Tiền mặt'}
              </span>
            </div>

            {typeof cashGiven === 'number' && cashGiven > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Tiền khách đưa:</span>
                  <span>{formatCurrencyVND(cashGiven)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Tiền thối lại:</span>
                  <span>{formatCurrencyVND(changeDue || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Barcode & Thank You */}
          <div className="text-center pt-2 space-y-2">
            <p className="text-[11px] font-semibold">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
            <p className="text-[9px] text-stone-500 italic">
              (Hóa đơn này kiêm phiếu bảo hành và đối soát trong ngày)
            </p>

            {/* Simulated Barcode */}
            <div className="pt-2 flex flex-col items-center">
              <div className="h-9 w-48 bg-stone-900 flex items-center justify-around px-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white h-full"
                    style={{ width: `${(i % 3) + 1}px` }}
                  />
                ))}
              </div>
              <span className="text-[9px] tracking-widest text-stone-500 mt-1">
                *{order.id.slice(-8).toUpperCase()}*
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close (Screen Only) */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
