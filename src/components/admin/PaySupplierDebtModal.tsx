'use client';

import React, { useState } from 'react';
import { Supplier } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrencyVND } from '@/lib/utils';
import { X, DollarSign, CreditCard, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface PaySupplierDebtModalProps {
  supplier: Supplier;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaySupplierDebtModal: React.FC<PaySupplierDebtModalProps> = ({
  supplier,
  onClose,
  onSuccess,
}) => {
  const currentDebt = supplier.total_debt || 0;
  const [payAmount, setPayAmount] = useState<number>(currentDebt > 0 ? currentDebt : 5000000);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [notes, setNotes] = useState(`Thanh toán công nợ cho ${supplier.name}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingDebt = Math.max(0, currentDebt - payAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán lớn hơn 0!');
      return;
    }

    setIsSubmitting(true);
    try {
      const noteFull = `${notes} (${paymentMethod === 'transfer' ? 'Chuyển khoản VietQR' : 'Tiền mặt'})`;
      inventoryService.paySupplierDebt(supplier.id, payAmount, noteFull);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi ghi nhận thanh toán công nợ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                THANH TOÁN CÔNG NỢ
              </h3>
              <p className="text-[11px] text-stone-400">Trả nợ đối tác: {supplier.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current Debt Card */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block">
                Nợ hiện tại cần trả:
              </span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                {formatCurrencyVND(currentDebt)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPayAmount(currentDebt)}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors"
            >
              Trả hết
            </button>
          </div>

          {/* Pay Amount Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Số Tiền Thanh Toán (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="10000"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-stone-500">
              <span>Còn lại sau thanh toán:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                {formatCurrencyVND(remainingDebt)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Phương Thức Chi Trả
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                Chuyển Khoản (QR)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                Tiền Mặt (Cash)
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Ghi Chú Giao Dịch
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Thanh toán công nợ theo phiếu đối soát tháng 10..."
              className="w-full px-3.5 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Thanh Toán'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
