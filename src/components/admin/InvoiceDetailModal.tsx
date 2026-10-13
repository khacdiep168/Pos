'use client';

import React from 'react';
import { Order } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import {
  X,
  Receipt,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  Flame,
  Wine,
  FileText,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  order: Order;
  onClose: () => void;
}

const PM_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  cash: {
    label: 'Tiền mặt',
    icon: Banknote,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
  },
  transfer_qr: {
    label: 'VietQR Chuyển khoản',
    icon: QrCode,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  card: {
    label: 'Thẻ ngân hàng (POS)',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  e_wallet: {
    label: 'Ví điện tử',
    icon: Wallet,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
  },
};

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ order, onClose }) => {
  const isPaid = order.payment_status === 'paid';
  const isCancelled = order.order_status === 'cancelled';
  const pm = order.payment_method ? PM_CONFIG[order.payment_method] : null;
  const PmIcon = pm ? pm.icon : Banknote;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                CHI TIẾT HÓA ĐƠN
              </h3>
              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                Mã đơn: #{order.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              title="In hóa đơn"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Bill Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-stone-400">Trạng thái đơn hàng:</span>
              <div className="flex items-center gap-1.5 font-bold">
                {isCancelled ? (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <XCircle className="w-4 h-4" />
                    Đã hủy đơn
                  </span>
                ) : isPaid ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Hoàn tất & Đã thanh toán
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" />
                    Chưa thanh toán ({order.order_status})
                  </span>
                )}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[11px] text-stone-400">Bàn phục vụ:</span>
              <div className="flex items-center gap-1 font-bold text-stone-900 dark:text-white justify-end">
                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                <span>{order.table_number}</span>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 dark:text-stone-400 px-1">
            <div>
              <span className="text-stone-400">Thời gian tạo: </span>
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {formatDateTime(order.created_at)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-400">Cập nhật: </span>
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {formatDateTime(order.updated_at || order.created_at)}
              </span>
            </div>
          </div>

          {/* Items Bill Table */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
            <div className="bg-stone-50 dark:bg-stone-800/80 px-3 py-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 grid grid-cols-12 gap-2">
              <span className="col-span-6">TÊN MÓN</span>
              <span className="col-span-2 text-center">SL</span>
              <span className="col-span-2 text-right">ĐƠN GIÁ</span>
              <span className="col-span-2 text-right">THÀNH TIỀN</span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="p-3 grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-6 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-white leading-tight">
                      {item.station === 'kitchen' ? (
                        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Wine className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      <span>{item.menu_item_name}</span>
                    </div>

                    {/* Modifiers */}
                    {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium pl-5">
                        {item.selected_modifiers.map((m) => m.name).join(' • ')}
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="text-[10px] text-stone-400 italic pl-5">
                        Ghi chú: {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 text-center font-bold text-stone-900 dark:text-white">
                    x{item.quantity}
                  </div>

                  <div className="col-span-2 text-right text-stone-500 dark:text-stone-400 text-[11px]">
                    {formatCurrencyVND(item.price)}
                  </div>

                  <div className="col-span-2 text-right font-bold text-stone-900 dark:text-white">
                    {formatCurrencyVND(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="p-4 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-2 text-xs">
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Tiền hàng (Subtotal):</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {formatCurrencyVND(order.subtotal)}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Voucher / Giảm giá:</span>
                <span className="font-semibold">
                  -{formatCurrencyVND(order.discount_amount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Thuế GTGT (VAT 8%):</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                +{formatCurrencyVND(order.tax_amount)}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-baseline">
              <span className="font-extrabold text-stone-900 dark:text-white text-sm">
                TỔNG THANH TOÁN:
              </span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                {formatCurrencyVND(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Payment Method Badge & Notes */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px]">HT Thanh toán:</span>
              {pm ? (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${pm.bg} ${pm.color}`}
                >
                  <PmIcon className="w-3.5 h-3.5" />
                  <span>{pm.label}</span>
                </div>
              ) : (
                <span className="text-stone-400 italic">Chưa xác định</span>
              )}
            </div>

            {order.notes && (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <span className="italic">{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
