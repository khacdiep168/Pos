'use client';

import React, { useState, useEffect } from 'react';
import { WorkShift } from '@/types';
import { orderService } from '@/services/orderService';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import {
  Clock,
  DollarSign,
  QrCode,
  CreditCard,
  Receipt,
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  Printer,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';

interface ShiftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftUpdated?: () => void;
}

export const ShiftManagementModal: React.FC<ShiftManagementModalProps> = ({
  isOpen,
  onClose,
  onShiftUpdated,
}) => {
  const [currentShift, setCurrentShift] = useState<WorkShift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<WorkShift[]>([]);
  const [viewHistory, setViewHistory] = useState(false);

  // Open Shift Form State
  const [cashierName, setCashierName] = useState('Thu Ngân Nguyễn Văn An');
  const [initialCash, setInitialCash] = useState<number>(1000000);

  // Close Shift Form State
  const [actualCashEnd, setActualCashEnd] = useState<number>(1000000);
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [printedZReport, setPrintedZReport] = useState<WorkShift | null>(null);

  const loadShift = () => {
    const active = orderService.getCurrentShift();
    setCurrentShift(active);
    setShiftHistory(orderService.getShiftHistory());
    if (active) {
      setActualCashEnd(active.initial_cash + active.total_cash_sales);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadShift();
      setPrintedZReport(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim()) return;

    orderService.openShift('cashier-1', cashierName.trim(), initialCash);
    loadShift();
    if (onShiftUpdated) onShiftUpdated();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    const closed = orderService.closeShift(actualCashEnd, closeNotes);
    if (closed) {
      setPrintedZReport(closed);
      loadShift();
      if (onShiftUpdated) onShiftUpdated();
    }
  };

  const expectedCash = currentShift
    ? currentShift.initial_cash + currentShift.total_cash_sales
    : 0;
  const differenceCash = actualCashEnd - expectedCash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                Quản Lý Ca Làm Việc & Báo Cáo Doanh Thu (Z-Report)
              </h3>
              <p className="text-xs text-stone-400">
                Theo dõi quỹ tiền mặt đầu ca, doanh thu phân loại và đối soát két
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end gap-2 text-xs">
          <button
            onClick={() => setViewHistory(!viewHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold hover:bg-stone-200"
          >
            <History className="w-3.5 h-3.5" />
            <span>{viewHistory ? 'Quay lại ca hiện tại' : `Lịch sử các ca (${shiftHistory.length})`}</span>
          </button>
        </div>

        {/* Lịch Sử Các Ca */}
        {viewHistory ? (
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-400">
              Nhật Ký Các Ca Đã Đóng
            </h4>
            {shiftHistory.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-6 text-center">Chưa có ca nào được kết thúc.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {shiftHistory.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-stone-900 dark:text-white">{s.cashier_name}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        {formatCurrencyVND(s.total_cash_sales + s.total_qr_sales + s.total_card_sales)}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 flex justify-between">
                      <span>{formatDateTime(s.start_time)} ➔ {s.end_time ? formatDateTime(s.end_time) : 'Đang mở'}</span>
                      <span>{s.total_orders_count} đơn hàng</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-stone-200/50 dark:border-stone-700/50">
                      <span>Tiền mặt két: {formatCurrencyVND(s.actual_cash_end || 0)}</span>
                      <span className={s.difference_cash && s.difference_cash < 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                        Chênh lệch: {s.difference_cash && s.difference_cash > 0 ? '+' : ''}{formatCurrencyVND(s.difference_cash || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : printedZReport ? (
          /* Màn hình sau khi kết ca: Z-Report Bill */
          <div className="p-5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300 dark:border-stone-700">
              <div className="inline-flex p-2 bg-emerald-500/10 text-emerald-600 rounded-full mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-black text-base text-stone-900 dark:text-white uppercase tracking-wider">
                BÁO CÁO KẾT CA (Z-REPORT)
              </h4>
              <p className="text-xs text-stone-400">Mã ca: #{printedZReport.id} • {printedZReport.cashier_name}</p>
              <p className="text-[11px] text-stone-400">
                {formatDateTime(printedZReport.start_time)} ➔ {formatDateTime(printedZReport.end_time || '')}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Tiền mặt ban đầu nhận ca:</span>
                <span className="font-mono font-bold">{formatCurrencyVND(printedZReport.initial_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Doanh thu Tiền mặt trong ca:</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrencyVND(printedZReport.total_cash_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Doanh thu Chuyển khoản VietQR:</span>
                <span className="font-mono font-bold text-cyan-600">{formatCurrencyVND(printedZReport.total_qr_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Doanh thu Quẹt thẻ POS:</span>
                <span className="font-mono font-bold text-purple-600">{formatCurrencyVND(printedZReport.total_card_sales)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-stone-200 dark:border-stone-700">
                <span>TỔNG DOANH THU CA:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  {formatCurrencyVND(printedZReport.total_cash_sales + printedZReport.total_qr_sales + printedZReport.total_card_sales)}
                </span>
              </div>

              <div className="pt-2 border-t border-dashed border-stone-200 dark:border-stone-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tiền mặt thực tế đếm tại két:</span>
                  <span className="font-mono font-black">{formatCurrencyVND(printedZReport.actual_cash_end || 0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-stone-500">Chênh lệch két tiền:</span>
                  <span className={printedZReport.difference_cash && printedZReport.difference_cash < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                    {printedZReport.difference_cash && printedZReport.difference_cash > 0 ? '+' : ''}{formatCurrencyVND(printedZReport.difference_cash || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In Báo Cáo Z-Report</span>
              </button>
              <button
                onClick={() => setPrintedZReport(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : !currentShift ? (
          /* Form Mở Ca */
          <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">Chưa Có Ca Nào Đang Hoạt Động</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Vui lòng khai báo thu ngân và số tiền mặt ban đầu để bắt đầu ca bán hàng.
                </p>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Tên Thu Ngân Trực Ca *:
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Tiền mặt ban đầu trong két (VND) *:
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={initialCash}
                onChange={(e) => setInitialCash(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-sm text-amber-600"
                required
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Tiền thối, quỹ đổi lẻ ban đầu giao cho thu ngân.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Bắt Đầu Mở Ca Làm Việc</span>
              </button>
            </div>
          </form>
        ) : (
          /* Ca Đang Hoạt Động -> Dashboard & Form Kết Ca */
          <div className="space-y-4 text-xs">
            {/* Active Shift Status Card */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                    Ca Đang Mở (#{currentShift.id})
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">
                  Mở lúc: {formatDateTime(currentShift.start_time)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                <div className="p-2 bg-white/70 dark:bg-stone-850 rounded-xl">
                  <div className="text-[10px] text-stone-400">Tiền Đầu Ca</div>
                  <div className="font-bold text-xs font-mono">{formatCurrencyVND(currentShift.initial_cash)}</div>
                </div>

                <div className="p-2 bg-white/70 dark:bg-stone-850 rounded-xl">
                  <div className="text-[10px] text-stone-400">Tiền Mặt Thu</div>
                  <div className="font-bold text-xs font-mono text-emerald-600">{formatCurrencyVND(currentShift.total_cash_sales)}</div>
                </div>

                <div className="p-2 bg-white/70 dark:bg-stone-850 rounded-xl">
                  <div className="text-[10px] text-stone-400">VietQR Thu</div>
                  <div className="font-bold text-xs font-mono text-cyan-600">{formatCurrencyVND(currentShift.total_qr_sales)}</div>
                </div>

                <div className="p-2 bg-white/70 dark:bg-stone-850 rounded-xl">
                  <div className="text-[10px] text-stone-400">Thẻ POS Thu</div>
                  <div className="font-bold text-xs font-mono text-purple-600">{formatCurrencyVND(currentShift.total_card_sales)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-1">
                <span>Tổng doanh thu bán hàng ca này:</span>
                <span className="font-mono text-base text-amber-600 dark:text-amber-400">
                  {formatCurrencyVND(currentShift.total_cash_sales + currentShift.total_qr_sales + currentShift.total_card_sales)} ({currentShift.total_orders_count} đơn)
                </span>
              </div>
            </div>

            {/* Form Kết Ca */}
            <form onSubmit={handleCloseShift} className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-500" />
                <span>Thực Hiện Kết Ca & Đối Soát Két Tiền</span>
              </h4>

              <div className="flex justify-between items-center text-xs p-2.5 bg-stone-100 dark:bg-stone-700/50 rounded-xl font-semibold">
                <span className="text-stone-500 dark:text-stone-300">Tiền mặt dự kiến trong két:</span>
                <span className="font-mono font-black text-stone-900 dark:text-white">
                  {formatCurrencyVND(expectedCash)}
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Tiền mặt thực tế đếm được khi bàn giao (VND) *:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={actualCashEnd}
                  onChange={(e) => setActualCashEnd(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-sm text-stone-900 dark:text-white"
                  required
                />
              </div>

              {/* Difference Preview */}
              <div className="flex justify-between items-center text-xs p-2.5 rounded-xl border font-bold">
                <span>Chênh lệch két tiền:</span>
                <span className={differenceCash < 0 ? 'text-rose-600 font-mono text-sm' : 'text-emerald-600 font-mono text-sm'}>
                  {differenceCash === 0 ? 'Khớp 100%' : `${differenceCash > 0 ? '+' : ''}${formatCurrencyVND(differenceCash)}`}
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Ghi chú bàn giao ca:
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="VD: Đã bàn giao chìa khóa két cho ca tối..."
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Xác Nhận Kết Ca & Xuất Z-Report</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
